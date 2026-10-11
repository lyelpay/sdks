/**
 * The `lyel-pay-checkout` postMessage protocol, v1, between the checkout widget (in its iframe) and the browser SDK
 * (in the merchant page). Every message carries `{ source, version }`; anything else is ignored.
 * None of the messages proves a payment: the merchant confirms with the webhook or a server-side read.
 */
export declare const WIDGET_MESSAGE_SOURCE = "lyel-pay-checkout";
export declare const SDK_MESSAGE_SOURCE = "lyel-pay-js";
export declare const PROTOCOL_VERSION = 1;
export type Fields = Record<string, unknown>;
export declare function isFields(value: unknown): value is Fields;
