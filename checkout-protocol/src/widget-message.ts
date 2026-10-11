import { isFields, PROTOCOL_VERSION, WIDGET_MESSAGE_SOURCE, type Fields } from './envelope.js';

/**
 * Widget → SDK. `challenge` is the only message posted before the parent page is confirmed: it carries a nonce the
 * SDK echoes back from the parent window. Every other message waits for that answer.
 */
export type WidgetMessage =
  | { type: 'challenge'; nonce: string }
  | { type: 'ready' }
  | { type: 'resize'; height: number }
  | { type: 'success'; paymentIntentId: string; reference: string }
  | { type: 'failed'; paymentIntentId: string }
  | { type: 'expired'; paymentIntentId: string }
  | { type: 'canceled'; paymentIntentId: string }
  | { type: 'close' };

export type WidgetEnvelope = WidgetMessage & { source: typeof WIDGET_MESSAGE_SOURCE; version: typeof PROTOCOL_VERSION };

export function widgetEnvelope(message: WidgetMessage): WidgetEnvelope {
  return { source: WIDGET_MESSAGE_SOURCE, version: PROTOCOL_VERSION, ...message };
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

/** A widget message, or null for anything else (other senders, the v0 protocol, malformed payloads). */
export function parseWidgetMessage(data: unknown): WidgetMessage | null {
  if (!isFields(data) || data['source'] !== WIDGET_MESSAGE_SOURCE || data['version'] !== PROTOCOL_VERSION) return null;
  return readMessage(data);
}
