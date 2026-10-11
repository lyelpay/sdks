// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LyelPayCheckout } from './LyelPayCheckout';
import { CHECKOUT, checkoutFrame, fromWidget, launchParams } from './test/widget';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('LyelPayCheckout (mode B)', () => {
  it('mounts the embedded block inside its own element', () => {
    const { container } = render(
      <LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} className="pay" />,
    );
    const host = container.querySelector('.pay');
    expect(checkoutFrame()?.parentElement).toBe(host);
    expect(launchParams().get('mode')).toBe('embedded');
    expect(launchParams().has('framed')).toBe(false);
  });

  it('asks for a frameless block', () => {
    render(<LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} framed={false} />);
    expect(launchParams().get('framed')).toBe('0');
  });

  it('follows the widget height and reports the outcomes', () => {
    const onReady = vi.fn();
    const onFailed = vi.fn();
    render(
      <LyelPayCheckout
        publishableKey="pk_test_abc"
        sessionToken="st_1"
        checkoutUrl={CHECKOUT}
        onReady={onReady}
        onFailed={onFailed}
      />,
    );
    fromWidget({ type: 'ready' });
    fromWidget({ type: 'resize', height: 480 });
    fromWidget({ type: 'failed', paymentIntentId: 'pi_1' });
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(checkoutFrame()?.style.height).toBe('480px');
    expect(onFailed).toHaveBeenCalledWith({ paymentIntentId: 'pi_1' });
  });

  it('reports a checkout that never gets ready, and removes the block', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    render(<LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} onError={onError} />);
    vi.advanceTimersByTime(30_000);
    expect(onError).toHaveBeenCalledExactlyOnceWith({ code: 'checkout_unavailable' });
    expect(checkoutFrame()).toBeNull();
  });

  it('mounts a new block for a new session and keeps a single one', () => {
    const { rerender } = render(<LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} />);
    rerender(<LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_2" checkoutUrl={CHECKOUT} />);
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(launchParams().get('st')).toBe('st_2');
  });

  it('keeps the block when only a callback changes', () => {
    const { rerender } = render(
      <LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} onReady={vi.fn()} />,
    );
    const before = checkoutFrame();
    rerender(<LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} onReady={vi.fn()} />);
    expect(checkoutFrame()).toBe(before);
  });

  it('removes the block on unmount', () => {
    const { unmount } = render(<LyelPayCheckout publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} />);
    unmount();
    expect(checkoutFrame()).toBeNull();
  });
});
