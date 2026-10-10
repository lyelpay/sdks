import { describe, expect, it } from 'vitest';
import { formatAmount, initialsOf, shouldShowSecuredBadge } from './display';
import { resolveLocale } from './locale';
import { isEmbeddingAllowed } from './embedding';
import { isExpiryWarning } from './expiry';

const NBSP = ' ';

describe('formatAmount', () => {
  it('groups thousands with a space in French', () => {
    expect(formatAmount('15000.0000', 'XAF', 'fr')).toBe(`15${NBSP}000${NBSP}FCFA`);
  });

  it('groups thousands with a comma in English', () => {
    expect(formatAmount('15000.0000', 'XOF', 'en')).toBe(`15,000${NBSP}FCFA`);
  });

  it('handles small, zero and large amounts', () => {
    expect(formatAmount('500', 'XAF', 'fr')).toBe(`500${NBSP}FCFA`);
    expect(formatAmount('0.0000', 'XAF', 'fr')).toBe(`0${NBSP}FCFA`);
    expect(formatAmount('1250000', 'XAF', 'fr')).toBe(`1${NBSP}250${NBSP}000${NBSP}FCFA`);
  });

  it('keeps a non-zero fraction', () => {
    expect(formatAmount('1500.5000', 'XAF', 'fr')).toBe(`1${NBSP}500,5${NBSP}FCFA`);
  });

  it('shows an unknown currency by its code', () => {
    expect(formatAmount('10', 'EUR', 'en')).toBe(`10${NBSP}EUR`);
  });
});

describe('initialsOf', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsOf('Ets Hassani')).toBe('EH');
    expect(initialsOf('  boulangerie  du port ')).toBe('BD');
    expect(initialsOf('Kiosque')).toBe('K');
  });

  it('never returns an empty badge', () => {
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('resolveLocale', () => {
  it('prefers the locale passed by the SDK', () => {
    expect(resolveLocale('en', 'fr')).toBe('en');
  });

  it('then the merchant default', () => {
    expect(resolveLocale(null, 'en')).toBe('en');
  });

  it('then French, ignoring unsupported values', () => {
    expect(resolveLocale('ln', null)).toBe('fr');
    expect(resolveLocale(null, null)).toBe('fr');
  });

  it('reads a regional tag', () => {
    expect(resolveLocale('en-GB', null)).toBe('en');
  });
});

describe('shouldShowSecuredBadge', () => {
  it('always shows it on the hosted page', () => {
    expect(shouldShowSecuredBadge('hosted', false)).toBe(true);
  });

  it('follows the merchant setting in the modal and the block', () => {
    expect(shouldShowSecuredBadge('modal', false)).toBe(false);
    expect(shouldShowSecuredBadge('embedded', true)).toBe(true);
  });

  it('shows it when the API does not send the setting yet', () => {
    expect(shouldShowSecuredBadge('embedded', undefined)).toBe(true);
  });
});

describe('isEmbeddingAllowed', () => {
  const live = { allowedDomains: ['shop.cg', '*.boutique.cg'], allowLocalhost: false };

  it('accepts a listed https host', () => {
    expect(isEmbeddingAllowed('https://shop.cg', live)).toBe(true);
  });

  it('accepts a subdomain only through a wildcard', () => {
    expect(isEmbeddingAllowed('https://www.shop.cg', live)).toBe(false);
    expect(isEmbeddingAllowed('https://www.boutique.cg', live)).toBe(true);
    expect(isEmbeddingAllowed('https://boutique.cg', live)).toBe(false);
  });

  it('refuses http in LIVE', () => {
    expect(isEmbeddingAllowed('http://shop.cg', live)).toBe(false);
  });

  it('refuses everything with an empty list in LIVE', () => {
    expect(isEmbeddingAllowed('https://shop.cg', { allowedDomains: [], allowLocalhost: false })).toBe(false);
  });

  it('accepts localhost only when allowed (TEST)', () => {
    expect(isEmbeddingAllowed('http://localhost:5173', live)).toBe(false);
    const test = { allowedDomains: [], allowLocalhost: true };
    expect(isEmbeddingAllowed('http://localhost:5173', test)).toBe(true);
    expect(isEmbeddingAllowed('http://127.0.0.1:8080', test)).toBe(true);
  });

  it('accepts http on a listed domain in TEST', () => {
    expect(isEmbeddingAllowed('http://shop.cg', { allowedDomains: ['shop.cg'], allowLocalhost: true })).toBe(true);
  });

  it('refuses a malformed or opaque origin', () => {
    expect(isEmbeddingAllowed('null', live)).toBe(false);
    expect(isEmbeddingAllowed('', live)).toBe(false);
  });

  it('is case-insensitive on the host', () => {
    expect(isEmbeddingAllowed('https://SHOP.cg', live)).toBe(true);
  });
});

describe('isExpiryWarning', () => {
  const expiresAt = new Date('2026-10-10T10:15:00Z');

  it('warns in the last two minutes', () => {
    expect(isExpiryWarning(expiresAt, new Date('2026-10-10T10:13:00Z'))).toBe(true);
    expect(isExpiryWarning(expiresAt, new Date('2026-10-10T10:14:59Z'))).toBe(true);
  });

  it('stays quiet before and after', () => {
    expect(isExpiryWarning(expiresAt, new Date('2026-10-10T10:12:59Z'))).toBe(false);
    expect(isExpiryWarning(expiresAt, new Date('2026-10-10T10:15:00Z'))).toBe(false);
  });
});
