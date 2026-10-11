import { isFields, PROTOCOL_VERSION, SDK_MESSAGE_SOURCE } from './envelope.js';

/** SDK → widget: only the answer to the challenge exists in protocol v1. */
export interface ChallengeResponse {
  source: typeof SDK_MESSAGE_SOURCE;
  version: typeof PROTOCOL_VERSION;
  type: 'challenge-response';
  nonce: string;
}

export function challengeResponse(nonce: string): ChallengeResponse {
  return { source: SDK_MESSAGE_SOURCE, version: PROTOCOL_VERSION, type: 'challenge-response', nonce };
}

/** True when `data` is the SDK answer that echoes `nonce`. */
export function answersChallenge(data: unknown, nonce: string): boolean {
  return (
    isFields(data) &&
    data['source'] === SDK_MESSAGE_SOURCE &&
    data['version'] === PROTOCOL_VERSION &&
    data['type'] === 'challenge-response' &&
    data['nonce'] === nonce
  );
}
