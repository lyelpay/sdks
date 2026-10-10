import type { RenderContext } from '../render-context';
import type { CodeError } from '../../app/checkout-machine';
import type { OtpProgress } from '../../domain/session';
import { escapeHtml, when } from '../html';
import { icons } from '../icons';

const CODE_LENGTH = 6;

function codeError(ctx: RenderContext, error: CodeError): string {
  const detail =
    error.kind === 'expired'
      ? escapeHtml(ctx.t.codeExpired)
      : `<strong>${escapeHtml(ctx.t.wrongCode)}</strong> ${escapeHtml(
          error.remainingAttempts > 0 ? ctx.t.attemptsLeft(error.remainingAttempts) : ctx.t.noAttemptLeft,
        )}`;
  return `<div class="lp-error" role="alert" id="lp-code-error">${icons.alert}<span>${detail}</span></div>`;
}

function resendControl(ctx: RenderContext, otp: OtpProgress, resending: boolean): string {
  if (otp.remainingSends <= 0 || otp.resendAvailableAt === null) {
    return `<p class="lp-muted-sm lp-resend-max" role="status">${escapeHtml(ctx.t.maxSendsReached)}</p>`;
  }
  return `<button type="button" class="lp-link-btn" data-action="resend" data-tick="resend" ${resending ? 'disabled' : ''}>${escapeHtml(ctx.t.resend)}</button>`;
}

/** States 5 and 6: one real input under six drawn boxes, so paste and one-time-code autofill work. */
export function codeStep(
  ctx: RenderContext,
  otp: OtpProgress,
  error: CodeError | null,
  notice: 'resent' | null,
  resending: boolean,
): string {
  const { t } = ctx;
  const boxes = Array.from({ length: CODE_LENGTH }, () => '<span class="lp-code-box"></span>').join('');
  return `<form class="lp-stack" data-form="code" novalidate>
    <div class="lp-info">${icons.whatsapp}<p>${escapeHtml(t.codeSent(otp.maskedPhoneNumber))}</p></div>
    <div class="lp-field">
      <label class="lp-label" for="lp-code">${escapeHtml(t.codeLabel)}</label>
      <div class="lp-code${error ? ' is-invalid' : ''}">
        <div class="lp-code-boxes" aria-hidden="true">${boxes}</div>
        <input id="lp-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
          maxlength="${CODE_LENGTH}" pattern="[0-9]*" aria-label="${escapeHtml(t.codeAria)}"
          aria-invalid="${error ? 'true' : 'false'}" ${error ? 'aria-describedby="lp-code-error"' : ''}>
      </div>
      ${when(error !== null, () => codeError(ctx, error ?? { kind: 'expired' }))}
      ${when(notice === 'resent', () => `<p class="lp-notice" role="status">${escapeHtml(t.codeResent)}</p>`)}
    </div>
    <button type="submit" class="lp-btn lp-btn-primary"><span>${escapeHtml(t.confirm)}</span></button>
    <div class="lp-code-actions">
      ${resendControl(ctx, otp, resending)}
      <button type="button" class="lp-link-btn" data-action="change-number">${escapeHtml(t.changeNumber)}</button>
    </div>
  </form>`;
}

export const CODE_INPUT_LENGTH = CODE_LENGTH;
