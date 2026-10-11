function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var eventemitter3 = {exports: {}};

(function (module) {

	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';

	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @private
	 */
	function Events() {}

	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);

	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}

	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Add a listener for a given event.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} once Specify if the listener is a one-time listener.
	 * @returns {EventEmitter}
	 * @private
	 */
	function addListener(emitter, event, fn, context, once) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('The listener must be a function');
	  }

	  var listener = new EE(fn, context || emitter, once)
	    , evt = prefix ? prefix + event : event;

	  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
	  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
	  else emitter._events[evt] = [emitter._events[evt], listener];

	  return emitter;
	}

	/**
	 * Clear event by name.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} evt The Event name.
	 * @private
	 */
	function clearEvent(emitter, evt) {
	  if (--emitter._eventsCount === 0) emitter._events = new Events();
	  else delete emitter._events[evt];
	}

	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;

	  if (this._eventsCount === 0) return names;

	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Array} The registered listeners.
	 * @public
	 */
	EventEmitter.prototype.listeners = function listeners(event) {
	  var evt = prefix ? prefix + event : event
	    , handlers = this._events[evt];

	  if (!handlers) return [];
	  if (handlers.fn) return [handlers.fn];

	  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
	    ee[i] = handlers[i].fn;
	  }

	  return ee;
	};

	/**
	 * Return the number of listeners listening to a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Number} The number of listeners.
	 * @public
	 */
	EventEmitter.prototype.listenerCount = function listenerCount(event) {
	  var evt = prefix ? prefix + event : event
	    , listeners = this._events[evt];

	  if (!listeners) return 0;
	  if (listeners.fn) return 1;
	  return listeners.length;
	};

	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Add a listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  return addListener(this, event, fn, context, false);
	};

	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  return addListener(this, event, fn, context, true);
	};

	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {*} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return this;
	  if (!fn) {
	    clearEvent(this, evt);
	    return this;
	  }

	  var listeners = this._events[evt];

	  if (listeners.fn) {
	    if (
	      listeners.fn === fn &&
	      (!once || listeners.once) &&
	      (!context || listeners.context === context)
	    ) {
	      clearEvent(this, evt);
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	        listeners[i].fn !== fn ||
	        (once && !listeners[i].once) ||
	        (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }

	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else clearEvent(this, evt);
	  }

	  return this;
	};

	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {(String|Symbol)} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;

	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) clearEvent(this, evt);
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;

	//
	// Expose the module.
	//
	{
	  module.exports = EventEmitter;
	} 
} (eventemitter3));

var eventemitter3Exports = eventemitter3.exports;
var EventEmitter = /*@__PURE__*/getDefaultExportFromCjs(eventemitter3Exports);

const SANDBOX_BASE_URL = 'https://sandbox.lyelpay.com';
const PROD_BASE_URL = 'https://api.lyelpay.com';

class LyelPay extends EventEmitter {
    constructor(options) {
        super();
        this.token = null;
        this.apiKey = options.apiKey;
        this.env = options.env || 'sandbox';
        this.baseUrl = this.env === 'production'
            ? PROD_BASE_URL
            : SANDBOX_BASE_URL;
    }
    async createIntention(operation, data) {
        try {
            const res = await fetch(`${this.baseUrl}/intention/${operation}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok)
                throw new Error(result.message || 'Intention creation failed');
            return result;
        }
        catch (err) {
            this.emit('error', err);
            throw err;
        }
    }
    async initOtp(params) {
        try {
            const res = await fetch(`${this.baseUrl}/auth/otp/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                },
                body: JSON.stringify(params),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'OTP init failed');
            }
        }
        catch (err) {
            this.emit('error', err);
            throw err;
        }
    }
    async verifyOtp(params) {
        try {
            const res = await fetch(`${this.baseUrl}/auth/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                },
                body: JSON.stringify(params),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message || 'OTP verification failed');
            this.token = data.token;
        }
        catch (err) {
            this.emit('error', err);
            throw err;
        }
    }
    async charge(params) {
        try {
            const res = await fetch(`${this.baseUrl}/payment/charge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    'x-api-key': this.apiKey,
                },
                body: JSON.stringify(params),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message || 'Charge failed');
            return data;
        }
        catch (err) {
            this.emit('error', err);
            throw err;
        }
    }
    getToken() {
        return this.token;
    }
}

const getLyelGlobal = () => {
    if (typeof window === 'undefined')
        return {};
    window.__LYEL__PAY__ = window.__LYEL__PAY__ || {};
    return window.__LYEL__PAY__;
};
const setLyelInstance = (instance) => {
    const global = getLyelGlobal();
    global._lyelPayInstance = instance;
};

const loadLyelPay = (options) => {
    const global = getLyelGlobal();
    if (global._lyelPayInstance) {
        return global._lyelPayInstance;
    }
    const instance = new LyelPay(options);
    setLyelInstance(instance);
    return instance;
};

var OPERATION_TYPE_ENDPOINTS;
(function (OPERATION_TYPE_ENDPOINTS) {
    OPERATION_TYPE_ENDPOINTS["DEPOSIT"] = "deposit";
    OPERATION_TYPE_ENDPOINTS["WITHDRAW"] = "withdraw";
    OPERATION_TYPE_ENDPOINTS["PAYMENT"] = "payment";
    OPERATION_TYPE_ENDPOINTS["TRANSFER"] = "transfer";
})(OPERATION_TYPE_ENDPOINTS || (OPERATION_TYPE_ENDPOINTS = {}));

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
 * The `lyel-pay-checkout` postMessage protocol, v1. The widget (checkout-ui, `src/messaging/contract.ts`) is the
 * source of truth: widget messages are `{ source: 'lyel-pay-checkout', version: 1, type, ...payload }`.
 * None of them proves a payment: confirm it with the `payment.completed` webhook or a server-side read.
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
/** A widget message, or null for anything else (other senders, v0 protocol, malformed payloads). */
function parseWidgetMessage(data) {
    if (!isFields(data) || data['source'] !== WIDGET_MESSAGE_SOURCE || data['version'] !== PROTOCOL_VERSION)
        return null;
    return readMessage(data);
}
function challengeResponse(nonce) {
    return { source: SDK_MESSAGE_SOURCE, version: PROTOCOL_VERSION, type: 'challenge-response', nonce };
}

function lockPageScroll() {
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
class GatewayCheckout {
    constructor(options) {
        var _a;
        this.options = options;
        this.current = null;
        this.checkoutUrl = (_a = options.checkoutUrl) !== null && _a !== void 0 ? _a : DEFAULT_CHECKOUT_URL;
        this.checkoutOrigin = checkoutOriginOf(this.checkoutUrl);
    }
    /** Mode A: a window over the page; full screen on mobile. Does nothing if the checkout is already shown. */
    open() {
        if (this.current)
            return;
        const iframe = createModalFrame(this.launchUrl('modal'));
        this.show(iframe, 'modal', document.body, lockPageScroll());
    }
    /** Mode B: a block inside `container`, as wide as it and as tall as its content. */
    mount(container, mountOptions = {}) {
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
            stopListening: () => {
                window.removeEventListener('message', listener);
            },
        };
        parent.appendChild(iframe);
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

export { DEFAULT_CHECKOUT_URL, GatewayCheckout, OPERATION_TYPE_ENDPOINTS, loadLyelPay };
//# sourceMappingURL=index.esm.js.map
