# @lyel/lyel-pay-node

Server-side SDK for the Lyel Pay payment gateway: create, read and cancel payment intents, and verify webhooks.

Your **secret key** (`sk_live_…` / `sk_test_…`) stays on your server. It never goes to a browser.

```bash
npm install @lyel/lyel-pay-node
```

Requires Node.js 18 or later.

```ts
import { LyelPay } from '@lyel/lyel-pay-node';

const lyel = new LyelPay(process.env.LYEL_SECRET_KEY!);
```

## The one rule: how you know a payment happened

> **Deliver the order only on the `payment.completed` webhook, or after reading the intent on your server with `paymentIntents.retrieve(id)` and seeing `status === 'COMPLETED'`.**
>
> **Never on the browser's word.** A widget `onSuccess`, or a customer landing on your `successUrl`, proves nothing: anyone can type that URL or fire that callback.

## Integration modes

In every mode, your server starts by creating the intent.

### Mode A — Modal, and Mode B — Embedded block

Your server creates the intent and hands the `sessionToken` to your page. The browser SDK (`@lyel/lyel-pay-js`) opens the modal or mounts the embedded block with your publishable key and that token.

```ts
app.post('/checkout', async (req, res) => {
  const intent = await lyel.paymentIntents.create({
    amount: '15000', // whole CFA francs
    currency: 'XAF',
    description: 'Commande #1042',
    metadata: { orderId: '1042' },
    customer: { phone: '+242061234567' }, // optional: pre-fills the phone field
    locale: 'fr',
  });

  await orders.attachIntent('1042', intent.id);
  res.json({ sessionToken: intent.sessionToken });
});
```

Then confirm with the webhook (below). The browser's `onSuccess` only shows "thank you, we are checking your payment".

### Mode C — Hosted page and redirect

No browser SDK. Give the return URLs and redirect the customer to `checkoutUrl`. A URL you leave out falls back to the default you set in your portal; both must end up set, and belong to your allowed domains (`https` in LIVE).

```ts
app.post('/checkout', async (req, res) => {
  const intent = await lyel.paymentIntents.create({
    amount: '15000',
    currency: 'XAF',
    description: 'Commande #1042',
    metadata: { orderId: '1042' },
    successUrl: 'https://shop.example/merci',
    cancelUrl: 'https://shop.example/panier',
  });

  if (intent.checkoutUrl === null) {
    // No success/cancel URL could be resolved: hosted page unavailable for this intent.
    return res.status(500).send('Hosted checkout is not configured');
  }

  await orders.attachIntent('1042', intent.id);
  res.redirect(303, intent.checkoutUrl);
});
```

Lyel Pay sends the customer back with `?lyel_payment_intent=<id>` and nothing else. Read the status on your server before showing a success page:

```ts
app.get('/merci', async (req, res) => {
  const id = String(req.query.lyel_payment_intent ?? '');
  const order = await orders.findByIntent(id); // must be an intent you created
  if (!order) return res.status(404).send('Unknown payment');

  const intent = await lyel.paymentIntents.retrieve(id);
  if (intent.status === 'COMPLETED') {
    await orders.markPaid(order.id); // idempotent: the webhook may have done it already
    return res.render('thank-you');
  }
  res.render('payment-pending', { status: intent.status });
});
```

## Read and cancel an intent

```ts
const intent = await lyel.paymentIntents.retrieve(id);
// intent.status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELED'

const canceled = await lyel.paymentIntents.cancel(id);
// Only a PENDING intent can be canceled; otherwise it throws E_GATEWAY_INTENT_NOT_CANCELABLE.
// Calling cancel again on a CANCELED intent answers the same intent.
```

## Webhooks

Lyel Pay sends one final event per intent: `payment.completed`, `payment.failed`, `payment.expired` or `payment.canceled`. Each delivery carries the `X-Lyel-Signature` header (`t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">`).

`constructEvent` checks the signature in constant time and rejects timestamps more than 300 seconds away from now (change it with `{ toleranceSeconds }`). Pass the **raw** body: a re-serialized JSON body will not match.

