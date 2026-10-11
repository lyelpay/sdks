# Mode A: modal

The customer clicks "Pay", a Lyel Pay window opens over your page (full screen on mobile), and closes after the payment. They never leave your site.

> **The browser callbacks do not prove a payment.** Use `onSuccess` to show "Thank you, we are checking your payment", then deliver on the `payment.completed` webhook or after `lyel.paymentIntents.retrieve(id)` on your server.

## 1. Server (Node)

```ts
import { LyelPay } from '@lyel/lyel-pay-node';

const lyel = new LyelPay(process.env.LYEL_SECRET_KEY!);

app.post('/checkout', async (req, res) => {
  const order = await orders.create(req.body);
  const intent = await lyel.paymentIntents.create({
    amount: String(order.total), // whole CFA francs
    currency: 'XAF',
    description: `Commande #${order.number}`,
    metadata: { orderId: order.id },
  });
  await orders.attachIntent(order.id, intent.id);
  res.json({ sessionToken: intent.sessionToken, intentId: intent.id });
});
```

## 2. Browser, plain JavaScript

```ts
import { GatewayCheckout } from '@lyel/lyel-pay-js';

payButton.addEventListener('click', async () => {
  const { sessionToken, intentId } = await fetch('/checkout', { method: 'POST' }).then((r) => r.json());
  const checkout = new GatewayCheckout({
    publishableKey: 'pk_test_…',
    sessionToken,
    checkoutUrl: 'https://dev.checkout.lyelpay.com', // dev only
    onSuccess: () => showMessage('Merci, nous vérifions votre paiement.'),
    onFailed: () => showMessage("Le paiement n'a pas abouti."),
    onClose: () => {}, // closing does not cancel: the customer can reopen until the intent expires
  });
  checkout.open();
});
```

## 2 bis. Browser, React

```tsx
import { useLyelPayCheckout } from 'react-lyel-pay-js';

function PayButton({ sessionToken }: { sessionToken: string }) {
  const { open } = useLyelPayCheckout({
    publishableKey: 'pk_test_…',
    sessionToken,
    onSuccess: () => setMessage('Merci, nous vérifions votre paiement.'),
  });
  return <button onClick={open}>Payer</button>;
}
```

`<LyelPayButton publishableKey sessionToken … />` does the same in one component.

## Options and events

| Option | Meaning |
|---|---|
| `publishableKey`, `sessionToken` | Required. |
| `locale` | `'fr'` or `'en'`, for this payment. Default: your portal setting, then French. |
| `buttonLabel` | `'PAY'`, `'PAY_AMOUNT'`, `'CONFIRM_ORDER'` or `'DONATE'`. Default: your portal setting. |
| `checkoutUrl` | Checkout address: `https://dev.checkout.lyelpay.com` on dev, or a local widget. |
| `amount`, `merchantName` | Ignored: they always come from the API. |

| Callback | When |
|---|---|
| `onReady()` | The window is shown. |
| `onSuccess({ paymentIntentId, reference })` | The customer saw the success. The window closes itself 3 s later. |
| `onFailed`, `onExpired`, `onCanceled` (`{ paymentIntentId }`) | Final outcome shown to the customer. Insufficient funds is not final: the customer can top up and retry. |
| `onClose()` | The window was closed. The intent stays payable until it expires. |

## Then, on your server

Deliver on the webhook (see the [Node SDK README](../../lyel-pay-node/README.md#webhooks)), or read the intent:

```ts
const intent = await lyel.paymentIntents.retrieve(intentId);
if (intent.status === 'COMPLETED') await orders.markPaid(orderId); // idempotent
```
