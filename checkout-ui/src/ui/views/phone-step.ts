import type { RenderContext } from '../render-context';
import { escapeHtml, when } from '../html';
import { icons } from '../icons';
import { spinner, testData } from './chrome';
import type { PhoneError } from '../../app/checkout-machine';

function simpleError(text: string): string {
  return `<div class="lp-error" role="alert">${icons.alert}<span>${escapeHtml(text)}</span></div>`;
}

function errorMessage(ctx: RenderContext, error: PhoneError): string {
  switch (error) {
    case 'invalid':
      return simpleError(ctx.t.invalidNumber);
    case 'sendLimit':
      return simpleError(ctx.t.maxSendsReached);
    case 'channelUnavailable':
      return simpleError(ctx.t.channelUnavailable);
    case 'notFound':
      return notFoundMessage(ctx);
  }
}

function notFoundMessage(ctx: RenderContext): string {
  const fix = ctx.signupUrl
    ? `${escapeHtml(ctx.t.notFoundFix)} <a class="lp-link" href="${escapeHtml(ctx.signupUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ctx.t.createAccount)}</a>`
    : escapeHtml(ctx.t.notFoundFixNoLink);
  return `<div class="lp-error-block" role="alert">
    <div class="lp-error lp-error-strong">${icons.alert}<span>${escapeHtml(ctx.t.notFound)}</span></div>
    <p class="lp-error-fix">${fix}</p>
  </div>`;
}

/** States 2, 3 and 4. */
export function phoneStep(ctx: RenderContext, error: PhoneError | null, sending: boolean): string {
  const { t } = ctx;
  const label = sending ? t.sendingCode : t.buttons[ctx.buttonLabel](ctx.amount);
  const fieldClass = sending ? 'lp-phone is-disabled' : error ? 'lp-phone is-invalid' : 'lp-phone';
  return `<form class="lp-stack" data-form="phone" novalidate>
    <div class="lp-field">
      <label class="lp-label" for="lp-phone">${escapeHtml(t.numberLabel)}
        <span class="lp-help" id="lp-phone-help">${escapeHtml(t.numberHelp)}</span>
      </label>
      <div class="${fieldClass}">
        <span class="lp-phone-prefix" aria-hidden="true">+242</span>
        <input id="lp-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national"
          aria-label="${escapeHtml(t.numberAria)}" aria-describedby="lp-phone-help"
          aria-invalid="${error ? 'true' : 'false'}" placeholder="06 123 45 67"
          value="${escapeHtml(ctx.phoneDraft)}" ${sending ? 'disabled' : ''}>
      </div>
      ${when(error !== null && !sending, () => errorMessage(ctx, error ?? 'invalid'))}
    </div>
    <button type="submit" class="lp-btn lp-btn-primary" ${sending ? 'disabled aria-busy="true"' : ''}>
      ${when(sending, () => spinner('lp-spin'))}<span>${escapeHtml(label)}</span>
    </button>
    ${when(ctx.session?.mode === 'TEST', () => testData(ctx))}
  </form>`;
}
