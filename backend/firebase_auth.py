import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from config import Config


def init_firebase():
    if firebase_admin._apps:
        return

    json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if json_str:
        try:
            service_account_info = json.loads(json_str)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized from FIREBASE_SERVICE_ACCOUNT_JSON")
            return
        except Exception as e:
            print(f"Failed to init Firebase: {e}")

    cred_path = Config.FIREBASE_CREDENTIALS_PATH
    if not cred_path:
        _dir = os.path.dirname(os.path.abspath(__file__))
        cred_path = os.path.join(_dir, "firebase-service-account.json")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized from credentials file")
        return

    if Config.FIREBASE_PROJECT_ID:
        cred_dict = {
            "type": os.environ.get("FIREBASE_TYPE", "service_account"),
            "project_id": Config.FIREBASE_PROJECT_ID,
            "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": (os.environ.get("FIREBASE_PRIVATE_KEY", "") or "").replace("\\n", "\n"),
            "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
            "auth_uri": os.environ.get("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
            "token_uri": os.environ.get("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        }
        if all([cred_dict.get("project_id"), cred_dict.get("private_key"), cred_dict.get("client_email")]):
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized from split env vars")
            return

    print("Warning: Firebase not initialized - credentials not found")


def verify_id_token(id_token):
    try:
        return auth.verify_id_token(id_token)
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


def check_email_domain(email):
    normalized = (email or "").lower().strip()
    return normalized.endswith(".edu")
