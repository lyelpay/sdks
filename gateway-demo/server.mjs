// Lyel Pay gateway demo: a test shop that pays through the real SDKs, in TEST mode, in the 3 integration modes.
//
//   - the shop page (public/) loads @lyel/lyel-pay-js: modal (mode A) or embedded block (mode B);
//   - mode C needs no browser SDK: the server redirects the customer to the hosted page;
//   - POST /api/payment-intents creates the intent with @lyel/lyel-pay-node and the secret key, which never
//     reaches the browser;
//   - the payment is only trusted after a server-side read (GET /api/payment-intents/:id, /merci): never on the
//     browser callbacks nor on the arrival on the success address.
//
// Keys and URLs come from .env.local (never committed). See README.md.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const LOCAL_CHECKOUT_PORT = 5174;
const MODES = ['modal', 'embedded', 'hosted'];

function loadEnv(file) {
  if (!existsSync(file)) throw new Error(`Missing ${file}: copy .env.example, see README.md`);
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (match) process.env[match[1]] ??= match[2];
  }
}

loadEnv(join(here, '.env.local'));
const PORT = Number(process.env.PORT || 4310);
/** Loopback only: the demo holds a secret test key and must not be reachable from the local network. */
const HOST = '127.0.0.1';
const SHOP_URL = `http://localhost:${PORT}`;
const { LYEL_API_URL, LYEL_TEST_SECRET_KEY, LYEL_TEST_PUBLISHABLE_KEY } = process.env;
const CHECKOUT_URL = new URL(process.env.LYEL_CHECKOUT_URL || 'https://dev.checkout.lyelpay.com').origin;
const LOCAL_CHECKOUT = CHECKOUT_URL === `http://localhost:${LOCAL_CHECKOUT_PORT}`;
if (!LYEL_API_URL || !LYEL_TEST_SECRET_KEY?.startsWith('sk_test_') || !LYEL_TEST_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
  throw new Error('.env.local needs LYEL_API_URL, a sk_test_ secret key and a pk_test_ publishable key');
}

const { LyelPay } = await import(join(here, '../lyel-pay-node/dist/index.mjs'));
const lyelPay = new LyelPay(LYEL_TEST_SECRET_KEY, { baseUrl: LYEL_API_URL });

/** The shop's "orders": only intents this shop created may be read back (a return address can be typed by hand). */
const createdIntents = new Set();

