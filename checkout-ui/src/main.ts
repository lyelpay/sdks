import { StateMachine, CheckoutParams } from './state';
import { render } from './ui';
import { requestOtp, confirmPayment } from './api';
import './styles.css';

function parseParams(): CheckoutParams | null {
  const p = new URLSearchParams(window.location.search);
  const pk = p.get('pk');
  const sessionToken = p.get('st');
  const amount = p.get('amount');
  const currency = p.get('currency');
  const origin = p.get('origin');

  if (!pk || !sessionToken || !amount || !currency || !origin) return null;

  return {
    pk,
    sessionToken,
    amount,
    currency,
    origin: decodeURIComponent(origin),
    merchantName: p.get('merchant_name') ? decodeURIComponent(p.get('merchant_name')!) : 'Merchant',
    locale: p.get('locale') ?? 'fr',
    isSandbox: pk.startsWith('pk_test_'),
  };
}

function postToParent(origin: string, message: Record<string, unknown>): void {
  window.parent.postMessage(message, origin);
}

function init(): void {
  const root = document.getElementById('app')!;
  const params = parseParams();

  if (!params) {
    root.innerHTML = '<div class="card"><div class="result-icon failed">✕</div><div class="result-title">Invalid checkout link</div></div>';
    return;
  }

  const machine = new StateMachine();
  const apiOpts = { pk: params.pk, sessionToken: params.sessionToken };

  machine.subscribe((state) => {
    render(root, state, params);
    attachHandlers(root, state.name, params, machine, apiOpts);

    if (state.name === 'SUCCESS') {
      postToParent(params.origin, { type: 'LYEL_PAY_SUCCESS', reference: state.reference });
    }
    if (state.name === 'FAILED') {
      postToParent(params.origin, { type: 'LYEL_PAY_FAILED', reason: state.reason });
    }
  });

  machine.transition({ name: 'PHONE_INPUT' });
}

function attachHandlers(
  root: HTMLElement,
  stateName: string,
  params: CheckoutParams,
  machine: StateMachine,
  apiOpts: { pk: string; sessionToken: string },
): void {
  if (stateName === 'PHONE_INPUT') {
    root.querySelector<HTMLFormElement>('#phone-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = (root.querySelector<HTMLInputElement>('#phone')?.value ?? '').trim();
      if (!phone) return;

      machine.transition({ name: 'SENDING_OTP', phoneNumber: phone });
      try {
        await requestOtp(apiOpts, phone);
        machine.transition({ name: 'OTP_INPUT', phoneNumber: phone });
      } catch (err) {
        machine.transition({ name: 'PHONE_INPUT', error: (err as Error).message });
      }
    });
  }

  if (stateName === 'OTP_INPUT') {
    const currentState = machine.current;
    const phoneNumber = currentState.name === 'OTP_INPUT' ? currentState.phoneNumber : '';

    root.querySelector<HTMLFormElement>('#otp-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otp = (root.querySelector<HTMLInputElement>('#otp')?.value ?? '').trim();
      if (otp.length !== 6) return;

      machine.transition({ name: 'CONFIRMING', phoneNumber });
      try {
        const result = await confirmPayment(apiOpts, otp);
        if (result.status === 'COMPLETED') {
          machine.transition({ name: 'SUCCESS', reference: result.reference });
        } else {
          machine.transition({ name: 'FAILED', reason: 'Payment could not be completed.' });
        }
      } catch (err) {
        machine.transition({ name: 'OTP_INPUT', phoneNumber, error: (err as Error).message });
      }
    });

    root.querySelector('#resend-link')?.addEventListener('click', async () => {
      machine.transition({ name: 'SENDING_OTP', phoneNumber });
      try {
        await requestOtp(apiOpts, phoneNumber);
        machine.transition({ name: 'OTP_INPUT', phoneNumber });
      } catch (err) {
        machine.transition({ name: 'OTP_INPUT', phoneNumber, error: (err as Error).message });
      }
    });
  }

  // Close button message from parent
  window.addEventListener('message', (ev) => {
    if (ev.data?.type === 'LYEL_PAY_CLOSE') {
      postToParent(params.origin, { type: 'LYEL_PAY_CLOSED' });
    }
  }, { once: false });
}

init();
