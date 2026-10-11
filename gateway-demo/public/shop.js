// The merchant's front end: ask the shop backend for a payment intent, then show the Lyel Pay checkout in the
// chosen mode. A browser callback never proves a payment: the shop asks its server, which reads the intent.
import { GatewayCheckout } from '/sdk/lyel-pay.esm.js';

const form = document.getElementById('pay-form');
const button = document.getElementById('pay');
const log = document.getElementById('log');
const embeddedSlot = document.getElementById('embedded-slot');

let current = null;

// The button stays disabled until this module is loaded: a click before would just submit the form.
button.disabled = false;

function note(text, tone = '') {
  const entry = document.createElement('div');
  entry.className = `entry ${tone}`;
  entry.textContent = `${new Date().toLocaleTimeString('fr-FR')} · ${text}`;
  log.prepend(entry);
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Création du paiement impossible');
  return json;
}

/** The proof: the shop server reads the intent with its secret key. */
async function confirmOnServer(intentId) {
  const res = await fetch(`/api/payment-intents/${encodeURIComponent(intentId)}`);
  const body = await res.json();
  if (res.ok && body.status === 'COMPLETED') note(`Confirmé par le serveur de la boutique. Référence : ${body.reference}`, 'ok');
  else note(`Le serveur ne confirme pas le paiement (statut : ${body.status ?? res.status}).`, 'ko');
}

function callbacks(intentId) {
  return {
    onReady: () => note('Lyel Pay est prêt.'),
    onSuccess: ({ reference }) => {
      note(`Le navigateur annonce un succès (${reference}). Vérification côté serveur…`);
      void confirmOnServer(intentId);
    },
    onFailed: () => note("Le paiement n'a pas abouti.", 'ko'),
    onExpired: () => note('La demande de paiement a expiré.', 'ko'),
    onCanceled: () => note('Paiement annulé.', 'ko'),
    onClose: () => note('Fenêtre fermée. Le paiement reste ouvert tant qu’il n’a pas expiré.'),
  };
}

function showCheckout(mode, intent) {
  current?.destroy();
  current = new GatewayCheckout({
    publishableKey: intent.publishableKey,
    sessionToken: intent.sessionToken,
    checkoutUrl: intent.checkoutUrl,
    ...callbacks(intent.intentId),
  });
  if (mode === 'embedded') current.mount(embeddedSlot);
  else current.open();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const amount = String(data.get('amount'));
  const mode = String(data.get('mode'));
  button.disabled = true;
  try {
    const intent = await postJson('/api/payment-intents', { amount, mode });
    if (mode === 'hosted') {
      note('Redirection vers la page de paiement Lyel Pay…');
      window.location.assign(intent.redirectUrl);
      return;
    }
    note(`Paiement créé (${intent.intentId.slice(0, 8)}…), mode ${mode === 'modal' ? 'modale' : 'intégré'}.`);
    showCheckout(mode, intent);
  } catch (error) {
    note(error.message, 'ko');
  } finally {
    button.disabled = false;
  }
});
