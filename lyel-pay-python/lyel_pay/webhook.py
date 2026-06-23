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
    """A verified webhook event delivered by Lyel Pay.

    Attributes:
        id: Unique event identifier (e.g. ``evt_...``).
        type: Event type (e.g. ``payment_intent.succeeded``).
        created: Unix timestamp (seconds) at which the event was emitted.
        data: Event payload. The shape depends on ``type``.
    """

    id: str
    type: str
    created: int
    data: dict[str, Any]


class WebhookVerifier:
    """Verify and parse webhook payloads delivered by Lyel Pay.

    Webhook requests carry a ``Lyel-Signature`` header of the form
    ``t=<timestamp>,v1=<hex_signature>``. The signature is an HMAC-SHA256
    of ``"<timestamp>.<raw_body>"`` keyed by the webhook secret.
    """

    def construct_event(
        self,
        payload: str | bytes,
        header: str,
        secret: str,
        tolerance: int = TOLERANCE_SECONDS,
    ) -> WebhookEvent:
        """Verify the signature and return a parsed event.

        Args:
            payload: Raw request body, exactly as received (do not
                re-serialize the JSON).
            header: Value of the ``Lyel-Signature`` request header.
            secret: Webhook signing secret from the Lyel Pay dashboard.
            tolerance: Maximum age of the timestamp in seconds, to guard
                against replay. Defaults to 300 seconds.

        Returns:
            The parsed ``WebhookEvent``.

        Raises:
            ValueError: If the header is malformed, the timestamp is
                older than ``tolerance``, or the signature does not match.

        Example:
            >>> verifier = WebhookVerifier()
            >>> event = verifier.construct_event(
            ...     payload=request.body,
            ...     header=request.headers["Lyel-Signature"],
            ...     secret="whsec_...",
            ... )
            >>> if event.type == "payment_intent.succeeded":
            ...     mark_order_paid(event.data["id"])
        """
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
