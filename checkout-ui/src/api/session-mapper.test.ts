import { describe, expect, it } from 'vitest';
import { toCheckoutSession } from './session-mapper';
import { InvalidResponseError } from './json';

const api = {
  id: 'pi_1',
  status: 'PENDING',
  reference: 'GWP-1',
  amount: '15000.0000',
  currency: 'XAF',
  description: 'Commande #1042',
  mode: 'TEST',
  locale: 'fr',
  expiresAt: '2026-10-10T10:15:00.000Z',
  merchant: { name: 'Ets Hassani', logoPath: null, primaryColor: '#1E8E3E', buttonLabel: 'PAY' },
  returnUrls: null,
  customerPhoneNumber: null,
  otp: null,
  embedding: { allowedDomains: ['shop.cg'], allowLocalhost: true },
};

describe('toCheckoutSession', () => {
  it('reads the API answer', () => {
    const session = toCheckoutSession(api);
    expect(session.expiresAt).toEqual(new Date('2026-10-10T10:15:00.000Z'));
    expect(session.merchant.primaryColor).toBe('#1E8E3E');
    expect(session.embedding.allowedDomains).toEqual(['shop.cg']);
  });

  it('leaves the secured badge undecided when the API does not send it yet', () => {
    expect(toCheckoutSession(api).merchant.showSecuredBadge).toBeUndefined();
  });

  it('reads the secured badge setting when present', () => {
    expect(toCheckoutSession({ ...api, merchant: { ...api.merchant, showSecuredBadge: false } }).merchant.showSecuredBadge).toBe(false);
    expect(toCheckoutSession({ ...api, showSecuredBadge: false }).merchant.showSecuredBadge).toBe(false);
  });

  it('keeps https return addresses', () => {
    const urls = { success: 'https://shop.cg/ok', cancel: 'https://shop.cg/ko' };
    expect(toCheckoutSession({ ...api, mode: 'LIVE', returnUrls: urls }).returnUrls).toEqual(urls);
  });

  it('keeps http on localhost in TEST only', () => {
    const urls = { success: 'http://localhost:3000/ok', cancel: 'http://127.0.0.1:3000/ko' };
    expect(toCheckoutSession({ ...api, returnUrls: urls }).returnUrls).toEqual(urls);
    expect(toCheckoutSession({ ...api, mode: 'LIVE', returnUrls: urls }).returnUrls).toBeNull();
  });

  it.each(['javascript:alert(1)', 'http://shop.cg/ok', 'data:text/html,x', 'not a url', '//shop.cg/ok'])(
    'refuses the return address %s',
    (bad) => {
      expect(toCheckoutSession({ ...api, returnUrls: { success: bad, cancel: 'https://shop.cg/ko' } }).returnUrls).toBeNull();
    },
  );

  it('refuses an unknown status', () => {
    expect(() => toCheckoutSession({ ...api, status: 'PAID' })).toThrow(InvalidResponseError);
  });
});
