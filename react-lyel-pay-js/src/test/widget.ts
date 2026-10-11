export const CHECKOUT = 'https://dev.checkout.lyelpay.com';

export function checkoutFrame(): HTMLIFrameElement | null {
  return document.querySelector('iframe');
}

export function launchParams(): URLSearchParams {
  const iframe = checkoutFrame();
  if (!iframe) throw new Error('no checkout iframe');
  return new URLSearchParams(new URL(iframe.src).hash.slice(1));
}

/** Posts a protocol v1 message as the checkout widget would, from its iframe and its origin. */
export function fromWidget(data: Record<string, unknown>): void {
  const source = checkoutFrame()?.contentWindow;
  if (!source) throw new Error('no checkout window');
  window.dispatchEvent(
    new MessageEvent('message', { data: { source: 'lyel-pay-checkout', version: 1, ...data }, origin: CHECKOUT, source }),
  );
}
