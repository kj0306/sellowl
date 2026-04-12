"""
logger.py — SellOWL Structured Logger
======================================
Outputs JSON lines to stdout so Render, AWS CloudWatch, Datadog, and
any log-aggregation service can ingest and index them without plugins.

Usage:
    from logger import get_logger
    log = get_logger(__name__)

    log.info("order.created",  order_id=42, buyer_id=7, total=120.00)
    log.warning("order.expiry_scan", expired_count=3)
    log.error("db.query_failed", table="orders", exc=str(e))

All calls accept keyword arguments that become top-level JSON fields,
making it trivial to filter in CloudWatch Insights:
    fields @message | filter order_id = 42
"""
from __future__ import annotations
import json
import logging
import sys
import time
import traceback
from typing import Any


class _JsonFormatter(logging.Formatter):
    """Emit each log record as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts":      time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level":   record.levelname,
            "logger":  record.name,
            "event":   record.getMessage(),  # first positional arg to log.info(...)
        }

        # Merge any extra kwargs passed via log.info("ev", extra={...}) or
        # our helper _LogAdapter which injects kwargs as extra automatically.
        if hasattr(record, "extra_fields"):
            payload.update(record.extra_fields)

        if record.exc_info:
            payload["traceback"] = traceback.format_exception(*record.exc_info)

        return json.dumps(payload, default=str)


class _LogAdapter(logging.LoggerAdapter):
    """
    Wraps a Logger so callers can pass keyword context directly:
        log.info("order.created", order_id=42, buyer_id=7)
    instead of the verbose:
        log.info("order.created", extra={"order_id": 42, ...})
    """

    def process(self, msg, kwargs):
        extra_fields = {k: v for k, v in kwargs.items() if k not in ("exc_info", "stack_info", "stacklevel")}
        # Remove them from kwargs so logging doesn't complain about unknown keys
        for k in list(extra_fields):
            kwargs.pop(k, None)
        extra = kwargs.get("extra", {})
        extra["extra_fields"] = extra_fields
        kwargs["extra"] = extra
        return msg, kwargs


def get_logger(name: str) -> _LogAdapter:
    """
    Return a structured logger for the given module name.

    On first call per name this sets up the handler; subsequent calls
    return the cached adapter (logging module deduplicates internally).
    """
    base = logging.getLogger(name)
    if not base.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JsonFormatter())
        base.addHandler(handler)
        base.propagate = False
    base.setLevel(logging.DEBUG if _is_dev() else logging.INFO)
    return _LogAdapter(base, extra={})


def _is_dev() -> bool:
    import os
    return os.environ.get("FLASK_ENV", "production").lower() in ("development", "dev")
