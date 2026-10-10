import type { RenderContext } from './render-context';
import { escapeHtml, when } from './html';
import { icons } from './icons';
import { checkoutCard } from './checkout-view';
import { securedBadge } from './views/chrome';
import { canCancel } from '../app/checkout-machine';
import { initialsOf } from '../domain/display';

/** Mode A: the widget draws the dimmed backdrop and the window; the SDK only mounts a full-screen iframe. */
function modalShell(ctx: RenderContext): string {
  const closeLocked = ctx.state.step === 'processing';
  return `<div class="lp-backdrop">
    <div class="lp-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(ctx.t.dialogLabel)}">
      <div class="lp-dialog-header">
        <span class="lp-dialog-title">${escapeHtml(ctx.t.modalTitle)}</span>
        <button type="button" class="lp-icon-btn" data-action="close" aria-label="${escapeHtml(ctx.t.close)}" ${closeLocked ? 'disabled' : ''}>${icons.close}</button>
      </div>
      ${checkoutCard(ctx)}
    </div>
  </div>`;
}

function embeddedShell(ctx: RenderContext): string {
  return `<div class="lp-embedded">${checkoutCard(ctx)}</div>`;
}

function hostedLogo(ctx: RenderContext): string {
  return ctx.logoUrl
    ? `<img class="lp-page-logo" src="${escapeHtml(ctx.logoUrl)}" alt="${escapeHtml(ctx.t.logoAlt(ctx.merchantName))}" referrerpolicy="no-referrer">`
    : `<span class="lp-page-logo lp-page-initials" aria-hidden="true">${escapeHtml(initialsOf(ctx.merchantName))}</span>`;
}

/** Mode C: merchant header, centred card, a single way to cancel, and the badge always shown. */
function hostedShell(ctx: RenderContext): string {
  const cancelUrl = ctx.session?.returnUrls?.cancel;
  return `<div class="lp-page">
    ${when(ctx.session !== null, () => `<header class="lp-page-header">${hostedLogo(ctx)}<span class="lp-page-merchant">${escapeHtml(ctx.merchantName)}</span></header>`)}
    <main class="lp-page-main">
      ${checkoutCard(ctx)}
      ${when(Boolean(cancelUrl) && canCancel(ctx.state), () => `<a class="lp-cancel-link" href="${escapeHtml(cancelUrl ?? '')}" data-action="cancel">${escapeHtml(ctx.t.cancelAndReturn(ctx.merchantName))}</a>`)}
    </main>
    <footer class="lp-page-footer">${securedBadge(ctx, 'lp-badge')}</footer>
  </div>`;
}

export function renderShell(ctx: RenderContext): string {
  switch (ctx.surface) {
    case 'modal':
      return modalShell(ctx);
    case 'embedded':
      return embeddedShell(ctx);
    case 'hosted':
      return hostedShell(ctx);
  }
}
