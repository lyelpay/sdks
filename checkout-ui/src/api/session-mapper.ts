import {
  BUTTON_LABELS,
  INTENT_STATUSES,
  type CheckoutSession,
  type IntentMode,
  type OtpProgress,
} from '../domain/session';
import { bool, date, isRecord, nullableDate, nullableStr, num, oneOf, rec, str, InvalidResponseError, type JsonRecord } from './json';

export function toOtpProgress(raw: unknown): OtpProgress {
  if (!isRecord(raw)) throw new InvalidResponseError('otp must be an object');
  return {
    channel: oneOf(raw, 'channel', ['WHATSAPP', 'TEST']),
    maskedPhoneNumber: str(raw, 'maskedPhoneNumber'),
    expiresAt: nullableDate(raw, 'expiresAt'),
    remainingAttempts: num(raw, 'remainingAttempts'),
    remainingSends: num(raw, 'remainingSends'),
    resendAvailableAt: nullableDate(raw, 'resendAvailableAt'),
  };
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

/** Only https, or http on localhost in TEST: anything else (javascript:, data:, plain http) is dropped. */
function isSafeReturnUrl(value: string, mode: IntentMode): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === 'https:') return true;
  return mode === 'TEST' && url.protocol === 'http:' && LOCAL_HOSTS.includes(url.hostname);
}

function toReturnUrls(raw: unknown, mode: IntentMode): CheckoutSession['returnUrls'] {
  if (!isRecord(raw)) return null;
  const urls = { success: str(raw, 'success'), cancel: str(raw, 'cancel') };
  return isSafeReturnUrl(urls.success, mode) && isSafeReturnUrl(urls.cancel, mode) ? urls : null;
}

function toAllowedDomains(raw: JsonRecord): string[] {
  const value = raw['allowedDomains'];
  return Array.isArray(value) ? value.filter((domain): domain is string => typeof domain === 'string') : [];
}

/** `showSecuredBadge` is being added by the API (PR in progress): read it on the merchant or at the top level. */
function securedBadgeSetting(raw: JsonRecord, merchant: JsonRecord): boolean | undefined {
  return bool(merchant, 'showSecuredBadge') ?? bool(raw, 'showSecuredBadge');
}

export function toCheckoutSession(raw: unknown): CheckoutSession {
  if (!isRecord(raw)) throw new InvalidResponseError('status must be an object');
  const merchant = rec(raw, 'merchant');
  const embedding = rec(raw, 'embedding');
  const otp = raw['otp'];
  const mode = oneOf(raw, 'mode', ['TEST', 'LIVE']);
  return {
    id: str(raw, 'id'),
    status: oneOf(raw, 'status', INTENT_STATUSES),
    reference: str(raw, 'reference'),
    amount: str(raw, 'amount'),
    currency: str(raw, 'currency'),
    description: nullableStr(raw, 'description'),
    mode,
    locale: str(raw, 'locale'),
    expiresAt: date(raw, 'expiresAt'),
    merchant: {
      name: str(merchant, 'name'),
      logoPath: nullableStr(merchant, 'logoPath'),
      primaryColor: nullableStr(merchant, 'primaryColor'),
      buttonLabel: oneOf(merchant, 'buttonLabel', BUTTON_LABELS),
      showSecuredBadge: securedBadgeSetting(raw, merchant),
    },
    returnUrls: toReturnUrls(raw['returnUrls'], mode),
    customerPhoneNumber: nullableStr(raw, 'customerPhoneNumber'),
    otp: otp === null || otp === undefined ? null : toOtpProgress(otp),
    embedding: {
      allowedDomains: toAllowedDomains(embedding),
      allowLocalhost: bool(embedding, 'allowLocalhost') ?? false,
    },
  };
}
