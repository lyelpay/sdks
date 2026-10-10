import { isCreatedPaymentIntent, isPaymentIntent } from './guards';
import { HttpClient } from './http-client';
import { CreatedPaymentIntent, CreatePaymentIntentParams, PaymentIntent } from './types';

const BASE_PATH = '/gateway/v1/payment-intents';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server-side payment intent calls. Every method uses the secret key: never call them from a browser. */
export class PaymentIntents {
  constructor(private readonly http: HttpClient) {}

  async create(params: CreatePaymentIntentParams): Promise<CreatedPaymentIntent> {
    return this.http.request('POST', BASE_PATH, isCreatedPaymentIntent, params);
  }

  /** With the webhook, the only proof that a payment happened: trust `status === 'COMPLETED'` from here. */
  async retrieve(id: string): Promise<PaymentIntent> {
    return this.http.request('GET', intentPath(id), isPaymentIntent);
  }

  /** Cancels a pending intent. Replaying it on a CANCELED intent answers the same intent. */
  async cancel(id: string): Promise<PaymentIntent> {
    return this.http.request('POST', `${intentPath(id)}/cancel`, isPaymentIntent);
  }
}

/** The API only takes UUIDs; checking here stops ids like `..` from rewriting the path the secret key is sent to. */
function intentPath(id: string): string {
  if (!UUID.test(id)) throw new TypeError('A payment intent id must be a UUID');
  return `${BASE_PATH}/${id}`;
}
