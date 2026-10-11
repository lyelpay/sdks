# Mode C: hosted page and redirect

No SDK in your site: a link is enough (WordPress without a developer, a link sent by message). The customer pays on a Lyel Pay page in your colours and comes back to your site.

> **Arriving on your success address proves nothing**: anybody can type it. Read the intent on your server, or wait for the `payment.completed` webhook, before delivering.

## 1. Server (Node): create and redirect

```ts
app.post('/checkout', async (req, res) => {
  const order = await orders.create(req.body);
  const intent = await lyel.paymentIntents.create({
    amount: String(order.total),
    currency: 'XAF',
    description: `Commande #${order.number}`,
    metadata: { orderId: order.id },
    successUrl: 'https://shop.example/merci',
    cancelUrl: 'https://shop.example/panier',
  });
  if (!intent.checkoutUrl) return res.status(500).send('Hosted checkout is not configured');
  await orders.attachIntent(order.id, intent.id);
  res.redirect(303, intent.checkoutUrl);
});
```

- `successUrl` and `cancelUrl` must belong to your allowed domains (`https` in LIVE; `localhost` is accepted in TEST). Leave one out and the default set in your portal applies.
- The link carries the session token after the `#`, so it never reaches server logs nor a `Referer`.

## 2. The customer pays

After the success the page sends the customer back to `successUrl` after 3 seconds (or at once with "Retour à …"). "Annuler et revenir à …" sends them to `cancelUrl` and cancels the intent (`payment.canceled`). A reload after the payment shows "Paiement déjà effectué", never an error.

## 3. Server (Node): the return

Lyel Pay adds `?lyel_payment_intent=<id>` and nothing else: no status in the address.

```ts
app.get('/merci', async (req, res) => {
  const id = String(req.query.lyel_payment_intent ?? '');
  const order = await orders.findByIntent(id); // only an intent you created
  if (!order) return res.status(404).send('Unknown payment');

  const intent = await lyel.paymentIntents.retrieve(id);
  if (intent.status === 'COMPLETED') {
    await orders.markPaid(order.id); // idempotent: the webhook may have done it already
    return res.render('thank-you');
  }
  res.render('payment-pending', { status: intent.status });
});
```

Without Node, call `GET /gateway/v1/payment-intents/:id` with `Authorization: Bearer <secret key>` and trust `status === "COMPLETED"` only.
