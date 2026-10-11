import { createEmbeddedFrame, createModalFrame } from './frames';
import { buildLaunchUrl, checkoutOriginOf, DEFAULT_CHECKOUT_URL, type EmbedSurface } from './launch-url';
import { challengeResponse, parseWidgetMessage, type WidgetMessage } from './protocol';
import type { GatewayCheckoutOptions, MountOptions } from './types';

interface OpenCheckout {
  iframe: HTMLIFrameElement;
  surface: EmbedSurface;
  stopListening: () => void;
  restorePage: () => void;
}

function lockPageScroll(): () => void {
  const previous = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = previous;
  };
}

/**
 * Shows the Lyel Pay checkout in the merchant page: `open()` for the modal (mode A), `mount()` for the embedded
 * block (mode B). The hosted page (mode C) needs no SDK: redirect to the `checkoutUrl` your server received.
 */
export class GatewayCheckout {
  private readonly checkoutUrl: string;
  private readonly checkoutOrigin: string;
  private current: OpenCheckout | null = null;

  constructor(private readonly options: GatewayCheckoutOptions) {
    this.checkoutUrl = options.checkoutUrl ?? DEFAULT_CHECKOUT_URL;
    this.checkoutOrigin = checkoutOriginOf(this.checkoutUrl);
  }

  /** Mode A: a window over the page; full screen on mobile. Does nothing if the checkout is already shown. */
  open(): void {
    if (this.current) return;
    const iframe = createModalFrame(this.launchUrl('modal'));
    this.show(iframe, 'modal', document.body, lockPageScroll());
  }

  /** Mode B: a block inside `container`, as wide as it and as tall as its content. */
  mount(container: HTMLElement, mountOptions: MountOptions = {}): void {
    if (this.current) return;
    const iframe = createEmbeddedFrame(this.launchUrl('embedded', mountOptions.framed));
    this.show(iframe, 'embedded', container, () => undefined);
  }

  /** Removes the modal and reports `onClose`. Closing never cancels the intent. */
  close(): void {
    if (!this.current) return;
    this.destroy();
    this.options.onClose?.();
  }

  /** Removes the checkout from the page and stops listening, without any callback. */
  destroy(): void {
    const current = this.current;
    if (!current) return;
    this.current = null;
    current.stopListening();
    current.restorePage();
    current.iframe.remove();
  }

  private launchUrl(surface: EmbedSurface, framed?: boolean): string {
    return buildLaunchUrl({
      checkoutUrl: this.checkoutUrl,
      publishableKey: this.options.publishableKey,
      sessionToken: this.options.sessionToken,
      parentOrigin: window.location.origin,
      surface,
      framed,
      locale: this.options.locale,
      buttonLabel: this.options.buttonLabel,
    });
  }

  private show(iframe: HTMLIFrameElement, surface: EmbedSurface, parent: HTMLElement, restorePage: () => void): void {
    const listener = (event: MessageEvent<unknown>): void => {
      this.receive(event);
    };
    // Listening starts before the iframe loads, so the widget challenge is never missed.
    window.addEventListener('message', listener);
    this.current = {
      iframe,
      surface,
      restorePage,
      stopListening: (): void => {
        window.removeEventListener('message', listener);
      },
    };
    parent.appendChild(iframe);
  }

  /** S2: only the checkout origin, and only our own iframe, may talk to the SDK. */
  private receive(event: MessageEvent<unknown>): void {
    const current = this.current;
    const widget = current?.iframe.contentWindow;
    if (!current || !widget || event.origin !== this.checkoutOrigin || event.source !== widget) return;
    const message = parseWidgetMessage(event.data);
    if (message) this.handle(message, current, widget);
  }

  private handle(message: WidgetMessage, current: OpenCheckout, widget: Window): void {
    switch (message.type) {
      case 'challenge':
        widget.postMessage(challengeResponse(message.nonce), this.checkoutOrigin);
        return;
      case 'ready':
        this.options.onReady?.();
        return;
      case 'resize':
        if (current.surface === 'embedded') current.iframe.style.height = `${Math.ceil(message.height)}px`;
        return;
      case 'success':
        this.options.onSuccess?.({ paymentIntentId: message.paymentIntentId, reference: message.reference });
        return;
      case 'failed':
        this.options.onFailed?.({ paymentIntentId: message.paymentIntentId });
        return;
      case 'expired':
        this.options.onExpired?.({ paymentIntentId: message.paymentIntentId });
        return;
      case 'canceled':
        this.options.onCanceled?.({ paymentIntentId: message.paymentIntentId });
        return;
      case 'close':
        if (current.surface === 'modal') this.close();
        return;
    }
  }
}
