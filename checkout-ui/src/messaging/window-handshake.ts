import type { ParentChannel } from './contract';
import { awaitParentConfirmation, type ParentListener } from './handshake';

function listenToWindowMessages(listener: ParentListener): () => void {
  const handler = (event: MessageEvent<unknown>): void => {
    listener({ origin: event.origin, source: event.source, data: event.data });
  };
  window.addEventListener('message', handler);
  return () => {
    window.removeEventListener('message', handler);
  };
}

/** The browser adapter of the S2 handshake: challenges `window.parent` on the announced origin. */
export function confirmWindowParent(channel: ParentChannel, parentOrigin: string): () => Promise<boolean> {
  return () =>
    awaitParentConfirmation({
      send: (message) => {
        channel.send(message);
      },
      subscribe: listenToWindowMessages,
      parent: window.parent,
      parentOrigin,
      nonce: crypto.randomUUID(),
    });
}
