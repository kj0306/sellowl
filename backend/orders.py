"""
orders.py — SellOWL Orders API
================================
Registers a Flask Blueprint at /api/orders with the following routes:

  POST   /api/orders                  — buyer places order request
  GET    /api/orders/incoming         — seller sees orders for their listings
  GET    /api/orders/outgoing         — buyer sees orders they placed
  GET    /api/orders/<id>             — detail (buyer OR seller)
  PATCH  /api/orders/<id>             — seller accept/reject  | buyer cancel
  GET    /api/orders/pending-count    — navbar badge count for sellers

Background job (APScheduler):
  Every 15 min: mark orders past expires_at as 'expired', write event row.

Production logging:
  Every meaningful action emits a structured JSON log line via logger.py
  so CloudWatch / Datadog can create dashboards and alerts without changes.
"""

from __future__ import annotations
import time
from datetime import datetime, timezone, timedelta
from typing import Any

import psycopg2
from flask import Blueprint, request, jsonify, session, g

from db import get_db_connection
from logger import get_logger

log = get_logger(__name__)

orders_bp = Blueprint("orders", __name__)

# ── Allowed status transitions ────────────────────────────────────────────────
# Maps (current_status, actor_role) → set of allowed next statuses
_TRANSITIONS: dict[tuple[str, str], set[str]] = {
    ("pending",  "seller"): {"accepted", "rejected"},
    ("pending",  "buyer"):  {"cancelled"},
    ("accepted", "buyer"):  {"completed"},   # future: buyer confirms pickup
    ("accepted", "seller"): {"cancelled"},   # seller cancels after accepting (edge case)
}

