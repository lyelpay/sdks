import { describe, expect, it } from 'vitest';
import type { CheckoutState } from '../app/checkout-machine';
import type { CheckoutSession, Surface } from '../domain/session';
import { dictionaryFor } from '../i18n';
import type { RenderContext } from './render-context';
import { renderShell } from './shells';

const session: CheckoutSession = {
  id: 'pi_1',
  status: 'PENDING',
  reference: 'GWP-7K2Q9M',
  amount: '15000',
  currency: 'XAF',
  description: null,
  mode: 'LIVE',
  locale: 'fr',
  expiresAt: new Date('2026-10-10T10:15:00Z'),
  merchant: { name: 'Ets Hassani', logoPath: null, primaryColor: null, buttonLabel: 'PAY', showSecuredBadge: true },
  returnUrls: { success: 'https://shop.cg/ok?lyel_payment_intent=pi_1', cancel: 'https://shop.cg/ko?lyel_payment_intent=pi_1' },
  customerPhoneNumber: null,
  otp: null,
  embedding: { allowedDomains: ['shop.cg'], allowLocalhost: false },
};

const otp = { channel: 'WHATSAPP', maskedPhoneNumber: '06 ••• •• 67', expiresAt: null, remainingAttempts: 5, remainingSends: 2, resendAvailableAt: null } as const;

function render(surface: Surface, state: CheckoutState, overrides: Partial<RenderContext> = {}): string {
  return renderShell({
    state,
    session,
    t: dictionaryFor('fr'),
    locale: 'fr',
    surface,
    framed: true,
    amount: '15 000 FCFA',
    merchantName: 'Ets Hassani',
    logoUrl: null,
    buttonLabel: 'PAY',
    signupUrl: null,
    showSecuredBadge: true,
    phoneDraft: '',
    redirecting: false,
    now: new Date('2026-10-10T10:00:00Z'),
    ...overrides,
  });
}

describe('hosted page', () => {
  it('offers a single way to cancel: the link under the card', () => {
    const html = render('hosted', { step: 'phone', error: null });
    expect(html).toContain('Annuler et revenir à Ets Hassani');
    expect(html).not.toContain('>Annuler<');
  });

  it.each<CheckoutState>([{ step: 'sendingCode' }, { step: 'processing', otp: null }, { step: 'success', alreadyPaid: false }])(
    'hides the cancel link while %j',
    (state) => {
      expect(render('hosted', state)).not.toContain('Annuler et revenir');
    },
  );

  it('shows the return button and the redirect notice after a success', () => {
    const html = render('hosted', { step: 'success', alreadyPaid: false }, { redirecting: true });
    expect(html).toContain('Retour à Ets Hassani');
    expect(html).toContain('Redirection automatique dans 3 s…');
  });

  it('always shows the secured badge, even when the merchant hid it', () => {
    expect(render('hosted', { step: 'phone', error: null }, { showSecuredBadge: true })).toContain('Paiement sécurisé par');
  });
});

describe('modal', () => {
  it('locks the close cross while the payment is in progress', () => {
    expect(render('modal', { step: 'processing', otp: null })).toMatch(/data-action="close" aria-label="Fermer" disabled/);
    expect(render('modal', { step: 'phone', error: null })).not.toMatch(/data-action="close" aria-label="Fermer" disabled/);
  });

  it('offers "Close" after a success', () => {
    expect(render('modal', { step: 'success', alreadyPaid: false })).toContain('>Fermer</button>');
  });

  it('hides the secured badge when the merchant chose so', () => {
    expect(render('modal', { step: 'phone', error: null }, { showSecuredBadge: false })).not.toContain('Paiement sécurisé par');
  });

  it('uses the "start again" expiry text', () => {
    expect(render('modal', { step: 'expired' })).toContain('Relancez le paiement pour recommencer.');
  });
});

