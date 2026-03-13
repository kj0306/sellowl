from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import os
from config import Config
from firebase_auth import init_firebase, verify_id_token, check_email_domain
from db import get_db_connection, init_db
import psycopg2

app = Flask(__name__, static_folder="dist", static_url_path="")
app.config.from_object(Config)

# CORS for React dev server and production
_cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if os.environ.get("FRONTEND_URL"):
    _cors_origins.append(os.environ["FRONTEND_URL"])
CORS(app, origins=_cors_origins, supports_credentials=True)

# Initialize Firebase and Database
init_firebase()
init_db()


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    """Return current user if session exists"""
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({
        "user": {
            "id": session.get("user_id"),
            "email": session.get("email"),
            "display_name": session.get("display_name"),
        }
    })


@app.route("/api/auth/verify", methods=["POST"])
def verify_auth():
    """Verify Firebase ID token and create/update user in database"""
    try:
        data = request.get_json()
        id_token = data.get("idToken")

        if not id_token:
            return jsonify({"error": "No ID token provided"}), 400

        # Verify token with Firebase
        decoded_token = verify_id_token(id_token)
        if not decoded_token:
            return jsonify({"error": "Invalid token"}), 401

        email = (decoded_token.get("email") or "").lower().strip()
        firebase_uid = decoded_token.get("uid")
        email_verified = decoded_token.get("email_verified", False)
        display_name = decoded_token.get("name") or email.split("@")[0]

        # Check email domain (.edu)
        if not check_email_domain(email):
            return jsonify({
                "error": "Only .edu email addresses are allowed",
                "email": email,
            }), 403

        # Check email verification
        if not email_verified:
            return jsonify({
                "error": "Email verification required. Please verify your email address.",
                "email": email,
            }), 403

        # Store/update user in database
        try:
            conn = get_db_connection()
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 503
        except psycopg2.OperationalError as e:
            return jsonify({
                "error": "Database connection failed. Check DATABASE_URL.",
                "detail": str(e),
            }), 503

        cur = None
        try:
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    display_name VARCHAR(255),
                    email_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

            cur.execute("SELECT id FROM users WHERE firebase_uid = %s", (firebase_uid,))
            user = cur.fetchone()

            if user:
                cur.execute("""
                    UPDATE users
                    SET email = %s, display_name = %s, email_verified = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE firebase_uid = %s
                    RETURNING id
                """, (email, display_name, email_verified, firebase_uid))
                user_id = cur.fetchone()[0]
            else:
                cur.execute("""
                    INSERT INTO users (firebase_uid, email, display_name, email_verified)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (firebase_uid, email, display_name, email_verified))
                user_id = cur.fetchone()[0]

            conn.commit()
        except psycopg2.Error as e:
            conn.rollback()
            return jsonify({
                "error": "Database error while saving user.",
                "detail": str(e),
            }), 503
        finally:
            if cur:
                cur.close()
            conn.close()

        session["user_id"] = user_id
        session["firebase_uid"] = firebase_uid
        session["email"] = email
        session["display_name"] = display_name

        return jsonify({
            "success": True,
            "user": {
                "id": user_id,
                "email": email,
                "display_name": display_name,
            },
        })

    except Exception as e:
        print(f"Auth error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({"success": True})


# Serve React frontend (static files + SPA fallback)
@app.route("/")
def index():
    """Serve the React app"""
    if os.path.exists(os.path.join(app.static_folder, "index.html")):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"message": "Sell OWL API", "docs": "/api/auth/me"}), 404


@app.route("/<path:path>")
def serve_frontend(path):
    """Serve static assets or SPA fallback for client-side routing"""
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    if os.path.exists(os.path.join(app.static_folder, "index.html")):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"error": "Not found"}), 404

@app.route("/api/listings", methods=["GET"])
def get_listings():
    """Get all available listings for the feed"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT l.id, l.title, l.description, l.price, l.category,
                   l.condition, l.image_url, l.created_at,
                   u.display_name as seller_name, u.email as seller_email, u.id as seller_id
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.is_available = TRUE
            ORDER BY l.created_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        listings = [
            {
                "id": r[0],
                "title": r[1],
                "description": r[2],
                "price": float(r[3]) if r[3] else 0,
                "category": r[4],
                "condition": r[5],
                "image_url": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "seller": {
                    "id": r[10],
                    "name": r[8],
                    "email": r[9],
                },
            }
            for r in rows
        ]
        return jsonify({"listings": listings})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/listings", methods=["POST"])
def create_listing():
    """Create a new listing (must be logged in)"""
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    try:
        data = request.get_json()
        title = data.get("title", "").strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO listings (user_id, title, description, price, category, condition, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            session["user_id"],
            title,
            data.get("description", ""),
            data.get("price", 0),
            data.get("category", "Other"),
            data.get("condition", "Good"),
            data.get("image_url", ""),
        ))
        listing_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True, "id": listing_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/listings/<int:listing_id>", methods=["GET"])
def get_listing(listing_id):
    """Get a single listing by ID"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT l.id, l.title, l.description, l.price, l.category,
                   l.condition, l.image_url, l.created_at,
                   u.display_name, u.email, u.id
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.id = %s
        """, (listing_id,))
        r = cur.fetchone()
        cur.close()
        conn.close()
        if not r:
            return jsonify({"error": "Listing not found"}), 404
        return jsonify({
            "id": r[0], "title": r[1], "description": r[2],
            "price": float(r[3]) if r[3] else 0,
            "category": r[4], "condition": r[5], "image_url": r[6],
            "created_at": r[7].isoformat() if r[7] else None,
            "seller": {"id": r[10], "name": r[8], "email": r[9]},
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/users/<int:user_id>/listings", methods=["GET"])
def get_user_listings(user_id):
    """Get all listings for a specific user"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT l.id, l.title, l.description, l.price, l.category,
                   l.condition, l.image_url, l.is_available, l.created_at,
                   u.display_name, u.email
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.user_id = %s AND l.is_available = TRUE
            ORDER BY l.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"listings": [
            {
                "id": r[0], "title": r[1], "description": r[2],
                "price": float(r[3]) if r[3] else 0,
                "category": r[4], "condition": r[5], "image_url": r[6],
                "is_available": r[7],
                "created_at": r[8].isoformat() if r[8] else None,
                "seller_name": r[9], "seller_email": r[10],
            }
            for r in rows
        ]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
