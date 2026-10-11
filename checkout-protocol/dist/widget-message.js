import { isFields, PROTOCOL_VERSION, WIDGET_MESSAGE_SOURCE } from './envelope.js';
export function widgetEnvelope(message) {
    return Object.assign({ source: WIDGET_MESSAGE_SOURCE, version: PROTOCOL_VERSION }, message);
}
function text(fields, key) {
    const value = fields[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
}
function readMessage(fields) {
    const paymentIntentId = text(fields, 'paymentIntentId');
    switch (fields['type']) {
        case 'challenge': {
            const nonce = text(fields, 'nonce');
            return nonce ? { type: 'challenge', nonce } : null;
        }
        case 'ready':
            return { type: 'ready' };
        case 'close':
            return { type: 'close' };
        case 'resize': {
            const height = fields['height'];
            return typeof height === 'number' && Number.isFinite(height) && height >= 0 ? { type: 'resize', height } : null;
        }
        case 'success': {
            const reference = text(fields, 'reference');
            return paymentIntentId && reference ? { type: 'success', paymentIntentId, reference } : null;
        }
        case 'failed':
        case 'expired':
        case 'canceled':
            return paymentIntentId ? { type: fields['type'], paymentIntentId } : null;
        default:
            return null;
    }
}
/** A widget message, or null for anything else (other senders, the v0 protocol, malformed payloads). */
export function parseWidgetMessage(data) {
    if (!isFields(data) || data['source'] !== WIDGET_MESSAGE_SOURCE || data['version'] !== PROTOCOL_VERSION)
        return null;
    return readMessage(data);
}
