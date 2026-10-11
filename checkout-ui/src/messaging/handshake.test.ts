import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetMessage } from './contract';
import { awaitParentConfirmation, PARENT_CONFIRMATION_TIMEOUT_MS, SDK_MESSAGE_SOURCE, type ParentListener } from './handshake';

const PARENT = { name: 'parent window' };
const ORIGIN = 'https://shop.cg';
const NONCE = 'n-123';

function response(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { source: SDK_MESSAGE_SOURCE, version: 1, type: 'challenge-response', nonce: NONCE, ...overrides };
}

function harness(): {
  sent: WidgetMessage[];
  deliver: (event: { origin: string; source: unknown; data: unknown }) => void;
  unsubscribed: () => boolean;
  confirmation: Promise<boolean>;
} {
  const sent: WidgetMessage[] = [];
  let listener: ParentListener | null = null;
  let unsubscribed = false;
  const confirmation = awaitParentConfirmation({
    send: (message) => {
      sent.push(message);
    },
    subscribe: (next) => {
      listener = next;
      return (): void => {
        unsubscribed = true;
      };
    },
    parent: PARENT,
    parentOrigin: ORIGIN,
    nonce: NONCE,
  });
  return {
    sent,
    deliver: (event) => listener?.(event),
    unsubscribed: () => unsubscribed,
    confirmation,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('awaitParentConfirmation', () => {
  it('sends the challenge to the announced parent', () => {
    const { sent } = harness();
    expect(sent).toEqual([{ type: 'challenge', nonce: NONCE }]);
  });

  it('confirms the parent that answers the nonce from the announced origin', async () => {
    const { deliver, confirmation, unsubscribed } = harness();
    deliver({ origin: ORIGIN, source: PARENT, data: response() });
    await expect(confirmation).resolves.toBe(true);
    expect(unsubscribed()).toBe(true);
  });

  it.each([
    ['another origin', { origin: 'https://evil.example', source: PARENT, data: response() }],
    ['another window', { origin: ORIGIN, source: { name: 'sibling' }, data: response() }],
    ['a wrong nonce', { origin: ORIGIN, source: PARENT, data: response({ nonce: 'guess' }) }],
    ['another sender', { origin: ORIGIN, source: PARENT, data: response({ source: 'lyel-pay-checkout' }) }],
    ['another version', { origin: ORIGIN, source: PARENT, data: response({ version: 2 }) }],
    ['another type', { origin: ORIGIN, source: PARENT, data: response({ type: 'ready' }) }],
    ['a string', { origin: ORIGIN, source: PARENT, data: 'challenge-response' }],
    ['null', { origin: ORIGIN, source: PARENT, data: null }],
  ])('ignores an answer from %s, then refuses the parent at the deadline', async (_label, event) => {
    const { deliver, confirmation, unsubscribed } = harness();
    deliver(event);
    await vi.advanceTimersByTimeAsync(PARENT_CONFIRMATION_TIMEOUT_MS);
    await expect(confirmation).resolves.toBe(false);
    expect(unsubscribed()).toBe(true);
  });

  it('still accepts the right answer after ignoring a wrong one', async () => {
    const { deliver, confirmation } = harness();
    deliver({ origin: 'https://evil.example', source: PARENT, data: response() });
    deliver({ origin: ORIGIN, source: PARENT, data: response() });
    await expect(confirmation).resolves.toBe(true);
  });
});
