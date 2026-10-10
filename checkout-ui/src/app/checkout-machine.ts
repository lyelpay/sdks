import type { CheckoutSession, OtpProgress } from '../domain/session';

export type PhoneError = 'invalid' | 'notFound';
export type CodeError = { kind: 'wrong'; remainingAttempts: number } | { kind: 'expired' };

/** The 14 states of the brief, plus the screen shown when the link or the page is refused. */
export type CheckoutState =
  | { step: 'loading'; initial: boolean } // 1
  | { step: 'phone'; error: PhoneError | null } // 2, 4
  | { step: 'sendingCode' } // 3
  | { step: 'code'; otp: OtpProgress; error: CodeError | null; notice: 'resent' | null; resending: boolean } // 5, 6
  | { step: 'processing'; otp: OtpProgress | null } // 7
  | { step: 'insufficientFunds' } // 8
  | { step: 'success'; alreadyPaid: boolean } // 9, 12
  | { step: 'failed' } // 10
  | { step: 'expired' } // 11
  | { step: 'canceled' } // 13
  | { step: 'networkError' } // 14
  | { step: 'unavailable' };

export type RequestFailure = { kind: 'network' } | { kind: 'api'; status: number; code: string | null };

export type CheckoutEvent =
  | { type: 'sessionRead'; session: CheckoutSession; now: Date }
  | { type: 'wrongCodeRead'; session: CheckoutSession; now: Date }
  | { type: 'inProgressRead'; session: CheckoutSession; now: Date }
  | { type: 'phoneSubmitted'; phoneNumber: string | null }
  | { type: 'codeSent'; otp: OtpProgress }
  | { type: 'resendStarted' }
  | { type: 'noticeTimedOut' }
  | { type: 'confirmStarted' }
  | { type: 'confirmed' }
  | { type: 'changeNumber' }
  | { type: 'retryAfterNetworkError' }
  | { type: 'embeddingRefused' }
  | { type: 'requestFailed'; failure: RequestFailure };

/** What the controller must do after a transition; the machine itself never calls the API. */
export type Effect = 'none' | 'refreshStatus' | 'refreshAfterWrongCode' | 'pollStatus';

export interface Transition {
  state: CheckoutState;
  effect: Effect;
}

const UNAVAILABLE_CODES = new Set([
  'E_CANNOT_AUTHENTICATE',
  'E_INVALID_API_KEY',
  'E_UNAUTHORIZED',
  'E_GATEWAY_SUSPENDED',
  'E_GATEWAY_ORIGIN_FORBIDDEN',
  'E_GATEWAY_INTENT_NOT_FOUND',
]);
const REFRESH_CODES = new Set(['E_GATEWAY_INTENT_INACTIVE', 'E_GATEWAY_OTP_SEND_LIMIT', 'E_GATEWAY_OTP_RESEND_TOO_SOON']);
const FINAL_FAILURE_CODES = new Set([
  'E_GATEWAY_PAYER_LOOKUP_EXHAUSTED',
  'E_GATEWAY_OTP_ATTEMPTS_EXHAUSTED',
  'E_GATEWAY_PAYMENT_DECLINED',
]);

const SERVER_ERROR = 500;

export function initialState(): CheckoutState {
  return { step: 'loading', initial: true };
}

function stay(state: CheckoutState, effect: Effect = 'none'): Transition {
  return { state, effect };
}

type CodeStepState = Extract<CheckoutState, { step: 'code' }>;

function codeState(otp: OtpProgress, error: CodeError | null = null): CodeStepState {
  return { step: 'code', otp, error, notice: null, resending: false };
}

function isCodeWaiting(otp: OtpProgress | null, now: Date): otp is OtpProgress {
  return otp !== null && otp.remainingAttempts > 0 && (otp.expiresAt === null || otp.expiresAt > now);
}

