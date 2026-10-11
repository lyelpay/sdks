// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { challengeResponse, widgetEnvelope, type WidgetMessage } from '@lyel/checkout-protocol';
import { GatewayCheckout, READY_TIMEOUT_MS } from './gateway-checkout';
import type { GatewayCheckoutOptions } from './types';

const CHECKOUT = 'https://dev.checkout.lyelpay.com';

function options(overrides: Partial<GatewayCheckoutOptions> = {}): GatewayCheckoutOptions {
  return { publishableKey: 'pk_test_abc', sessionToken: 'st_123', checkoutUrl: CHECKOUT, ...overrides };
}

function frame(): HTMLIFrameElement {
  const iframe = document.querySelector('iframe');
  if (!iframe) throw new Error('no checkout iframe');
  return iframe;
}

function widgetWindow(): Window {
  const win = frame().contentWindow;
  if (!win) throw new Error('the checkout iframe has no window');
  return win;
}

function fromWidget(message: WidgetMessage, init: { origin?: string; source?: Window } = {}): void {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: widgetEnvelope(message),
      origin: init.origin ?? CHECKOUT,
      source: init.source ?? widgetWindow(),
    }),
  );
}

function container(): HTMLElement {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('GatewayCheckout, mode A (modal)', () => {
  it('opens a full-screen transparent iframe on the modal surface', () => {
    new GatewayCheckout(options()).open();
    const iframe = frame();
    const src = new URL(iframe.src);
    expect(src.origin).toBe(CHECKOUT);
    expect(new URLSearchParams(src.hash.slice(1)).get('mode')).toBe('modal');
    expect(new URLSearchParams(src.hash.slice(1)).get('origin')).toBe(window.location.origin);
    expect(iframe.style.position).toBe('fixed');
    expect(iframe.style.width).toBe('100%');
    expect(iframe.style.height).toBe('100%');
    expect(iframe.style.background).toBe('transparent');
    expect(iframe.parentElement).toBe(document.body);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('opens once, whatever the number of clicks', () => {
    const checkout = new GatewayCheckout(options());
    checkout.open();
    checkout.open();
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('closes on the widget close message and gives the page its scroll back', () => {
    const onClose = vi.fn();
    new GatewayCheckout(options({ onClose })).open();
    fromWidget({ type: 'close' });
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('can be opened again after a close, as long as the intent is pending', () => {
    const checkout = new GatewayCheckout(options());
    checkout.open();
    checkout.close();
    checkout.open();
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('keeps the modal open on a success: the widget closes itself after 3 s', () => {
    const onSuccess = vi.fn();
    new GatewayCheckout(options({ onSuccess })).open();
    fromWidget({ type: 'success', paymentIntentId: 'pi_1', reference: 'GWP-7K2Q9M' });
    expect(onSuccess).toHaveBeenCalledWith({ paymentIntentId: 'pi_1', reference: 'GWP-7K2Q9M' });
    expect(document.querySelector('iframe')).not.toBeNull();
  });
});

describe('GatewayCheckout, mode B (embedded block)', () => {
  it('mounts a block inside the merchant element, framed by default', () => {
    const target = container();
    new GatewayCheckout(options()).mount(target);
    const iframe = frame();
    const hash = new URLSearchParams(new URL(iframe.src).hash.slice(1));
    expect(iframe.parentElement).toBe(target);
    expect(hash.get('mode')).toBe('embedded');
    expect(hash.has('framed')).toBe(false);
    expect(iframe.style.width).toBe('100%');
    expect(iframe.style.minWidth).toBe('320px');
    expect(iframe.style.maxWidth).toBe('560px');
    expect(document.body.style.overflow).toBe('');
  });

  it('asks for a frameless block', () => {
    new GatewayCheckout(options()).mount(container(), { framed: false });
    expect(new URLSearchParams(new URL(frame().src).hash.slice(1)).get('framed')).toBe('0');
  });

  it('follows the height the widget announces', () => {
    new GatewayCheckout(options()).mount(container());
    fromWidget({ type: 'resize', height: 612 });
    expect(frame().style.height).toBe('612px');
  });

  it('stays mounted on every outcome: the merchant page reacts to the callbacks', () => {
    const onReady = vi.fn();
    const onFailed = vi.fn();
    const onExpired = vi.fn();
    const onCanceled = vi.fn();
    new GatewayCheckout(options({ onReady, onFailed, onExpired, onCanceled })).mount(container());
    fromWidget({ type: 'ready' });
    fromWidget({ type: 'failed', paymentIntentId: 'pi_1' });
    fromWidget({ type: 'expired', paymentIntentId: 'pi_1' });
    fromWidget({ type: 'canceled', paymentIntentId: 'pi_1' });
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledWith({ paymentIntentId: 'pi_1' });
    expect(onExpired).toHaveBeenCalledWith({ paymentIntentId: 'pi_1' });
    expect(onCanceled).toHaveBeenCalledWith({ paymentIntentId: 'pi_1' });
    expect(document.querySelector('iframe')).not.toBeNull();
  });

  it('unmounts and stops listening', () => {
    const onReady = vi.fn();
    const checkout = new GatewayCheckout(options({ onReady }));
    checkout.mount(container());
    const win = widgetWindow();
    checkout.destroy();
    fromWidget({ type: 'ready' }, { source: win });
    expect(document.querySelector('iframe')).toBeNull();
    expect(onReady).not.toHaveBeenCalled();
  });
});

describe('GatewayCheckout, S2', () => {
  it.each([
    ['another origin', { origin: 'https://evil.example' }],
    ['another window', { source: window }],
  ])('ignores a message from %s', (_label, init) => {
    const onSuccess = vi.fn();
    new GatewayCheckout(options({ onSuccess })).open();
    fromWidget({ type: 'success', paymentIntentId: 'pi_1', reference: 'GWP-1' }, init);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('answers the widget challenge on the checkout origin, through the iframe window', () => {
    new GatewayCheckout(options()).open();
    const postMessage = vi.spyOn(widgetWindow(), 'postMessage').mockImplementation(() => undefined);
    fromWidget({ type: 'challenge', nonce: 'n-1' });
    expect(postMessage).toHaveBeenCalledWith(
      challengeResponse('n-1'),
      CHECKOUT,
    );
  });

  it('does not answer a challenge from another origin', () => {
    new GatewayCheckout(options()).open();
    const postMessage = vi.spyOn(widgetWindow(), 'postMessage').mockImplementation(() => undefined);
    fromWidget({ type: 'challenge', nonce: 'n-1' }, { origin: 'https://evil.example' });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('never sends the amount nor the merchant name to the widget (S9)', () => {
    new GatewayCheckout(options({ amount: '1', merchantName: 'Fake' })).open();
    const hash = new URLSearchParams(new URL(frame().src).hash.slice(1));
    expect([...hash.keys()].sort()).toEqual(['mode', 'origin', 'pk', 'st']);
  });

  it('refuses an invalid checkout address at once', () => {
    expect(() => new GatewayCheckout(options({ checkoutUrl: 'not a url' }))).toThrow(/checkoutUrl/);
  });
});

describe('GatewayCheckout, the checkout never answers', () => {
  it.each([
    ['modal', (checkout: GatewayCheckout): void => {
      checkout.open();
    }],
    ['embedded block', (checkout: GatewayCheckout): void => {
      checkout.mount(container());
    }],
  ])('removes the %s and reports checkout_unavailable when ready never comes', (_label, show) => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const onClose = vi.fn();
    show(new GatewayCheckout(options({ onError, onClose })));
    vi.advanceTimersByTime(READY_TIMEOUT_MS - 1);
    expect(onError).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(onError).toHaveBeenCalledExactlyOnceWith({ code: 'checkout_unavailable' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('waits longer than the 5 s widget challenge', () => {
    expect(READY_TIMEOUT_MS).toBeGreaterThan(5000);
  });

  it('keeps the checkout once ready arrived in time', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    new GatewayCheckout(options({ onError })).open();
    fromWidget({ type: 'ready' });
    vi.advanceTimersByTime(READY_TIMEOUT_MS * 2);
    expect(document.querySelector('iframe')).not.toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it('forgets the deadline when the merchant removes the checkout first', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const checkout = new GatewayCheckout(options({ onError }));
    checkout.open();
    checkout.destroy();
    vi.advanceTimersByTime(READY_TIMEOUT_MS);
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('GatewayCheckout, focus (modal)', () => {
  function pageButton(): HTMLButtonElement {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    return button;
  }

  it('moves the focus into the checkout once its iframe has loaded', () => {
    pageButton();
    new GatewayCheckout(options()).open();
    frame().dispatchEvent(new Event('load'));
    expect(document.activeElement).toBe(frame());
  });

  it('gives the focus back to the element that opened the checkout', () => {
    const button = pageButton();
    const checkout = new GatewayCheckout(options());
    checkout.open();
    frame().dispatchEvent(new Event('load'));
    checkout.close();
    expect(document.activeElement).toBe(button);
  });

  it('leaves the focus on the merchant page for an embedded block', () => {
    const button = pageButton();
    new GatewayCheckout(options()).mount(container());
    frame().dispatchEvent(new Event('load'));
    expect(document.activeElement).toBe(button);
  });
});

describe('GatewayCheckout, options', () => {
  it.each(['', 'sk_test_abc', 'pk_abc', 'pk_test_', 'PK_TEST_abc'])('refuses the publishable key %j', (publishableKey) => {
    expect(() => new GatewayCheckout(options({ publishableKey }))).toThrow(/publishableKey/);
  });

  it.each(['pk_test_abc', 'pk_live_abc'])('accepts the publishable key %j', (publishableKey) => {
    expect(() => new GatewayCheckout(options({ publishableKey }))).not.toThrow();
  });

  it.each(['', '   '])('refuses the session token %j', (sessionToken) => {
    expect(() => new GatewayCheckout(options({ sessionToken }))).toThrow(/sessionToken/);
  });

  it('refuses to mount into a missing element', () => {
    const checkout = new GatewayCheckout(options());
    expect(() => {
      checkout.mount(document.getElementById('nowhere'));
    }).toThrow(/mount/);
    expect(document.querySelector('iframe')).toBeNull();
  });
});
