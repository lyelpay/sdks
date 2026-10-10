import { describe, expect, it } from 'vitest';
import type { CheckoutSession, OtpProgress } from '../domain/session';
import { canCancel, initialState, reduce, type CheckoutState } from './checkout-machine';

const NOW = new Date('2026-10-10T10:00:00Z');
const LATER = new Date('2026-10-10T10:05:00Z');

const otp: OtpProgress = {
  channel: 'TEST',
  maskedPhoneNumber: '06 ••• •• 67',
  expiresAt: LATER,
  remainingAttempts: 5,
  remainingSends: 2,
  resendAvailableAt: NOW,
};

function session(overrides: Partial<CheckoutSession> = {}): CheckoutSession {
  return {
    id: 'pi_1',
    status: 'PENDING',
    reference: 'GWP-7K2Q9M',
    amount: '15000.0000',
    currency: 'XAF',
    description: null,
    mode: 'TEST',
    locale: 'fr',
    expiresAt: new Date('2026-10-10T10:15:00Z'),
    merchant: { name: 'Ets Hassani', logoPath: null, primaryColor: null, buttonLabel: 'PAY', showSecuredBadge: true },
    returnUrls: null,
    customerPhoneNumber: null,
    otp: null,
    embedding: { allowedDomains: [], allowLocalhost: true },
    ...overrides,
  };
}

const phone: CheckoutState = { step: 'phone', error: null };
const sending: CheckoutState = { step: 'sendingCode' };
const code: CheckoutState = { step: 'code', otp, error: null, notice: null, resending: false };
const processing: CheckoutState = { step: 'processing', otp };

describe('reading the status', () => {
  it('starts on the skeleton', () => {
    expect(initialState()).toEqual({ step: 'loading', initial: true });
  });

  it.each([
    ['PENDING', { step: 'phone', error: null }],
    ['FAILED', { step: 'failed' }],
    ['EXPIRED', { step: 'expired' }],
    ['CANCELED', { step: 'canceled' }],
  ] as const)('maps %s on the first read', (status, expected) => {
    const next = reduce(initialState(), { type: 'sessionRead', session: session({ status }), now: NOW });
    expect(next.state).toEqual(expected);
  });

  it('shows "already paid" when the first read is COMPLETED (reload)', () => {
    const next = reduce(initialState(), { type: 'sessionRead', session: session({ status: 'COMPLETED' }), now: NOW });
    expect(next.state).toEqual({ step: 'success', alreadyPaid: true });
  });

  it('resumes on the code step when a live code is waiting', () => {
    const next = reduce(initialState(), { type: 'sessionRead', session: session({ otp }), now: NOW });
    expect(next.state).toEqual(code);
  });

  it('goes back to the number when the waiting code is spent or expired', () => {
    const spent = reduce(initialState(), { type: 'sessionRead', session: session({ otp: { ...otp, remainingAttempts: 0 } }), now: NOW });
    expect(spent.state).toEqual(phone);
    const expired = reduce(initialState(), { type: 'sessionRead', session: session({ otp }), now: LATER });
    expect(expired.state).toEqual(phone);
  });
});

describe('network problem (state 14)', () => {
  it('never jumps to the number on retry: it reads the status first', () => {
    const next = reduce({ step: 'networkError' }, { type: 'retryAfterNetworkError' });
    expect(next).toEqual({ state: { step: 'loading', initial: false }, effect: 'refreshStatus' });
  });

  it('shows the success (9, not 12) when the status read after a retry is COMPLETED', () => {
    const next = reduce({ step: 'loading', initial: false }, { type: 'sessionRead', session: session({ status: 'COMPLETED' }), now: NOW });
    expect(next.state).toEqual({ step: 'success', alreadyPaid: false });
  });

  it('is reached when a call cannot get through', () => {
    expect(reduce(processing, { type: 'requestFailed', failure: { kind: 'network' } }).state).toEqual({ step: 'networkError' });
    expect(reduce(sending, { type: 'requestFailed', failure: { kind: 'api', status: 503, code: 'E_GATEWAY_OTP_CHANNEL_UNAVAILABLE' } }).state).toEqual({ step: 'networkError' });
  });
});

describe('the number step', () => {
  it('refuses an unreadable number without calling the API', () => {
    expect(reduce(phone, { type: 'phoneSubmitted', phoneNumber: null })).toEqual({
      state: { step: 'phone', error: 'invalid' },
      effect: 'none',
    });
  });

  it('sends the code for a readable number', () => {
    expect(reduce(phone, { type: 'phoneSubmitted', phoneNumber: '+242061234567' })).toEqual({
      state: sending,
      effect: 'none',
    });
  });

  it('shows "account not found" (4)', () => {
    const next = reduce(sending, { type: 'requestFailed', failure: { kind: 'api', status: 404, code: 'E_GATEWAY_PAYER_NOT_FOUND' } });
    expect(next.state).toEqual({ step: 'phone', error: 'notFound' });
  });

  it('fails for good after too many unknown numbers', () => {
    const next = reduce(sending, { type: 'requestFailed', failure: { kind: 'api', status: 422, code: 'E_GATEWAY_PAYER_LOOKUP_EXHAUSTED' } });
    expect(next.state).toEqual({ step: 'failed' });
  });

  it('goes to the code step once sent', () => {
    expect(reduce(sending, { type: 'codeSent', otp }).state).toEqual(code);
  });
});

