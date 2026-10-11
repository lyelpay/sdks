import { describe, expect, it } from 'vitest';
import { dictionaryFor } from './index';

describe('dictionaries', () => {
  it('agree the remaining attempts in French', () => {
    expect(dictionaryFor('fr').attemptsLeft(1)).toBe('Il vous reste 1 essai.');
    expect(dictionaryFor('fr').attemptsLeft(2)).toBe('Il vous reste 2 essais.');
  });

  it('agree the remaining attempts in English', () => {
    expect(dictionaryFor('en').attemptsLeft(1)).toBe('1 attempt left.');
    expect(dictionaryFor('en').attemptsLeft(4)).toBe('4 attempts left.');
  });

  it('use the validated titles and expiry texts', () => {
    expect(dictionaryFor('fr').alreadyPaidTitle).toBe('Paiement déjà effectué');
    expect(dictionaryFor('en').alreadyPaidTitle).toBe('Payment already made');
    expect(dictionaryFor('fr').expiredBodyEmbedded).toBe('Cette demande de paiement a expiré. Relancez le paiement pour recommencer.');
    expect(dictionaryFor('en').expiredBodyEmbedded).toBe('This payment request has expired. Start the payment again.');
  });

  it('put the amount in the "Pay {amount}" label', () => {
    expect(dictionaryFor('fr').buttons.PAY_AMOUNT('15 000 FCFA')).toBe('Payer 15 000 FCFA');
  });
});
