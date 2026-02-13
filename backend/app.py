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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
