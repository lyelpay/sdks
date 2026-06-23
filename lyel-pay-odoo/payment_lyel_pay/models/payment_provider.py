import logging

from odoo import fields, models

_logger = logging.getLogger(__name__)

SUPPORTED_CURRENCIES = ("XAF", "XOF", "CDF", "EUR", "USD")


class PaymentProvider(models.Model):
    _inherit = "payment.provider"

    code = fields.Selection(
        selection_add=[("lyel_pay", "Lyel Pay")],
        ondelete={"lyel_pay": "set default"},
    )

    lyel_pay_publishable_key = fields.Char(
        string="Publishable Key",
        help=(
            "Public key shared with the customer's browser to mount the "
            "checkout widget. Starts with pk_test_ in sandbox, pk_live_ "
            "in production."
        ),
    )
    lyel_pay_secret_key = fields.Char(
        string="Secret Key",
        help=(
            "Secret API key used to call Lyel Pay from Odoo. Starts with "
            "sk_test_ in sandbox, sk_live_ in production."
        ),
        groups="base.group_system",
    )
    lyel_pay_webhook_secret = fields.Char(
        string="Webhook Secret",
        help="HMAC signing secret used to verify webhooks. Starts with whsec_.",
        groups="base.group_system",
    )
    lyel_pay_checkout_url = fields.Char(
        string="Checkout URL",
        default="https://checkout.lyelpay.com",
        help=(
            "URL of the Lyel Pay hosted checkout iframe. Override only for "
            "staging or self-hosted deployments."
        ),
    )

    def _get_supported_currencies(self):
        supported = super()._get_supported_currencies()
        if self.code != "lyel_pay":
            return supported
        return supported.filtered(lambda c: c.name in SUPPORTED_CURRENCIES)

    def _lyel_pay_environment(self):
        """Return ``"sandbox"`` when the provider is in test state, else ``"production"``."""
        self.ensure_one()
        return "sandbox" if self.state == "test" else "production"

    def _get_lyel_pay_client(self):
        """Build a configured ``lyel_pay.LyelPay`` instance for this provider.

        Imported lazily so that Odoo can load the module even when the SDK
        is not installed; missing dependency is surfaced clearly here.
        """
        self.ensure_one()
        try:
            from lyel_pay import LyelPay
        except ImportError as exc:  # pragma: no cover - environment guard
            _logger.error("lyel-pay SDK not installed. Run `pip install lyel-pay>=0.2.0`.")
            raise ImportError(
                "The lyel-pay Python SDK is required. Install it with "
                "`pip install \"lyel-pay>=0.2.0\"`."
            ) from exc
        return LyelPay(
            secret_key=self.lyel_pay_secret_key,
            environment=self._lyel_pay_environment(),
        )
