export interface LyelPayConfig {
  secretKey: string;
  baseUrl?: string;
}

export type PaymentIntentMode = 'LIVE' | 'TEST';

export type GatewayCurrency = 'XAF' | 'XOF';

export type CheckoutLocale = 'fr' | 'en';

/** Only `COMPLETED` proves a payment. A pending intent past its deadline reads `EXPIRED`. */
export type PaymentIntentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELED';

export type PaymentFailureReason = 'OTP_ATTEMPTS_EXHAUSTED' | 'TOO_MANY_UNKNOWN_PAYERS' | 'DECLINED';

export type WebhookDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED';

export interface PaymentIntentCustomer {
  /** Pre-fills the checkout phone field; the customer can still change it. */
  phone?: string;
}

export interface CreatePaymentIntentParams {
  /** Whole CFA francs, as a string (e.g. `'15000'`). */
  amount: string;
  currency: GatewayCurrency;
  description?: string;
  metadata?: Record<string, unknown>;
  /** Hosted page: give it together with `cancelUrl`. Must belong to your allowed domains (https in LIVE). */
  successUrl?: string;
  /** Hosted page: give it together with `successUrl`. Must belong to your allowed domains (https in LIVE). */
  cancelUrl?: string;
  customer?: PaymentIntentCustomer;
  /** Defaults to the merchant setting. */
  locale?: CheckoutLocale;
}

/** Returned once, to your server, at creation. Hand `sessionToken` to the browser, never your secret key. */
export interface CreatedPaymentIntent {
  id: string;
  sessionToken: string;
  reference: string;
  status: PaymentIntentStatus;
  /** Stored decimal form, e.g. `'15000.0000'`. */
  amount: string;
  currency: GatewayCurrency;
  mode: PaymentIntentMode;
  expiresAt: string;
  successUrl: string | null;
  cancelUrl: string | null;
  /** Hosted payment page to redirect the customer to; `null` without return URLs. */
  checkoutUrl: string | null;
}

export interface PaymentIntentWebhookDelivery {
  status: WebhookDeliveryStatus;
  attempts: number;
  deliveredAt: string | null;
}

/** A payment intent as your server reads it with the secret key. Never carries the session token. */
export interface PaymentIntent {
  id: string;
  reference: string;
  status: PaymentIntentStatus;
  amount: string;
  currency: GatewayCurrency;
  mode: PaymentIntentMode;
  description: string | null;
  metadata: Record<string, unknown> | null;
  payerPhoneNumber: string | null;
  failureReason: PaymentFailureReason | null;
  successUrl: string | null;
  cancelUrl: string | null;
  webhook: PaymentIntentWebhookDelivery;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
  canceledAt: string | null;
}

export const WEBHOOK_EVENT_TYPES = [
  'payment.completed',
  'payment.failed',
  'payment.expired',
  'payment.canceled',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface WebhookPaymentIntent {
  id: string;
  reference: string;
  amount: string;
  currency: GatewayCurrency;
  mode: PaymentIntentMode;
  status: PaymentIntentStatus;
  description: string | null;
  metadata: Record<string, unknown> | null;
  payerPhoneNumber: string | null;
  failureReason: PaymentFailureReason | null;
  createdAt: string;
  completedAt: string | null;
  canceledAt: string | null;
}

/** One final event per intent: `id` stays the same across delivery retries, so use it to deduplicate. */
export interface WebhookEvent {
  id: string;
  event: WebhookEventType;
  /** Unix seconds at which this delivery attempt was signed. */
  timestamp: number;
  data: WebhookPaymentIntent;
}
