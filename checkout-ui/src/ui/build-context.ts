import type { ControllerSnapshot } from '../app/checkout-controller';
import type { LaunchParams } from '../launch/launch-params';
import type { CheckoutConfig } from '../config/env';
import { dictionaryFor } from '../i18n';
import { formatAmount, shouldShowSecuredBadge } from '../domain/display';
import { resolveLocale } from '../domain/locale';
import type { RenderContext } from './render-context';

export function buildRenderContext(
  snapshot: ControllerSnapshot,
  launch: LaunchParams,
  config: CheckoutConfig,
  now: Date,
): RenderContext {
  const { session } = snapshot;
  const locale = resolveLocale(launch.locale, session?.locale ?? null);
  const merchant = session?.merchant;
  return {
    state: snapshot.state,
    session,
    t: dictionaryFor(locale),
    locale,
    surface: launch.surface,
    framed: launch.framed,
    amount: session ? formatAmount(session.amount, session.currency, locale) : '',
    merchantName: merchant?.name ?? '',
    logoUrl: merchant?.logoPath ? `${config.apiBaseUrl}${merchant.logoPath}` : null,
    buttonLabel: launch.buttonLabel ?? merchant?.buttonLabel ?? 'PAY',
    signupUrl: config.signupUrl,
    showSecuredBadge: shouldShowSecuredBadge(launch.surface, merchant?.showSecuredBadge),
    phoneDraft: snapshot.phoneDraft,
    redirecting: snapshot.redirecting,
    now,
  };
}
