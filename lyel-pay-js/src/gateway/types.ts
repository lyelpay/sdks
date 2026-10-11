export type CheckoutLocale = 'fr' | 'en';

/** Closed list, as in the merchant portal: no free text, to avoid misleading labels. */
export type CheckoutButtonLabel = 'PAY' | 'PAY_AMOUNT' | 'CONFIRM_ORDER' | 'DONATE';

export interface CheckoutOutcome {
  paymentIntentId: string;
}

export interface CheckoutSuccess extends CheckoutOutcome {
  /** The `GWP-…` reference shown to the customer. */
  reference: string;
}

/** `checkout_unavailable`: the checkout never said it was ready (refused domain, failed handshake, network). */
export type CheckoutErrorCode = 'checkout_unavailable';

export interface CheckoutError {
  code: CheckoutErrorCode;
}

/**
 * These callbacks tell your page what the customer saw. None of them proves a payment: deliver the order only on
 * the `payment.completed` webhook, or after reading the intent on your server with your secret key.
 */
export interface GatewayCheckoutCallbacks {
  /** The widget is shown and talks to your page. */
  onReady?: () => void;
  onSuccess?: (success: CheckoutSuccess) => void;
  /** Final failure (code attempts exhausted, declined). Insufficient funds is not final and is not reported. */
  onFailed?: (outcome: CheckoutOutcome) => void;
  onExpired?: (outcome: CheckoutOutcome) => void;
  onCanceled?: (outcome: CheckoutOutcome) => void;
  /** Modal only: the customer closed the window. Closing does not cancel the intent; it can be reopened. */
  onClose?: () => void;
  /** The checkout could not be shown; it has been removed from the page. Offer another way to pay, or retry. */
  onError?: (error: CheckoutError) => void;
}

export interface GatewayCheckoutOptions extends GatewayCheckoutCallbacks {
  publishableKey: string;
  /** The `sessionToken` your server received when it created the intent. */
  sessionToken: string;
  /** Forces the language for this payment; defaults to the merchant setting, then French. */
  locale?: CheckoutLocale;
  /** Overrides the merchant button label for this payment, within the same closed list. */
  buttonLabel?: CheckoutButtonLabel;
  /** Checkout address; defaults to production. Use `https://dev.checkout.lyelpay.com` on dev, or a local widget. */
  checkoutUrl?: string;
  /** @deprecated Ignored: the amount always comes from the API. */
  amount?: string;
  /** @deprecated Ignored: the currency always comes from the API. */
  currency?: string;
  /** @deprecated Ignored: the merchant name always comes from the API. */
  merchantName?: string;
}

export interface MountOptions {
  /** `false` blends the block into your page, without border nor shadow. Defaults to `true`. */
  framed?: boolean;
}
