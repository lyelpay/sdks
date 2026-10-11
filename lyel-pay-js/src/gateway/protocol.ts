/**
 * The `lyel-pay-checkout` postMessage protocol, v1. The widget (checkout-ui, `src/messaging/contract.ts`) is the
 * source of truth: widget messages are `{ source: 'lyel-pay-checkout', version: 1, type, ...payload }`.
 * None of them proves a payment: confirm it with the `payment.completed` webhook or a server-side read.
 */
export const WIDGET_MESSAGE_SOURCE = 'lyel-pay-checkout';
export const SDK_MESSAGE_SOURCE = 'lyel-pay-js';
export const PROTOCOL_VERSION = 1;

export type WidgetMessage =
  | { type: 'challenge'; nonce: string }
  | { type: 'ready' }
  | { type: 'resize'; height: number }
  | { type: 'success'; paymentIntentId: string; reference: string }
  | { type: 'failed'; paymentIntentId: string }
  | { type: 'expired'; paymentIntentId: string }
  | { type: 'canceled'; paymentIntentId: string }
  | { type: 'close' };

export interface ChallengeResponse {
  source: typeof SDK_MESSAGE_SOURCE;
  version: typeof PROTOCOL_VERSION;
  type: 'challenge-response';
  nonce: string;
}

type Fields = Record<string, unknown>;

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null;
}

function text(fields: Fields, key: string): string | null {
  const value = fields[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readMessage(fields: Fields): WidgetMessage | null {
  const paymentIntentId = text(fields, 'paymentIntentId');
  switch (fields['type']) {
    case 'challenge': {
      const nonce = text(fields, 'nonce');
      return nonce ? { type: 'challenge', nonce } : null;
    }
    case 'ready':
      return { type: 'ready' };
    case 'close':
      return { type: 'close' };
    case 'resize': {
      const height = fields['height'];
      return typeof height === 'number' && Number.isFinite(height) && height >= 0 ? { type: 'resize', height } : null;
    }
    case 'success': {
      const reference = text(fields, 'reference');
      return paymentIntentId && reference ? { type: 'success', paymentIntentId, reference } : null;
    }
    case 'failed':
    case 'expired':
    case 'canceled':
      return paymentIntentId ? { type: fields['type'], paymentIntentId } : null;
    default:
      return null;
  }
}

/** A widget message, or null for anything else (other senders, v0 protocol, malformed payloads). */
export function parseWidgetMessage(data: unknown): WidgetMessage | null {
  if (!isFields(data) || data['source'] !== WIDGET_MESSAGE_SOURCE || data['version'] !== PROTOCOL_VERSION) return null;
  return readMessage(data);
}

export function challengeResponse(nonce: string): ChallengeResponse {
  return { source: SDK_MESSAGE_SOURCE, version: PROTOCOL_VERSION, type: 'challenge-response', nonce };
}