describe('the code step', () => {
  it('announces a new code after a resend, then hides the notice', () => {
    const resending = reduce(code, { type: 'resendStarted' }).state;
    expect(resending).toEqual({ ...code, resending: true });
    const resent = reduce(resending, { type: 'codeSent', otp: { ...otp, remainingSends: 1 } }).state;
    expect(resent).toEqual({ ...code, otp: { ...otp, remainingSends: 1 }, notice: 'resent' });
    expect(reduce(resent, { type: 'noticeTimedOut' }).state).toEqual({ ...code, otp: { ...otp, remainingSends: 1 } });
  });

  it('re-reads the status when a resend is refused for timing or limit', () => {
    const next = reduce({ ...code, resending: true }, { type: 'requestFailed', failure: { kind: 'api', status: 429, code: 'E_GATEWAY_OTP_SEND_LIMIT' } });
    expect(next.effect).toBe('refreshStatus');
  });

  it('pays on confirm', () => {
    expect(reduce(code, { type: 'confirmStarted' }).state).toEqual(processing);
    expect(reduce(processing, { type: 'confirmed' }).state).toEqual({ step: 'success', alreadyPaid: false });
  });

  it('re-reads the attempts left on a wrong code (6)', () => {
    const next = reduce(processing, { type: 'requestFailed', failure: { kind: 'api', status: 422, code: 'E_GATEWAY_INVALID_OTP' } });
    expect(next.effect).toBe('refreshAfterWrongCode');
    const read = reduce(next.state, { type: 'wrongCodeRead', session: session({ otp: { ...otp, remainingAttempts: 1 } }), now: NOW });
    expect(read.state).toEqual({ ...code, otp: { ...otp, remainingAttempts: 1 }, error: { kind: 'wrong', remainingAttempts: 1 } });
  });

  it('follows the status when the wrong code ended the payment', () => {
    const read = reduce(processing, { type: 'wrongCodeRead', session: session({ status: 'FAILED' }), now: NOW });
    expect(read.state).toEqual({ step: 'failed' });
  });

  it('says the code expired', () => {
    const next = reduce(processing, { type: 'requestFailed', failure: { kind: 'api', status: 422, code: 'E_GATEWAY_OTP_EXPIRED' } });
    expect(next.state).toEqual({ ...code, error: { kind: 'expired' } });
  });

  it.each(['E_GATEWAY_OTP_ATTEMPTS_EXHAUSTED', 'E_GATEWAY_PAYMENT_DECLINED'])('fails for good on %s', (errorCode) => {
    const next = reduce(processing, { type: 'requestFailed', failure: { kind: 'api', status: 422, code: errorCode } });
    expect(next.state).toEqual({ step: 'failed' });
  });

  it('shows insufficient funds (8) without ending the payment', () => {
    const next = reduce(processing, { type: 'requestFailed', failure: { kind: 'api', status: 422, code: 'E_GATEWAY_INSUFFICIENT_FUNDS' } });
    expect(next).toEqual({ state: { step: 'insufficientFunds' }, effect: 'none' });
  });

  it('never shows an error on a concurrent confirm (409): it keeps waiting and reads the status', () => {
    const next = reduce(processing, { type: 'requestFailed', failure: { kind: 'api', status: 409, code: 'E_GATEWAY_PAYMENT_IN_PROGRESS' } });
    expect(next).toEqual({ state: processing, effect: 'pollStatus' });
  });

  it('keeps waiting while the polled status is still pending, then follows it', () => {
    expect(reduce(processing, { type: 'inProgressRead', session: session(), now: NOW })).toEqual({ state: processing, effect: 'pollStatus' });
    expect(reduce(processing, { type: 'inProgressRead', session: session({ status: 'COMPLETED' }), now: NOW }).state).toEqual({
      step: 'success',
      alreadyPaid: false,
    });
  });

  it('goes back to the number on "change number"', () => {
    expect(reduce(code, { type: 'changeNumber' }).state).toEqual(phone);
    expect(reduce({ step: 'insufficientFunds' }, { type: 'changeNumber' }).state).toEqual(phone);
  });
});

describe('any step', () => {
  it.each(['E_CANNOT_AUTHENTICATE', 'E_INVALID_API_KEY', 'E_GATEWAY_SUSPENDED', 'E_GATEWAY_ORIGIN_FORBIDDEN'])(
    'shows the unavailable screen on %s',
    (errorCode) => {
      const next = reduce(initialState(), { type: 'requestFailed', failure: { kind: 'api', status: 401, code: errorCode } });
      expect(next.state).toEqual({ step: 'unavailable' });
    },
  );

  it('re-reads the status when the intent is no longer active', () => {
    const next = reduce(processing, { type: 'requestFailed', failure: { kind: 'api', status: 422, code: 'E_GATEWAY_INTENT_INACTIVE' } });
    expect(next.effect).toBe('refreshStatus');
  });

  it('can be refused for the embedding page', () => {
    expect(reduce(initialState(), { type: 'embeddingRefused' }).state).toEqual({ step: 'unavailable' });
  });
});

describe('canCancel (hosted page link)', () => {
  it.each<[CheckoutState, boolean]>([
    [phone, true],
    [{ step: 'phone', error: 'notFound' }, true],
    [code, true],
    [{ ...code, error: { kind: 'wrong', remainingAttempts: 2 } }, true],
    [{ step: 'insufficientFunds' }, true],
    [sending, false],
    [{ ...code, resending: true }, false],
    [processing, false],
    [{ step: 'success', alreadyPaid: false }, false],
    [{ step: 'networkError' }, false],
  ])('%j → %s', (state, expected) => {
    expect(canCancel(state)).toBe(expected);
  });
});
