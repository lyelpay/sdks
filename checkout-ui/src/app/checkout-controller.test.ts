import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutRequestError, type CheckoutApi } from '../api/checkout-api';
import type { CheckoutSession, OtpProgress, Surface } from '../domain/session';
import type { WidgetMessage } from '@lyel/checkout-protocol';
import { CheckoutController, type ControllerOptions } from './checkout-controller';
import type { CheckoutHost } from './checkout-host';

const NOW = new Date('2026-10-10T10:00:00Z');

const otp: OtpProgress = {
  channel: 'TEST',
  maskedPhoneNumber: '06 ••• •• 67',
  expiresAt: new Date('2026-10-10T10:05:00Z'),
  remainingAttempts: 5,
  remainingSends: 2,
  resendAvailableAt: NOW,
};

function session(overrides: Partial<CheckoutSession> = {}): CheckoutSession {
  return {
    id: 'pi_1',
    status: 'PENDING',
    reference: 'GWP-1',
    amount: '15000',
    currency: 'XAF',
    description: null,
    mode: 'LIVE',
    locale: 'fr',
    expiresAt: new Date('2026-10-10T10:15:00Z'),
    merchant: { name: 'Ets Hassani', logoPath: null, primaryColor: null, buttonLabel: 'PAY', showSecuredBadge: true },
    returnUrls: { success: 'https://shop.cg/ok', cancel: 'https://shop.cg/ko' },
    customerPhoneNumber: null,
    otp: null,
    embedding: { allowedDomains: ['shop.cg'], allowLocalhost: false },
    ...overrides,
  };
}

interface FakeApi {
  readStatus: ReturnType<typeof vi.fn<CheckoutApi['readStatus']>>;
  requestCode: ReturnType<typeof vi.fn<CheckoutApi['requestCode']>>;
  confirm: ReturnType<typeof vi.fn<CheckoutApi['confirm']>>;
  cancel: ReturnType<typeof vi.fn<CheckoutApi['cancel']>>;
}

function fakeApi(): FakeApi {
  return {
    readStatus: vi.fn<CheckoutApi['readStatus']>().mockResolvedValue(session()),
    requestCode: vi.fn<CheckoutApi['requestCode']>().mockResolvedValue(otp),
    confirm: vi.fn<CheckoutApi['confirm']>().mockResolvedValue(undefined),
    cancel: vi.fn<CheckoutApi['cancel']>(),
  };
}

function fakeHost(): { host: CheckoutHost; messages: WidgetMessage[]; redirects: string[] } {
  const messages: WidgetMessage[] = [];
  const redirects: string[] = [];
  return {
    host: {
      notify: (message): void => {
        messages.push(message);
      },
      redirect: (url): void => {
        redirects.push(url);
      },
    },
    messages,
    redirects,
  };
}

function controllerWith(
  api: FakeApi,
  host: CheckoutHost,
  overrides: Partial<ControllerOptions> & { surface?: Surface } = {},
): CheckoutController {
  return new CheckoutController({
    api,
    host,
    surface: 'embedded',
    parentOrigin: 'https://shop.cg',
    observedParentOrigin: 'https://shop.cg',
    expectedIntentId: null,
    confirmParent: () => Promise.resolve(true),
    onChange: () => undefined,
    ...overrides,
  });
}

const apiError = (status: number, code: string): CheckoutRequestError => new CheckoutRequestError({ kind: 'api', status, code });

