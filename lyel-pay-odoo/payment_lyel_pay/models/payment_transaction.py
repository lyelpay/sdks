import logging

from odoo import _, api, models
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class PaymentTransaction(models.Model):
    _inherit = "payment.transaction"

    def _get_specific_rendering_values(self, processing_values):
        """Create the Lyel Pay payment intent and return values for the inline form.

        Called by Odoo right before rendering the payment page. We use this
        moment to create the PaymentIntent server-side (so the secret key
        never reaches the browser) and hand the resulting session token back
        to the JS layer so it can mount the checkout iframe.
        """
        res = super()._get_specific_rendering_values(processing_values)
        if self.provider_code != "lyel_pay":
            return res

        provider = self.provider_id
        client = provider._get_lyel_pay_client()
        try:
            intent = client.payment_intents.create(
                amount=str(self.amount),
                currency=self.currency_id.name,
                description=self.reference,
                metadata={
                    "odoo_reference": self.reference,
                    "odoo_transaction_id": str(self.id),
                },
                idempotency_key=f"odoo-{self.reference}",
            )
        except Exception as exc:
            _logger.exception(
                "Lyel Pay: PaymentIntent creation failed for transaction %s",
                self.reference,
            )
            raise ValidationError(
                _("Lyel Pay refused the payment: %s") % str(exc)
            )

        # Stash the provider's intent id so the webhook can find us back.
        self.provider_reference = intent.get("id")

        return {
            "checkout_url": provider.lyel_pay_checkout_url,
            "publishable_key": provider.lyel_pay_publishable_key or "",
            "session_token": intent.get("session_token", ""),
            "amount": str(self.amount),
            "currency": self.currency_id.name,
            "origin": self.get_base_url(),
            "merchant_name": (provider.company_id.name or "Merchant"),
            "reference": self.reference,
        }

    @api.model
    def _get_tx_from_notification_data(self, provider_code, notification_data):
        """Locate the local transaction matching a Lyel Pay webhook event.

        Match on ``metadata.odoo_reference`` first (set at intent creation
        time, the most reliable link). Fall back to ``provider_reference``
        equality if metadata is missing for any reason.
        """
        tx = super()._get_tx_from_notification_data(provider_code, notification_data)
        if provider_code != "lyel_pay" or tx:
            return tx

        data = notification_data.get("data") or {}
        metadata = data.get("metadata") or {}
        reference = metadata.get("odoo_reference")

        if reference:
            tx = self.search(
                [("reference", "=", reference), ("provider_code", "=", "lyel_pay")],
                limit=1,
            )
        if not tx:
            intent_id = data.get("id")
            if intent_id:
                tx = self.search(
                    [
                        ("provider_reference", "=", intent_id),
                        ("provider_code", "=", "lyel_pay"),
                    ],
                    limit=1,
                )
        if not tx:
            raise ValidationError(
                _("No Odoo transaction found matching this Lyel Pay event.")
            )
        return tx

    def _process_notification_data(self, notification_data):
        """Translate a Lyel Pay webhook event into a transaction state change."""
        super()._process_notification_data(notification_data)
        if self.provider_code != "lyel_pay":
            return

        event_type = notification_data.get("type")
        data = notification_data.get("data") or {}

        if event_type == "payment_intent.succeeded":
            self._set_done()
        elif event_type == "payment_intent.failed":
            self._set_error(data.get("failure_reason") or _("Payment failed"))
        elif event_type == "payment_intent.cancelled":
            self._set_canceled(_("Payment cancelled by user"))
        else:
            _logger.info(
                "Lyel Pay: ignoring unhandled event type %s for transaction %s",
                event_type,
                self.reference,
            )
