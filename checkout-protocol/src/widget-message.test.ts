import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION, WIDGET_MESSAGE_SOURCE } from './envelope.js';
import { parseWidgetMessage, widgetEnvelope } from './widget-message.js';

const envelope = { source: WIDGET_MESSAGE_SOURCE, version: PROTOCOL_VERSION };

describe('parseWidgetMessage', () => {
  it.each([
    [{ type: 'challenge', nonce: 'n-1' }],
    [{ type: 'ready' }],
    [{ type: 'resize', height: 512 }],
    [{ type: 'success', paymentIntentId: 'pi_1', reference: 'GWP-7K2Q9M' }],
    [{ type: 'failed', paymentIntentId: 'pi_1' }],
    [{ type: 'expired', paymentIntentId: 'pi_1' }],
    [{ type: 'canceled', paymentIntentId: 'pi_1' }],
    [{ type: 'close' }],
  ])('reads %j', (message) => {
    expect(parseWidgetMessage({ ...envelope, ...message })).toEqual(message);
  });

  it.each([
    ['null', null],
    ['a string', 'ready'],
    ['the v0 protocol', { type: 'LYEL_PAY_SUCCESS', reference: 'GWP-1' }],
    ['another sender', { source: 'other', version: 1, type: 'ready' }],
    ['another version', { ...envelope, version: 2, type: 'ready' }],
    ['an unknown type', { ...envelope, type: 'paid' }],
    ['a challenge without nonce', { ...envelope, type: 'challenge' }],
    ['an empty nonce', { ...envelope, type: 'challenge', nonce: '' }],
    ['a resize without height', { ...envelope, type: 'resize' }],
    ['a negative height', { ...envelope, type: 'resize', height: -1 }],
    ['an infinite height', { ...envelope, type: 'resize', height: Number.POSITIVE_INFINITY }],
    ['a success without reference', { ...envelope, type: 'success', paymentIntentId: 'pi_1' }],
    ['a failure without intent id', { ...envelope, type: 'failed' }],
  ])('ignores %s', (_label, data) => {
    expect(parseWidgetMessage(data)).toBeNull();
  });
});

describe('widgetEnvelope', () => {
  it('wraps a message so that parseWidgetMessage reads it back', () => {
    const message = { type: 'resize', height: 512 } as const;
    expect(widgetEnvelope(message)).toEqual({ ...envelope, ...message });
    expect(parseWidgetMessage(widgetEnvelope(message))).toEqual(message);
  });
});
