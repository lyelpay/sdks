import type { RenderContext } from '../render-context';
import { escapeHtml, when } from '../html';
import { initialsOf } from '../../domain/display';

function logo({ logoUrl, merchantName, t }: RenderContext): string {
  if (logoUrl) {
    return `<img class="lp-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(t.logoAlt(merchantName))}" width="44" height="44" referrerpolicy="no-referrer">`;
  }
  return `<span class="lp-initials" aria-hidden="true">${escapeHtml(initialsOf(merchantName))}</span>`;
}

/** Merchant, amount and description: all read from the API (S9). */
export function summary(ctx: RenderContext): string {
  const description = ctx.session?.description ?? null;
  return `<div class="lp-summary">
    <div class="lp-summary-merchant">
      ${logo(ctx)}
      <div class="lp-summary-names">
        <span class="lp-muted-sm">${escapeHtml(ctx.t.payTo)}</span>
        <span class="lp-merchant-name">${escapeHtml(ctx.merchantName)}</span>
      </div>
    </div>
    <div class="lp-summary-amount">
      <span class="lp-amount">${escapeHtml(ctx.amount)}</span>
      ${when(description !== null, () => `<span class="lp-muted">${escapeHtml(description ?? '')}</span>`)}
    </div>
  </div>`;
}
