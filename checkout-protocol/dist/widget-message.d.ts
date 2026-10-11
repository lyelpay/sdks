import { PROTOCOL_VERSION, WIDGET_MESSAGE_SOURCE } from './envelope.js';
/**
 * Widget → SDK. `challenge` is the only message posted before the parent page is confirmed: it carries a nonce the
 * SDK echoes back from the parent window. Every other message waits for that answer.
 */
export type WidgetMessage = {
    type: 'challenge';
    nonce: string;
} | {
    type: 'ready';
} | {
    type: 'resize';
    height: number;
} | {
    type: 'success';
    paymentIntentId: string;
    reference: string;
} | {
    type: 'failed';
    paymentIntentId: string;
} | {
    type: 'expired';
    paymentIntentId: string;
} | {
    type: 'canceled';
    paymentIntentId: string;
} | {
    type: 'close';
};
export type WidgetEnvelope = WidgetMessage & {
    source: typeof WIDGET_MESSAGE_SOURCE;
    version: typeof PROTOCOL_VERSION;
};
export declare function widgetEnvelope(message: WidgetMessage): WidgetEnvelope;
/** A widget message, or null for anything else (other senders, the v0 protocol, malformed payloads). */
export declare function parseWidgetMessage(data: unknown): WidgetMessage | null;
