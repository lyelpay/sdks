import type { RenderContext } from './render-context';
import { when } from './html';
import { expiryWarning, securedBadge, skeleton, testBanner } from './views/chrome';
import { summary } from './views/summary';
import { phoneStep } from './views/phone-step';
import { codeStep } from './views/code-step';
import { canceled, expired, failed, insufficientFunds, networkError, processing, success, unavailable } from './views/outcomes';

/** Steps that keep the merchant and amount on screen (states 2 to 8). */
function withSummary(ctx: RenderContext, content: string): string {
  return `${summary(ctx)}${content}`;
}

function body(ctx: RenderContext): string {
  const { state } = ctx;
  switch (state.step) {
    case 'loading':
      return skeleton(ctx);
    case 'phone':
      return withSummary(ctx, phoneStep(ctx, state.error, false));
    case 'sendingCode':
      return withSummary(ctx, phoneStep(ctx, null, true));
    case 'code':
      return withSummary(ctx, codeStep(ctx, state.otp, state.error, state.notice, state.resending));
    case 'processing':
      return withSummary(ctx, processing(ctx));
    case 'insufficientFunds':
      return withSummary(ctx, insufficientFunds(ctx));
    case 'success':
      return success(ctx, state.alreadyPaid);
    case 'failed':
      return failed(ctx);
    case 'expired':
      return expired(ctx);
    case 'canceled':
      return canceled(ctx);
    case 'networkError':
      return networkError(ctx);
    case 'unavailable':
      return unavailable(ctx);
  }
}

/** The card shared by the three surfaces; the secured badge sits inside it only in modes A and B. */
export function checkoutCard(ctx: RenderContext): string {
  const framed = ctx.surface === 'embedded' ? ctx.framed : true;
  return `<section class="lp-card${framed ? ' is-framed' : ''}" lang="${ctx.locale}">
    ${when(ctx.session?.mode === 'TEST', () => testBanner(ctx))}
    ${expiryWarning(ctx)}
    <div class="lp-card-body">${body(ctx)}</div>
    ${when(ctx.surface !== 'hosted' && ctx.showSecuredBadge, () => securedBadge(ctx, 'lp-card-footer'))}
  </section>`;
}
