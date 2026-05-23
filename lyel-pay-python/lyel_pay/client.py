from __future__ import annotations

from typing import Any, Optional

import httpx

BASE_URL = "https://api.lyelpay.com"


class LyelPayError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code


class PaymentIntents:
    def __init__(self, client: "LyelPay") -> None:
        self._client = client

    def create(
        self,
        amount: str,
        currency: str,
        description: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"amount": amount, "currency": currency}
        if description is not None:
            payload["description"] = description
        if metadata is not None:
            payload["metadata"] = metadata
        return self._client._post("/gateway/v1/payment-intents", payload)

    def retrieve(self, session_token: str) -> dict[str, Any]:
        return self._client._get(
            "/gateway/v1/payment-intents/status",
            session_token=session_token,
        )


class LyelPay:
    def __init__(self, secret_key: str, base_url: str = BASE_URL) -> None:
        self._secret_key = secret_key
        self._base_url = base_url.rstrip("/")
        self.payment_intents = PaymentIntents(self)

    def _headers(self, session_token: Optional[str] = None) -> dict[str, str]:
        h = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._secret_key}",
        }
        if session_token:
            h["x-session-token"] = session_token
        return h

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        with httpx.Client() as client:
            res = client.post(
                f"{self._base_url}{path}",
                json=payload,
                headers=self._headers(),
            )
        return self._handle(res)

    def _get(self, path: str, session_token: Optional[str] = None) -> dict[str, Any]:
        with httpx.Client() as client:
            res = client.get(
                f"{self._base_url}{path}",
                headers=self._headers(session_token),
            )
        return self._handle(res)

    @staticmethod
    def _handle(res: httpx.Response) -> dict[str, Any]:
        if not res.is_success:
            try:
                msg = res.json().get("message", f"HTTP {res.status_code}")
            except Exception:
                msg = f"HTTP {res.status_code}"
            raise LyelPayError(res.status_code, msg)
        return res.json()
