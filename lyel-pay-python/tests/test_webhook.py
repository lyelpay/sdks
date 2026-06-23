from __future__ import annotations

import hashlib
import hmac
import json
import time

import pytest

from lyel_pay import WebhookEvent, WebhookVerifier

SECRET = "whsec_test"


def _sign(payload: str, timestamp: int, secret: str = SECRET) -> str:
    signed = f"{timestamp}.{payload}"
    sig = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig}"


def _event_payload() -> str:
    return json.dumps(
        {
            "id": "evt_123",
            "type": "payment_intent.succeeded",
            "created": 1700000000,
            "data": {"id": "pi_123", "amount": "1500.00"},
        }
    )


class TestWebhookVerifier:
    def test_valid_signature_returns_event(self):
        payload = _event_payload()
        header = _sign(payload, int(time.time()))

        event = WebhookVerifier().construct_event(payload, header, SECRET)

        assert isinstance(event, WebhookEvent)
        assert event.id == "evt_123"
        assert event.type == "payment_intent.succeeded"
        assert event.created == 1700000000
        assert event.data == {"id": "pi_123", "amount": "1500.00"}

    def test_accepts_bytes_payload(self):
        payload = _event_payload()
        header = _sign(payload, int(time.time()))

        event = WebhookVerifier().construct_event(
            payload.encode(), header, SECRET
        )

        assert event.id == "evt_123"

    def test_malformed_header_raises(self):
        payload = _event_payload()
        with pytest.raises(ValueError, match="Invalid webhook signature header"):
            WebhookVerifier().construct_event(payload, "garbage", SECRET)

    def test_missing_timestamp_raises(self):
        payload = _event_payload()
        with pytest.raises(ValueError, match="Invalid webhook signature header"):
            WebhookVerifier().construct_event(payload, "v1=abc", SECRET)

    def test_missing_signature_raises(self):
        payload = _event_payload()
        with pytest.raises(ValueError, match="Invalid webhook signature header"):
            WebhookVerifier().construct_event(payload, "t=1700000000", SECRET)

    def test_timestamp_too_old_raises(self):
        payload = _event_payload()
        old_ts = int(time.time()) - 3600  # 1 hour old
        header = _sign(payload, old_ts)

        with pytest.raises(ValueError, match="too old"):
            WebhookVerifier().construct_event(payload, header, SECRET)

    def test_custom_tolerance_accepts_older_timestamps(self):
        payload = _event_payload()
        old_ts = int(time.time()) - 3600
        header = _sign(payload, old_ts)

        # Tolerance set wide enough to accept 1-hour-old event.
        event = WebhookVerifier().construct_event(
            payload, header, SECRET, tolerance=7200
        )
        assert event.id == "evt_123"

    def test_signature_mismatch_raises(self):
        payload = _event_payload()
        header = _sign(payload, int(time.time()), secret="wrong_secret")

        with pytest.raises(ValueError, match="signature mismatch"):
            WebhookVerifier().construct_event(payload, header, SECRET)

    def test_tampered_payload_raises(self):
        original = _event_payload()
        ts = int(time.time())
        header = _sign(original, ts)

        # Sign one payload, send another.
        tampered = json.dumps(
            {
                "id": "evt_evil",
                "type": "payment_intent.succeeded",
                "created": 1700000000,
                "data": {"id": "pi_evil", "amount": "999999.00"},
            }
        )

        with pytest.raises(ValueError, match="signature mismatch"):
            WebhookVerifier().construct_event(tampered, header, SECRET)
