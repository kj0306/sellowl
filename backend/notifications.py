"""
notifications.py — SellOWL Notifications API
=============================================
Blueprint: /api/notifications and /api/notifications/count

Derives notifications from existing tables — no new schema needed:
  • messages        → new messages from others in my conversations
  • order_events    → status changes on orders I'm part of (not caused by me)
  • orders          → new incoming order requests (as seller)

Each notification:
  id          string   "msg-<id>" | "oe-<id>"
  type        string   message | order_received | order_accepted |
                       order_rejected | order_cancelled | order_expired
  title       string   sender name or event label
  body        string   preview text
  created_at  string   ISO timestamp
  link_type   string   "conversation" | "order"
  link_id     int      conversation_id or order_id
"""

from flask import Blueprint, request, jsonify, session
from db import get_db_connection
from logger import get_logger

log = get_logger(__name__)
notifications_bp = Blueprint("notifications", __name__)

_STATUS_BODY = {
    "accepted":  "accepted your order",
    "rejected":  "declined your order",
    "cancelled": "cancelled the order",
    "expired":   "Order expired — seller didn't respond in 3 days",
    "completed": "marked the order as completed",
}


def _fetch_all(user_id, limit=50):
    conn = get_db_connection()
    cur = conn.cursor()
    items = []

    # ── 1. Recent messages from others ──────────────────────────────────────
    cur.execute("""
        SELECT
            m.id,
            m.conversation_id,
            u.display_name,
            m.text,
            m.created_at,
            COALESCE(
                m.created_at > (
                    SELECT last_read_at FROM conversation_reads
                    WHERE user_id = %s AND conversation_id = m.conversation_id
                ),
                TRUE
            ) AS is_unread
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        JOIN users u ON u.id = m.sender_id
        WHERE (c.user1_id = %s OR c.user2_id = %s)
          AND m.sender_id != %s
        ORDER BY m.created_at DESC
        LIMIT %s
    """, (user_id, user_id, user_id, user_id, limit))

    for row in cur.fetchall():
        msg_id, conv_id, sender_name, text, created_at, is_unread = row
        items.append({
            "id":         f"msg-{msg_id}",
            "type":       "message",
            "title":      sender_name or "Someone",
            "body":       (text or "")[:100],
            "created_at": created_at.isoformat() if created_at else None,
            "link_type":  "conversation",
            "link_id":    conv_id,
            "read":       not bool(is_unread),
        })

    # ── 2. Order events caused by others ────────────────────────────────────
    cur.execute("""
        SELECT
            oe.id,
            oe.order_id,
            oe.event_type,
            oe.new_status,
            actor.display_name  AS actor_name,
            oe.created_at,
            o.buyer_id,
            o.seller_id,
            (
                SELECT STRING_AGG(oi.title, ', ' ORDER BY oi.id)
                FROM order_items oi
                WHERE oi.order_id = o.id
            ) AS item_titles
        FROM order_events oe
        JOIN orders o      ON o.id  = oe.order_id
        LEFT JOIN users actor ON actor.id = oe.actor_id
        WHERE (o.buyer_id = %s OR o.seller_id = %s)
          AND (oe.actor_id IS NULL OR oe.actor_id != %s)
          AND oe.event_type IN ('order_created', 'status_changed')
        ORDER BY oe.created_at DESC
        LIMIT %s
    """, (user_id, user_id, user_id, limit))

    for row in cur.fetchall():
        oe_id, order_id, event_type, new_status, actor_name, created_at, buyer_id, seller_id, item_titles = row
        items_preview = item_titles or "items"
        actor = actor_name or "Someone"

        if event_type == "order_created":
            notif_type = "order_received"
            title      = actor
            body       = f"Placed an order request for {items_preview}"

        elif event_type == "status_changed" and new_status:
            notif_type = f"order_{new_status}"
            if new_status == "expired":
                title = "Order expired"
                body  = f"Your order for {items_preview} expired (no response)"
            else:
                label = _STATUS_BODY.get(new_status, new_status)
                title = actor
                body  = f"{label.capitalize()} — {items_preview}"
        else:
            continue

        items.append({
            "id":         f"oe-{oe_id}",
            "type":       notif_type,
            "title":      title,
            "body":       body,
            "created_at": created_at.isoformat() if created_at else None,
            "link_type":  "order",
            "link_id":    order_id,
            "read":       False,   # client tracks via localStorage
        })

    cur.close()
    conn.close()

    items.sort(key=lambda n: n["created_at"] or "", reverse=True)
    return items[:limit]


# ── Routes ────────────────────────────────────────────────────────────────────

@notifications_bp.route("/api/notifications", methods=["GET"])
def get_notifications():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        items = _fetch_all(session["user_id"])
        return jsonify({"notifications": items})
    except Exception as exc:
        log.error("notifications.get.error", exc=str(exc))
        return jsonify({"error": str(exc)}), 500


@notifications_bp.route("/api/notifications/count", methods=["GET"])
def get_notification_count():
    """
    Returns:
      unread_messages  int   conversations with unread messages (for Messages badge)
      pending_orders   int   pending order requests as seller  (for Offers badge)
      new_order_events int   order status changes as buyer, last 7 days (for Notifications badge)
    """
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        me = session["user_id"]
        conn = get_db_connection()
        cur = conn.cursor()

        # Unread message conversations
        cur.execute("""
            SELECT COUNT(DISTINCT msg.conversation_id)
            FROM messages msg
            JOIN conversations c ON c.id = msg.conversation_id
            WHERE msg.sender_id != %s
              AND (c.user1_id = %s OR c.user2_id = %s)
              AND msg.created_at > COALESCE(
                  (SELECT last_read_at FROM conversation_reads
                   WHERE user_id = %s AND conversation_id = msg.conversation_id),
                  '1970-01-01'
              )
        """, (me, me, me, me))
        unread_messages = int(cur.fetchone()[0])

        # Pending incoming orders (as seller)
        cur.execute(
            "SELECT COUNT(*) FROM orders WHERE seller_id = %s AND status = 'pending'",
            (me,)
        )
        pending_orders = int(cur.fetchone()[0])

        # Order events affecting me as buyer in last 7 days (not caused by me)
        # These are the ones shown in the Notifications tab
        cur.execute("""
            SELECT COUNT(*) FROM order_events oe
            JOIN orders o ON o.id = oe.order_id
            WHERE o.buyer_id = %s
              AND (oe.actor_id IS NULL OR oe.actor_id != %s)
              AND oe.event_type IN ('status_changed')
              AND oe.created_at > NOW() - INTERVAL '7 days'
        """, (me, me))
        new_order_events = int(cur.fetchone()[0])

        cur.close()
        conn.close()
        return jsonify({
            "unread_messages":  unread_messages,
            "pending_orders":   pending_orders,
            "new_order_events": new_order_events,
        })
    except Exception as exc:
        log.error("notifications.count.error", exc=str(exc))
        return jsonify({"error": str(exc)}), 500
