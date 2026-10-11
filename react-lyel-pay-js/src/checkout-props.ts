import type { GatewayCheckoutCallbacks, GatewayCheckoutOptions } from '@lyel/lyel-pay-js';

/** What a React integration passes: the amount and the merchant name always come from the API, never from here. */
export type CheckoutSettings = Pick<
  GatewayCheckoutOptions,
  'publishableKey' | 'sessionToken' | 'locale' | 'buttonLabel' | 'checkoutUrl'
>;

export type CheckoutProps = CheckoutSettings & GatewayCheckoutCallbacks;
