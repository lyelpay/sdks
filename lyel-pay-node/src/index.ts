import { HttpClient } from './http-client';
import { PaymentIntents } from './payment-intents';
import { LyelPayConfig } from './types';
import { Webhooks } from './webhooks';

export class LyelPay {
  readonly paymentIntents: PaymentIntents;
  readonly webhooks: Webhooks;

  constructor(secretKey: string, options: Omit<LyelPayConfig, 'secretKey'> = {}) {
    this.paymentIntents = new PaymentIntents(new HttpClient({ ...options, secretKey }));
    this.webhooks = new Webhooks();
  }
}

export { PaymentIntents } from './payment-intents';
export { Webhooks, WEBHOOK_SIGNATURE_HEADER } from './webhooks';
export type { ConstructEventOptions } from './webhooks';
export {
  GatewayErrorCodes,
  LyelPayApiError,
  LyelPayWebhookPayloadError,
  LyelPayWebhookSignatureError,
} from './errors';
export type { GatewayErrorCode, LyelPayApiErrorDetails } from './errors';
export * from './types';
