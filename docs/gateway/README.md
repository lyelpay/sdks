# Lyel Pay gateway: integration guide

Take a Lyel Pay payment on your site in one of three ways:

| Mode | What the customer sees | Browser code | Guide |
|---|---|---|---|
| A. Modal | A window over your page | `@lyel/lyel-pay-js` or `react-lyel-pay-js` | [mode-a-modal.md](./mode-a-modal.md) |
| B. Embedded block | The payment form inside your page | `@lyel/lyel-pay-js` or `react-lyel-pay-js` | [mode-b-embedded.md](./mode-b-embedded.md) |
| C. Hosted page | A Lyel Pay page, then back to your site | none, a redirect | [mode-c-hosted-page.md](./mode-c-hosted-page.md) |

## The one rule

> **Never deliver an order on the word of the browser.** Neither `onSuccess` nor an arrival on your success address proves a payment. The proof is the **`payment.completed` webhook**, or a **server-side read** of the intent with your secret key (`GET /gateway/v1/payment-intents/:id`, `lyel.paymentIntents.retrieve(id)` in Node).

## What every mode shares

1. **Your server** creates the payment intent with your **secret key** (`sk_test_…` / `sk_live_…`). The secret key never reaches a browser.
2. The amount, the currency, your name and logo always come from Lyel Pay, never from the browser: a page script cannot change what the customer pays.
3. Lyel Pay calls your webhook once per intent with the final event: `payment.completed`, `payment.failed`, `payment.expired` or `payment.canceled`. See the [Node SDK README](../../lyel-pay-node/README.md#webhooks) to verify its signature.

## Your keys and settings

From the developer portal: TEST and LIVE keys, webhook address, allowed domains, default return addresses, and the checkout appearance (logo, colour, name, language, button label).

- **Allowed domains**: in LIVE, modes A and B only show on a page of these domains, and mode C only returns to them (`https` only). In TEST, `localhost` and `127.0.0.1` are accepted too.
- **Checkout address**: `https://dev.checkout.lyelpay.com` on dev. The browser SDK defaults to `https://checkout.lyelpay.com`; on dev, pass `checkoutUrl: 'https://dev.checkout.lyelpay.com'`.

## Test mode

With TEST keys no money moves. Numbers: `06 000 0001` succeeds, `06 000 0002` has insufficient funds, `06 000 0003` has no account; any other well-formed number succeeds. The code is always `000000`, and no WhatsApp message is sent.

A working shop showing the three modes: [`gateway-demo`](../../gateway-demo/README.md).
