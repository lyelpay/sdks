# @lyel/lyel-pay-js

Browser SDK of the Lyel Pay gateway: shows the checkout as a **modal** (mode A) or an **embedded block** (mode B). The hosted page (mode C) needs no browser SDK.

Full integration guide, with the server side in Node: [`docs/gateway`](../docs/gateway/README.md).

> **The callbacks do not prove a payment.** Deliver the order on the `payment.completed` webhook, or after reading the intent on your server with your secret key.

## Install

```bash
npm install @lyel/lyel-pay-js
```

## Modal

```ts
import { GatewayCheckout } from '@lyel/lyel-pay-js';

const checkout = new GatewayCheckout({
  publishableKey: 'pk_test_…',
  sessionToken, // from your server, which created the intent with its secret key
  checkoutUrl: 'https://dev.checkout.lyelpay.com', // dev only; defaults to https://checkout.lyelpay.com
  onSuccess: ({ paymentIntentId, reference }) => showMessage('Merci, nous vérifions votre paiement.'),
  onFailed: ({ paymentIntentId }) => {},
  onClose: () => {},
});
checkout.open();
```

## Embedded block

```ts
checkout.mount(document.getElementById('lyel-pay')!, { framed: false });
checkout.destroy(); // removes it
```

## Options

`publishableKey`, `sessionToken` (required) · `locale` (`'fr' | 'en'`) · `buttonLabel` (`'PAY' | 'PAY_AMOUNT' | 'CONFIRM_ORDER' | 'DONATE'`) · `checkoutUrl` · callbacks `onReady`, `onSuccess`, `onFailed`, `onExpired`, `onCanceled`, `onClose` (modal only).

`amount`, `currency` and `merchantName` are ignored: the checkout reads them from the API.

## Security

- The parameters ride after the `#` of the checkout address: the session token reaches neither server logs nor a `Referer`.
- The SDK only listens to messages whose origin is the checkout and whose sender is its own iframe.
- Before it says anything, the checkout challenges the page that embeds it; the SDK answers from that page. A page that only pretends to be your domain gets no answer through, and the checkout refuses to show.

## Protocol

`lyel-pay-checkout` v1 messages: `challenge`, `ready`, `resize`, `success`, `failed`, `expired`, `canceled`, `close`; the SDK answers `challenge` with `challenge-response`. The source of truth is `checkout-ui/src/messaging/contract.ts`.

## Upgrading from 1.x

- `onSuccess` receives `{ paymentIntentId, reference }` instead of the reference; `onFailed` receives `{ paymentIntentId }`.
- `open(container)` is now `mount(container)` for the embedded block; `open()` is the modal.
- The modal no longer closes on a failure: the customer reads the message, then closes it.
- The v0 client (`LyelPay`, `loadLyelPay`, see `docs/`) targets the retired `/intention` API and will be removed.

## Development

```bash
npm install
npm test && npm run typecheck && npm run lint
npm run build   # dist/ is versioned: rebuild it in the same commit
```
