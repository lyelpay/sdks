import type { CSSProperties, JSX, ReactNode } from 'react';
import type { CheckoutProps } from './checkout-props';
import { useLyelPayCheckout } from './use-lyel-pay-checkout';

export type LyelPayButtonProps = CheckoutProps & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
};

/** A ready-made button that opens the modal (mode A). */
export function LyelPayButton(props: LyelPayButtonProps): JSX.Element {
  const { children = 'Payer avec Lyel Pay', className, style, disabled = false, ...checkout } = props;
  const { open } = useLyelPayCheckout(checkout);
  return (
    <button type="button" onClick={open} disabled={disabled} className={className} style={style}>
      {children}
    </button>
  );
}
