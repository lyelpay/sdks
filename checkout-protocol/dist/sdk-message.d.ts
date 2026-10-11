import { PROTOCOL_VERSION, SDK_MESSAGE_SOURCE } from './envelope.js';
/** SDK → widget: only the answer to the challenge exists in protocol v1. */
export interface ChallengeResponse {
    source: typeof SDK_MESSAGE_SOURCE;
    version: typeof PROTOCOL_VERSION;
    type: 'challenge-response';
    nonce: string;
}
export declare function challengeResponse(nonce: string): ChallengeResponse;
/** True when `data` is the SDK answer that echoes `nonce`. */
export declare function answersChallenge(data: unknown, nonce: string): boolean;
