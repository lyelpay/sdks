import type { CheckoutButtonLabel, CheckoutLocale } from './types';

export const DEFAULT_CHECKOUT_URL = 'https://checkout.lyelpay.com';

export type EmbedSurface = 'modal' | 'embedded';

export interface LaunchUrlParams {
  checkoutUrl: string;
  publishableKey: string;
  sessionToken: string;
  /** The page that embeds the widget; the widget checks it against the merchant allowed domains (S2). */
  parentOrigin: string;
  surface: EmbedSurface;
  framed?: boolean;
  locale?: CheckoutLocale;
  buttonLabel?: CheckoutButtonLabel;
}

/** The origin every widget message must come from; throws on an address that is not http(s). */
export function checkoutOriginOf(checkoutUrl: string): string {
  let url: URL;
  try {
    url = new URL(checkoutUrl);
  } catch {
    throw new Error(`Lyel Pay: checkoutUrl is not a valid address: ${JSON.stringify(checkoutUrl)}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Lyel Pay: checkoutUrl must be an http(s) address: ${JSON.stringify(checkoutUrl)}`);
  }
  return url.origin;
}

/**
 * The parameters ride after the `#`: browsers send the fragment neither to the server nor in a Referer, so the
 * session token stays out of logs (S11). Amount and merchant name are never sent: the widget reads them from the API.
 */
export function buildLaunchUrl(params: LaunchUrlParams): string {
  const url = new URL('/', checkoutOriginOf(params.checkoutUrl));
  const hash = new URLSearchParams({
    pk: params.publishableKey,
    st: params.sessionToken,
    origin: params.parentOrigin,
    mode: params.surface,
  });
  if (params.framed === false) hash.set('framed', '0');
  if (params.locale) hash.set('locale', params.locale);
  if (params.buttonLabel) hash.set('button', params.buttonLabel);
  url.hash = hash.toString();
  return url.toString();
}
