import {
  CreatedPaymentIntent,
  PAYMENT_INTENT_MODES,
  PAYMENT_INTENT_STATUSES,
  PaymentIntent,
  PaymentIntentMode,
  PaymentIntentStatus,
  WEBHOOK_EVENT_TYPES,
  WebhookEvent,
  WebhookEventType,
} from './types';

/** Runtime checks for what crosses the wire: API answers and webhook bodies are narrowed here, never cast. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

export function isPaymentIntentStatus(value: unknown): value is PaymentIntentStatus {
  return isOneOf(PAYMENT_INTENT_STATUSES, value);
}

export function isPaymentIntentMode(value: unknown): value is PaymentIntentMode {
  return isOneOf(PAYMENT_INTENT_MODES, value);
}

export function isWebhookEventType(value: unknown): value is WebhookEventType {
  return isOneOf(WEBHOOK_EVENT_TYPES, value);
}

function hasIntentCore(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isPaymentIntentStatus(value.status) &&
    isPaymentIntentMode(value.mode)
  );
}

export function isCreatedPaymentIntent(value: unknown): value is CreatedPaymentIntent {
  return hasIntentCore(value) && typeof value.sessionToken === 'string' && value.sessionToken.length > 0;
}

export function isPaymentIntent(value: unknown): value is PaymentIntent {
  return hasIntentCore(value) && isRecord(value.webhook);
}

export function isWebhookEvent(value: unknown): value is WebhookEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isWebhookEventType(value.event) &&
    typeof value.timestamp === 'number' &&
    isRecord(value.data) &&
    typeof value.data.id === 'string' &&
    isPaymentIntentStatus(value.data.status)
  );
}
