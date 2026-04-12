CREATE TABLE IF NOT EXISTS schema_migrations (
    version     VARCHAR(20) PRIMARY KEY,
    applied_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id             SERIAL        PRIMARY KEY,
    firebase_uid   VARCHAR(255)  UNIQUE NOT NULL,
    email          VARCHAR(255)  UNIQUE NOT NULL,
    display_name   VARCHAR(255),
    email_verified BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS university  VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio         TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_university   ON users (university);

CREATE TABLE IF NOT EXISTS listings (
    id              SERIAL          PRIMARY KEY,
    user_id         INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2)   NOT NULL DEFAULT 0,
    category        VARCHAR(100)    NOT NULL DEFAULT 'Other',
    condition       VARCHAR(50)     NOT NULL DEFAULT 'Good',
    image_url       TEXT,
    neighbourhood   VARCHAR(255),
    delivery_option VARCHAR(50)     NOT NULL DEFAULT 'pickup',
    is_available    BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_listings_user_id      ON listings (user_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_available ON listings (is_available);
CREATE INDEX IF NOT EXISTS idx_listings_category     ON listings (category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at   ON listings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_feed         ON listings (is_available, created_at DESC);

CREATE TABLE IF NOT EXISTS conversations (
    id         SERIAL    PRIMARY KEY,
    user1_id   INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id   INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations (user1_id, user2_id);

CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL    PRIMARY KEY,
    conversation_id INTEGER   NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       INTEGER   NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    text            TEXT      NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id       ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at      ON messages (conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS conversation_reads (
    user_id         INTEGER   NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
    conversation_id INTEGER   NOT NULL REFERENCES conversations(id)  ON DELETE CASCADE,
    last_read_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, conversation_id)
);