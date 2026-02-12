import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from config import Config


def init_firebase():
    """Initialize Firebase Admin SDK (safe to call multiple times)."""
    if firebase_admin._apps:
        return

    # 1) Render: single JSON env var (recommended)
    json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if json_str:
        try:
            service_account_info = json.loads(json_str)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized from FIREBASE_SERVICE_ACCOUNT_JSON")
            return
        except Exception as e:
            print(f"Failed to init Firebase from FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    # 2) Local: file path
    if Config.FIREBASE_CREDENTIALS_PATH and os.path.exists(Config.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized from FIREBASE_CREDENTIALS_PATH")
        return

    # 3) Fallback: split env vars (optional)
    if Config.FIREBASE_PROJECT_ID:
        cred_dict = {
                "type": os.environ.get('FIREBASE_TYPE', 'service_account'),
                "project_id": Config.FIREBASE_PROJECT_ID,
                "private_key_id": os.environ.get('FIREBASE_PRIVATE_KEY_ID'),
                "private_key": os.environ.get('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                "client_email": os.environ.get('FIREBASE_CLIENT_EMAIL'),
                "client_id": os.environ.get('FIREBASE_CLIENT_ID'),
                "auth_uri": os.environ.get('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
                "token_uri": os.environ.get('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
            }
        if all([cred_dict.get("project_id"), cred_dict.get("private_key"), cred_dict.get("client_email")]):
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized from split env vars")
            return

    print("Warning: Firebase not initialized - credentials not found")


def verify_id_token(id_token):
    """Verify Firebase ID token"""
    try:
        return auth.verify_id_token(id_token)
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


def check_email_domain(email):
    """Allow any .edu email"""
    normalized = (email or "").lower().strip()
    return normalized.endswith(".edu")