```ts
import express from 'express';
import {
  LyelPayWebhookPayloadError,
  LyelPayWebhookSignatureError,
  WEBHOOK_SIGNATURE_HEADER,
} from '@lyel/lyel-pay-node';

app.post('/webhooks/lyel', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = lyel.webhooks.constructEvent(
      req.body, // Buffer
      req.headers[WEBHOOK_SIGNATURE_HEADER],
      process.env.LYEL_WEBHOOK_SECRET!,
    );
  } catch (error) {
    if (error instanceof LyelPayWebhookSignatureError || error instanceof LyelPayWebhookPayloadError) {
      return res.status(400).send(error.message);
    }
    throw error;
  }

  // event.id is stable across retries: use it to process each event once.
  if (await events.alreadyProcessed(event.id)) return res.sendStatus(200);

  switch (event.event) {
    case 'payment.completed':
      await orders.markPaidByIntent(event.data.id);
      break;
    case 'payment.failed':
    case 'payment.expired':
    case 'payment.canceled':
      await orders.releaseByIntent(event.data.id, event.event);
      break;
  }

  await events.markProcessed(event.id);
  res.sendStatus(200);
});
```

## Errors

A non-2xx answer throws `LyelPayApiError` with `statusCode`, `message`, `code` and `retryAfterSeconds` (from `Retry-After`, or `null`). `code` is `null` for request validation errors (400). A 2xx answer the SDK cannot read throws `LyelPayUnexpectedResponseError`.

`retrieve` and `cancel` throw a `TypeError` before any call when the id is not a UUID.

```ts
import { GatewayErrorCodes, LyelPayApiError } from '@lyel/lyel-pay-node';

try {
  await lyel.paymentIntents.cancel(id);
} catch (error) {
  if (error instanceof LyelPayApiError && error.code === GatewayErrorCodes.E_GATEWAY_INTENT_NOT_CANCELABLE) {
    // already completed, failed or expired: read it to know which
  }
}
```

| Code | HTTP | Meaning |
|---|---|---|
| `E_CANNOT_AUTHENTICATE` | 401 | Missing or malformed `Authorization` header |
| `E_INVALID_API_KEY` | 401 | Unknown or malformed secret key |
| `E_UNAUTHORIZED` | 403 | LIVE key used while LIVE mode is not enabled for your account |
| `E_GATEWAY_SUSPENDED` | 403 | Online payment is suspended for your account |
| `E_GATEWAY_RETURN_URL_FORBIDDEN` | 400 | A return URL is outside your allowed domains (or not `https` in LIVE) |
| `E_GATEWAY_RETURN_URLS_INCOMPLETE` | 400 | Only one of the success and cancel URLs could be resolved |
| `E_GATEWAY_INVALID_PHONE` | 400 | `customer.phone` is not a valid phone number |
| `E_GATEWAY_INTENT_NOT_FOUND` | 404 | No intent with this id for your account and key mode |
| `E_GATEWAY_INTENT_NOT_CANCELABLE` | 409 | The intent is no longer pending |

## Upgrading from 0.1

- `paymentIntents.retrieve` now takes the intent **id** (it used to take the session token).
- `create` returns `CreatedPaymentIntent`, with `checkoutUrl`, `successUrl` and `cancelUrl`.
- Webhook events follow the API body: `{ id, event, timestamp, data }` (was `{ type, created, data.paymentIntent }`, which never matched what the API sends).
- Errors are `LyelPayApiError` instances with a `code`; the `LyelPayError` interface is removed.
- The `LyelPayMode` type is removed; use `PaymentIntentMode` (`'LIVE' | 'TEST'`).
- `PaymentIntentStatus` gains `CANCELED`: handle it in any exhaustive `switch`.
- The constructor options are `Omit<LyelPayConfig, 'secretKey'>` (was `Partial<LyelPayConfig>`): the key is the first argument only.
- `retrieve` and `cancel` reject non-UUID ids with a `TypeError`.
