# react-lyel-pay-js

React bindings of the Lyel Pay gateway checkout, on top of [`@lyel/lyel-pay-js`](../lyel-pay-js/README.md).

Full integration guide, with the server side in Node: [`docs/gateway`](../docs/gateway/README.md).

> **The callbacks do not prove a payment.** Deliver the order on the `payment.completed` webhook, or after reading the intent on your server with your secret key.

## Install

```bash
npm install react-lyel-pay-js @lyel/lyel-pay-js
```

## Modal: `useLyelPayCheckout`

```tsx
import { useLyelPayCheckout } from 'react-lyel-pay-js';

function PayButton({ sessionToken }: { sessionToken: string }) {
  const { open, close } = useLyelPayCheckout({
    publishableKey: 'pk_test_…',
    sessionToken,
    onSuccess: ({ reference }) => setMessage('Merci, nous vérifions votre paiement.'),
  });
  return <button onClick={open}>Payer</button>;
}
```

Or the ready-made `<LyelPayButton publishableKey sessionToken onSuccess={…}>Payer</LyelPayButton>`.

## Embedded block: `<LyelPayCheckout />`

```tsx
import { LyelPayCheckout } from 'react-lyel-pay-js';

<LyelPayCheckout publishableKey="pk_test_…" sessionToken={sessionToken} framed={false} onSuccess={…} />
```

## Behaviour

- Options: `publishableKey`, `sessionToken`, `locale`, `buttonLabel`, `checkoutUrl` (`https://dev.checkout.lyelpay.com` on dev), and the callbacks of `@lyel/lyel-pay-js`.
- A new `sessionToken` (or key, locale, label, address) rebuilds the checkout; a new callback does not: the latest one is always called.
- Unmounting removes the modal or the block.

## Development

```bash
npm install
npm test && npm run typecheck && npm run lint && npm run build
```
