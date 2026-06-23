from __future__ import annotations

import os
import time
import uuid
from typing import Any, Literal, Optional

import httpx

PROD_BASE_URL = "https://api.lyelpay.com"
SANDBOX_BASE_URL = "https://sandbox.lyelpay.com"

Environment = Literal["sandbox", "production"]

_MAX_RETRIES = 3
_RETRYABLE_STATUS = {500, 502, 503, 504}
_DEFAULT_TIMEOUT_SECONDS = 30.0


class LyelPayError(Exception):
    """Raised when the Lyel Pay API returns an error response.

    Attributes:
        status_code: HTTP status code returned by the API.
        message: Human-readable error message, extracted from the API
            response body when available.
    """

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code


class PaymentIntents:
    """Resource for creating and retrieving payment intents."""

    def __init__(self, client: "LyelPay") -> None:
        self._client = client

    def create(
        self,
        amount: str,
        currency: str,
        description: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create a new payment intent.

        Args:
            amount: Amount as a decimal string (e.g. "1500.00").
            currency: ISO 4217 currency code (e.g. "XAF", "EUR").
            description: Optional human-readable description shown to the
                payer in the checkout widget.
            metadata: Optional key/value map persisted on the intent and
                returned on webhook events.
            idempotency_key: Optional key to safely retry the same call.
                If omitted, a UUID4 is generated automatically. Reuse the
                same key when retrying a failed call to avoid creating
                duplicate intents.

        Returns:
            The created payment intent as a dict, including ``id`` and
            ``session_token`` used to authorize the checkout widget.

        Raises:
            LyelPayError: If the API rejects the request.

        Example:
            >>> client = LyelPay(environment="sandbox")
            >>> intent = client.payment_intents.create(
            ...     amount="1500.00",
            ...     currency="XAF",
            ...     description="Order #1234",
            ... )
            >>> intent["session_token"]
            'sess_...'
        """
        payload: dict[str, Any] = {"amount": amount, "currency": currency}
        if description is not None:
            payload["description"] = description
        if metadata is not None:
            payload["metadata"] = metadata
        return self._client._post(
            "/gateway/v1/payment-intents",
            payload,
            idempotency_key=idempotency_key,
        )

    def retrieve(self, session_token: str) -> dict[str, Any]:
        """Retrieve the current status of a payment intent.

        Args:
            session_token: Session token returned by ``create()``.

        Returns:
            The payment intent state, including ``status`` (``pending``,
            ``succeeded``, ``failed``, ``cancelled``).

        Raises:
            LyelPayError: If the API rejects the request.

        Example:
            >>> client = LyelPay(environment="sandbox")
            >>> state = client.payment_intents.retrieve("sess_abc123")
            >>> state["status"]
            'succeeded'
        """
        return self._client._get(
            "/gateway/v1/payment-intents/status",
            session_token=session_token,
        )


class LyelPay:
    """Lyel Pay API client.

    The client reads its secret key from the ``secret_key`` argument or,
    if omitted, from the ``LYEL_PAY_SECRET_KEY`` environment variable.

    Args:
        secret_key: Lyel Pay secret API key. If ``None``, falls back to
            the ``LYEL_PAY_SECRET_KEY`` environment variable.
        environment: ``"sandbox"`` or ``"production"``. Selects the
            default API base URL. Ignored when ``base_url`` is set.
        base_url: Custom API base URL. Overrides ``environment``. Use
            this for self-hosted or staging endpoints.
        timeout: Per-request timeout in seconds.

    Raises:
        ValueError: If no secret key is provided and the
            ``LYEL_PAY_SECRET_KEY`` environment variable is unset.

    Example:
        >>> # Sandbox via constructor argument
        >>> client = LyelPay(secret_key="sk_test_...", environment="sandbox")

        >>> # Production via environment variable
        >>> # export LYEL_PAY_SECRET_KEY=sk_live_...
        >>> client = LyelPay()
    """

    def __init__(
        self,
        secret_key: Optional[str] = None,
        environment: Environment = "production",
        base_url: Optional[str] = None,
        timeout: float = _DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        resolved_key = secret_key or os.environ.get("LYEL_PAY_SECRET_KEY")
        if not resolved_key:
            raise ValueError(
                "Lyel Pay secret key is required. Pass secret_key=... or set "
                "the LYEL_PAY_SECRET_KEY environment variable."
            )
        self._secret_key = resolved_key

        if base_url is not None:
            self._base_url = base_url.rstrip("/")
        elif environment == "sandbox":
            self._base_url = SANDBOX_BASE_URL
        else:
            self._base_url = PROD_BASE_URL

        self._timeout = timeout
        self.payment_intents = PaymentIntents(self)

    def _headers(
        self,
        session_token: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> dict[str, str]:
        h = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._secret_key}",
        }
        if session_token:
            h["x-session-token"] = session_token
        if idempotency_key:
            h["Idempotency-Key"] = idempotency_key
        return h

    def _post(
        self,
        path: str,
        payload: dict[str, Any],
        idempotency_key: Optional[str] = None,
    ) -> dict[str, Any]:
        key = idempotency_key or str(uuid.uuid4())
        res = self._request_with_retry(
            "POST",
            path,
            json=payload,
            headers=self._headers(idempotency_key=key),
        )
        return self._handle(res)

    def _get(self, path: str, session_token: Optional[str] = None) -> dict[str, Any]:
        res = self._request_with_retry(
            "GET",
            path,
            headers=self._headers(session_token=session_token),
        )
        return self._handle(res)

    def _request_with_retry(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> httpx.Response:
        url = f"{self._base_url}{path}"
        last_response: Optional[httpx.Response] = None
        for attempt in range(_MAX_RETRIES):
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    res = client.request(method, url, **kwargs)
                if res.status_code not in _RETRYABLE_STATUS:
                    return res
                last_response = res
            except httpx.RequestError:
                if attempt == _MAX_RETRIES - 1:
                    raise
            if attempt < _MAX_RETRIES - 1:
                time.sleep(2**attempt)
        assert last_response is not None
        return last_response

    @staticmethod
    def _handle(res: httpx.Response) -> dict[str, Any]:
        if not res.is_success:
            try:
                msg = res.json().get("message", f"HTTP {res.status_code}")
            except Exception:
                msg = f"HTTP {res.status_code}"
            raise LyelPayError(res.status_code, msg)
        return res.json()
