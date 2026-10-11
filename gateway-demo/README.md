# Gateway demo: a test shop paying with Lyel Pay

A one-product shop that pays through the real gateway SDKs, in **TEST** mode (no money moves), in the three integration modes:

- **Modale** and **Intégré**: the page loads `@lyel/lyel-pay-js` (`../lyel-pay-js/dist`) and opens the modal or mounts the block;
- **Page hébergée**: the server creates the intent with `successUrl` / `cancelUrl` and redirects to the hosted page; `/merci` and `/annule` read the intent on the server before saying anything;
- `POST /api/payment-intents` creates the intent with `@lyel/lyel-pay-node` (`../lyel-pay-node/dist`) and the **secret** key, which never reaches the browser;
- after `onSuccess`, the page asks the shop server, which reads the intent: the browser alone is never trusted.

Integration guide: [`docs/gateway`](../docs/gateway/README.md).

## Run

```bash
# once: build the SDKs (public registry: the private one is not needed)
(cd ../lyel-pay-js && npm install --registry https://registry.npmjs.org && npm run build)
(cd ../lyel-pay-node && npm install --registry https://registry.npmjs.org && npm run build)

cp .env.example .env.local   # then fill in the merchant TEST keys; never commit .env.local
npm start                     # shop on http://localhost:4310 (PORT to change it)
```

`.env.local`:

| Variable | Meaning |
|---|---|
| `LYEL_API_URL` | The dev API. |
| `LYEL_TEST_SECRET_KEY`, `LYEL_TEST_PUBLISHABLE_KEY` | The merchant TEST keys, from the developer portal. |
| `LYEL_CHECKOUT_URL` | `https://dev.checkout.lyelpay.com` (default). `http://localhost:5174` runs `../checkout-ui` locally (run `npm install` there first); its API calls then go through this server, so no CORS setup is needed. |
| `PORT` | Shop port, `4310` by default. |

The merchant must allow `localhost` (accepted in TEST) for the hosted page return addresses.

## Pay

1. Choose a mode, then « Payer avec Lyel Pay ».
2. Number `06 000 0001` (success), `06 000 0002` (insufficient funds) or `06 000 0003` (no account); any other well-formed number succeeds.
3. Code `000000`.
4. The page logs what the browser says, then what the shop server reads. In TEST the intent completes and the `payment.completed` webhook fires, without debiting anyone.
