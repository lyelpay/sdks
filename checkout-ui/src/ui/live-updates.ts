import type { ControllerSnapshot } from '../app/checkout-controller';
import type { Dictionary } from '../i18n';
import { isExpiryWarning, secondsUntil } from '../domain/expiry';

function countdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Updates the resend countdown and the 2-minute warning in place, so typing is never interrupted. */
export function applyLiveUpdates(root: HTMLElement, snapshot: ControllerSnapshot, t: Dictionary, now: Date): void {
  const { state, session } = snapshot;
  const warning = root.querySelector<HTMLElement>('[data-tick="expiry"]');
  if (warning && session) {
    warning.hidden = !(isExpiryWarning(session.expiresAt, now) && ['phone', 'code', 'insufficientFunds', 'sendingCode'].includes(state.step));
  }
  const notice = root.querySelector<HTMLElement>('[data-tick="notice"]');
  if (notice && state.step === 'code') {
    notice.hidden = state.noticeUntil === null || state.noticeUntil <= now;
  }
  const resend = root.querySelector<HTMLButtonElement>('[data-tick="resend"]');
  if (resend && state.step === 'code') {
    const wait = secondsUntil(state.otp.resendAvailableAt, now);
    resend.disabled = state.resending || wait > 0;
    resend.textContent = wait > 0 ? t.resendIn(countdown(wait)) : t.resend;
  }
}
