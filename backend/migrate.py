#!/usr/bin/env python3
"""
migrate.py — SellOWL Database Migration Runner
===============================================
Usage:
    python migrate.py              # apply all pending migrations
    python migrate.py --status     # show which migrations are applied
    python migrate.py --dry-run    # print SQL without executing

Migrations live in backend/migrations/ as NN_description.sql files.
Applied versions are tracked in the schema_migrations table.

Safe to run on every deploy — already-applied migrations are skipped.
"""
from __future__ import annotations
import os
import sys
import argparse
import logging
from pathlib import Path
import psycopg2
from config import Config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [migrate] %(levelname)s %(message)s",
)
log = logging.getLogger("migrate")


def _connection_url() -> str:
    url = Config.DATABASE_URL
    if not url:
        raise RuntimeError("DATABASE_URL is not set.")
    if "supabase.co" in url and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return url


def get_migrations_dir() -> Path:
    return Path(__file__).parent / "migrations"


def list_migration_files() -> list[tuple[str, Path]]:
    """Return [(version, path), ...] sorted by version string."""
    migrations_dir = get_migrations_dir()
    files = sorted(migrations_dir.glob("*.sql"))
    result = []
    for f in files:
        # version = first token before '_', e.g. "001" from "001_base_tables.sql"
        version = f.stem.split("_")[0]
        result.append((version, f))
    return result


def get_applied_versions(conn) -> set[str]:
    cur = conn.cursor()
    # schema_migrations may not exist yet (first ever run)
    try:
        cur.execute("SELECT version FROM schema_migrations")
        applied = {row[0] for row in cur.fetchall()}
    except psycopg2.errors.UndefinedTable:
        conn.rollback()
        applied = set()
    finally:
        cur.close()
    return applied


def _split_statements(sql):
    """
    Split SQL file into individual statements.
    Correctly handles:
      - Semicolons inside -- single-line comments (stripped before splitting)
      - Semicolons inside $$ dollar-quoted blocks (e.g. plpgsql functions)
    """
    # Step 1: strip single-line comment lines
    clean_lines = []
    for line in sql.splitlines():
        if not line.strip().startswith("--"):
            clean_lines.append(line)
    clean_sql = "\n".join(clean_lines)

    # Step 2: split on ; but NOT inside $$ dollar-quoted blocks
    statements = []
    current = []
    in_dollars = False

    for line in clean_sql.splitlines():
        # Toggle dollar-quote state
        dollar_count = line.count("$$")
        if dollar_count % 2 != 0:
            in_dollars = not in_dollars

        if not in_dollars and line.rstrip().endswith(";"):
            current.append(line)
            stmt = "\n".join(current).strip().rstrip(";").strip()
            if stmt:
                statements.append(stmt)
            current = []
        else:
            current.append(line)

    # Anything left without a trailing semicolon
    leftover = "\n".join(current).strip()
    if leftover:
        statements.append(leftover)

    return [s for s in statements if s.strip()]


def run_migration(conn, version: str, path: Path, dry_run: bool = False) -> None:
    sql = path.read_text(encoding="utf-8")
    statements = _split_statements(sql)

    if dry_run:
        log.info("DRY RUN — would apply %s (%s): %d statements", version, path.name, len(statements))
        return

    cur = conn.cursor()
    try:
        for i, stmt in enumerate(statements, 1):
            log.info("  [%d/%d] %s", i, len(statements), stmt[:80].replace("\n", " "))
            cur.execute(stmt)
        cur.execute(
            "INSERT INTO schema_migrations (version, description) VALUES (%s, %s) "
            "ON CONFLICT (version) DO NOTHING",
            (version, path.stem),
        )
        conn.commit()
        log.info("\u2713 Applied migration %s \u2014 %s", version, path.name)
    except Exception as exc:
        conn.rollback()
        log.error("\u2717 Migration %s failed: %s", version, exc)
        raise
    finally:
        cur.close()


def cmd_status(conn) -> None:
    applied = get_applied_versions(conn)
    all_migrations = list_migration_files()
    log.info("Migration status (%d total):", len(all_migrations))
    for version, path in all_migrations:
        state = "applied" if version in applied else "PENDING"
        log.info("  [%s] %s — %s", state, version, path.name)


def cmd_apply(conn, dry_run: bool = False) -> None:
    applied = get_applied_versions(conn)
    all_migrations = list_migration_files()
    pending = [(v, p) for v, p in all_migrations if v not in applied]

    if not pending:
        log.info("All migrations already applied — nothing to do.")
        return

    log.info("Applying %d pending migration(s)…", len(pending))
    for version, path in pending:
        run_migration(conn, version, path, dry_run=dry_run)

    if not dry_run:
        log.info("Migration complete.")


def main() -> None:
    parser = argparse.ArgumentParser(description="SellOWL migration runner")
    parser.add_argument("--status",  action="store_true", help="Show migration status")
    parser.add_argument("--dry-run", action="store_true", help="Print SQL without executing")
    args = parser.parse_args()

    conn = psycopg2.connect(_connection_url())
    conn.autocommit = False

    try:
        if args.status:
            cmd_status(conn)
        else:
            cmd_apply(conn, dry_run=args.dry_run)
    finally:
        conn.close()


if __name__ == "__main__":
    main()