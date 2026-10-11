// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLyelPayCheckout, type UseLyelPayCheckoutOptions } from './use-lyel-pay-checkout';
import { CHECKOUT, checkoutFrame, fromWidget, launchParams } from './test/widget';

function options(overrides: Partial<UseLyelPayCheckoutOptions> = {}): UseLyelPayCheckoutOptions {
  return { publishableKey: 'pk_test_abc', sessionToken: 'st_1', checkoutUrl: CHECKOUT, ...overrides };
}

afterEach(() => {
  cleanup();
});

describe('useLyelPayCheckout (mode A)', () => {
  it('opens the modal on demand only', () => {
    const { result } = renderHook(() => useLyelPayCheckout(options({ locale: 'en', buttonLabel: 'DONATE' })));
    expect(checkoutFrame()).toBeNull();
    act(() => {
      result.current.open();
    });
    expect(launchParams().get('mode')).toBe('modal');
    expect(launchParams().get('locale')).toBe('en');
    expect(launchParams().get('button')).toBe('DONATE');
  });

  it('calls the latest callback the component rendered with', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { result, rerender } = renderHook((props: UseLyelPayCheckoutOptions) => useLyelPayCheckout(props), {
      initialProps: options({ onSuccess: first }),
    });
    act(() => {
      result.current.open();
    });
    rerender(options({ onSuccess: latest }));
    fromWidget({ type: 'success', paymentIntentId: 'pi_1', reference: 'GWP-7K2Q9M' });
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith({ paymentIntentId: 'pi_1', reference: 'GWP-7K2Q9M' });
  });

  it('closes on demand and reports it', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useLyelPayCheckout(options({ onClose })));
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.close();
    });
    expect(checkoutFrame()).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes the modal of the previous session when the session token changes', () => {
    const { result, rerender } = renderHook((props: UseLyelPayCheckoutOptions) => useLyelPayCheckout(props), {
      initialProps: options(),
    });
    act(() => {
      result.current.open();
    });
    rerender(options({ sessionToken: 'st_2' }));
    expect(checkoutFrame()).toBeNull();
    act(() => {
      result.current.open();
    });
    expect(launchParams().get('st')).toBe('st_2');
  });

  it('removes the modal when the component unmounts', () => {
    const { result, unmount } = renderHook(() => useLyelPayCheckout(options()));
    act(() => {
      result.current.open();
    });
    unmount();
    expect(checkoutFrame()).toBeNull();
  });
});
