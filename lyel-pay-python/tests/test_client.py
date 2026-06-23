from __future__ import annotations

import re
import uuid

import httpx
import pytest
import respx

from lyel_pay import LyelPay, LyelPayError
from lyel_pay.client import PROD_BASE_URL, SANDBOX_BASE_URL


def _intent_response() -> dict:
    return {
        "id": "pi_123",
        "session_token": "sess_abc",
        "status": "pending",
    }


class TestConstruction:
    def test_secret_key_from_argument(self):
        client = LyelPay(secret_key="sk_test_arg")
        assert client._secret_key == "sk_test_arg"

    def test_secret_key_from_env_var(self, monkeypatch):
        monkeypatch.setenv("LYEL_PAY_SECRET_KEY", "sk_test_env")
        client = LyelPay()
        assert client._secret_key == "sk_test_env"

    def test_argument_takes_precedence_over_env(self, monkeypatch):
        monkeypatch.setenv("LYEL_PAY_SECRET_KEY", "sk_test_env")
        client = LyelPay(secret_key="sk_test_arg")
        assert client._secret_key == "sk_test_arg"

    def test_raises_without_secret_key(self, monkeypatch):
        monkeypatch.delenv("LYEL_PAY_SECRET_KEY", raising=False)
        with pytest.raises(ValueError, match="secret key is required"):
            LyelPay()

    def test_sandbox_environment_url(self):
        client = LyelPay(secret_key="sk", environment="sandbox")
        assert client._base_url == SANDBOX_BASE_URL

    def test_production_environment_url(self):
        client = LyelPay(secret_key="sk", environment="production")
        assert client._base_url == PROD_BASE_URL

    def test_default_environment_is_production(self):
        client = LyelPay(secret_key="sk")
        assert client._base_url == PROD_BASE_URL

    def test_custom_base_url_overrides_environment(self):
        client = LyelPay(
            secret_key="sk",
            environment="sandbox",
            base_url="https://staging.lyelpay.com/",
        )
        assert client._base_url == "https://staging.lyelpay.com"


class TestPaymentIntentCreate:
    @respx.mock
    def test_minimal_payload(self):
        route = respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(200, json=_intent_response())
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        intent = client.payment_intents.create(amount="1500.00", currency="XAF")

        assert intent == _intent_response()
        assert route.calls.last.request.headers["Authorization"] == "Bearer sk"
        body = route.calls.last.request.content.decode()
        assert '"amount":"1500.00"' in body
        assert '"currency":"XAF"' in body
        assert "description" not in body
        assert "metadata" not in body

    @respx.mock
    def test_full_payload(self):
        route = respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(200, json=_intent_response())
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        client.payment_intents.create(
            amount="1500.00",
            currency="XAF",
            description="Order #1234",
            metadata={"order_id": "1234"},
        )

        body = route.calls.last.request.content.decode()
        assert '"description":"Order #1234"' in body
        assert '"order_id":"1234"' in body

    @respx.mock
    def test_explicit_idempotency_key_sent_as_header(self):
        route = respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(200, json=_intent_response())
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        client.payment_intents.create(
            amount="1500.00",
            currency="XAF",
            idempotency_key="order-1234-attempt-1",
        )

        assert route.calls.last.request.headers["Idempotency-Key"] == "order-1234-attempt-1"

    @respx.mock
    def test_auto_generated_idempotency_key_is_uuid4(self):
        route = respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(200, json=_intent_response())
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        client.payment_intents.create(amount="1500.00", currency="XAF")

        key = route.calls.last.request.headers["Idempotency-Key"]
        # Will raise if not a valid UUID.
        parsed = uuid.UUID(key)
        assert parsed.version == 4

    @respx.mock
    def test_4xx_raises_lyel_pay_error_with_api_message(self):
        respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(400, json={"message": "amount must be positive"})
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        with pytest.raises(LyelPayError) as exc_info:
            client.payment_intents.create(amount="-1", currency="XAF")

        assert exc_info.value.status_code == 400
        assert "amount must be positive" in str(exc_info.value)

    @respx.mock
    def test_4xx_without_json_body(self):
        respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(401, content=b"unauthorized")
        )
        client = LyelPay(secret_key="bad", environment="sandbox")

        with pytest.raises(LyelPayError) as exc_info:
            client.payment_intents.create(amount="1500.00", currency="XAF")

        assert exc_info.value.status_code == 401
        assert "HTTP 401" in str(exc_info.value)


class TestPaymentIntentRetrieve:
    @respx.mock
    def test_sends_session_token_header(self):
        route = respx.get(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents/status").mock(
            return_value=httpx.Response(200, json={"status": "succeeded"})
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        state = client.payment_intents.retrieve(session_token="sess_abc")

        assert state == {"status": "succeeded"}
        assert route.calls.last.request.headers["x-session-token"] == "sess_abc"


class TestRetry:
    @pytest.fixture(autouse=True)
    def _no_sleep(self, monkeypatch):
        """Skip the backoff waits so tests stay fast."""
        monkeypatch.setattr("lyel_pay.client.time.sleep", lambda _s: None)

    @respx.mock
    def test_retries_on_500_then_succeeds(self):
        respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            side_effect=[
                httpx.Response(500, json={"message": "boom"}),
                httpx.Response(200, json=_intent_response()),
            ]
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        intent = client.payment_intents.create(amount="1500.00", currency="XAF")

        assert intent == _intent_response()

    @respx.mock
    def test_retries_exhausted_returns_last_5xx(self):
        respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(503, json={"message": "still down"})
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        with pytest.raises(LyelPayError) as exc_info:
            client.payment_intents.create(amount="1500.00", currency="XAF")

        assert exc_info.value.status_code == 503
        assert "still down" in str(exc_info.value)

    @respx.mock
    def test_does_not_retry_on_400(self):
        route = respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            return_value=httpx.Response(400, json={"message": "bad"})
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        with pytest.raises(LyelPayError):
            client.payment_intents.create(amount="1500.00", currency="XAF")

        assert route.call_count == 1

    @respx.mock
    def test_retries_on_network_error_then_succeeds(self):
        respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            side_effect=[
                httpx.ConnectError("boom"),
                httpx.Response(200, json=_intent_response()),
            ]
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        intent = client.payment_intents.create(amount="1500.00", currency="XAF")

        assert intent == _intent_response()

    @respx.mock
    def test_network_error_raised_after_exhaustion(self):
        respx.post(f"{SANDBOX_BASE_URL}/gateway/v1/payment-intents").mock(
            side_effect=httpx.ConnectError("never reachable")
        )
        client = LyelPay(secret_key="sk", environment="sandbox")

        with pytest.raises(httpx.ConnectError):
            client.payment_intents.create(amount="1500.00", currency="XAF")
