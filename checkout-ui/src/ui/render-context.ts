import type { CheckoutState } from '../app/checkout-machine';
import type { Dictionary } from '../i18n';
import type { CheckoutSession, Surface } from '../domain/session';
import type { ButtonLabel } from '../domain/session';
import type { Locale } from '../domain/locale';

/** Everything a view needs, computed once per render. */
export interface RenderContext {
  state: CheckoutState;
  session: CheckoutSession | null;
  t: Dictionary;
  locale: Locale;
  surface: Surface;
  framed: boolean;
  amount: string;
  merchantName: string;
  logoUrl: string | null;
  buttonLabel: ButtonLabel;
  signupUrl: string | null;
  showSecuredBadge: boolean;
  /** Last number the customer typed, kept across "change number" and retries. */
  phoneDraft: string;
  /** Hosted page only: a live outcome redirects after 3 s; a reload does not. */
  redirecting: boolean;
}
