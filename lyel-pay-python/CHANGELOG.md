# Changelog

## 0.2.0

Hardening release in preparation for the Odoo payment module.

### Added

- `environment` argument on `LyelPay` (`"sandbox"` or `"production"`) to
  select the API base URL without hardcoding it. `base_url` still works
  as an override for self-hosted or staging endpoints.
- Fallback to `LYEL_PAY_SECRET_KEY` environment variable when the
  `secret_key` argument is omitted.
- `idempotency_key` argument on `PaymentIntents.create()`. When omitted,
  a UUID4 is generated and sent in the `Idempotency-Key` header on every
  POST request.
- Automatic retry with exponential backoff (1s, 2s) on `500`, `502`,
  `503`, `504` responses and network errors. `4xx` errors are surfaced
  immediately without retry. Three attempts maximum.
- Configurable per-request `timeout` (default 30s).
- `LyelPayError` exported at package root: `from lyel_pay import LyelPayError`.
- Docstrings (Google format) on all public classes and methods, with
  usage examples.
- README with install, quickstart, configuration, payment intents,
  webhooks, error handling.
- Unit test suite covering construction, payload shapes, idempotency,
  retry behavior, error handling, and webhook verification (29 tests).

### Changed

- `LyelPay(secret_key)` is now optional (falls back to env var).
  Constructing without either raises `ValueError`.

## 0.1.0

Initial release.

- `LyelPay` client with `PaymentIntents.create()` and
  `PaymentIntents.retrieve()`.
- `WebhookVerifier.construct_event()` with HMAC-SHA256 signature
  verification and timestamp tolerance.
- `LyelPayError` exception.
