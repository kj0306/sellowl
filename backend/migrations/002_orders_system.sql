-- =============================================================================
-- Migration 002 — Orders System
-- Created: 2026-01-01
-- Description: Complete order pipeline: orders, order_items (snapshot),
--              order_events (immutable audit log), and helper indexes.
--
-- Design decisions:
--   • order_items snapshots listing data at order time so the record is
--     durable even if the listing is later deleted/edited.
--   • order_events is append-only (no UPDATE/DELETE). Every state transition
--     writes a row so we have a full audit trail — critical for dispute
--     resolution and analytics.
--   • expires_at is set to NOW() + 3 days at INSERT time. A background job
--     flips status → 'expired' and writes an event row.
--   • JSONB metadata on order_events gives us schema-free extra context
--     without requiring a migration every time we add a field.
-- =============================================================================

-- ── orders ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                  SERIAL          PRIMARY KEY,

    -- Parties
    buyer_id            INTEGER         NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    seller_id           INTEGER         NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,

    -- Reference to source listing (nullable: listing may be deleted later)
    listing_id          INTEGER                  REFERENCES listings(id) ON DELETE SET NULL,

    -- State machine: pending → accepted | rejected | cancelled | expired
    --                accepted → completed  (future: when buyer confirms pickup)
    status              VARCHAR(20)     NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','rejected',
                                              'cancelled','expired','completed')),

    -- Financials (snapshot at order time — not live from listing)
    total_amount        DECIMAL(10,2)   NOT NULL CHECK (total_amount >= 0),
    item_count          INTEGER         NOT NULL DEFAULT 1 CHECK (item_count >= 1),

    -- Optional free-text from buyer
    buyer_note          TEXT,

    -- Optional response message from seller on accept/reject
    seller_note         TEXT,

    -- Who cancelled (if status = 'cancelled')
    cancelled_by        VARCHAR(10)              CHECK (cancelled_by IN ('buyer','seller','system')),
    cancellation_reason TEXT,

    -- Timestamps
    expires_at          TIMESTAMP       NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 days'),
    responded_at        TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Core query patterns
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id   ON orders (buyer_id,  created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id  ON orders (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON orders (listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
-- Composite for expiry job (only pending orders need checking)
CREATE INDEX IF NOT EXISTS idx_orders_expiry     ON orders (status, expires_at)
    WHERE status = 'pending';
-- Composite for seller "incoming pending" view
CREATE INDEX IF NOT EXISTS idx_orders_seller_pending ON orders (seller_id, status, created_at DESC)
    WHERE status = 'pending';


-- ── order_items ───────────────────────────────────────────────────────────────
-- Snapshot of each listing included in the order.
-- Data is captured at order-creation time and never mutated.
CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL          PRIMARY KEY,
    order_id        INTEGER         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Soft reference — listing may be gone
    listing_id      INTEGER                  REFERENCES listings(id) ON DELETE SET NULL,

    -- Snapshot fields (duplicated intentionally — immutable record)
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2)   NOT NULL CHECK (price >= 0),
    category        VARCHAR(100),
    condition       VARCHAR(50),
    image_url       TEXT,
    neighbourhood   VARCHAR(255),

    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_listing_id ON order_items (listing_id);


-- ── order_events (immutable audit log) ───────────────────────────────────────
-- Append-only. Every state transition, cancellation, system action, or
-- notable observation gets a row here. Never UPDATE or DELETE this table.
-- This is your source of truth for disputes, analytics, and debugging.
CREATE TABLE IF NOT EXISTS order_events (
    id          BIGSERIAL       PRIMARY KEY,
    order_id    INTEGER         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Who did what
    event_type  VARCHAR(50)     NOT NULL,   -- e.g. order_created, status_changed, note_added
    actor_id    INTEGER                  REFERENCES users(id) ON DELETE SET NULL,
    actor_role  VARCHAR(10)              CHECK (actor_role IN ('buyer','seller','system')),

    -- State transition (nullable for non-status events)
    old_status  VARCHAR(20),
    new_status  VARCHAR(20),

    -- Schema-free payload for extra context
    -- Examples: {"ip":"1.2.3.4"}, {"reason":"item sold"}, {"duration_seconds":42}
    metadata    JSONB           NOT NULL DEFAULT '{}',

    -- Immutable timestamp
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id   ON order_events (order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_order_events_actor_id   ON order_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_order_events_event_type ON order_events (event_type);
-- For analytics: how long do sellers take to respond?
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON order_events (created_at DESC);
-- Partial index for fast "all status_changed events" analytics
CREATE INDEX IF NOT EXISTS idx_order_events_status_changed
    ON order_events (order_id, created_at)
    WHERE event_type = 'status_changed';


-- ── updated_at auto-trigger (orders) ─────────────────────────────────────────
-- Postgres does not auto-update updated_at. A trigger does it for us.
-- updated_at is set explicitly in all UPDATE statements in orders.py