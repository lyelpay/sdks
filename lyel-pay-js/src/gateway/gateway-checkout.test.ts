// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GatewayCheckout } from './gateway-checkout';
import type { GatewayCheckoutOptions } from './types';
import { SDK_MESSAGE_SOURCE, WIDGET_MESSAGE_SOURCE } from './protocol';

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

function fromWidget(data: Record<string, unknown>, init: { origin?: string; source?: Window } = {}): void {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { source: WIDGET_MESSAGE_SOURCE, version: 1, ...data },
      origin: init.origin ?? CHECKOUT,
      source: init.source ?? widgetWindow(),
    }),
  );
}

afterEach(() => {
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
  function container(): HTMLElement {
    const element = document.createElement('div');
    document.body.appendChild(element);
    return element;
  }

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
      { source: SDK_MESSAGE_SOURCE, version: 1, type: 'challenge-response', nonce: 'n-1' },
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
    new GatewayCheckout({ ...options(), amount: '1', merchantName: 'Fake' }).open();
    const hash = new URLSearchParams(new URL(frame().src).hash.slice(1));
    expect([...hash.keys()].sort()).toEqual(['mode', 'origin', 'pk', 'st']);
  });

  it('refuses an invalid checkout address at once', () => {
    expect(() => new GatewayCheckout(options({ checkoutUrl: 'not a url' }))).toThrow(/checkoutUrl/);
  });
});
