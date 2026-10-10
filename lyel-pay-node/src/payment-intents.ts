import { HttpClient } from './http-client';
import { CreatedPaymentIntent, CreatePaymentIntentParams, PaymentIntent } from './types';

const BASE_PATH = '/gateway/v1/payment-intents';

/** Server-side payment intent calls. Every method uses the secret key: never call them from a browser. */
export class PaymentIntents {
  constructor(private readonly http: HttpClient) {}

  async create(params: CreatePaymentIntentParams): Promise<CreatedPaymentIntent> {
    return this.http.request<CreatedPaymentIntent>('POST', BASE_PATH, params);
  }

  /** With the webhook, the only proof that a payment happened: trust `status === 'COMPLETED'` from here. */
  async retrieve(id: string): Promise<PaymentIntent> {
    return this.http.request<PaymentIntent>('GET', intentPath(id));
  }

  /** Cancels a pending intent. Replaying it on a CANCELED intent answers the same intent. */
  async cancel(id: string): Promise<PaymentIntent> {
    return this.http.request<PaymentIntent>('POST', `${intentPath(id)}/cancel`);
  }
}

function intentPath(id: string): string {
  if (id.trim().length === 0) throw new TypeError('A payment intent id is required');
  return `${BASE_PATH}/${encodeURIComponent(id)}`;
}
