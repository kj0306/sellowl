-- Likes and comments on listings (feed + profile). Persisted for all viewers.

CREATE TABLE IF NOT EXISTS listing_likes (
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (listing_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_likes_listing ON listing_likes (listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_user   ON listing_likes (user_id);

CREATE TABLE IF NOT EXISTS listing_comments (
    id          SERIAL PRIMARY KEY,
    listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT listing_comments_body_nonempty CHECK (char_length(trim(body)) > 0),
    CONSTRAINT listing_comments_body_len CHECK (char_length(body) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_listing_comments_listing ON listing_comments (listing_id, created_at DESC);
