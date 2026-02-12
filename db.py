import psycopg2
from psycopg2.extras import RealDictCursor
import os
from config import Config

# Track if we've successfully run init so we retry on first use
_db_initialized = False


def _connection_url():
    """DATABASE_URL with sslmode=require for Supabase when not present."""
    url = Config.DATABASE_URL
    if not url:
        return None
    if "supabase.co" in url and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return url


def get_db_connection():
    """Get PostgreSQL database connection. Raises if DATABASE_URL not set or connection fails."""
    url = _connection_url()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it in Render Dashboard → Environment."
        )
    return psycopg2.connect(url)


def init_db():
    """Initialize database tables. Safe to call at startup; logs and continues on failure."""
    global _db_initialized
    url = _connection_url()
    if not url:
        print("Warning: DATABASE_URL not set. User data will not be saved. Set DATABASE_URL in Render → Environment.")
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
        print(f"Database init failed (app will still start): {e}")
        print("Set DATABASE_URL in Render → Environment and use Supabase connection string with sslmode=require if needed.")
