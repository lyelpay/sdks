import { describe, expect, it, vi } from 'vitest';
import { createParentChannel, MESSAGE_SOURCE, outcomeMessageFor, PROTOCOL_VERSION } from './contract';

describe('createParentChannel', () => {
  it('posts an enveloped message to the verified origin only', () => {
    const postMessage = vi.fn();
    const channel = createParentChannel({ postMessage }, 'https://shop.cg');
    channel.send({ type: 'resize', height: 512 });
    expect(postMessage).toHaveBeenCalledWith(
      { source: MESSAGE_SOURCE, version: PROTOCOL_VERSION, type: 'resize', height: 512 },
      'https://shop.cg',
    );
  });

  it('never posts to the wildcard origin', () => {
    expect(() => createParentChannel({ postMessage: vi.fn() }, '*')).toThrow();
  });
});

describe('outcomeMessageFor', () => {
  it.each([
    [{ step: 'success', alreadyPaid: false }, { type: 'success', paymentIntentId: 'pi_1', reference: 'GWP-1' }],
    [{ step: 'success', alreadyPaid: true }, { type: 'success', paymentIntentId: 'pi_1', reference: 'GWP-1' }],
    [{ step: 'failed' }, { type: 'failed', paymentIntentId: 'pi_1' }],
    [{ step: 'expired' }, { type: 'expired', paymentIntentId: 'pi_1' }],
    [{ step: 'canceled' }, { type: 'canceled', paymentIntentId: 'pi_1' }],
  ] as const)('announces %j', (state, message) => {
    expect(outcomeMessageFor({ step: 'processing', otp: null }, state, { id: 'pi_1', reference: 'GWP-1' })).toEqual(message);
  });

  it('stays quiet when the step does not change or is not an outcome', () => {
    const session = { id: 'pi_1', reference: 'GWP-1' };
    expect(outcomeMessageFor({ step: 'failed' }, { step: 'failed' }, session)).toBeNull();
    expect(outcomeMessageFor({ step: 'phone', error: null }, { step: 'sendingCode' }, session)).toBeNull();
    expect(outcomeMessageFor({ step: 'processing', otp: null }, { step: 'insufficientFunds' }, session)).toBeNull();
  });
});
