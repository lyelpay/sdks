import { isFields, PROTOCOL_VERSION, SDK_MESSAGE_SOURCE } from './envelope.js';
export function challengeResponse(nonce) {
    return { source: SDK_MESSAGE_SOURCE, version: PROTOCOL_VERSION, type: 'challenge-response', nonce };
}
/** True when `data` is the SDK answer that echoes `nonce`. */
export function answersChallenge(data, nonce) {
    return (isFields(data) &&
        data['source'] === SDK_MESSAGE_SOURCE &&
        data['version'] === PROTOCOL_VERSION &&
        data['type'] === 'challenge-response' &&
        data['nonce'] === nonce);
}
