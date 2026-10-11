import type { RenderContext } from '../render-context';
import type { CodeError } from '../../app/checkout-machine';
import type { OtpProgress } from '../../domain/session';
import { escapeHtml, when } from '../html';
import { icons } from '../icons';

const CODE_LENGTH = 6;

function codeErrorDetail(ctx: RenderContext, error: CodeError): string {
  switch (error.kind) {
    case 'expired':
      return escapeHtml(ctx.t.codeExpired);
    case 'channelUnavailable':
      return escapeHtml(ctx.t.channelUnavailable);
    case 'wrong':
      return `<strong>${escapeHtml(ctx.t.wrongCode)}</strong> ${escapeHtml(
        error.remainingAttempts > 0 ? ctx.t.attemptsLeft(error.remainingAttempts) : ctx.t.noAttemptLeft,
      )}`;
  }
}

function codeError(ctx: RenderContext, error: CodeError): string {
  const detail = codeErrorDetail(ctx, error);
  return `<div class="lp-error" role="alert" id="lp-code-error">${icons.alert}<span>${detail}</span></div>`;
}

/** In TEST no WhatsApp message leaves: say so, as the test data box does. */
function codeSentInfo(ctx: RenderContext, otp: OtpProgress): string {
  const testMode = ctx.session?.mode === 'TEST';
  const icon = testMode ? icons.flask : icons.whatsapp;
  const text = testMode ? ctx.t.codeSentTest : ctx.t.codeSent(otp.maskedPhoneNumber);
  return `<div class="lp-info">${icon}<p>${escapeHtml(text)}</p></div>`;
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
  noticeUntil: Date | null,
  resending: boolean,
): string {
  const { t } = ctx;
  const boxes = Array.from({ length: CODE_LENGTH }, () => '<span class="lp-code-box"></span>').join('');
  return `<form class="lp-stack" data-form="code" novalidate>
    ${codeSentInfo(ctx, otp)}
    <div class="lp-field">
      <label class="lp-label" for="lp-code">${escapeHtml(t.codeLabel)}</label>
      <div class="lp-code${error ? ' is-invalid' : ''}">
        <div class="lp-code-boxes" aria-hidden="true">${boxes}</div>
        <input id="lp-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
          maxlength="${CODE_LENGTH}" pattern="[0-9]*" aria-label="${escapeHtml(t.codeAria)}"
          aria-invalid="${error ? 'true' : 'false'}" ${error ? 'aria-describedby="lp-code-error"' : ''}>
      </div>
      ${when(error !== null, () => codeError(ctx, error ?? { kind: 'expired' }))}
      <p class="lp-notice" role="status" data-tick="notice" ${noticeUntil !== null && noticeUntil > ctx.now ? '' : 'hidden'}>${escapeHtml(t.codeResent)}</p>
    </div>
    <button type="submit" class="lp-btn lp-btn-primary"><span>${escapeHtml(t.confirm)}</span></button>
    <div class="lp-code-actions">
      ${resendControl(ctx, otp, resending)}
      <button type="button" class="lp-link-btn" data-action="change-number">${escapeHtml(t.changeNumber)}</button>
    </div>
  </form>`;
}

export const CODE_INPUT_LENGTH = CODE_LENGTH;
