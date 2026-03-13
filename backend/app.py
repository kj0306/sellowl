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
