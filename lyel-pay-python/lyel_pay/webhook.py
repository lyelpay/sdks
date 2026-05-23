from __future__ import annotations

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any

TOLERANCE_SECONDS = 300


@dataclass
class WebhookEvent:
    id: str
    type: str
    created: int
    data: dict[str, Any]


class WebhookVerifier:
    def construct_event(
        self,
        payload: str | bytes,
        header: str,
        secret: str,
        tolerance: int = TOLERANCE_SECONDS,
    ) -> WebhookEvent:
        if isinstance(payload, bytes):
            payload = payload.decode()

        parts: dict[str, str] = {}
        for part in header.split(","):
            k, _, v = part.partition("=")
            if k and v:
                parts[k] = v

        timestamp = parts.get("t")
        signature = parts.get("v1")

        if not timestamp or not signature:
            raise ValueError("Invalid webhook signature header")

        ts = int(timestamp)
        now = int(time.time())
        if abs(now - ts) > tolerance:
            raise ValueError("Webhook timestamp too old")

        signed = f"{timestamp}.{payload}"
        expected = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected, signature):
            raise ValueError("Webhook signature mismatch")

        body = json.loads(payload)
        return WebhookEvent(
            id=body["id"],
            type=body["type"],
            created=body["created"],
            data=body["data"],
        )
