import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class LyelPayController(http.Controller):
    """HTTP endpoint that receives signed webhooks from Lyel Pay."""

    _webhook_route = "/payment/lyel_pay/webhook"

    @http.route(
        _webhook_route,
        type="http",
        auth="public",
        methods=["POST"],
        csrf=False,
        save_session=False,
    )
    def webhook(self, **_kwargs):
        try:
            from lyel_pay import WebhookVerifier
        except ImportError:
            _logger.error("lyel-pay SDK not installed; cannot process webhook.")
            return request.make_json_response({"error": "sdk missing"}, status=500)

        raw_body = request.httprequest.get_data()
        signature = request.httprequest.headers.get("Lyel-Signature")

        if not signature:
            _logger.warning("Lyel Pay webhook rejected: missing Lyel-Signature header")
            return request.make_json_response({"error": "missing signature"}, status=400)

        # A single Odoo instance can technically host multiple Lyel Pay
        # providers (e.g. one per company in multi-company setups). We try
        # each provider's secret until one verifies the signature.
        providers = (
            request.env["payment.provider"]
            .sudo()
            .search(
                [
                    ("code", "=", "lyel_pay"),
                    ("lyel_pay_webhook_secret", "!=", False),
                ]
            )
        )
        if not providers:
            _logger.warning("Lyel Pay webhook rejected: no configured provider")
            return request.make_json_response({"error": "no provider"}, status=400)

        verifier = WebhookVerifier()
        event = None
        last_error = None
        for provider in providers:
            try:
                event = verifier.construct_event(
                    payload=raw_body,
                    header=signature,
                    secret=provider.lyel_pay_webhook_secret,
                )
                break
            except ValueError as exc:
                last_error = exc

        if event is None:
            _logger.warning("Lyel Pay webhook signature verification failed: %s", last_error)
            return request.make_json_response({"error": "invalid signature"}, status=400)

        notification_data = {
            "id": event.id,
            "type": event.type,
            "created": event.created,
            "data": event.data,
        }

        try:
            tx = (
                request.env["payment.transaction"]
                .sudo()
                ._get_tx_from_notification_data("lyel_pay", notification_data)
            )
            tx._handle_notification_data("lyel_pay", notification_data)
        except Exception:
            _logger.exception("Lyel Pay webhook processing error for event %s", event.id)
            return request.make_json_response({"error": "processing failed"}, status=500)

        return request.make_json_response({"received": True}, status=200)
