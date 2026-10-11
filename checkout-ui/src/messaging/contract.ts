import { widgetEnvelope, type WidgetEnvelope, type WidgetMessage } from '@lyel/checkout-protocol';
import type { CheckoutState } from '../app/checkout-machine';

/**
 * Widget → SDK messages (modes A and B), in the shared `@lyel/checkout-protocol`. They are posted only to the
 * parent origin that passed the allowed-domains check (S2), never to '*'; every message but `challenge` waits for
 * the parent to answer it (see handshake.ts).
 */

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
      target.postMessage(widgetEnvelope(message), verifiedOrigin);
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
