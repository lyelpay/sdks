import type { RenderContext } from '../render-context';
import { escapeHtml, when } from '../html';
import { icons } from '../icons';
import { spinner } from './chrome';
import { retryPlan } from '../../app/checkout-machine';
import type { OtpProgress } from '../../domain/session';

type Tone = 'error' | 'warning' | 'muted';
type Exit = 'cancelUrl' | 'none';

interface Outcome {
  tone: Tone;
  icon: string;
  title: string;
  body: string;
  role: 'alert' | 'status';
  retry: boolean;
  changeNumber: boolean;
  exit: Exit;
}

function exitAction(ctx: RenderContext, exit: Exit): string {
  if (exit === 'none') return '';
  const cancelUrl = ctx.session?.returnUrls?.cancel;
  if (ctx.surface === 'hosted') {
    return cancelUrl
      ? `<a class="lp-btn lp-btn-secondary" href="${escapeHtml(cancelUrl)}">${escapeHtml(ctx.t.backTo(ctx.merchantName))}</a>${when(ctx.redirecting, () => redirectNotice(ctx))}`
      : '';
  }
  if (ctx.surface === 'modal') {
    return `<button type="button" class="lp-btn lp-btn-secondary" data-action="close">${escapeHtml(ctx.t.close)}</button>`;
  }
  return '';
}

function redirectNotice({ t }: RenderContext): string {
  return `<span class="lp-muted-sm" aria-live="polite">${escapeHtml(t.redirecting)}</span>`;
}

function outcomeBlock(ctx: RenderContext, outcome: Outcome): string {
  const { t } = ctx;
  return `<div class="lp-outcome">
    <span class="lp-circle lp-circle-${outcome.tone}">${outcome.icon}</span>
    <div class="lp-outcome-text" role="${outcome.role}">
      <h2 class="lp-title" tabindex="-1" data-focus>${escapeHtml(outcome.title)}</h2>
      <p class="lp-body">${escapeHtml(outcome.body)}</p>
    </div>
    <div class="lp-actions">
      ${when(outcome.retry, () => `<button type="button" class="lp-btn lp-btn-primary" data-action="retry">${escapeHtml(t.retry)}</button>`)}
      ${when(outcome.changeNumber, () => `<button type="button" class="lp-btn lp-btn-secondary" data-action="change-number">${escapeHtml(t.changeNumber)}</button>`)}
      ${exitAction(ctx, outcome.exit)}
    </div>
  </div>`;
}

const base = { retry: false, changeNumber: false, exit: 'cancelUrl' } as const;

/** State 8: "Try again" disappears once neither the current code nor a new one can be used. */
export function insufficientFunds(ctx: RenderContext, otp: OtpProgress | null): string {
  const { t } = ctx;
  const canRetry = retryPlan(otp, ctx.now) !== 'none';
  const block = outcomeBlock(ctx, { ...base, tone: 'warning', icon: icons.wallet, title: t.insufficientTitle, body: t.insufficientBody, role: 'alert', retry: canRetry, changeNumber: true, exit: 'none' });
  return canRetry ? block : `${block}<p class="lp-muted-sm" role="status">${escapeHtml(t.maxSendsReached)}</p>`;
}

export function failed(ctx: RenderContext): string {
  return outcomeBlock(ctx, { ...base, tone: 'error', icon: icons.cross, title: ctx.t.failedTitle, body: ctx.t.failedBody, role: 'alert' });
}

export function expired(ctx: RenderContext): string {
  const body = ctx.surface === 'hosted' ? ctx.t.expiredBodyHosted : ctx.t.expiredBodyEmbedded;
  return outcomeBlock(ctx, { ...base, tone: 'muted', icon: icons.clock(30), title: ctx.t.expiredTitle, body, role: 'alert' });
}

export function canceled(ctx: RenderContext): string {
  return outcomeBlock(ctx, { ...base, tone: 'muted', icon: icons.ban, title: ctx.t.canceledTitle, body: ctx.t.canceledBody, role: 'status' });
}

export function networkError(ctx: RenderContext): string {
  return outcomeBlock(ctx, { ...base, tone: 'error', icon: icons.offline, title: ctx.t.networkTitle, body: ctx.t.networkBody, role: 'alert', retry: true, exit: 'none' });
}

export function unavailable(ctx: RenderContext): string {
  return outcomeBlock(ctx, { ...base, tone: 'error', icon: icons.cross, title: ctx.t.unavailableTitle, body: ctx.t.unavailableBody, role: 'alert', exit: 'none' });
}

/** State 7. */
export function processing({ t }: RenderContext): string {
  return `<div class="lp-processing" role="status" aria-live="polite">
    ${spinner('lp-spin lp-spin-lg')}
    <strong class="lp-processing-title">${escapeHtml(t.processing)}</strong>
    <span class="lp-body">${escapeHtml(t.dontClose)}</span>
  </div>`;
}

function successAction(ctx: RenderContext): string {
  const successUrl = ctx.session?.returnUrls?.success;
  if (ctx.surface === 'hosted' && successUrl) {
    return `<div class="lp-actions">
      <a class="lp-btn lp-btn-primary" href="${escapeHtml(successUrl)}">${escapeHtml(ctx.t.backTo(ctx.merchantName))}</a>
      ${when(ctx.redirecting, () => redirectNotice(ctx))}
    </div>`;
  }
  if (ctx.surface === 'modal') {
    return `<div class="lp-actions"><button type="button" class="lp-btn lp-btn-secondary" data-action="close">${escapeHtml(ctx.t.close)}</button></div>`;
  }
  return '';
}

/** States 9 and 12. */
export function success(ctx: RenderContext, alreadyPaid: boolean): string {
  const { t } = ctx;
  return `<div class="lp-outcome">
    <span class="lp-circle lp-circle-success">${icons.check}</span>
    <div class="lp-outcome-text" role="status">
      <h2 class="lp-title" tabindex="-1" data-focus>${escapeHtml(alreadyPaid ? t.alreadyPaidTitle : t.successTitle)}</h2>
      <p class="lp-body">${escapeHtml(alreadyPaid ? t.alreadyPaidBody : t.successBody)}</p>
    </div>
    <dl class="lp-receipt">
      <div><dt>${escapeHtml(t.amountLabel)}</dt><dd class="lp-receipt-amount">${escapeHtml(ctx.amount)}</dd></div>
      <div><dt>${escapeHtml(t.merchantLabel)}</dt><dd>${escapeHtml(ctx.merchantName)}</dd></div>
      <div><dt>${escapeHtml(t.referenceLabel)}</dt><dd class="lp-mono">${escapeHtml(ctx.session?.reference ?? '')}</dd></div>
    </dl>
    ${successAction(ctx)}
  </div>`;
}
