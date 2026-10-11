import { useCallback, useEffect, useMemo, useRef } from 'react';
import { GatewayCheckout } from '@lyel/lyel-pay-js';
import type { CheckoutProps } from './checkout-props';
import { useStableCallbacks } from './use-stable-callbacks';

export type UseLyelPayCheckoutOptions = CheckoutProps;

export interface LyelPayCheckoutControls {
  /** Opens the modal (mode A); does nothing while it is already open. */
  open: () => void;
  /** Closes the modal. Closing never cancels the payment intent. */
  close: () => void;
}

/**
 * Mode A, the modal. `onSuccess` only tells the page what the customer saw: deliver the order on the
 * `payment.completed` webhook or after a server-side read with your secret key.
 */
export function useLyelPayCheckout(options: UseLyelPayCheckoutOptions): LyelPayCheckoutControls {
  const { publishableKey, sessionToken, locale, buttonLabel, checkoutUrl, ...callbacks } = options;
  const stableCallbacks = useStableCallbacks(callbacks);
  const checkout = useRef<GatewayCheckout | null>(null);

  useEffect(() => {
    const instance = new GatewayCheckout({ publishableKey, sessionToken, locale, buttonLabel, checkoutUrl, ...stableCallbacks });
    checkout.current = instance;
    return (): void => {
      instance.destroy();
      if (checkout.current === instance) checkout.current = null;
    };
  }, [publishableKey, sessionToken, locale, buttonLabel, checkoutUrl, stableCallbacks]);

  const open = useCallback((): void => {
    checkout.current?.open();
  }, []);
  const close = useCallback((): void => {
    checkout.current?.close();
  }, []);
  return useMemo(() => ({ open, close }), [open, close]);
}
