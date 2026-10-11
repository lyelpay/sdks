import { useEffect, useMemo, useRef } from 'react';
import type { GatewayCheckoutCallbacks } from '@lyel/lyel-pay-js';

/**
 * Callbacks with a stable identity that always call the latest ones rendered: a new inline arrow on every render
 * must not tear down and reload the checkout iframe.
 */
export function useStableCallbacks(callbacks: GatewayCheckoutCallbacks): Required<GatewayCheckoutCallbacks> {
  const latest = useRef(callbacks);
  useEffect(() => {
    latest.current = callbacks;
  });
  return useMemo(
    () => ({
      onReady: (): void => latest.current.onReady?.(),
      onSuccess: (success): void => latest.current.onSuccess?.(success),
      onFailed: (outcome): void => latest.current.onFailed?.(outcome),
      onExpired: (outcome): void => latest.current.onExpired?.(outcome),
      onCanceled: (outcome): void => latest.current.onCanceled?.(outcome),
      onClose: (): void => latest.current.onClose?.(),
      onError: (error): void => latest.current.onError?.(error),
    }),
    [],
  );
}
