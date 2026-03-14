from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import os
import psycopg2
from config import Config
from firebase_auth import init_firebase, verify_id_token, check_email_domain
from db import get_db_connection, init_db
from ai_provider import ai   # ← swap AI backend via AI_PROVIDER env var

app = Flask(__name__, static_folder="dist", static_url_path="")
app.config.from_object(Config)

_cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if os.environ.get("FRONTEND_URL"):
    _cors_origins.append(os.environ["FRONTEND_URL"])
CORS(app, origins=_cors_origins, supports_credentials=True)

init_firebase()
init_db()

# ─── AUTH ────────────────────────────────────────────────────────

@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"user": {
        "id": session.get("user_id"),
        "email": session.get("email"),
        "display_name": session.get("display_name"),
    }})


@app.route("/api/auth/verify", methods=["POST"])
def verify_auth():
    try:
        data = request.get_json()
        id_token = data.get("idToken")
        if not id_token:
            return jsonify({"error": "No ID token provided"}), 400
        decoded_token = verify_id_token(id_token)
        if not decoded_token:
            return jsonify({"error": "Invalid token"}), 401
        email        = (decoded_token.get("email") or "").lower().strip()
        firebase_uid = decoded_token.get("uid")
        email_verified = decoded_token.get("email_verified", False)
        display_name   = decoded_token.get("name") or email.split("@")[0]
        if not check_email_domain(email):
            return jsonify({"error": "Only .edu email addresses are allowed", "email": email}), 403
        if not email_verified:
            return jsonify({"error": "Email verification required.", "email": email}), 403
        try:
            conn = get_db_connection()
        except (RuntimeError, psycopg2.OperationalError) as e:
            return jsonify({"error": "Database connection failed.", "detail": str(e)}), 503
        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY, firebase_uid VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL, display_name VARCHAR(255),
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
            conn.commit()
            cur.execute("SELECT id FROM users WHERE firebase_uid = %s", (firebase_uid,))
            user = cur.fetchone()
            if user:
                cur.execute("""UPDATE users SET email=%s, display_name=%s, email_verified=%s,
                    updated_at=CURRENT_TIMESTAMP WHERE firebase_uid=%s RETURNING id""",
                    (email, display_name, email_verified, firebase_uid))
                user_id = cur.fetchone()[0]
            else:
                cur.execute("""INSERT INTO users (firebase_uid, email, display_name, email_verified)
                    VALUES (%s, %s, %s, %s) RETURNING id""",
                    (firebase_uid, email, display_name, email_verified))
                user_id = cur.fetchone()[0]
            conn.commit()
        except psycopg2.Error as e:
            conn.rollback()
            return jsonify({"error": "Database error.", "detail": str(e)}), 503
        finally:
            if cur: cur.close()
            conn.close()
        session["user_id"]     = user_id
        session["firebase_uid"] = firebase_uid
        session["email"]        = email
        session["display_name"] = display_name
        return jsonify({"success": True, "user": {"id": user_id, "email": email, "display_name": display_name}})
    except Exception as e:
        print(f"Auth error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


# ─── LISTINGS ────────────────────────────────────────────────────

def _ensure_listings_table(conn):
    cur = conn.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL, description TEXT,
        price DECIMAL(10,2), category VARCHAR(100), condition VARCHAR(50),
        image_url TEXT, neighbourhood VARCHAR(255),
        delivery_option VARCHAR(50) DEFAULT 'pickup',
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    for col, defn in [
        ("neighbourhood",   "VARCHAR(255)"),
        ("delivery_option", "VARCHAR(50) DEFAULT 'pickup'"),
    ]:
        try:
            cur.execute(f"ALTER TABLE listings ADD COLUMN IF NOT EXISTS {col} {defn}")
        except Exception:
            pass
    conn.commit()
    cur.close()


def _row_to_listing(r):
    return {
        "id": r[0], "title": r[1], "description": r[2],
        "price":    float(r[3]) if r[3] is not None else 0,
        "category": r[4], "condition": r[5], "image_url": r[6],
        "neighbourhood": r[7], "delivery_option": r[8],
        "is_available": r[9],
        "created_at": r[10].isoformat() if r[10] else None,
        "seller_name": r[11], "seller_email": r[12], "seller_id": r[13],
    }


@app.route("/api/listings", methods=["GET"])
def get_listings():
    try:
        conn = get_db_connection()
        _ensure_listings_table(conn)
        cur = conn.cursor()
        cur.execute("""SELECT l.id, l.title, l.description, l.price, l.category,
               l.condition, l.image_url, l.neighbourhood, l.delivery_option,
               l.is_available, l.created_at, u.display_name, u.email, u.id
            FROM listings l JOIN users u ON l.user_id = u.id
            WHERE l.is_available = TRUE ORDER BY l.created_at DESC""")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({"listings": [_row_to_listing(r) for r in rows]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/listings", methods=["POST"])
def create_listing():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        data = request.get_json()
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400
        conn = get_db_connection()
        _ensure_listings_table(conn)
        cur = conn.cursor()
        cur.execute("""INSERT INTO listings
            (user_id, title, description, price, category, condition,
             image_url, neighbourhood, delivery_option)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (session["user_id"], title, data.get("description",""),
             data.get("price", 0), data.get("category","Other"),
             data.get("condition","Good"), data.get("image_url",""),
             data.get("neighbourhood",""), data.get("delivery_option","pickup")))
        listing_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return jsonify({"success": True, "id": listing_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/listings/<int:listing_id>", methods=["GET"])
def get_listing(listing_id):
    try:
        conn = get_db_connection()
        _ensure_listings_table(conn)
        cur = conn.cursor()
        cur.execute("""SELECT l.id, l.title, l.description, l.price, l.category,
               l.condition, l.image_url, l.neighbourhood, l.delivery_option,
               l.is_available, l.created_at, u.display_name, u.email, u.id
            FROM listings l JOIN users u ON l.user_id = u.id WHERE l.id=%s""",
            (listing_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row: return jsonify({"error": "Not found"}), 404
        return jsonify({"listing": _row_to_listing(row)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>/listings", methods=["GET"])
def get_user_listings(user_id):
    try:
        conn = get_db_connection()
        _ensure_listings_table(conn)
        cur = conn.cursor()
        cur.execute("""SELECT l.id, l.title, l.description, l.price, l.category,
               l.condition, l.image_url, l.neighbourhood, l.delivery_option,
               l.is_available, l.created_at, u.display_name, u.email, u.id
            FROM listings l JOIN users u ON l.user_id = u.id
            WHERE l.user_id=%s AND l.is_available=TRUE ORDER BY l.created_at DESC""",
            (user_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({"listings": [_row_to_listing(r) for r in rows]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/listings/<int:listing_id>", methods=["DELETE"])
def delete_listing(listing_id):
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE listings SET is_available=FALSE WHERE id=%s AND user_id=%s",
                    (listing_id, session["user_id"]))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── AI ROUTES (provider-agnostic) ──────────────────────────────

@app.route("/api/ai/scan-image", methods=["POST"])
def scan_image():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        data = request.get_json()
        image_url = data.get("image_url")
        if not image_url:
            return jsonify({"error": "image_url required"}), 400
        result = ai.scan_image(image_url)
        return jsonify({"success": True, "data": result})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        print(f"scan_image error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/suggest-price", methods=["POST"])
def suggest_price():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        data = request.get_json()
        title = data.get("title", "")
        if not title:
            return jsonify({"error": "title required"}), 400
        result = ai.suggest_price(
            title,
            data.get("description", ""),
            data.get("category", ""),
            data.get("condition", ""),
        )
        return jsonify({"success": True, "data": result})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        print(f"suggest_price error: {e}")
        return jsonify({"error": str(e)}), 500


# ─── STATIC / SPA → moved to bottom of file ───





# ─── MESSAGING ───────────────────────────────────────────────────

def _ensure_messaging_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user1_id, user2_id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Tracks when each user last read each conversation
    cur.execute("""
        CREATE TABLE IF NOT EXISTS conversation_reads (
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
            last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, conversation_id)
        )
    """)
    conn.commit()
    cur.close()


@app.route("/api/conversations", methods=["GET", "POST"])
def conversations():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    # ── POST: start or get a conversation ──
    if request.method == "POST":
        try:
            me = session["user_id"]
            other_id = request.get_json().get("other_user_id")
            if not other_id or other_id == me:
                return jsonify({"error": "Invalid user"}), 400
            conn = get_db_connection()
            _ensure_messaging_tables(conn)
            cur = conn.cursor()
            u1, u2 = min(me, other_id), max(me, other_id)
            cur.execute("""
                INSERT INTO conversations (user1_id, user2_id)
                VALUES (%s, %s)
                ON CONFLICT (user1_id, user2_id) DO UPDATE SET user1_id = EXCLUDED.user1_id
                RETURNING id
            """, (u1, u2))
            conv_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return jsonify({"conversation_id": conv_id})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── GET: list all conversations ──
    try:
        me = session["user_id"]
        conn = get_db_connection()
        _ensure_messaging_tables(conn)
        cur = conn.cursor()
        cur.execute("""
            SELECT
                c.id,
                u.id   AS other_id,
                u.display_name AS other_name,
                u.email AS other_email,
                m.text AS last_text,
                m.created_at AS last_time,
                m.sender_id AS last_sender_id,
                (
                    SELECT COUNT(*)
                    FROM messages msg
                    WHERE msg.conversation_id = c.id
                      AND msg.sender_id != %s
                      AND msg.created_at > COALESCE(
                          (SELECT last_read_at FROM conversation_reads
                           WHERE user_id = %s AND conversation_id = c.id),
                          '1970-01-01'
                      )
                ) AS unread_count
            FROM conversations c
            JOIN users u ON u.id = CASE
                WHEN c.user1_id = %s THEN c.user2_id
                ELSE c.user1_id
            END
            LEFT JOIN LATERAL (
                SELECT text, created_at, sender_id
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON TRUE
            WHERE c.user1_id = %s OR c.user2_id = %s
            ORDER BY COALESCE(m.created_at, c.created_at) DESC
        """, (me, me, me, me, me))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({"conversations": [
            {
                "id": r[0],
                "other_user": {"id": r[1], "name": r[2], "email": r[3]},
                "last_message": r[4],
                "last_time": r[5].isoformat() if r[5] else None,
                "last_sender_id": r[6],
                "unread_count": int(r[7]),
            }
            for r in rows
        ]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/conversations/<int:conv_id>/messages", methods=["GET", "POST"])
def conversation_messages(conv_id):
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    me = session["user_id"]

    # ── POST: send a message ──
    if request.method == "POST":
        try:
            text = (request.get_json().get("text") or "").strip()
            if not text:
                return jsonify({"error": "Message cannot be empty"}), 400
            conn = get_db_connection()
            _ensure_messaging_tables(conn)
            cur = conn.cursor()
            cur.execute("""
                SELECT id FROM conversations
                WHERE id = %s AND (user1_id = %s OR user2_id = %s)
            """, (conv_id, me, me))
            if not cur.fetchone():
                cur.close(); conn.close()
                return jsonify({"error": "Not found"}), 404
            cur.execute("""
                INSERT INTO messages (conversation_id, sender_id, text)
                VALUES (%s, %s, %s)
                RETURNING id, created_at
            """, (conv_id, me, text))
            msg_id, created_at = cur.fetchone()
            conn.commit(); cur.close(); conn.close()
            return jsonify({
                "id": msg_id,
                "sender_id": me,
                "sender_name": session.get("display_name"),
                "text": text,
                "time": created_at.isoformat(),
                "is_mine": True,
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── GET: load messages ──
    try:
        conn = get_db_connection()
        _ensure_messaging_tables(conn)
        cur = conn.cursor()
        cur.execute("""
            SELECT id FROM conversations
            WHERE id = %s AND (user1_id = %s OR user2_id = %s)
        """, (conv_id, me, me))
        if not cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"error": "Not found"}), 404
        cur.execute("""
            SELECT m.id, m.sender_id, u.display_name, m.text, m.created_at
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.conversation_id = %s
            ORDER BY m.created_at ASC
        """, (conv_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({"messages": [
            {
                "id": r[0],
                "sender_id": r[1],
                "sender_name": r[2],
                "text": r[3],
                "time": r[4].isoformat() if r[4] else None,
                "is_mine": r[1] == me,
            }
            for r in rows
        ]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── UNREAD COUNT (for nav badge) ───────────────────────────────

@app.route("/api/conversations/unread", methods=["GET"])
def get_unread_count():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        me = session["user_id"]
        conn = get_db_connection()
        _ensure_messaging_tables(conn)
        cur = conn.cursor()
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
        count = cur.fetchone()[0]
        cur.close(); conn.close()
        return jsonify({"unread_count": int(count)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/conversations/<int:conv_id>/read", methods=["POST"])
def mark_conversation_read(conv_id):
    """Call this when user opens a conversation."""
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        me = session["user_id"]
        conn = get_db_connection()
        _ensure_messaging_tables(conn)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO conversation_reads (user_id, conversation_id, last_read_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, conversation_id)
            DO UPDATE SET last_read_at = CURRENT_TIMESTAMP
        """, (me, conv_id))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── STATIC / SPA ───────────────────────────────────────────────

@app.route("/")
def index():
    if os.path.exists(os.path.join(app.static_folder, "index.html")):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"message": "Sell OWL API"}), 404


@app.route("/<path:path>")
def serve_frontend(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    if os.path.exists(os.path.join(app.static_folder, "index.html")):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"error": "Not found"}), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
