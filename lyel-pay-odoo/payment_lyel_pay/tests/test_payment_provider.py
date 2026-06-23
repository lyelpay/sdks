from odoo.tests.common import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestPaymentProviderSeed(TransactionCase):
    """Sanity checks on the seeded Lyel Pay provider and methods."""

    def test_provider_is_seeded_disabled(self):
        provider = self.env.ref("payment_lyel_pay.payment_provider_lyel_pay")
        self.assertEqual(provider.code, "lyel_pay")
        self.assertEqual(
            provider.state,
            "disabled",
            "Provider must ship disabled — credentials are user-supplied.",
        )

    def test_provider_supports_expected_currencies(self):
        provider = self.env.ref("payment_lyel_pay.payment_provider_lyel_pay")
        supported = {c.name for c in provider._get_supported_currencies()}
        # We don't assert equality because the merchant's company may not
        # have every currency activated, but every supported currency that
        # IS active in the DB must show up.
        active_codes = set(
            self.env["res.currency"]
            .search([("name", "in", ["XAF", "XOF", "CDF", "EUR", "USD"])])
            .mapped("name")
        )
        self.assertEqual(supported & active_codes, active_codes)

    def test_environment_helper(self):
        provider = self.env.ref("payment_lyel_pay.payment_provider_lyel_pay")
        provider.state = "test"
        self.assertEqual(provider._lyel_pay_environment(), "sandbox")
        provider.state = "enabled"
        self.assertEqual(provider._lyel_pay_environment(), "production")

    def test_payment_methods_linked(self):
        provider = self.env.ref("payment_lyel_pay.payment_provider_lyel_pay")
        method_codes = set(provider.payment_method_ids.mapped("code"))
        self.assertEqual(
            method_codes,
            {"airtel_money", "orange_money", "mtn_mobile_money"},
        )