const STATIC = {
  '/': ['public/index.html', 'text/html; charset=utf-8'],
  '/shop.js': ['public/shop.js', 'text/javascript; charset=utf-8'],
  '/sdk/lyel-pay.esm.js': ['../lyel-pay-js/dist/index.esm.js', 'text/javascript; charset=utf-8'],
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/** The API links the dev widget; a local widget serves the same hosted page under its own origin. */
function hostedPageUrl(checkoutUrl) {
  const url = new URL(checkoutUrl);
  if (!LOCAL_CHECKOUT) return url.toString();
  const local = new URL(CHECKOUT_URL);
  url.protocol = local.protocol;
  url.host = local.host;
  return url.toString();
}

/** Shop backend: create the payment intent with the secret key, give the page what it needs for the chosen mode. */
async function createPaymentIntent(req, res) {
  const { amount, mode } = JSON.parse((await readBody(req)) || '{}');
  if (!/^\d+$/.test(String(amount)) || Number(amount) <= 0) return send(res, 400, { message: 'Montant invalide' });
  if (!MODES.includes(mode)) return send(res, 400, { message: 'Mode inconnu' });
  const hosted = mode === 'hosted';
  try {
    const intent = await lyelPay.paymentIntents.create({
      amount: String(amount),
      currency: 'XAF',
      description: 'T-shirt Lyel Pay (démo)',
      ...(hosted ? { successUrl: `${SHOP_URL}/merci`, cancelUrl: `${SHOP_URL}/annule` } : {}),
    });
    createdIntents.add(intent.id);
    if (hosted) {
      if (!intent.checkoutUrl) return send(res, 502, { message: 'Page hébergée indisponible pour ce marchand' });
      return send(res, 201, { intentId: intent.id, redirectUrl: hostedPageUrl(intent.checkoutUrl) });
    }
    send(res, 201, {
      intentId: intent.id,
      sessionToken: intent.sessionToken,
      publishableKey: LYEL_TEST_PUBLISHABLE_KEY,
      checkoutUrl: CHECKOUT_URL,
    });
  } catch (error) {
    send(res, 502, { message: error instanceof Error ? error.message : 'Création du paiement impossible' });
  }
}

/** The proof of payment: the status read on the server with the secret key. */
async function readCreatedIntent(id) {
  if (!createdIntents.has(id)) return null;
  return lyelPay.paymentIntents.retrieve(id);
}

async function intentStatus(res, id) {
  const intent = await readCreatedIntent(id);
  if (!intent) return send(res, 404, { message: 'Paiement inconnu de cette boutique' });
  send(res, 200, { status: intent.status, reference: intent.reference });
}

const RETURN_TITLES = {
  COMPLETED: 'Merci, votre paiement est confirmé.',
  PENDING: 'Paiement pas encore confirmé.',
  CANCELED: 'Paiement annulé.',
  EXPIRED: 'La demande de paiement a expiré.',
  FAILED: "Le paiement n'a pas abouti.",
};

/** Mode C return pages: the address alone proves nothing, the server reads the intent before saying "paid". */
async function returnPage(res, url) {
  const id = url.searchParams.get('lyel_payment_intent') ?? '';
  const intent = await readCreatedIntent(id);
  const title = intent ? RETURN_TITLES[intent.status] : 'Paiement inconnu de cette boutique.';
  const detail = intent ? `Statut lu côté serveur : ${intent.status} · référence ${intent.reference}` : 'Rien n’est livré.';
  send(
    res,
    intent ? 200 : 404,
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Boutique de test Lyel Pay</title>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;color:#051a1a">
<h1 style="font-size:22px">${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><p><a href="/">Retour à la boutique</a></p></body></html>`,
    'text/html; charset=utf-8',
  );
}

/** Local widget only: relays its calls (pk + session token) to the API, so it needs no CORS setup. */
async function relayToApi(req, res) {
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.headers['x-session-token']) headers['x-session-token'] = req.headers['x-session-token'];
  const body = req.method === 'GET' ? undefined : await readBody(req);
  const upstream = await fetch(`${LYEL_API_URL}${req.url}`, { method: req.method, headers, body });
  send(res, upstream.status, await upstream.text(), upstream.headers.get('content-type') ?? 'application/json');
}

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', CHECKOUT_URL);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

const INTENT_PATH = /^\/api\/payment-intents\/([^/]+)$/;

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', SHOP_URL);
    const path = url.pathname;
    if (LOCAL_CHECKOUT && path.startsWith('/gateway/v1/')) {
      withCors(res);
      if (req.method === 'OPTIONS') return send(res, 204, '');
      return await relayToApi(req, res);
    }
    if (path === '/api/payment-intents' && req.method === 'POST') return await createPaymentIntent(req, res);
    const intentMatch = INTENT_PATH.exec(path);
    if (intentMatch && req.method === 'GET') return await intentStatus(res, decodeURIComponent(intentMatch[1]));
    if ((path === '/merci' || path === '/annule') && req.method === 'GET') return await returnPage(res, url);
    const file = STATIC[path];
    if (file && req.method === 'GET') return send(res, 200, readFileSync(join(here, file[0])), file[1]);
    send(res, 404, { message: 'Not found' });
  } catch (error) {
    send(res, 500, { message: error instanceof Error ? error.message : 'Erreur' });
  }
}).listen(PORT, HOST, () => {
  console.log(`Boutique de test : ${SHOP_URL}  (API : ${LYEL_API_URL}, widget : ${CHECKOUT_URL}, mode TEST)`);
});

if (LOCAL_CHECKOUT) {
  const checkout = spawn('npx', ['vite', '--port', String(LOCAL_CHECKOUT_PORT), '--strictPort'], {
    cwd: join(here, '../checkout-ui'),
    env: { ...process.env, VITE_API_URL: SHOP_URL },
    stdio: 'inherit',
  });
  process.on('exit', () => checkout.kill());
  process.on('SIGINT', () => process.exit(0));
}
