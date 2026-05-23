import { LyelPayConfig } from './types';
import { PaymentIntents } from './payment-intents';
import { Webhooks } from './webhooks';

export class LyelPay {
  readonly paymentIntents: PaymentIntents;
  readonly webhooks: Webhooks;

  constructor(secretKey: string, options: Partial<LyelPayConfig> = {}) {
    const config: LyelPayConfig = { secretKey, ...options };
    this.paymentIntents = new PaymentIntents(config);
    this.webhooks = new Webhooks();
  }
}

export { PaymentIntents } from './payment-intents';
export { Webhooks } from './webhooks';
export * from './types';
