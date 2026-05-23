export interface GatewayCheckoutOptions {
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
}

const DEFAULT_CHECKOUT_URL = 'https://checkout.lyelpay.com';

export class GatewayCheckout {
  private iframe: HTMLIFrameElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private readonly opts: GatewayCheckoutOptions;
  private bound: ((ev: MessageEvent) => void) | null = null;

  constructor(opts: GatewayCheckoutOptions) {
    this.opts = opts;
  }

  open(container?: HTMLElement): void {
    if (this.iframe) return;

    const origin = window.location.origin;
    const base = this.opts.checkoutUrl ?? DEFAULT_CHECKOUT_URL;
    const params = new URLSearchParams({
      pk: this.opts.publishableKey,
      st: this.opts.sessionToken,
      amount: this.opts.amount,
      currency: this.opts.currency,
      origin: origin,
      merchant_name: this.opts.merchantName ?? '',
      locale: this.opts.locale ?? 'fr',
    });
    const src = `${base}?${params.toString()}`;

    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99999',
    });

    this.iframe = document.createElement('iframe');
    Object.assign(this.iframe.style, {
      width: '100%',
      maxWidth: '420px',
      height: '560px',
      border: 'none',
      borderRadius: '12px',
      background: 'white',
    });
    this.iframe.src = src;
    this.iframe.allow = 'payment';

    this.overlay.appendChild(this.iframe);
    (container ?? document.body).appendChild(this.overlay);

    this.bound = (ev: MessageEvent) => this.handleMessage(ev, origin);
    window.addEventListener('message', this.bound);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  close(): void {
    this.iframe?.contentWindow?.postMessage({ type: 'LYEL_PAY_CLOSE' }, '*');
    this.destroy();
    this.opts.onClose?.();
  }

  destroy(): void {
    if (this.bound) {
      window.removeEventListener('message', this.bound);
      this.bound = null;
    }
    this.overlay?.remove();
    this.overlay = null;
    this.iframe = null;
  }

  private handleMessage(ev: MessageEvent, _origin: string): void {
    if (!ev.data || typeof ev.data !== 'object') return;
    const { type } = ev.data as { type: string; reference?: string; reason?: string };

    if (type === 'LYEL_PAY_SUCCESS') {
      this.opts.onSuccess?.(ev.data.reference as string);
      this.destroy();
    } else if (type === 'LYEL_PAY_FAILED') {
      this.opts.onFailed?.(ev.data.reason as string);
      this.destroy();
    } else if (type === 'LYEL_PAY_CLOSED') {
      this.destroy();
      this.opts.onClose?.();
    }
  }
}
