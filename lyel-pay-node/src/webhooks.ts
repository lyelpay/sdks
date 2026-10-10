import { createHmac, timingSafeEqual } from 'crypto';
import { LyelPayWebhookPayloadError, LyelPayWebhookSignatureError } from './errors';
import { WEBHOOK_EVENT_TYPES, WebhookEvent, WebhookEventType } from './types';

/** Header carrying `t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">`. Node lowercases header names. */
export const WEBHOOK_SIGNATURE_HEADER = 'x-lyel-signature';

const DEFAULT_TOLERANCE_SECONDS = 300;
const UNIX_SECONDS = /^\d{1,12}$/;
const SHA256_HEX = /^[0-9a-f]{64}$/i;

export interface ConstructEventOptions {
  /** Maximum age (and clock skew) of the signed timestamp. Defaults to 300 seconds. */
  toleranceSeconds?: number;
}

interface SignatureHeader {
  timestamp: string;
  signature: string;
}

export class Webhooks {
  /**
   * Verifies a webhook and returns its event. Pass the raw request body, exactly as received:
   * a body re-serialized by a JSON parser will not match the signature.
   */
  constructEvent(
    payload: string | Buffer,
    header: string | string[] | undefined,
    secret: string,
    options: ConstructEventOptions = {},
  ): WebhookEvent {
    if (secret.length === 0) throw new TypeError('A webhook secret is required');

    const rawBody = typeof payload === 'string' ? payload : payload.toString('utf8');
    const { timestamp, signature } = parseHeader(Array.isArray(header) ? header[0] : header);

    assertFresh(Number(timestamp), options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS);
    assertSigned(`${timestamp}.${rawBody}`, signature, secret);

    return parseEvent(rawBody);
  }
}

function parseHeader(header: string | undefined): SignatureHeader {
  const fields = new Map<string, string>();
  for (const part of (header ?? '').split(',')) {
    const separator = part.indexOf('=');
    if (separator > 0) fields.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }

  const timestamp = fields.get('t');
  const signature = fields.get('v1');
  if (timestamp === undefined || !UNIX_SECONDS.test(timestamp) || signature === undefined || !SHA256_HEX.test(signature)) {
    throw new LyelPayWebhookSignatureError('Invalid webhook signature header');
  }
  return { timestamp, signature };
}

function assertFresh(timestampSeconds: number, toleranceSeconds: number): void {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    throw new LyelPayWebhookSignatureError('Webhook timestamp is outside the tolerance');
  }
}

function assertSigned(signedContent: string, signature: string, secret: string): void {
  const expected = createHmac('sha256', secret).update(signedContent).digest();
  const received = Buffer.from(signature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(expected, received)) {
    throw new LyelPayWebhookSignatureError('Webhook signature mismatch');
  }
}

function parseEvent(rawBody: string): WebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new LyelPayWebhookPayloadError('Webhook body is not valid JSON');
  }
  if (!isWebhookEvent(parsed)) {
    throw new LyelPayWebhookPayloadError('Unknown webhook event: upgrade @lyel/lyel-pay-node');
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWebhookEventType(value: unknown): value is WebhookEventType {
  return WEBHOOK_EVENT_TYPES.some((type) => type === value);
}

function isWebhookEvent(value: unknown): value is WebhookEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isWebhookEventType(value.event) &&
    typeof value.timestamp === 'number' &&
    isRecord(value.data) &&
    typeof value.data.id === 'string' &&
    typeof value.data.status === 'string'
  );
}