describe('embedded block', () => {
  it.each<CheckoutState>([{ step: 'success', alreadyPaid: false }, { step: 'failed' }, { step: 'expired' }, { step: 'canceled' }])(
    'shows no button on %j: the merchant reacts to the messages',
    (state) => {
      expect(render('embedded', state)).not.toContain('<button');
      expect(render('embedded', state)).not.toContain('lp-btn');
    },
  );

  it('drops the frame on request', () => {
    expect(render('embedded', { step: 'phone', error: null }, { framed: false })).not.toContain('is-framed');
  });
});

describe('code step', () => {
  it('replaces the resend link once no send is left', () => {
    const html = render('embedded', { step: 'code', otp: { ...otp, remainingSends: 0 }, error: null, noticeUntil: null, resending: false });
    expect(html).toContain('Vous avez atteint le nombre maximum d’envois.');
    expect(html).not.toContain('data-action="resend"');
  });

  it('announces a new code while the notice lasts, then keeps it hidden in place', () => {
    const shown = render('embedded', { step: 'code', otp, error: null, noticeUntil: new Date('2026-10-10T10:00:03Z'), resending: false });
    expect(shown).toMatch(/data-tick="notice" >Nouveau code envoyé\./);
    const hidden = render('embedded', { step: 'code', otp, error: null, noticeUntil: null, resending: false });
    expect(hidden).toMatch(/data-tick="notice" hidden>/);
  });

  it('says when WhatsApp cannot send the code', () => {
    const html = render('embedded', { step: 'phone', error: 'channelUnavailable' });
    expect(html).toContain('Impossible d’envoyer le code pour le moment. Réessayez dans quelques minutes.');
  });

  it('accepts paste and one-time-code autofill', () => {
    const html = render('embedded', { step: 'code', otp, error: null, noticeUntil: null, resending: false });
    expect(html).toContain('autocomplete="one-time-code"');
  });
});

describe('account not found', () => {
  it('hides the sign-up link without a configured address', () => {
    expect(render('embedded', { step: 'phone', error: 'notFound' })).not.toContain('Créer un compte Lyel Pay');
  });

  it('shows it with the configured address', () => {
    const html = render('embedded', { step: 'phone', error: 'notFound' }, { signupUrl: 'https://store.example/lyel' });
    expect(html).toContain('href="https://store.example/lyel"');
  });
});

describe('state 8', () => {
  it('offers "Try again" while a code can still be used or sent', () => {
    expect(render('embedded', { step: 'insufficientFunds', otp })).toContain('data-action="retry"');
  });

  it('hides "Try again" and says the send limit is reached otherwise', () => {
    const html = render('embedded', { step: 'insufficientFunds', otp: { ...otp, remainingAttempts: 0, remainingSends: 0 } });
    expect(html).not.toContain('data-action="retry"');
    expect(html).toContain('Vous avez atteint le nombre maximum d’envois.');
  });
});

describe('test mode', () => {
  it('shows the banner and the test numbers', () => {
    const html = render('embedded', { step: 'phone', error: null }, { session: { ...session, mode: 'TEST' } });
    expect(html).toContain('Mode test — aucun argent ne bouge');
    expect(html).toContain('06 000 00 01 — paiement accepté');
  });
});

describe('test mode, code step', () => {
  const codeState: CheckoutState = { step: 'code', otp, error: null, noticeUntil: null, resending: false };

  it('says no message is sent, instead of a WhatsApp code that never comes', () => {
    const html = render('embedded', codeState, { session: { ...session, mode: 'TEST' } });
    expect(html).toContain('Mode test : aucun message n’est envoyé. Saisissez 000000.');
    expect(html).not.toContain('Nous avons envoyé un code');
  });

  it('keeps the WhatsApp text in LIVE', () => {
    expect(render('embedded', codeState)).toContain('Nous avons envoyé un code à 6 chiffres sur WhatsApp au 06 ••• •• 67.');
  });
});

describe('escaping', () => {
  it('never injects the merchant name as markup', () => {
    expect(render('hosted', { step: 'phone', error: null }, { merchantName: '<img src=x onerror=alert(1)>' })).not.toContain('<img src=x');
  });
});