async function onCodeStep(controller: CheckoutController): Promise<void> {
  await controller.start();
  controller.submitPhone('06 123 45 67');
  await vi.runOnlyPendingTimersAsync();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CheckoutController', () => {
  it('debits once on a double confirm', async () => {
    const api = fakeApi();
    const controller = controllerWith(api, fakeHost().host);
    await onCodeStep(controller);
    const first = controller.confirm('000000');
    const second = controller.confirm('000000');
    await Promise.all([first, second]);
    expect(api.confirm).toHaveBeenCalledTimes(1);
    expect(controller.snapshot.state).toEqual({ step: 'success', alreadyPaid: false });
  });

  it('re-reads the status on a 409 and lands on the success', async () => {
    const api = fakeApi();
    const controller = controllerWith(api, fakeHost().host);
    await onCodeStep(controller);
    api.confirm.mockRejectedValueOnce(apiError(409, 'E_GATEWAY_PAYMENT_IN_PROGRESS'));
    api.readStatus.mockResolvedValue(session({ status: 'COMPLETED' }));
    await controller.confirm('000000');
    expect(controller.snapshot.state.step).toBe('processing');
    await vi.advanceTimersByTimeAsync(1500);
    expect(api.readStatus).toHaveBeenCalledTimes(2);
    expect(controller.snapshot.state).toEqual({ step: 'success', alreadyPaid: false });
  });

  it('runs the S2 check again when the status is re-read after a network error', async () => {
    const api = fakeApi();
    const { host, messages } = fakeHost();
    api.readStatus.mockRejectedValueOnce(new CheckoutRequestError({ kind: 'network' }));
    const controller = controllerWith(api, host, { observedParentOrigin: 'https://evil.example' });
    await controller.start();
    expect(controller.snapshot.state.step).toBe('networkError');
    controller.retry();
    await vi.runOnlyPendingTimersAsync();
    expect(controller.snapshot.state.step).toBe('unavailable');
    expect(messages).toEqual([]);
  });

  it('accepts the session after a network error once the checks pass, and says ready', async () => {
    const api = fakeApi();
    const { host, messages } = fakeHost();
    api.readStatus.mockRejectedValueOnce(new CheckoutRequestError({ kind: 'network' }));
    const controller = controllerWith(api, host);
    await controller.start();
    controller.retry();
    await vi.runOnlyPendingTimersAsync();
    expect(controller.snapshot.state.step).toBe('phone');
    expect(messages).toEqual([{ type: 'ready' }]);
  });

  it.each([
    ['a domain outside the list', { parentOrigin: 'https://evil.example', observedParentOrigin: 'https://evil.example' }],
    ['a forged origin', { parentOrigin: 'https://shop.cg', observedParentOrigin: 'https://evil.example' }],
  ])('sends nothing to the parent on %s', async (_label, origins) => {
    const api = fakeApi();
    api.readStatus.mockResolvedValue(session({ status: 'COMPLETED' }));
    const { host, messages } = fakeHost();
    const controller = controllerWith(api, host, origins);
    await controller.start();
    controller.close();
    expect(controller.snapshot.state.step).toBe('unavailable');
    expect(messages).toEqual([]);
  });

  describe('parent handshake (S2)', () => {
    it('says nothing to the parent and refuses to show itself when the parent does not answer the challenge', async () => {
      const { host, messages } = fakeHost();
      const controller = controllerWith(fakeApi(), host, { confirmParent: () => Promise.resolve(false) });
      await controller.start();
      controller.close();
      expect(controller.snapshot.state.step).toBe('unavailable');
      expect(messages).toEqual([]);
    });

    it('challenges the parent once, after the allowed-domain check, then says ready', async () => {
      const api = fakeApi();
      const { host, messages } = fakeHost();
      const confirmParent = vi.fn(() => Promise.resolve(true));
      const controller = controllerWith(api, host, { confirmParent });
      await onCodeStep(controller);
      await controller.confirm('000000');
      expect(confirmParent).toHaveBeenCalledTimes(1);
      expect(messages[0]).toEqual({ type: 'ready' });
    });

    it.each(['LIVE', 'TEST'] as const)(
      'shows itself in %s when the browser hides the parent origin but the parent answers the challenge',
      async (mode) => {
        const api = fakeApi();
        api.readStatus.mockResolvedValue(session({ mode }));
        const { host, messages } = fakeHost();
        const controller = controllerWith(api, host, { observedParentOrigin: null });
        await controller.start();
        expect(controller.snapshot.state.step).toBe('phone');
        expect(messages).toEqual([{ type: 'ready' }]);
      },
    );

    it('refuses an unknown parent origin when the parent does not answer the challenge', async () => {
      const { host, messages } = fakeHost();
      const controller = controllerWith(fakeApi(), host, {
        observedParentOrigin: null,
        confirmParent: () => Promise.resolve(false),
      });
      await controller.start();
      expect(controller.snapshot.state.step).toBe('unavailable');
      expect(messages).toEqual([]);
    });

    it('says ready before anything else, even when every render announces the height', async () => {
      const { host, messages } = fakeHost();
      const controller: CheckoutController = controllerWith(fakeApi(), host, {
        onChange: () => {
          controller.notify({ type: 'resize', height: 480 });
        },
      });
      await controller.start();
      expect(messages[0]).toEqual({ type: 'ready' });
      expect(messages).toContainEqual({ type: 'resize', height: 480 });
    });

    it('never challenges a parent outside the allowed domains', async () => {
      const confirmParent = vi.fn(() => Promise.resolve(true));
      const controller = controllerWith(fakeApi(), fakeHost().host, {
        parentOrigin: 'https://evil.example',
        observedParentOrigin: 'https://evil.example',
        confirmParent,
      });
      await controller.start();
      expect(confirmParent).not.toHaveBeenCalled();
    });

    it('does not challenge anybody on the hosted page', async () => {
      const confirmParent = vi.fn(() => Promise.resolve(false));
      const controller = controllerWith(fakeApi(), fakeHost().host, {
        surface: 'hosted',
        parentOrigin: null,
        observedParentOrigin: null,
        expectedIntentId: 'pi_1',
        confirmParent,
      });
      await controller.start();
      expect(confirmParent).not.toHaveBeenCalled();
      expect(controller.snapshot.state.step).toBe('phone');
    });
  });

  it('refuses a hosted page whose path id is not the intent of the token', async () => {
    const controller = controllerWith(fakeApi(), fakeHost().host, {
      surface: 'hosted',
      parentOrigin: null,
      observedParentOrigin: null,
      expectedIntentId: 'pi_other',
    });
    await controller.start();
    expect(controller.snapshot.state.step).toBe('unavailable');
  });

  describe('state 8', () => {
    async function onInsufficientFunds(api: FakeApi): Promise<CheckoutController> {
      const controller = controllerWith(api, fakeHost().host);
      await onCodeStep(controller);
      api.confirm.mockRejectedValueOnce(apiError(422, 'E_GATEWAY_INSUFFICIENT_FUNDS'));
      await controller.confirm('000000');
      return controller;
    }

    it('goes back to the code entry without sending a new code', async () => {
      const api = fakeApi();
      const controller = await onInsufficientFunds(api);
      controller.retry();
      expect(controller.snapshot.state.step).toBe('code');
      expect(api.requestCode).toHaveBeenCalledTimes(1);
    });

    it('sends a new code when the current one expired', async () => {
      const api = fakeApi();
      const controller = await onInsufficientFunds(api);
      vi.setSystemTime(new Date('2026-10-10T10:06:00Z'));
      controller.retry();
      await vi.runOnlyPendingTimersAsync();
      expect(api.requestCode).toHaveBeenCalledTimes(2);
      expect(api.requestCode).toHaveBeenLastCalledWith('+242061234567');
      expect(controller.snapshot.state.step).toBe('code');
    });
  });

  it('cancels the step timers on a step change and on dispose', async () => {
    const api = fakeApi();
    const { host, redirects } = fakeHost();
    const controller = controllerWith(api, host, { surface: 'hosted', parentOrigin: null, observedParentOrigin: null, expectedIntentId: 'pi_1' });
    await onCodeStep(controller);
    await controller.confirm('000000');
    expect(controller.snapshot.redirecting).toBe(true);
    controller.dispose();
    await vi.advanceTimersByTimeAsync(5000);
    expect(redirects).toEqual([]);
  });

  it('redirects to the success address 3 s after a live success on the hosted page', async () => {
    const api = fakeApi();
    const { host, redirects } = fakeHost();
    const controller = controllerWith(api, host, { surface: 'hosted', parentOrigin: null, observedParentOrigin: null, expectedIntentId: 'pi_1' });
    await onCodeStep(controller);
    await controller.confirm('000000');
    await vi.advanceTimersByTimeAsync(3000);
    expect(redirects).toEqual(['https://shop.cg/ok']);
  });
});

