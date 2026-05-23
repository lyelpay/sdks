import React, { useCallback, useRef } from 'react';
import { GatewayCheckout, GatewayCheckoutOptions } from '@lyel/lyel-pay-js';

export interface LyelPayButtonProps {
  publishableKey: string;
  sessionToken: string;
  amount: string;
  currency: 'XAF' | 'XOF';
  merchantName?: string;
  locale?: string;
  checkoutUrl?: string;
  onSuccess?: (reference: string) => void;
  onFailed?: (reason: string) => void;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const LyelPayButton: React.FC<LyelPayButtonProps> = ({
  publishableKey,
  sessionToken,
  amount,
  currency,
  merchantName,
  locale,
  checkoutUrl,
  onSuccess,
  onFailed,
  onClose,
  children = 'Pay now',
  className,
  style,
  disabled = false,
}) => {
  const checkoutRef = useRef<GatewayCheckout | null>(null);

  const handleClick = useCallback(() => {
    if (disabled) return;

    const opts: GatewayCheckoutOptions = {
      publishableKey,
      sessionToken,
      amount,
      currency,
      merchantName,
      locale,
      checkoutUrl,
      onSuccess: (ref) => {
        checkoutRef.current = null;
        onSuccess?.(ref);
      },
      onFailed: (reason) => {
        checkoutRef.current = null;
        onFailed?.(reason);
      },
      onClose: () => {
        checkoutRef.current = null;
        onClose?.();
      },
    };

    checkoutRef.current = new GatewayCheckout(opts);
    checkoutRef.current.open();
  }, [publishableKey, sessionToken, amount, currency, merchantName, locale, checkoutUrl, onSuccess, onFailed, onClose, disabled]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
};

export default LyelPayButton;
