import { createHmac } from 'crypto';
import { LyelPay, LyelPayWebhookSignatureError, WEBHOOK_SIGNATURE_HEADER, Webhooks } from '../src';

const SECRET = 'whsec_test_secret';
const NOW_SECONDS = 1_791_000_000;

/** Mirrors lyel-pay-api GatewayWebhookSender: body carries the timestamp, signature covers `${t}.${body}`. */
function signLikeTheApi(
  message: Record<string, unknown>,
  timestamp: number,
  secret: string = SECRET,
): { payload: string; header: string } {
  const payload = JSON.stringify({ ...message, timestamp });
  const signature = createHmac('sha256', secret).update(`${String(timestamp)}.${payload}`).digest('hex');
  return { payload, header: `t=${String(timestamp)},v1=${signature}` };
}

function canceledMessage(): Record<string, unknown> {
  return {
    id: 'evt_7d1d1c3a-5b7e-4f0e-9a51-3b2a6f0e8c11',
    event: 'payment.canceled',
    data: {
      id: '7d1d1c3a-5b7e-4f0e-9a51-3b2a6f0e8c11',
      reference: 'GWP-1',
      amount: '15000.0000',
      currency: 'XAF',
      mode: 'TEST',
      status: 'CANCELED',
      description: null,
      metadata: { orderId: '1042' },
      payerPhoneNumber: null,
      failureReason: null,
      createdAt: '2026-10-06T10:00:00.000Z',
      completedAt: null,
      canceledAt: '2026-10-06T10:02:00.000Z',
    },
  };
}

describe('Webhooks.constructEvent', () => {
  const webhooks = new Webhooks();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW_SECONDS * 1000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('names the header the API sends', () => {
    expect(WEBHOOK_SIGNATURE_HEADER).toBe('x-lyel-signature');
  });

  it('is exposed on the client', () => {
    expect(new LyelPay('sk_test_x').webhooks).toBeInstanceOf(Webhooks);
  });

  it('accepts a payload signed exactly like the API and returns the typed event', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS);

    const event = webhooks.constructEvent(payload, header, SECRET);

    expect(event.event).toBe('payment.canceled');
    expect(event.id).toBe('evt_7d1d1c3a-5b7e-4f0e-9a51-3b2a6f0e8c11');
    expect(event.timestamp).toBe(NOW_SECONDS);
    expect(event.data.status).toBe('CANCELED');
    expect(event.data.canceledAt).toBe('2026-10-06T10:02:00.000Z');
  });

  it('accepts the raw body as a Buffer', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS);

    expect(webhooks.constructEvent(Buffer.from(payload, 'utf8'), header, SECRET).event).toBe('payment.canceled');
  });

  it.each(['payment.completed', 'payment.failed', 'payment.expired', 'payment.canceled'])(
    'accepts the %s event',
    (eventName) => {
      const { payload, header } = signLikeTheApi({ ...canceledMessage(), event: eventName }, NOW_SECONDS);

      expect(webhooks.constructEvent(payload, header, SECRET).event).toBe(eventName);
    },
  );

  it('rejects a payload altered after signing', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS);
    const tampered = payload.replace('15000.0000', '1.0000');

    expect(() => webhooks.constructEvent(tampered, header, SECRET)).toThrow(LyelPayWebhookSignatureError);
  });

  it('rejects a signature made with another secret', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS, 'whsec_other');

    expect(() => webhooks.constructEvent(payload, header, SECRET)).toThrow('signature mismatch');
  });

  it('rejects a timestamp swapped in the header', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS);
    const replayed = header.replace(`t=${String(NOW_SECONDS)}`, `t=${String(NOW_SECONDS + 1)}`);

    expect(() => webhooks.constructEvent(payload, replayed, SECRET)).toThrow('signature mismatch');
  });

  it('accepts a timestamp exactly at the default 300 s tolerance', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS - 300);

    expect(webhooks.constructEvent(payload, header, SECRET).event).toBe('payment.canceled');
  });

  it('rejects a timestamp past the tolerance, in the past or the future', () => {
    const old = signLikeTheApi(canceledMessage(), NOW_SECONDS - 301);
    const future = signLikeTheApi(canceledMessage(), NOW_SECONDS + 301);

    expect(() => webhooks.constructEvent(old.payload, old.header, SECRET)).toThrow('outside the tolerance');
    expect(() => webhooks.constructEvent(future.payload, future.header, SECRET)).toThrow('outside the tolerance');
  });

  it('honours a custom tolerance', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS - 60);

    expect(() => webhooks.constructEvent(payload, header, SECRET, { toleranceSeconds: 30 })).toThrow(
      'outside the tolerance',
    );
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['without v1', `t=${String(NOW_SECONDS)}`],
    ['without t', 'v1=abcd'],
    ['with a non-numeric t', 't=soon,v1=abcd'],
    ['with a non-hex v1', `t=${String(NOW_SECONDS)},v1=not-hex`],
  ])('rejects a header %s', (_label, header) => {
    const { payload } = signLikeTheApi(canceledMessage(), NOW_SECONDS);

    expect(() => webhooks.constructEvent(payload, header, SECRET)).toThrow(LyelPayWebhookSignatureError);
  });

  it('rejects an empty secret instead of verifying against it', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS, '');

    expect(() => webhooks.constructEvent(payload, header, '')).toThrow(TypeError);
  });

  it('takes the first value when a framework hands the header as an array', () => {
    const { payload, header } = signLikeTheApi(canceledMessage(), NOW_SECONDS);

    expect(webhooks.constructEvent(payload, [header], SECRET).event).toBe('payment.canceled');
  });

  it('rejects a correctly signed body that is not a known event', () => {
    const { payload, header } = signLikeTheApi({ ...canceledMessage(), event: 'payment.refunded' }, NOW_SECONDS);

    expect(() => webhooks.constructEvent(payload, header, SECRET)).toThrow('Unknown webhook event');
  });
});