describe('CheckoutController, page restored from the back/forward cache', () => {
  it('re-reads the status through the acceptance gate and shows the real state', async () => {
    const api = fakeApi();
    const controller = controllerWith(api, fakeHost().host, {
      surface: 'hosted',
      parentOrigin: null,
      observedParentOrigin: null,
      expectedIntentId: 'pi_1',
    });
    await controller.start();
    expect(controller.snapshot.state.step).toBe('phone');
    api.readStatus.mockResolvedValue(session({ status: 'CANCELED' }));
    controller.pageRestored();
    expect(controller.snapshot.state.step).toBe('loading');
    await vi.runOnlyPendingTimersAsync();
    expect(api.readStatus).toHaveBeenCalledTimes(2);
    expect(controller.snapshot.state.step).toBe('canceled');
  });

  it('still refuses a session that no longer passes the acceptance gate', async () => {
    const api = fakeApi();
    const controller = controllerWith(api, fakeHost().host, {
      surface: 'hosted',
      parentOrigin: null,
      observedParentOrigin: null,
      expectedIntentId: 'pi_1',
    });
    await controller.start();
    api.readStatus.mockResolvedValue(session({ id: 'pi_other' }));
    controller.pageRestored();
    await vi.runOnlyPendingTimersAsync();
    expect(controller.snapshot.state.step).toBe('unavailable');
  });

  it('never posts the same outcome twice to the parent (modes A and B)', async () => {
    const api = fakeApi();
    const { host, messages } = fakeHost();
    const controller = controllerWith(api, host);
    await onCodeStep(controller);
    await controller.confirm('000000');
    api.readStatus.mockResolvedValue(session({ status: 'COMPLETED' }));
    controller.pageRestored();
    await vi.runOnlyPendingTimersAsync();
    expect(controller.snapshot.state.step).toBe('success');
    expect(messages.filter((message) => message.type === 'success')).toHaveLength(1);
  });

  it('clears the redirect notice on the hosted page and does not redirect a second time', async () => {
    const api = fakeApi();
    const { host, redirects } = fakeHost();
    const controller = controllerWith(api, host, {
      surface: 'hosted',
      parentOrigin: null,
      observedParentOrigin: null,
      expectedIntentId: 'pi_1',
    });
    await onCodeStep(controller);
    await controller.confirm('000000');
    expect(controller.snapshot.redirecting).toBe(true);
    await vi.advanceTimersByTimeAsync(3000);
    expect(redirects).toEqual(['https://shop.cg/ok']);
    api.readStatus.mockResolvedValue(session({ status: 'COMPLETED' }));
    controller.pageRestored();
    await vi.advanceTimersByTimeAsync(3000);
    expect(controller.snapshot.redirecting).toBe(false);
    expect(redirects).toEqual(['https://shop.cg/ok']);
  });

  it('does not leave the page again for a payment that was already made', async () => {
    const api = fakeApi();
    const { host, redirects } = fakeHost();
    const controller = controllerWith(api, host, {
      surface: 'hosted',
      parentOrigin: null,
      observedParentOrigin: null,
      expectedIntentId: 'pi_1',
    });
    await controller.start();
    api.readStatus.mockResolvedValue(session({ status: 'COMPLETED' }));
    controller.pageRestored();
    await vi.advanceTimersByTimeAsync(3000);
    expect(controller.snapshot.state).toEqual({ step: 'success', alreadyPaid: true });
    expect(redirects).toEqual([]);
  });
});
