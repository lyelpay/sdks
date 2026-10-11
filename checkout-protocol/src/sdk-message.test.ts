import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION, SDK_MESSAGE_SOURCE } from './envelope.js';
import { answersChallenge, challengeResponse } from './sdk-message.js';

describe('challengeResponse', () => {
  it('echoes the nonce under the SDK envelope', () => {
    expect(challengeResponse('n-1')).toEqual({
      source: SDK_MESSAGE_SOURCE,
      version: PROTOCOL_VERSION,
      type: 'challenge-response',
      nonce: 'n-1',
    });
  });
});

describe('answersChallenge', () => {
  it('accepts the answer that echoes the nonce', () => {
    expect(answersChallenge(challengeResponse('n-1'), 'n-1')).toBe(true);
  });

  it.each([
    ['a wrong nonce', { ...challengeResponse('n-1'), nonce: 'guess' }],
    ['another sender', { ...challengeResponse('n-1'), source: 'lyel-pay-checkout' }],
    ['another version', { ...challengeResponse('n-1'), version: 2 }],
    ['another type', { ...challengeResponse('n-1'), type: 'ready' }],
    ['a string', 'challenge-response'],
    ['null', null],
  ])('refuses %s', (_label, data) => {
    expect(answersChallenge(data, 'n-1')).toBe(false);
  });
});
