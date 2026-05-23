import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookEvent } from './types';

const TOLERANCE_SECONDS = 300;

export class Webhooks {
  constructEvent(payload: string, header: string, secret: string): WebhookEvent {
    const parts: Record<string, string> = {};
    for (const part of header.split(',')) {
      const [k, v] = part.split('=');
      if (k && v) parts[k] = v;
    }

    const timestamp = parts['t'];
    const signature = parts['v1'];

    if (!timestamp || !signature) {
      throw new Error('Invalid webhook signature header');
    }

    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > TOLERANCE_SECONDS) {
      throw new Error('Webhook timestamp too old');
    }

    const signed = `${timestamp}.${payload}`;
    const expected = createHmac('sha256', secret).update(signed).digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      throw new Error('Webhook signature mismatch');
    }

    return JSON.parse(payload) as WebhookEvent;
  }
}
