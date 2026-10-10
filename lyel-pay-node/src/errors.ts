/** Stable `code` values the gateway API answers with. Compare `LyelPayApiError.code` against them. */
export const GatewayErrorCodes = {
  E_CANNOT_AUTHENTICATE: 'E_CANNOT_AUTHENTICATE',
  E_INVALID_API_KEY: 'E_INVALID_API_KEY',
  E_GATEWAY_NOT_ACTIVATED: 'E_GATEWAY_NOT_ACTIVATED',
  E_GATEWAY_SUSPENDED: 'E_GATEWAY_SUSPENDED',
  E_GATEWAY_INTENT_NOT_FOUND: 'E_GATEWAY_INTENT_NOT_FOUND',
  E_GATEWAY_INTENT_INACTIVE: 'E_GATEWAY_INTENT_INACTIVE',
  E_GATEWAY_INTENT_NOT_CANCELABLE: 'E_GATEWAY_INTENT_NOT_CANCELABLE',
  E_GATEWAY_RETURN_URL_FORBIDDEN: 'E_GATEWAY_RETURN_URL_FORBIDDEN',
  E_GATEWAY_RETURN_URLS_INCOMPLETE: 'E_GATEWAY_RETURN_URLS_INCOMPLETE',
  E_GATEWAY_INVALID_PHONE: 'E_GATEWAY_INVALID_PHONE',
  E_GATEWAY_PAYMENT_IN_PROGRESS: 'E_GATEWAY_PAYMENT_IN_PROGRESS',
  E_GATEWAY_PAYMENT_DECLINED: 'E_GATEWAY_PAYMENT_DECLINED',
  E_GATEWAY_INSUFFICIENT_FUNDS: 'E_GATEWAY_INSUFFICIENT_FUNDS',
} as const;

export type GatewayErrorCode = (typeof GatewayErrorCodes)[keyof typeof GatewayErrorCodes];

export interface LyelPayApiErrorDetails {
  statusCode: number;
  message: string;
  code: string | null;
  retryAfterSeconds: number | null;
}

/** A non-2xx answer from the API. `code` is null for request validation errors (400 without a code). */
export class LyelPayApiError extends Error {
  readonly statusCode: number;
  readonly code: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(details: LyelPayApiErrorDetails) {
    super(details.message);
    this.name = 'LyelPayApiError';
    this.statusCode = details.statusCode;
    this.code = details.code;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }
}

/** The webhook could not be authenticated: answer 400 and do not act on it. */
export class LyelPayWebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LyelPayWebhookSignatureError';
  }
}

/** The webhook is authentic but its body is not an event this SDK version knows. */
export class LyelPayWebhookPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LyelPayWebhookPayloadError';
  }
}
