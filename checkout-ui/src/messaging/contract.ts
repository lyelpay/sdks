import type { CheckoutState } from '../app/checkout-machine';

/**
 * Widget → SDK messages (modes A and B), protocol v1.
 * Every message is `{ source: 'lyel-pay-checkout', version: 1, type, ...payload }`, posted only to the
 * parent origin that passed the allowed-domains check (S2), never to '*'.
 * `challenge` is the only message posted before the parent is confirmed: it carries a nonce the SDK must echo
 * back from the parent window (see handshake.ts). Every other message waits for that answer.
 * None of them proves a payment: the merchant confirms with the webhook or a server-side read.
 */
export const MESSAGE_SOURCE = 'lyel-pay-checkout';
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

export type WidgetEnvelope = WidgetMessage & { source: typeof MESSAGE_SOURCE; version: typeof PROTOCOL_VERSION };

export interface MessageTarget {
  postMessage(message: WidgetEnvelope, targetOrigin: string): void;
}

export interface ParentChannel {
  send(message: WidgetMessage): void;
}

export function createParentChannel(target: MessageTarget, verifiedOrigin: string): ParentChannel {
  if (verifiedOrigin === '*') throw new Error('The parent origin must be verified, never a wildcard');
  return {
    send(message: WidgetMessage): void {
      target.postMessage({ source: MESSAGE_SOURCE, version: PROTOCOL_VERSION, ...message }, verifiedOrigin);
    },
  };
}

/** The outcome to announce when the checkout enters a final state; null otherwise. */
export function outcomeMessageFor(
  previous: CheckoutState,
  next: CheckoutState,
  session: { id: string; reference: string },
): WidgetMessage | null {
  if (previous.step === next.step) return null;
  const paymentIntentId = session.id;
  switch (next.step) {
    case 'success':
      return { type: 'success', paymentIntentId, reference: session.reference };
    case 'failed':
      return { type: 'failed', paymentIntentId };
    case 'expired':
      return { type: 'expired', paymentIntentId };
    case 'canceled':
      return { type: 'canceled', paymentIntentId };
    default:
      return null;
  }
}
