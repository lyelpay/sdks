import { PROTOCOL_VERSION, type WidgetMessage } from './contract';

/** Sender of the SDK → widget messages; only the handshake answer exists in protocol v1. */
export const SDK_MESSAGE_SOURCE = 'lyel-pay-js';
export const PARENT_CONFIRMATION_TIMEOUT_MS = 5000;

export interface ParentEvent {
  origin: string;
  source: unknown;
  data: unknown;
}

export type ParentListener = (event: ParentEvent) => void;

export interface ParentConfirmationOptions {
  /** Posts to the announced origin only: a page of another origin never receives the challenge. */
  send: (message: WidgetMessage) => void;
  /** Starts listening to the messages the widget receives; returns the unsubscribe function. */
  subscribe: (listener: ParentListener) => () => void;
  /** The window expected to answer, `window.parent`. */
  parent: unknown;
  parentOrigin: string;
  nonce: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function answersNonce(data: unknown, nonce: string): boolean {
  return (
    isRecord(data) &&
    data['source'] === SDK_MESSAGE_SOURCE &&
    data['version'] === PROTOCOL_VERSION &&
    data['type'] === 'challenge-response' &&
    data['nonce'] === nonce
  );
}

/**
 * S2 handshake: the browser delivers the challenge only if the parent really is on the announced origin, and
 * only that parent can echo the nonce back. Resolves false when no valid answer arrives in time.
 */
export function awaitParentConfirmation(options: ParentConfirmationOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let unsubscribe: () => void = () => undefined;
    const settle = (confirmed: boolean): void => {
      clearTimeout(timer);
      unsubscribe();
      resolve(confirmed);
    };
    const timer = setTimeout(() => {
      settle(false);
    }, PARENT_CONFIRMATION_TIMEOUT_MS);
    unsubscribe = options.subscribe((event) => {
      const fromParent = event.source === options.parent && event.origin === options.parentOrigin;
      if (fromParent && answersNonce(event.data, options.nonce)) settle(true);
    });
    options.send({ type: 'challenge', nonce: options.nonce });
  });
}
