import { CheckoutState, CheckoutParams } from './state';

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency, minimumFractionDigits: 0 }).format(num);
}

function header(params: CheckoutParams): string {
  return `
    <div class="logo">
      <div class="logo-mark">L</div>
      <span class="logo-text">Lyel Pay</span>
    </div>
    ${params.isSandbox ? '<div class="sandbox-badge">⚠ Test Mode</div>' : ''}
    <div class="merchant-info">
      <div class="merchant-name">${escapeHtml(params.merchantName)}</div>
      <div class="amount-display">${escapeHtml(formatAmount(params.amount, params.currency))}</div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function render(root: HTMLElement, state: CheckoutState, params: CheckoutParams): void {
  switch (state.name) {
    case 'LOADING':
      root.innerHTML = `<div class="card" style="text-align:center;padding:48px 24px">
        <div class="spinner" style="border-top-color:var(--primary);border-color:var(--border)"></div>
      </div>`;
      break;

    case 'PHONE_INPUT':
      root.innerHTML = `<div class="card">
        ${header(params)}
        <div class="screen-title">Enter your phone</div>
        <div class="screen-subtitle">You'll receive an OTP to confirm payment.</div>
        <form id="phone-form">
          <div class="form-group">
            <label for="phone">Mobile Money number</label>
            <input id="phone" type="tel" placeholder="+237 6XX XXX XXX" autocomplete="tel" required />
            ${state.error ? `<div class="error-message">${escapeHtml(state.error)}</div>` : ''}
          </div>
          <button type="submit" class="btn btn-primary">Send OTP</button>
        </form>
      </div>`;
      break;

    case 'SENDING_OTP':
      root.innerHTML = `<div class="card">
        ${header(params)}
        <div class="screen-title">Sending OTP…</div>
        <div class="screen-subtitle">Please wait.</div>
        <button class="btn btn-primary" disabled><span class="spinner"></span>Sending…</button>
      </div>`;
      break;

    case 'OTP_INPUT':
      root.innerHTML = `<div class="card">
        ${header(params)}
        <div class="screen-title">Enter OTP</div>
        <div class="screen-subtitle">Sent to ${escapeHtml(state.phoneNumber)}</div>
        <form id="otp-form">
          <div class="form-group">
            <label for="otp">One-time password</label>
            <input id="otp" class="otp-input" type="text" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code" required />
            ${state.error ? `<div class="error-message">${escapeHtml(state.error)}</div>` : ''}
          </div>
          <button type="submit" class="btn btn-primary">Confirm payment</button>
        </form>
        <div class="resend-row">
          Didn't receive it?
          <a class="resend-link" id="resend-link">Resend</a>
        </div>
      </div>`;
      break;

    case 'CONFIRMING':
      root.innerHTML = `<div class="card">
        ${header(params)}
        <div class="screen-title">Confirming…</div>
        <div class="screen-subtitle">Please wait while we process your payment.</div>
        <button class="btn btn-primary" disabled><span class="spinner"></span>Confirming…</button>
      </div>`;
      break;

    case 'SUCCESS':
      root.innerHTML = `<div class="card">
        <div class="result-icon success">✓</div>
        <div class="result-title">Payment successful</div>
        <div class="result-message">Reference: ${escapeHtml(state.reference)}</div>
      </div>`;
      break;

    case 'FAILED':
      root.innerHTML = `<div class="card">
        <div class="result-icon failed">✕</div>
        <div class="result-title">Payment failed</div>
        <div class="result-message">${escapeHtml(state.reason)}</div>
      </div>`;
      break;
  }
}