/** Where a fresh status read lands: never back on the number while a code is still usable. */
function stateFromSession(current: CheckoutState, session: CheckoutSession, now: Date): CheckoutState {
  switch (session.status) {
    case 'COMPLETED':
      return { step: 'success', alreadyPaid: current.step === 'loading' && current.initial };
    case 'FAILED':
      return { step: 'failed' };
    case 'EXPIRED':
      return { step: 'expired' };
    case 'CANCELED':
      return { step: 'canceled' };
    case 'PENDING':
      return isCodeWaiting(session.otp, now) ? codeState(session.otp) : { step: 'phone', error: null };
  }
}

function onFailure(current: CheckoutState, failure: RequestFailure): Transition {
  if (failure.kind === 'network' || failure.status >= SERVER_ERROR || failure.code === null) {
    return stay({ step: 'networkError' });
  }
  const { code } = failure;
  if (UNAVAILABLE_CODES.has(code)) return stay({ step: 'unavailable' });
  if (FINAL_FAILURE_CODES.has(code)) return stay({ step: 'failed' });
  if (REFRESH_CODES.has(code)) return stay(current, 'refreshStatus');
  switch (code) {
    case 'E_GATEWAY_PAYER_NOT_FOUND':
      return stay({ step: 'phone', error: 'notFound' });
    case 'E_GATEWAY_INVALID_PHONE':
      return stay({ step: 'phone', error: 'invalid' });
    case 'E_GATEWAY_OTP_NOT_REQUESTED':
      return stay({ step: 'phone', error: null });
    case 'E_GATEWAY_INSUFFICIENT_FUNDS':
      return stay({ step: 'insufficientFunds' });
    case 'E_GATEWAY_PAYMENT_IN_PROGRESS':
      return stay(current, 'pollStatus');
    case 'E_GATEWAY_INVALID_OTP':
    case 'E_GATEWAY_OTP_MAX_ATTEMPTS':
      return stay(current, 'refreshAfterWrongCode');
    case 'E_GATEWAY_OTP_EXPIRED':
      return current.step === 'processing' && current.otp
        ? stay(codeState(current.otp, { kind: 'expired' }))
        : stay(current, 'refreshStatus');
    default:
      return stay({ step: 'networkError' });
  }
}

export function reduce(current: CheckoutState, event: CheckoutEvent): Transition {
  switch (event.type) {
    case 'sessionRead':
      return stay(stateFromSession(current, event.session, event.now));
    case 'wrongCodeRead': {
      const { session, now } = event;
      if (session.status !== 'PENDING' || !session.otp) return stay(stateFromSession(current, session, now));
      return stay(codeState(session.otp, { kind: 'wrong', remainingAttempts: session.otp.remainingAttempts }));
    }
    case 'inProgressRead':
      return event.session.status === 'PENDING'
        ? stay(current, 'pollStatus')
        : stay(stateFromSession(current, event.session, event.now));
    case 'phoneSubmitted':
      return stay(event.phoneNumber === null ? { step: 'phone', error: 'invalid' } : { step: 'sendingCode' });
    case 'codeSent':
      return stay({
        ...codeState(event.otp),
        notice: current.step === 'code' && current.resending ? 'resent' : null,
      });
    case 'resendStarted':
      return current.step === 'code' ? stay({ ...current, resending: true, notice: null }) : stay(current);
    case 'noticeTimedOut':
      return current.step === 'code' ? stay({ ...current, notice: null }) : stay(current);
    case 'confirmStarted':
      return stay({ step: 'processing', otp: current.step === 'code' ? current.otp : null });
    case 'confirmed':
      return stay({ step: 'success', alreadyPaid: false });
    case 'changeNumber':
      return stay({ step: 'phone', error: null });
    case 'retryAfterNetworkError':
      return stay({ step: 'loading', initial: false }, 'refreshStatus');
    case 'embeddingRefused':
      return stay({ step: 'unavailable' });
    case 'requestFailed':
      return onFailure(current, event.failure);
  }
}

/** Hosted page: "Cancel and return" only while the customer is choosing (states 2, 4, 5, 6, 8). */
export function canCancel(state: CheckoutState): boolean {
  switch (state.step) {
    case 'phone':
    case 'insufficientFunds':
      return true;
    case 'code':
      return !state.resending;
    default:
      return false;
  }
}
