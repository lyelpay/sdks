import { LyelPay, LyelPayApiError, GatewayErrorCodes } from '../src';

const SECRET = 'sk_test_abc123';
const BASE_URL = 'https://api.example.test';
const INTENT_ID = '7d1d1c3a-5b7e-4f0e-9a51-3b2a6f0e8c11';

const createdIntent = {
  id: INTENT_ID,
  sessionToken: 'st_123',
  reference: 'GWP-1',
  status: 'PENDING',
  amount: '15000.0000',
  currency: 'XAF',
  mode: 'TEST',
  expiresAt: '2026-10-06T10:15:00.000Z',
  successUrl: 'https://shop.cg/merci',
  cancelUrl: 'https://shop.cg/panier',
  checkoutUrl: `https://dev.checkout.lyelpay.com/pay/${INTENT_ID}#pk=pk_test_abc&st=st_123`,
};

const readIntent = {
  id: INTENT_ID,
  reference: 'GWP-1',
  status: 'CANCELED',
  amount: '15000.0000',
  currency: 'XAF',
  mode: 'TEST',
  description: null,
  metadata: null,
  payerPhoneNumber: null,
  failureReason: null,
  successUrl: null,
  cancelUrl: null,
  webhook: { status: 'PENDING', attempts: 0, deliveredAt: null },
  createdAt: '2026-10-06T10:00:00.000Z',
  expiresAt: '2026-10-06T10:15:00.000Z',
  completedAt: null,
  canceledAt: '2026-10-06T10:02:00.000Z',
};

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('PaymentIntents', () => {
  let fetchMock: jest.SpyInstance<Promise<Response>, Parameters<typeof fetch>>;
  const lyel = new LyelPay(SECRET, { baseUrl: BASE_URL });

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  function lastCall(): { url: string; init: RequestInit } {
    const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    if (typeof url !== 'string') throw new Error('expected the SDK to call fetch with a string URL');
    return { url, init: init ?? {} };
  }

  function lastJsonBody(): unknown {
    const { body } = lastCall().init;
    if (typeof body !== 'string') throw new Error('expected a JSON string body');
    return JSON.parse(body);
  }

  function lastHeaders(): Record<string, string> {
    const headers = lastCall().init.headers;
    if (!headers || headers instanceof Headers || Array.isArray(headers)) {
      throw new Error('expected a plain header record');
    }
    return headers;
  }

  describe('create', () => {
    it('posts every v2 field with the secret key and returns the checkout URL', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(201, createdIntent));

      const intent = await lyel.paymentIntents.create({
        amount: '15000',
        currency: 'XAF',
        description: 'Commande #1042',
        metadata: { orderId: '1042' },
        successUrl: 'https://shop.cg/merci',
        cancelUrl: 'https://shop.cg/panier',
        customer: { phone: '+242061234567' },
        locale: 'fr',
      });

      expect(lastCall().url).toBe(`${BASE_URL}/gateway/v1/payment-intents`);
      expect(lastCall().init.method).toBe('POST');
      expect(lastHeaders().Authorization).toBe(`Bearer ${SECRET}`);
      expect(lastJsonBody()).toEqual({
        amount: '15000',
        currency: 'XAF',
        description: 'Commande #1042',
        metadata: { orderId: '1042' },
        successUrl: 'https://shop.cg/merci',
        cancelUrl: 'https://shop.cg/panier',
        customer: { phone: '+242061234567' },
        locale: 'fr',
      });
      expect(intent.checkoutUrl).toBe(createdIntent.checkoutUrl);
      expect(intent.sessionToken).toBe('st_123');
    });

    it('returns a null checkout URL when no return URLs are given', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(201, { ...createdIntent, successUrl: null, cancelUrl: null, checkoutUrl: null }),
      );

      const intent = await lyel.paymentIntents.create({ amount: '500', currency: 'XAF' });

      expect(intent.checkoutUrl).toBeNull();
    });

    it('defaults to the production API URL', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(201, createdIntent));

      await new LyelPay(SECRET).paymentIntents.create({ amount: '500', currency: 'XAF' });

      expect(lastCall().url).toBe('https://api.lyelpay.com/gateway/v1/payment-intents');
    });
  });

  describe('retrieve', () => {
    it('reads the intent by id with the secret key and no body', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...readIntent, status: 'COMPLETED' }));

      const intent = await lyel.paymentIntents.retrieve(INTENT_ID);

      expect(lastCall().url).toBe(`${BASE_URL}/gateway/v1/payment-intents/${INTENT_ID}`);
      expect(lastCall().init.method).toBe('GET');
      expect(lastCall().init.body).toBeUndefined();
      expect(lastHeaders().Authorization).toBe(`Bearer ${SECRET}`);
      expect(intent.status).toBe('COMPLETED');
      expect(intent.webhook.attempts).toBe(0);
    });

    it('encodes the id so it cannot change the path', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, readIntent));

      await lyel.paymentIntents.retrieve('../keys');

      expect(lastCall().url).toBe(`${BASE_URL}/gateway/v1/payment-intents/..%2Fkeys`);
    });

    it('rejects an empty id without calling the API', async () => {
      await expect(lyel.paymentIntents.retrieve('')).rejects.toThrow(TypeError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('posts to the cancel route and returns the CANCELED intent', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, readIntent));

      const intent = await lyel.paymentIntents.cancel(INTENT_ID);

      expect(lastCall().url).toBe(`${BASE_URL}/gateway/v1/payment-intents/${INTENT_ID}/cancel`);
      expect(lastCall().init.method).toBe('POST');
      expect(intent.status).toBe('CANCELED');
      expect(intent.canceledAt).toBe('2026-10-06T10:02:00.000Z');
    });

    it('answers the same CANCELED intent when replayed', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, readIntent))
        .mockResolvedValueOnce(jsonResponse(200, readIntent));

      const first = await lyel.paymentIntents.cancel(INTENT_ID);
      const second = await lyel.paymentIntents.cancel(INTENT_ID);

      expect(second).toEqual(first);
    });

    it('surfaces E_GATEWAY_INTENT_NOT_CANCELABLE once the intent is final', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(409, { message: 'Payment intent can no longer be canceled', code: 'E_GATEWAY_INTENT_NOT_CANCELABLE' }),
      );

      await expect(lyel.paymentIntents.cancel(INTENT_ID)).rejects.toMatchObject({
        statusCode: 409,
        code: GatewayErrorCodes.E_GATEWAY_INTENT_NOT_CANCELABLE,
      });
    });
  });

  describe('errors', () => {
    it('throws a typed error carrying the API code and message', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(409, { message: 'The payment is being processed: read the status', code: 'E_GATEWAY_PAYMENT_IN_PROGRESS' }),
      );

      const error = await lyel.paymentIntents.retrieve(INTENT_ID).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(LyelPayApiError);
      expect(error).toMatchObject({
        statusCode: 409,
        code: GatewayErrorCodes.E_GATEWAY_PAYMENT_IN_PROGRESS,
        message: 'The payment is being processed: read the status',
        retryAfterSeconds: null,
      });
    });

    it('reads Retry-After on rate-limited answers', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(429, { message: 'Wait', code: 'E_GATEWAY_OTP_RESEND_TOO_SOON' }, { 'Retry-After': '30' }),
      );

      await expect(lyel.paymentIntents.retrieve(INTENT_ID)).rejects.toMatchObject({ retryAfterSeconds: 30 });
    });

    it('joins validation messages and leaves the code null', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(400, {
          statusCode: 400,
          message: ['amount must be a positive whole number of CFA francs', 'currency must be one of XAF, XOF'],
          error: 'Bad Request',
        }),
      );

      await expect(lyel.paymentIntents.create({ amount: '0', currency: 'XAF' })).rejects.toMatchObject({
        statusCode: 400,
        code: null,
        message: 'amount must be a positive whole number of CFA francs; currency must be one of XAF, XOF',
      });
    });

    it('falls back to the HTTP status when the body is not JSON', async () => {
      fetchMock.mockResolvedValueOnce(new Response('<html>Bad gateway</html>', { status: 502 }));

      await expect(lyel.paymentIntents.retrieve(INTENT_ID)).rejects.toMatchObject({
        statusCode: 502,
        code: null,
        message: 'HTTP 502',
      });
    });
  });
});
