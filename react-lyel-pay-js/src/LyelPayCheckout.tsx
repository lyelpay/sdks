import { useEffect, useRef, type CSSProperties, type JSX } from 'react';
import { GatewayCheckout, type MountOptions } from '@lyel/lyel-pay-js';
import type { CheckoutProps } from './checkout-props';
import { useStableCallbacks } from './use-stable-callbacks';

export type LyelPayCheckoutProps = Omit<CheckoutProps, 'onClose'> &
  MountOptions & {
    className?: string;
    style?: CSSProperties;
  };

/**
 * Mode B, the block embedded in your page. It stays shown after every outcome: your page reacts to the callbacks,
 * and delivers the order only on the `payment.completed` webhook or a server-side read.
 */
export function LyelPayCheckout(props: LyelPayCheckoutProps): JSX.Element {
  const { publishableKey, sessionToken, locale, buttonLabel, checkoutUrl, framed, className, style, ...callbacks } = props;
  const host = useRef<HTMLDivElement>(null);
  const stableCallbacks = useStableCallbacks(callbacks);

  useEffect(() => {
    const element = host.current;
    if (!element) return undefined;
    const checkout = new GatewayCheckout({ publishableKey, sessionToken, locale, buttonLabel, checkoutUrl, ...stableCallbacks });
    checkout.mount(element, { framed });
    return (): void => {
      checkout.destroy();
    };
  }, [publishableKey, sessionToken, locale, buttonLabel, checkoutUrl, framed, stableCallbacks]);

  return <div ref={host} className={className} style={style} />;
}