_VALID_STATUSES = {"pending", "accepted", "rejected", "cancelled", "expired", "completed"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _row_to_order(row: tuple, items: list[dict] | None = None) -> dict:
    """Map a DB row (from _ORDER_QUERY columns) to a JSON-safe dict."""
    return {
        "id":                  row[0],
        "buyer_id":            row[1],
        "seller_id":           row[2],
        "listing_id":          row[3],
        "status":              row[4],
        "total_amount":        float(row[5]) if row[5] is not None else 0.0,
        "item_count":          row[6],
        "buyer_note":          row[7],
        "seller_note":         row[8],
        "cancelled_by":        row[9],
        "cancellation_reason": row[10],
        "expires_at":          row[11].isoformat() if row[11] else None,
        "responded_at":        row[12].isoformat() if row[12] else None,
        "created_at":          row[13].isoformat() if row[13] else None,
        "updated_at":          row[14].isoformat() if row[14] else None,
        # Joined buyer / seller fields
        "buyer_name":          row[15],
        "buyer_email":         row[16],
        "seller_name":         row[17],
        "seller_email":        row[18],
        # Items snapshot (populated when fetching detail)
        "items":               items or [],
    }


_ORDER_SELECT = """
    SELECT
        o.id, o.buyer_id, o.seller_id, o.listing_id,
        o.status, o.total_amount, o.item_count,
        o.buyer_note, o.seller_note,
        o.cancelled_by, o.cancellation_reason,
        o.expires_at, o.responded_at, o.created_at, o.updated_at,
        b.display_name  AS buyer_name,  b.email AS buyer_email,
        s.display_name  AS seller_name, s.email AS seller_email
    FROM orders o
    JOIN users b ON b.id = o.buyer_id
    JOIN users s ON s.id = o.seller_id
"""


def _fetch_items(cur, order_id: int) -> list[dict]:
    cur.execute(
        """SELECT id, order_id, listing_id, title, description,
                  price, category, condition, image_url, neighbourhood, created_at
           FROM order_items WHERE order_id = %s ORDER BY id""",
        (order_id,),
    )
    rows = cur.fetchall()
    return [
        {
            "id":           r[0],
            "order_id":     r[1],
            "listing_id":   r[2],
            "title":        r[3],
            "description":  r[4],
            "price":        float(r[5]) if r[5] is not None else 0.0,
            "category":     r[6],
            "condition":    r[7],
            "image_url":    r[8],
            "neighbourhood":r[9],
            "created_at":   r[10].isoformat() if r[10] else None,
        }
        for r in rows
    ]


def _write_event(
    cur,
    order_id: int,
    event_type: str,
    actor_id: int | None,
    actor_role: str | None,
    old_status: str | None = None,
    new_status: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Append one immutable row to order_events."""
    import json as _json
    cur.execute(
        """INSERT INTO order_events
               (order_id, event_type, actor_id, actor_role, old_status, new_status, metadata)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (
            order_id,
            event_type,
            actor_id,
            actor_role,
            old_status,
            new_status,
            _json.dumps(metadata or {}),
        ),
    )




def _send_order_message(conn, cur, sender_id: int, other_id: int, text: str) -> None:
    """
    Create or find a conversation between sender and other_id,
    then insert `text` as a message from sender.
    Used so buyer notes and seller notes appear in the message thread.
    """
    u1, u2 = min(sender_id, other_id), max(sender_id, other_id)
    cur.execute("""
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (%s, %s)
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET user1_id = EXCLUDED.user1_id
        RETURNING id
    """, (u1, u2))
    conv_id = cur.fetchone()[0]
    cur.execute(
        "INSERT INTO messages (conversation_id, sender_id, text) VALUES (%s, %s, %s)",
        (conv_id, sender_id, text),
    )

# ── POST /api/orders — buyer places an order ──────────────────────────────────

@orders_bp.route("/api/orders", methods=["POST"])
def create_order():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    buyer_id  = session["user_id"]
    t_start   = time.perf_counter()

    data = request.get_json(silent=True) or {}
    listing_ids: list[int] = data.get("listing_ids", [])
    buyer_note: str        = (data.get("buyer_note") or "").strip()[:1000]

    if not listing_ids or not isinstance(listing_ids, list):
        log.warning("order.create.bad_request", buyer_id=buyer_id, reason="missing listing_ids")
        return jsonify({"error": "listing_ids must be a non-empty list"}), 400

    if len(listing_ids) > 50:
        return jsonify({"error": "Too many items in one order (max 50)"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        # ── Fetch all requested listings in one query ──────────────────────
        placeholders = ",".join(["%s"] * len(listing_ids))
        cur.execute(
            f"""SELECT l.id, l.title, l.description, l.price,
                       l.category, l.condition, l.image_url, l.neighbourhood,
                       l.user_id, l.is_available
                FROM listings l
                WHERE l.id IN ({placeholders})""",
            listing_ids,
        )
        rows = cur.fetchall()
        found_ids = {r[0] for r in rows}

        # Validate: all requested IDs must exist and be available
        missing = set(listing_ids) - found_ids
        if missing:
            log.warning("order.create.not_found", buyer_id=buyer_id, missing_ids=list(missing))
            return jsonify({"error": f"Listings not found: {sorted(missing)}"}), 404

        unavailable = [r[1] for r in rows if not r[9]]
        if unavailable:
            log.warning("order.create.unavailable", buyer_id=buyer_id, titles=unavailable)
            return jsonify({"error": f"Some listings are no longer available: {unavailable}"}), 409

        # Validate: all listings must belong to the same seller
        seller_ids = {r[8] for r in rows}
        if len(seller_ids) > 1:
            log.warning("order.create.multi_seller", buyer_id=buyer_id, seller_ids=list(seller_ids))
            return jsonify({"error": "All listings in one order must be from the same seller"}), 400

        seller_id = next(iter(seller_ids))
        if seller_id == buyer_id:
            return jsonify({"error": "You cannot order your own listings"}), 400

        # ── Compute totals ─────────────────────────────────────────────────
        total_amount = sum(float(r[3]) for r in rows)
        item_count   = len(rows)
        expires_at   = _now_utc() + timedelta(days=3)

        # ── Insert order ───────────────────────────────────────────────────
        cur.execute(
            """INSERT INTO orders
                   (buyer_id, seller_id, listing_id, status, total_amount, item_count,
                    buyer_note, expires_at)
               VALUES (%s, %s, %s, 'pending', %s, %s, %s, %s)
               RETURNING id""",
            (
                buyer_id,
                seller_id,
                rows[0][0] if item_count == 1 else None,  # single-item shortcut
                total_amount,
                item_count,
                buyer_note or None,
                expires_at,
            ),
        )
        order_id = cur.fetchone()[0]

        # ── Snapshot order items ───────────────────────────────────────────
        for r in rows:
            cur.execute(
                """INSERT INTO order_items
                       (order_id, listing_id, title, description, price,
                        category, condition, image_url, neighbourhood)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (order_id, r[0], r[1], r[2], float(r[3]),
                 r[4], r[5], r[6], r[7]),
            )

        # ── Audit event ────────────────────────────────────────────────────
        _write_event(
            cur, order_id, "order_created",
            actor_id=buyer_id, actor_role="buyer",
            new_status="pending",
            metadata={
                "listing_ids":   listing_ids,
                "total_amount":  total_amount,
                "item_count":    item_count,
                "has_buyer_note": bool(buyer_note),
            },
        )

        # If buyer left a note, send it as a message in the conversation thread
        if buyer_note:
            _send_order_message(conn, cur, buyer_id, seller_id,
                f"[Order request] {buyer_note}")

        conn.commit()
        elapsed = round((time.perf_counter() - t_start) * 1000)
        log.info(
            "order.created",
            order_id=order_id, buyer_id=buyer_id, seller_id=seller_id,
            total_amount=total_amount, item_count=item_count, ms=elapsed,
        )

        cur.close()
        conn.close()
        return jsonify({"success": True, "order_id": order_id}), 201

    except psycopg2.Error as exc:
        if conn:
            conn.rollback()
        log.error("order.create.db_error", buyer_id=buyer_id, exc=str(exc))
        return jsonify({"error": "Database error. Please try again."}), 500
    except Exception as exc:
        if conn:
            conn.rollback()
        log.error("order.create.unexpected", buyer_id=buyer_id, exc=str(exc))
        return jsonify({"error": "Unexpected error. Please try again."}), 500
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


# ── GET /api/orders/incoming — seller's view ──────────────────────────────────

@orders_bp.route("/api/orders/incoming", methods=["GET"])
def get_incoming_orders():
    """Orders placed for the current user's listings (seller view)."""
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    seller_id = session["user_id"]
    status_filter = request.args.get("status")   # ?status=pending

    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        where = "WHERE o.seller_id = %s"
        params: list[Any] = [seller_id]
        if status_filter and status_filter in _VALID_STATUSES:
            where += " AND o.status = %s"
            params.append(status_filter)

        cur.execute(
            f"{_ORDER_SELECT} {where} ORDER BY o.created_at DESC LIMIT 100",
            params,
        )
        rows = cur.fetchall()

        # For each order, check if the listing already has an accepted order
        # so the frontend can disable the Accept button for other pending orders
        accepted_listings = set()
        cur.execute(
            """SELECT DISTINCT listing_id FROM orders
               WHERE seller_id = %s AND status = 'accepted' AND listing_id IS NOT NULL""",
            (seller_id,)
        )
        for r in cur.fetchall():
            accepted_listings.add(r[0])

        orders = []
        for row in rows:
            items = _fetch_items(cur, row[0])
            order = _row_to_order(row, items)
            # Flag: does this listing already have an accepted order?
            order_listing_id = row[3]  # listing_id column
            order["listing_has_accepted_order"] = (
                order_listing_id is not None and order_listing_id in accepted_listings
                and order["status"] != "accepted"  # don't flag the accepted one itself
            )
            orders.append(order)

        cur.close()
        conn.close()

        log.info("order.incoming.listed", seller_id=seller_id, count=len(orders), status_filter=status_filter)
        return jsonify({"orders": orders})

    except Exception as exc:
        log.error("order.incoming.error", seller_id=seller_id, exc=str(exc))
        return jsonify({"error": str(exc)}), 500


# ── GET /api/orders/outgoing — buyer's view ───────────────────────────────────

@orders_bp.route("/api/orders/outgoing", methods=["GET"])
def get_outgoing_orders():
    """Orders the current user has placed (buyer view)."""
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    buyer_id = session["user_id"]
    status_filter = request.args.get("status")

    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        where = "WHERE o.buyer_id = %s"
        params: list[Any] = [buyer_id]
        if status_filter and status_filter in _VALID_STATUSES:
            where += " AND o.status = %s"
            params.append(status_filter)

        cur.execute(
            f"{_ORDER_SELECT} {where} ORDER BY o.created_at DESC LIMIT 100",
            params,
        )
        rows = cur.fetchall()

        orders = []
        for row in rows:
            items = _fetch_items(cur, row[0])
            orders.append(_row_to_order(row, items))

        cur.close()
        conn.close()

        log.info("order.outgoing.listed", buyer_id=buyer_id, count=len(orders))
        return jsonify({"orders": orders})

    except Exception as exc:
        log.error("order.outgoing.error", buyer_id=buyer_id, exc=str(exc))
        return jsonify({"error": str(exc)}), 500


# ── GET /api/orders/pending-count — seller navbar badge ──────────────────────

@orders_bp.route("/api/orders/pending-count", methods=["GET"])
def get_pending_count():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute(
            "SELECT COUNT(*) FROM orders WHERE seller_id = %s AND status = 'pending'",
            (session["user_id"],),
        )
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        return jsonify({"pending_count": int(count)})
    except Exception as exc:
        log.error("order.pending_count.error", user_id=session.get("user_id"), exc=str(exc))
        return jsonify({"error": str(exc)}), 500


# ── GET /api/orders/<id> — detail for buyer or seller ────────────────────────

@orders_bp.route("/api/orders/<int:order_id>", methods=["GET"])
def get_order(order_id: int):
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    me = session["user_id"]
    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        cur.execute(
            f"{_ORDER_SELECT} WHERE o.id = %s AND (o.buyer_id = %s OR o.seller_id = %s)",
            (order_id, me, me),
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return jsonify({"error": "Order not found"}), 404

        items = _fetch_items(cur, order_id)

        # Also fetch event log
        cur.execute(
            """SELECT id, event_type, actor_id, actor_role,
                      old_status, new_status, metadata, created_at
               FROM order_events WHERE order_id = %s ORDER BY created_at ASC""",
            (order_id,),
        )
        events = [
            {
                "id":          r[0],
                "event_type":  r[1],
                "actor_id":    r[2],
                "actor_role":  r[3],
                "old_status":  r[4],
                "new_status":  r[5],
                "metadata":    r[6],
                "created_at":  r[7].isoformat() if r[7] else None,
            }
            for r in cur.fetchall()
        ]

        cur.close(); conn.close()
        order = _row_to_order(row, items)
        order["events"] = events
        return jsonify({"order": order})

    except Exception as exc:
        log.error("order.get.error", order_id=order_id, user_id=me, exc=str(exc))
        return jsonify({"error": str(exc)}), 500


# ── PATCH /api/orders/<id> — transition order state ──────────────────────────

@orders_bp.route("/api/orders/<int:order_id>", methods=["PATCH"])
def update_order(order_id: int):
    """
    Seller: {"action": "accept", "seller_note": "..."} or {"action": "reject", ...}
    Buyer:  {"action": "cancel", "cancellation_reason": "..."}
    """
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    me   = session["user_id"]
    data = request.get_json(silent=True) or {}
    action: str = (data.get("action") or "").strip().lower()

    if action not in ("accept", "reject", "cancel", "complete"):
        return jsonify({"error": "action must be one of: accept, reject, cancel, complete"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        # Fetch and lock the row for update
        cur.execute(
            "SELECT id, buyer_id, seller_id, status, expires_at FROM orders WHERE id = %s FOR UPDATE",
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Order not found"}), 404

        _, buyer_id, seller_id, current_status, expires_at = row

        # Determine actor role
        if me == seller_id:
            actor_role = "seller"
        elif me == buyer_id:
            actor_role = "buyer"
        else:
            conn.rollback()
            return jsonify({"error": "Not authorised"}), 403

        # Map action → new_status
        action_map = {
            "accept":   "accepted",
            "reject":   "rejected",
            "cancel":   "cancelled",
            "complete": "completed",
        }
        new_status = action_map[action]

        # Validate transition
        allowed = _TRANSITIONS.get((current_status, actor_role), set())
        if new_status not in allowed:
            conn.rollback()
            log.warning(
                "order.update.invalid_transition",
                order_id=order_id, user_id=me, actor_role=actor_role,
                current_status=current_status, requested_new=new_status,
            )
            return jsonify({
                "error": f"Cannot move order from '{current_status}' to '{new_status}' as {actor_role}"
            }), 409

        # Check expiry (only for seller-side transitions on pending orders)
        if current_status == "pending" and expires_at:
            exp = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
            if _now_utc() > exp:
                conn.rollback()
                return jsonify({"error": "This order has expired and can no longer be updated"}), 409

        # Gather optional fields
        seller_note         = (data.get("seller_note") or "").strip()[:1000] or None
        cancellation_reason = (data.get("cancellation_reason") or "").strip()[:1000] or None

        # Build UPDATE
        update_fields = ["status = %s", "responded_at = CURRENT_TIMESTAMP", "updated_at = CURRENT_TIMESTAMP"]
        update_params: list[Any] = [new_status]

        if seller_note and actor_role == "seller":
            update_fields.append("seller_note = %s")
            update_params.append(seller_note)

        if new_status == "cancelled":
            update_fields.append("cancelled_by = %s")
            update_params.append(actor_role)
            if cancellation_reason:
                update_fields.append("cancellation_reason = %s")
                update_params.append(cancellation_reason)

        update_params.append(order_id)
        cur.execute(
            f"UPDATE orders SET {', '.join(update_fields)} WHERE id = %s",
            update_params,
        )

        # Audit event
        _write_event(
            cur, order_id, "status_changed",
            actor_id=me, actor_role=actor_role,
            old_status=current_status, new_status=new_status,
            metadata={
                "action":               action,
                "has_seller_note":      bool(seller_note),
                "cancellation_reason":  cancellation_reason,
            },
        )

        # Send seller note as a message in the conversation thread
        if seller_note and actor_role == "seller":
            prefix = "[Order accepted]" if new_status == "accepted" else "[Order declined]"
            _send_order_message(conn, cur, me, buyer_id, f"{prefix} {seller_note}")

        # On accept: mark ALL listings in the order unavailable + auto-reject
        # other pending orders for those listings.
        if new_status == "accepted":
            # Collect listing IDs: prefer order_items (covers both single and
            # multi-item orders), fall back to the denormalised listing_id column.
            cur.execute(
                "SELECT DISTINCT listing_id FROM order_items WHERE order_id = %s",
                (order_id,)
            )
            listing_ids_to_close = [r[0] for r in cur.fetchall()]

            # Fallback: if order_items is empty, use the shortcut column
            if not listing_ids_to_close:
                cur.execute("SELECT listing_id FROM orders WHERE id = %s", (order_id,))
                acc = cur.fetchone()
                if acc and acc[0]:
                    listing_ids_to_close = [acc[0]]

            for listing_id in listing_ids_to_close:
                # Mark listing as sold
                cur.execute(
                    "UPDATE listings SET is_available = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (listing_id,)
                )
                log.info("listing.marked_sold", listing_id=listing_id, accepted_order_id=order_id)

                # Auto-reject other pending orders for this listing
                cur.execute(
                    "SELECT id, buyer_id FROM orders WHERE listing_id = %s AND status = %s AND id != %s",
                    (listing_id, "pending", order_id)
                )
                for sib_id, sib_buyer_id in cur.fetchall():
                    cur.execute(
                        "UPDATE orders SET status = %s, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, seller_note = %s WHERE id = %s",
                        ("rejected", "Item has been sold to another buyer.", sib_id)
                    )
                    _write_event(
                        cur, sib_id, "status_changed",
                        actor_id=me, actor_role="seller",
                        old_status="pending", new_status="rejected",
                        metadata={"reason": "listing_sold_to_another_buyer", "accepted_order_id": order_id},
                    )
                    log.info("order.auto_rejected", order_id=sib_id, reason="listing_sold", accepted_order_id=order_id)

                # Also auto-reject via order_items for multi-item orders whose
                # orders table listing_id is NULL
                cur.execute(
                    """SELECT DISTINCT o.id, o.buyer_id
                       FROM orders o
                       JOIN order_items oi ON oi.order_id = o.id
                       WHERE oi.listing_id = %s AND o.status = 'pending' AND o.id != %s""",
                    (listing_id, order_id)
                )
                for sib_id, sib_buyer_id in cur.fetchall():
                    cur.execute(
                        "UPDATE orders SET status = %s, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, seller_note = %s WHERE id = %s",
                        ("rejected", "Item has been sold to another buyer.", sib_id)
                    )
                    _write_event(
                        cur, sib_id, "status_changed",
                        actor_id=me, actor_role="seller",
                        old_status="pending", new_status="rejected",
                        metadata={"reason": "listing_sold_to_another_buyer", "accepted_order_id": order_id},
                    )
                    log.info("order.auto_rejected_via_items", order_id=sib_id, listing_id=listing_id, accepted_order_id=order_id)


        conn.commit()
        log.info(
            "order.updated",
            order_id=order_id, actor_id=me, actor_role=actor_role,
            old_status=current_status, new_status=new_status,
        )
        cur.close()
        conn.close()
        return jsonify({"success": True, "status": new_status})

    except psycopg2.Error as exc:
        if conn:
            conn.rollback()
        log.error("order.update.db_error", order_id=order_id, user_id=me, exc=str(exc))
        return jsonify({"error": "Database error. Please try again."}), 500
    except Exception as exc:
        if conn:
            conn.rollback()
        log.error("order.update.unexpected", order_id=order_id, user_id=me, exc=str(exc))
        return jsonify({"error": "Unexpected error. Please try again."}), 500
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


# ── Background expiry job ─────────────────────────────────────────────────────

def expire_pending_orders() -> int:
    """
    Called by APScheduler every 15 minutes.
    Finds pending orders past expires_at, marks them expired, writes events.
    Returns the count of orders expired this run.
    """
    log.info("order.expiry.scan_start")
    conn = None
    expired_count = 0
    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        cur.execute(
            """SELECT id, buyer_id, seller_id
               FROM orders
               WHERE status = 'pending' AND expires_at <= CURRENT_TIMESTAMP
               LIMIT 200""",
        )
        rows = cur.fetchall()

        for order_id, buyer_id, seller_id in rows:
            cur.execute(
                """UPDATE orders
                   SET status = 'expired', updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s""",
                (order_id,),
            )
            _write_event(
                cur, order_id, "status_changed",
                actor_id=None, actor_role="system",
                old_status="pending", new_status="expired",
                metadata={"reason": "seller_did_not_respond_within_3_days"},
            )
            expired_count += 1

        conn.commit()
        cur.close()
        log.info("order.expiry.scan_done", expired_count=expired_count)
        return expired_count

    except Exception as exc:
        if conn:
            conn.rollback()
        log.error("order.expiry.error", exc=str(exc))
        return 0
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass