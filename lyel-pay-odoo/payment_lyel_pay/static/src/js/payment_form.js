/** @odoo-module **/

import paymentForm from "@payment/js/payment_form";

paymentForm.include({
    /**
     * Intercept payment processing for Lyel Pay to mount the checkout
     * iframe rather than going through the default redirect flow.
     *
     * The iframe posts `LYEL_PAY_SUCCESS` / `LYEL_PAY_FAILED` messages
     * back to us. We use them only to redirect the customer to the
     * post-payment status page — the authoritative state change comes
     * from the webhook, not from the iframe.
     */
    async _processDirectFlow(providerCode, paymentOptionId, paymentMethodCode, processingValues) {
        if (providerCode !== "lyel_pay") {
            return this._super(...arguments);
        }

        const root = document.querySelector(".o_lyel_pay_checkout");
        if (!root) {
            return this._super(...arguments);
        }

        const data = root.dataset;
        const checkoutUrl = new URL(data.checkoutUrl);
        checkoutUrl.searchParams.set("pk", data.publishableKey);
        checkoutUrl.searchParams.set("st", data.sessionToken);
        checkoutUrl.searchParams.set("amount", data.amount);
        checkoutUrl.searchParams.set("currency", data.currency);
        checkoutUrl.searchParams.set("origin", data.origin);
        if (data.merchantName) {
            checkoutUrl.searchParams.set(
                "merchant_name",
                encodeURIComponent(data.merchantName),
            );
        }

        const container = root.querySelector(".o_lyel_pay_iframe_container");
        container.innerHTML = "";

        const iframe = document.createElement("iframe");
        iframe.src = checkoutUrl.toString();
        iframe.style.width = "100%";
        iframe.style.minHeight = "520px";
        iframe.style.border = "0";
        iframe.allow = "payment";
        container.appendChild(iframe);

        const iframeOrigin = checkoutUrl.origin;
        const messageHandler = (event) => {
            if (event.origin !== iframeOrigin) return;
            const payload = event.data || {};
            if (
                payload.type === "LYEL_PAY_SUCCESS" ||
                payload.type === "LYEL_PAY_FAILED"
            ) {
                window.removeEventListener("message", messageHandler);
                // The webhook will have already (or shortly will) flip the
                // transaction state; the status page polls until done.
                window.location.href = "/payment/status";
            }
        };
        window.addEventListener("message", messageHandler);
    },
});
