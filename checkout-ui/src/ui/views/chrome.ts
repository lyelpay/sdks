import type { RenderContext } from '../render-context';
import { escapeHtml } from '../html';
import { icons } from '../icons';

export function testBanner({ t }: RenderContext): string {
  return `<div class="lp-test-banner" role="note">${icons.flask}<span>${escapeHtml(t.testBanner)}</span></div>`;
}

/** Always in the DOM so the clock can reveal it without a re-render; aria-live announces it once shown. */
export function expiryWarning({ t }: RenderContext): string {
  return `<div class="lp-expiry" data-tick="expiry" role="status" aria-live="polite" hidden>${icons.clock(18)}<span>${escapeHtml(t.expiryWarning)}</span></div>`;
}

export function securedBadge({ t }: RenderContext, className: string): string {
  return `<div class="${className}">${icons.lock}<span>${escapeHtml(t.securedBy)}</span><span class="lp-brand">${icons.lyelPay}Lyel Pay</span></div>`;
}

export function testData({ t }: RenderContext): string {
  return `<div class="lp-test-data">
    <strong>${escapeHtml(t.testTitle)}</strong>
    <span>${escapeHtml(t.testSuccess)}</span>
    <span>${escapeHtml(t.testInsufficient)}</span>
    <span>${escapeHtml(t.testNotFound)}</span>
    <span class="lp-test-code">${escapeHtml(t.testCode)}</span>
  </div>`;
}

export function skeleton({ t }: RenderContext): string {
  return `<div class="lp-skeleton" aria-busy="true">
    <span class="lp-sr-only" role="status">${escapeHtml(t.loading)}</span>
    <div class="lp-sk lp-sk-summary">
      <div class="lp-sk-row"><span class="lp-sk-logo"></span><span class="lp-sk-lines"><span class="lp-sk-bar" style="--w:70px;--h:10px"></span><span class="lp-sk-bar" style="--w:120px;--h:14px"></span></span></div>
      <span class="lp-sk-bar" style="--w:170px;--h:30px"></span>
      <span class="lp-sk-bar" style="--w:210px;--h:12px"></span>
    </div>
    <div class="lp-sk lp-sk-field"><span class="lp-sk-bar" style="--w:150px;--h:12px"></span><span class="lp-sk-input"></span></div>
    <span class="lp-sk lp-sk-button"></span>
  </div>`;
}

export function spinner(className: string): string {
  return `<span class="${className}" aria-hidden="true"></span>`;
}
