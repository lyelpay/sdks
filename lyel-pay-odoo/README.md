# Lyel Pay for Odoo

Official Odoo payment provider module for [Lyel Pay](https://lyelpay.com).
Accept mobile money (Airtel, Orange, MTN) and card payments in Central and
West Africa directly from the Odoo checkout.

Supports **Odoo 17** and **Odoo 18**.

## What you get

- A new "Lyel Pay" entry under **Settings → Payment Providers**.
- Mobile money payments on `website_sale` (e-commerce checkout).
- Customer payment links on invoices via the standard "Pay Now" flow.
- Webhook handling that updates transactions authoritatively from the
  Lyel Pay backend, independent of the customer's browser session.

## Install

### From the Odoo Apps store

Search "Lyel Pay" in **Apps**, click Install.

### From source

```bash
git clone https://github.com/lyelpay/sdks.git
cp -r sdks/lyel-pay-odoo/payment_lyel_pay /path/to/your/odoo/addons/
```

Restart Odoo, update the Apps list, install **Lyel Pay**.

### Runtime dependencies

The module depends on the official Lyel Pay Python SDK:

```bash
pip install "lyel-pay>=0.2.0"
```

## Configure

1. Go to **Settings → Payment Providers**.
2. Open **Lyel Pay**.
3. Set **State** to *Test* (sandbox) or *Enabled* (production).
4. Fill in:
   - **Publishable key** (`pk_test_...` / `pk_live_...`)
   - **Secret key** (`sk_test_...` / `sk_live_...`)
   - **Webhook secret** (`whsec_...`)
5. Save.

The webhook URL to configure on your Lyel Pay dashboard is:

```
https://<your-odoo-domain>/payment/lyel_pay/webhook
```

## Local development

A complete stack (Odoo 17 + Odoo 18 + Postgres) is provided via Docker:

```bash
docker compose up -d
```

- Odoo 17: <http://localhost:8069>
- Odoo 18: <http://localhost:8070>

The module is mounted read-only from `./payment_lyel_pay`. Edit files on
the host, restart the Odoo container, the changes are picked up.

To wipe everything:

```bash
docker compose down -v
```

## Run the tests

Inside the running Odoo 17 container:

```bash
docker compose exec odoo17 odoo \
  -d test_lyel_pay --test-enable --stop-after-init \
  -i payment_lyel_pay
```

Replace `odoo17` with `odoo18` to test on Odoo 18.

## License

MIT — see [LICENSE](./LICENSE).
