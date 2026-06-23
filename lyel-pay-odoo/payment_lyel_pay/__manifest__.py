{
    "name": "Lyel Pay",
    "version": "17.0.1.0.0",
    "category": "Accounting/Payment Providers",
    "summary": "Accept mobile money and card payments with Lyel Pay",
    "description": """
Lyel Pay payment provider for Odoo. Accept mobile money payments
(Airtel, Orange, MTN) and cards in Central and West Africa.

Supports:
- Website checkout (website_sale)
- Customer payment links on invoices
- Webhook-based authoritative status updates
- Sandbox and production environments
""",
    "author": "Lyel Solutions",
    "website": "https://lyelpay.com",
    "license": "MIT",
    "depends": ["payment"],
    "external_dependencies": {
        "python": ["lyel_pay"],
    },
    "data": [
        "views/payment_provider_views.xml",
        "views/payment_lyel_pay_templates.xml",
        "data/payment_method_data.xml",
        "data/payment_provider_data.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "payment_lyel_pay/static/src/js/payment_form.js",
        ],
    },
    "application": False,
    "installable": True,
    "auto_install": False,
}
