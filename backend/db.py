import psycopg2
import os
from config import Config

_db_initialized = False


def _connection_url():
    url = Config.DATABASE_URL
    if not url:
        return None
    if "supabase.co" in url and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return url


def get_db_connection():
    url = _connection_url()
    if not url:
        raise RuntimeError("DATABASE_URL is not set.")
    return psycopg2.connect(url)


def init_db():
    global _db_initialized
    url = _connection_url()
    if not url:
        print("Warning: DATABASE_URL not set. User data will not be saved.")
        return
    try:
        conn = psycopg2.connect(url)
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
        cur.close()
        conn.close()
        _db_initialized = True
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database init failed: {e}")
