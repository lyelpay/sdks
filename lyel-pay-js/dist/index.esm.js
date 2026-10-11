/**
 * The `lyel-pay-checkout` postMessage protocol, v1, between the checkout widget (in its iframe) and the browser SDK
 * (in the merchant page). Every message carries `{ source, version }`; anything else is ignored.
 * None of the messages proves a payment: the merchant confirms with the webhook or a server-side read.
 */
const WIDGET_MESSAGE_SOURCE = 'lyel-pay-checkout';
const SDK_MESSAGE_SOURCE = 'lyel-pay-js';
const PROTOCOL_VERSION = 1;
function isFields(value) {
    return typeof value === 'object' && value !== null;
}

function text(fields, key) {
    const value = fields[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
}
function readMessage(fields) {
    const paymentIntentId = text(fields, 'paymentIntentId');
    switch (fields['type']) {
        case 'challenge': {
            const nonce = text(fields, 'nonce');
            return nonce ? { type: 'challenge', nonce } : null;
        }
        case 'ready':
            return { type: 'ready' };
        case 'close':
            return { type: 'close' };
        case 'resize': {
            const height = fields['height'];
            return typeof height === 'number' && Number.isFinite(height) && height >= 0 ? { type: 'resize', height } : null;
        }
        case 'success': {
            const reference = text(fields, 'reference');
            return paymentIntentId && reference ? { type: 'success', paymentIntentId, reference } : null;
        }
        case 'failed':
        case 'expired':
        case 'canceled':
            return paymentIntentId ? { type: fields['type'], paymentIntentId } : null;
        default:
            return null;
    }
}
/** A widget message, or null for anything else (other senders, the v0 protocol, malformed payloads). */
function parseWidgetMessage(data) {
    if (!isFields(data) || data['source'] !== WIDGET_MESSAGE_SOURCE || data['version'] !== PROTOCOL_VERSION)
        return null;
    return readMessage(data);
}

function challengeResponse(nonce) {
    return { source: SDK_MESSAGE_SOURCE, version: PROTOCOL_VERSION, type: 'challenge-response', nonce };
}

const MODAL_LAYER = '2147483000';
/** Shows the loading skeleton until the widget announces its real height. */
const INITIAL_BLOCK_HEIGHT = '400px';
function baseFrame(src, title) {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = title;
    Object.assign(iframe.style, { border: '0', background: 'transparent', colorScheme: 'normal', display: 'block' });
    return iframe;
}
/** Mode A: the widget draws the backdrop and the dialog itself, so the frame covers the viewport, transparent. */
function createModalFrame(src) {
    const iframe = baseFrame(src, 'Lyel Pay');
    Object.assign(iframe.style, {
        position: 'fixed',
        inset: '0',
        width: '100%',
        height: '100%',
        zIndex: MODAL_LAYER,
    });
    return iframe;
}
/** Mode B: as wide as its container (320 to 560 px); the height follows the widget `resize` messages. */
function createEmbeddedFrame(src) {
    const iframe = baseFrame(src, 'Lyel Pay');
    Object.assign(iframe.style, { width: '100%', minWidth: '320px', maxWidth: '560px', height: INITIAL_BLOCK_HEIGHT });
    return iframe;
}

const DEFAULT_CHECKOUT_URL = 'https://checkout.lyelpay.com';
/** The origin every widget message must come from; throws on an address that is not http(s). */
function checkoutOriginOf(checkoutUrl) {
    let url;
    try {
        url = new URL(checkoutUrl);
    }
    catch (_a) {
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
function buildLaunchUrl(params) {
    const url = new URL('/', checkoutOriginOf(params.checkoutUrl));
    const hash = new URLSearchParams({
        pk: params.publishableKey,
        st: params.sessionToken,
        origin: params.parentOrigin,
        mode: params.surface,
    });
    if (params.framed === false)
        hash.set('framed', '0');
    if (params.locale)
        hash.set('locale', params.locale);
    if (params.buttonLabel)
        hash.set('button', params.buttonLabel);
    url.hash = hash.toString();
    return url.toString();
}

/**
 * Mode A takes the page over: no scroll behind the modal, and the keyboard focus goes into the checkout.
 * The returned function gives both back, focus to the element that opened the checkout.
 */
function takeOverPage() {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = previousOverflow;
        if (previousFocus instanceof HTMLElement)
            previousFocus.focus();
    };
}

const PUBLISHABLE_KEY = /^pk_(test|live)_.+$/;
/** Fails fast on a misconfigured integration, before anything is added to the page. */
function assertValidOptions(options) {
    if (!PUBLISHABLE_KEY.test(options.publishableKey)) {
        throw new Error('Lyel Pay: publishableKey must start with pk_test_ or pk_live_ (never use your secret key here)');
    }
    if (options.sessionToken.trim() === '') {
        throw new Error('Lyel Pay: sessionToken is empty; pass the sessionToken your server received with the intent');
    }
}
/** `mount(document.getElementById(...))` with a wrong id passes null: say so instead of failing later. */
function assertMountTarget(container) {
    if (!(container instanceof HTMLElement)) {
        throw new Error('Lyel Pay: mount() needs an element of the page; the container is missing');
    }
}

/**
 * How long the checkout has to say `ready`: its 5 s parent challenge, plus the iframe load and the status read on a
 * slow mobile network (the same 30 s budget as the Lyel Pay app).
 */
const READY_TIMEOUT_MS = 30000;
/**
 * Shows the Lyel Pay checkout in the merchant page: `open()` for the modal (mode A), `mount()` for the embedded
 * block (mode B). The hosted page (mode C) needs no SDK: redirect to the `checkoutUrl` your server received.
 */
class GatewayCheckout {
    constructor(options) {
        var _a;
        this.options = options;
        this.current = null;
        assertValidOptions(options);
        this.checkoutUrl = (_a = options.checkoutUrl) !== null && _a !== void 0 ? _a : DEFAULT_CHECKOUT_URL;
        this.checkoutOrigin = checkoutOriginOf(this.checkoutUrl);
    }
    /** Mode A: a window over the page; full screen on mobile. Does nothing if the checkout is already shown. */
    open() {
        if (this.current)
            return;
        const iframe = createModalFrame(this.launchUrl('modal'));
        iframe.addEventListener('load', () => {
            iframe.focus();
        });
        this.show(iframe, 'modal', document.body, takeOverPage());
    }
    /** Mode B: a block inside `container`, as wide as it and as tall as its content. Throws on a missing container. */
    mount(container, mountOptions = {}) {
        assertMountTarget(container);
        if (this.current)
            return;
        const iframe = createEmbeddedFrame(this.launchUrl('embedded', mountOptions.framed));
        this.show(iframe, 'embedded', container, () => undefined);
    }
    /** Removes the modal and reports `onClose`. Closing never cancels the intent. */
    close() {
        var _a, _b;
        if (!this.current)
            return;
        this.destroy();
        (_b = (_a = this.options).onClose) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    /** Removes the checkout from the page and stops listening, without any callback. */
    destroy() {
        const current = this.current;
        if (!current)
            return;
        this.current = null;
        clearTimeout(current.readyDeadline);
        current.stopListening();
        current.restorePage();
        current.iframe.remove();
    }
    launchUrl(surface, framed) {
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
    show(iframe, surface, parent, restorePage) {
        const listener = (event) => {
            this.receive(event);
        };
        // Listening starts before the iframe loads, so the widget challenge is never missed.
        window.addEventListener('message', listener);
        this.current = {
            iframe,
            surface,
            restorePage,
            readyDeadline: setTimeout(() => {
                this.giveUp();
            }, READY_TIMEOUT_MS),
            stopListening: () => {
                window.removeEventListener('message', listener);
            },
        };
        parent.appendChild(iframe);
    }
    /** A refused domain or a failed handshake leaves the widget silent: never leave the page stuck behind it. */
    giveUp() {
        var _a, _b;
        this.destroy();
        (_b = (_a = this.options).onError) === null || _b === void 0 ? void 0 : _b.call(_a, { code: 'checkout_unavailable' });
    }
    /** S2: only the checkout origin, and only our own iframe, may talk to the SDK. */
    receive(event) {
        const current = this.current;
        const widget = current === null || current === void 0 ? void 0 : current.iframe.contentWindow;
        if (!current || !widget || event.origin !== this.checkoutOrigin || event.source !== widget)
            return;
        const message = parseWidgetMessage(event.data);
        if (message)
            this.handle(message, current, widget);
    }
    handle(message, current, widget) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        switch (message.type) {
            case 'challenge':
                widget.postMessage(challengeResponse(message.nonce), this.checkoutOrigin);
                return;
            case 'ready':
                clearTimeout(current.readyDeadline);
                (_b = (_a = this.options).onReady) === null || _b === void 0 ? void 0 : _b.call(_a);
                return;
            case 'resize':
                if (current.surface === 'embedded')
                    current.iframe.style.height = `${Math.ceil(message.height)}px`;
                return;
            case 'success':
                (_d = (_c = this.options).onSuccess) === null || _d === void 0 ? void 0 : _d.call(_c, { paymentIntentId: message.paymentIntentId, reference: message.reference });
                return;
            case 'failed':
                (_f = (_e = this.options).onFailed) === null || _f === void 0 ? void 0 : _f.call(_e, { paymentIntentId: message.paymentIntentId });
                return;
            case 'expired':
                (_h = (_g = this.options).onExpired) === null || _h === void 0 ? void 0 : _h.call(_g, { paymentIntentId: message.paymentIntentId });
                return;
            case 'canceled':
                (_k = (_j = this.options).onCanceled) === null || _k === void 0 ? void 0 : _k.call(_j, { paymentIntentId: message.paymentIntentId });
                return;
            case 'close':
                if (current.surface === 'modal')
                    this.close();
                return;
        }
    }
}

export { DEFAULT_CHECKOUT_URL, GatewayCheckout };
//# sourceMappingURL=index.esm.js.map
