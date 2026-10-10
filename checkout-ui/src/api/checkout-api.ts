import type { RequestFailure } from '../app/checkout-machine';
import type { CheckoutSession, OtpProgress } from '../domain/session';
import { InvalidResponseError, isRecord } from './json';
import { toCheckoutSession, toOtpProgress } from './session-mapper';

const BASE_PATH = '/gateway/v1/payment-intents';

export class CheckoutRequestError extends Error {
  constructor(readonly failure: RequestFailure) {
    super(failure.kind === 'api' ? `Checkout API refused: ${failure.code ?? failure.status}` : 'Network error');
  }
}

export interface CheckoutCredentials {
  publishableKey: string;
  sessionToken: string;
}

/** The port the controller uses; the HTTP adapter below is the only implementation. */
export interface CheckoutApi {
  readStatus(): Promise<CheckoutSession>;
  requestCode(phoneNumber: string): Promise<OtpProgress>;
  confirm(otp: string): Promise<void>;
  cancel(): void;
}

function errorCodeOf(body: unknown): string | null {
  return isRecord(body) && typeof body['code'] === 'string' ? body['code'] : null;
}

export function createCheckoutApi(baseUrl: string, credentials: CheckoutCredentials): CheckoutApi {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${credentials.publishableKey}`,
    'x-session-token': credentials.sessionToken,
  };

  async function call(path: string, init: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${BASE_PATH}${path}`, { ...init, headers, referrerPolicy: 'no-referrer' });
    } catch {
      throw new CheckoutRequestError({ kind: 'network' });
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new CheckoutRequestError({ kind: 'api', status: response.status, code: errorCodeOf(body) });
    }
    return body;
  }

  function parsed<T>(read: () => T): T {
    try {
      return read();
    } catch (error) {
      if (error instanceof InvalidResponseError) throw new CheckoutRequestError({ kind: 'network' });
      throw error;
    }
  }

  return {
    async readStatus(): Promise<CheckoutSession> {
      const body = await call('/status', { method: 'GET' });
      return parsed(() => toCheckoutSession(body));
    },
    async requestCode(phoneNumber: string): Promise<OtpProgress> {
      const body = await call('/request-otp', { method: 'POST', body: JSON.stringify({ phoneNumber }) });
      return parsed(() => toOtpProgress(body));
    },
    async confirm(otp: string): Promise<void> {
      await call('/confirm', { method: 'POST', body: JSON.stringify({ otp }) });
    },
    cancel(): void {
      void call('/cancel', { method: 'POST', keepalive: true }).catch(() => undefined);
    },
  };
}
