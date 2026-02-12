from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
from config import Config
from firebase_auth import init_firebase, verify_id_token, check_email_domain
from db import get_db_connection, init_db

app = Flask(__name__)
app.config.from_object(Config)

# Initialize Firebase and Database
init_firebase()
init_db()

@app.route("/")
def home():
    """Homepage - redirects to login if not authenticated"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template("index.html")

@app.route("/login")
def login():
    """Login page"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template("login.html")

@app.route("/signup")
def signup():
    """Signup page"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template("signup.html")

@app.route("/api/auth/verify", methods=["POST"])
def verify_auth():
    """Verify Firebase ID token and create/update user in database"""
    try:
        data = request.get_json()
        id_token = data.get('idToken')
        
        if not id_token:
            return jsonify({'error': 'No ID token provided'}), 400
        
        # Verify token with Firebase
        decoded_token = verify_id_token(id_token)
        if not decoded_token:
            return jsonify({'error': 'Invalid token'}), 401
        
        email = (decoded_token.get('email') or '').lower().strip()

        firebase_uid = decoded_token.get('uid')
        email_verified = decoded_token.get('email_verified', False)
        display_name = decoded_token.get('name') or email.split('@')[0]
        
        # Check email domain (.edu)
        if not check_email_domain(email):
            return jsonify({
                'error': 'Only .edu email addresses are allowed',
                'email': email
            }), 403
        
        # Check email verification
        if not email_verified:
            return jsonify({
                'error': 'Email verification required. Please verify your email address.',
                'email': email
            }), 403
        
        # Store/update user in database
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE firebase_uid = %s", (firebase_uid,))
        user = cur.fetchone()
        
        if user:
            # Update existing user
            cur.execute("""
                UPDATE users 
                SET email = %s, display_name = %s, email_verified = %s, updated_at = CURRENT_TIMESTAMP
                WHERE firebase_uid = %s
                RETURNING id
            """, (email, display_name, email_verified, firebase_uid))
            user_id = cur.fetchone()[0]
        else:
            # Create new user
            cur.execute("""
                INSERT INTO users (firebase_uid, email, display_name, email_verified)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (firebase_uid, email, display_name, email_verified))
            user_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Set session
        session['user_id'] = user_id
        session['firebase_uid'] = firebase_uid
        session['email'] = email
        session['display_name'] = display_name
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'email': email,
                'display_name': display_name
            }
        })
        
    except Exception as e:
        print(f"Auth error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'success': True})

@app.route("/dashboard")
def dashboard():
    """Verified student dashboard"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_data = {
        'id': session.get('user_id'),
        'email': session.get('email'),
        'display_name': session.get('display_name')
    }
    
    return render_template("dashboard.html", user=user_data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
