# Mode B: embedded block

The payment form is part of your page, for example your order summary on the left and the Lyel Pay block on the right. The block takes the width of its container (320 to 560 px) and grows or shrinks with its content: no inner scroll bar.

> **The browser callbacks do not prove a payment.** At the end the block shows the outcome and your page decides what to do next; deliver the order only on the `payment.completed` webhook or after `lyel.paymentIntents.retrieve(id)` on your server.

## 1. Server (Node)

The same as the modal: create the intent and give the page its `sessionToken`. See [mode A, step 1](./mode-a-modal.md#1-server-node).

## 2. Browser, plain JavaScript

```html
<div id="lyel-pay"></div>
```

```ts
import { GatewayCheckout } from '@lyel/lyel-pay-js';

const checkout = new GatewayCheckout({
  publishableKey: 'pk_test_…',
  sessionToken,
  checkoutUrl: 'https://dev.checkout.lyelpay.com', // dev only
  onReady: () => hideSpinner(),
  onSuccess: ({ reference }) => goToConfirmationPage(reference), // which then checks on your server
  onFailed: () => showHelp(),
});
checkout.mount(document.getElementById('lyel-pay')!, { framed: true });
// checkout.destroy() removes it, for example when the customer leaves the step.
```

`framed: false` drops the border and the shadow, so the block blends into your page.

## 2 bis. Browser, React

```tsx
import { LyelPayCheckout } from 'react-lyel-pay-js';

<LyelPayCheckout
  publishableKey="pk_test_…"
  sessionToken={sessionToken}
  framed={false}
  onSuccess={({ reference }) => navigate(`/commande/merci?ref=${reference}`)}
/>
```

The block is mounted when the component is, rebuilt for a new `sessionToken`, and removed on unmount. Changing a callback does not reload it.

## Options and events

As the modal (see [mode A](./mode-a-modal.md#options-and-events)), plus `framed`, and without `onClose`: the block stays on the page after every outcome, with no button of its own.
