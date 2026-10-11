type CheckoutLocale = 'fr' | 'en';
/** Closed list, as in the merchant portal: no free text, to avoid misleading labels. */
type CheckoutButtonLabel = 'PAY' | 'PAY_AMOUNT' | 'CONFIRM_ORDER' | 'DONATE';
interface CheckoutOutcome {
    paymentIntentId: string;
}
interface CheckoutSuccess extends CheckoutOutcome {
    /** The `GWP-…` reference shown to the customer. */
    reference: string;
}
/** `checkout_unavailable`: the checkout never said it was ready (refused domain, failed handshake, network). */
type CheckoutErrorCode = 'checkout_unavailable';
interface CheckoutError {
    code: CheckoutErrorCode;
}
/**
 * These callbacks tell your page what the customer saw. None of them proves a payment: deliver the order only on
 * the `payment.completed` webhook, or after reading the intent on your server with your secret key.
 */
interface GatewayCheckoutCallbacks {
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
interface GatewayCheckoutOptions extends GatewayCheckoutCallbacks {
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
interface MountOptions {
    /** `false` blends the block into your page, without border nor shadow. Defaults to `true`. */
    framed?: boolean;
}

/**
 * Shows the Lyel Pay checkout in the merchant page: `open()` for the modal (mode A), `mount()` for the embedded
 * block (mode B). The hosted page (mode C) needs no SDK: redirect to the `checkoutUrl` your server received.
 */
declare class GatewayCheckout {
    private readonly options;
    private readonly checkoutUrl;
    private readonly checkoutOrigin;
    private current;
    constructor(options: GatewayCheckoutOptions);
    /** Mode A: a window over the page; full screen on mobile. Does nothing if the checkout is already shown. */
    open(): void;
    /** Mode B: a block inside `container`, as wide as it and as tall as its content. Throws on a missing container. */
    mount(container: HTMLElement | null, mountOptions?: MountOptions): void;
    /** Removes the modal and reports `onClose`. Closing never cancels the intent. */
    close(): void;
    /** Removes the checkout from the page and stops listening, without any callback. */
    destroy(): void;
    private launchUrl;
    private show;
    /** A refused domain or a failed handshake leaves the widget silent: never leave the page stuck behind it. */
    private giveUp;
    /** S2: only the checkout origin, and only our own iframe, may talk to the SDK. */
    private receive;
    private handle;
}

declare const DEFAULT_CHECKOUT_URL = "https://checkout.lyelpay.com";

export { DEFAULT_CHECKOUT_URL, GatewayCheckout };
export type { CheckoutButtonLabel, CheckoutError, CheckoutErrorCode, CheckoutLocale, CheckoutOutcome, CheckoutSuccess, GatewayCheckoutCallbacks, GatewayCheckoutOptions, MountOptions };
