/**
 * The `lyel-pay-checkout` postMessage protocol, v1, between the checkout widget (in its iframe) and the browser SDK
 * (in the merchant page). Every message carries `{ source, version }`; anything else is ignored.
 * None of the messages proves a payment: the merchant confirms with the webhook or a server-side read.
 */
export const WIDGET_MESSAGE_SOURCE = 'lyel-pay-checkout';
export const SDK_MESSAGE_SOURCE = 'lyel-pay-js';
export const PROTOCOL_VERSION = 1;

export type Fields = Record<string, unknown>;

export function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null;
}
