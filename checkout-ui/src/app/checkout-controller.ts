import { CheckoutRequestError, type CheckoutApi } from '../api/checkout-api';
import { isEmbeddingAllowed } from '../domain/embedding';
import { normalizePhoneNumber } from '../domain/phone';
import type { CheckoutSession, Surface } from '../domain/session';
import { outcomeMessageFor, type WidgetMessage } from '../messaging/contract';
import type { CheckoutHost } from './checkout-host';
import { initialState, reduce, type CheckoutEvent, type CheckoutState, type Effect } from './checkout-machine';

export const AUTO_LEAVE_DELAY_MS = 3000;
const NOTICE_DURATION_MS = 3000;
const POLL_DELAY_MS = 1500;
const MAX_POLLS = 10;

export interface ControllerSnapshot {
  state: CheckoutState;
  session: CheckoutSession | null;
  phoneDraft: string;
  redirecting: boolean;
}

export interface ControllerOptions {
  api: CheckoutApi;
  host: CheckoutHost;
  surface: Surface;
  /** Modes A and B: the embedding page, checked against the allowed domains before anything is shown (S2). */
  parentOrigin: string | null;
  /** Hosted page: the id in the address must be the intent of the token. */
  expectedIntentId: string | null;
  onChange: (snapshot: ControllerSnapshot) => void;
  now?: () => Date;
}

/** Runs the payment: turns customer intents into API calls and machine events. It never touches the DOM. */
export class CheckoutController {
  private state: CheckoutState = initialState();
  private session: CheckoutSession | null = null;
  private phoneDraft = '';
  private lastPhoneNumber: string | null = null;
  private redirecting = false;
  /** Nothing is posted to the parent before its origin passed the allowed-domains check. */
  private verified = false;
  private polls = 0;
  private expiryChecked = false;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly now: () => Date;

  constructor(private readonly options: ControllerOptions) {
    this.now = options.now ?? ((): Date => new Date());
  }

  get snapshot(): ControllerSnapshot {
    return { state: this.state, session: this.session, phoneDraft: this.phoneDraft, redirecting: this.redirecting };
  }

  async start(): Promise<void> {
    const session = await this.read();
    if (!session) return;
    if (!this.isAllowedHere(session)) {
      this.dispatch({ type: 'embeddingRefused' });
      return;
    }
    this.verified = true;
    this.session = session;
    this.phoneDraft = session.customerPhoneNumber ?? '';
    this.dispatch({ type: 'sessionRead', session, now: this.now() });
    this.notify({ type: 'ready' });
  }

  /** Modal close button, "Close" and Escape; locked while the payment is in progress (state 7). */
  close(): void {
    if (this.state.step !== 'processing') this.notify({ type: 'close' });
  }

  notify(message: WidgetMessage): void {
    if (this.verified) this.options.host.notify(message);
  }

  submitPhone(input: string): void {
    if (this.state.step !== 'phone') return;
    this.phoneDraft = input;
    const phoneNumber = normalizePhoneNumber(input);
    this.dispatch({ type: 'phoneSubmitted', phoneNumber });
    if (phoneNumber) void this.sendCode(phoneNumber);
  }

  resendCode(): void {
    if (this.state.step !== 'code' || this.state.resending || !this.lastPhoneNumber) return;
    this.dispatch({ type: 'resendStarted' });
    void this.sendCode(this.lastPhoneNumber);
  }

  async confirm(code: string): Promise<void> {
    if (this.state.step !== 'code' || !/^\d{6}$/.test(code)) return;
    this.dispatch({ type: 'confirmStarted' });
    try {
      await this.options.api.confirm(code);
      this.dispatch({ type: 'confirmed' });
    } catch (error) {
      this.fail(error);
    }
  }

  changeNumber(): void {
    this.dispatch({ type: 'changeNumber' });
  }

  /** State 8 sends a new code (the API keeps no "validated" mark); state 14 re-reads the status first. */
  retry(): void {
    if (this.state.step === 'networkError') {
      this.dispatch({ type: 'retryAfterNetworkError' });
      return;
    }
    if (this.state.step !== 'insufficientFunds') return;
    if (!this.lastPhoneNumber) {
      this.changeNumber();
      return;
    }
    this.dispatch({ type: 'phoneSubmitted', phoneNumber: this.lastPhoneNumber });
    void this.sendCode(this.lastPhoneNumber);
  }

  /** Hosted page: cancel, then leave at once for the cancel address, whatever the API answers. */
  cancel(): string | null {
    const url = this.session?.returnUrls?.cancel ?? null;
    if (!url) return null;
    this.options.api.cancel();
    return url;
  }

  /** The intent deadline passed while the customer was on the page: the API says what happened. */
  expiryReached(): void {
    if (this.expiryChecked || !this.isActive()) return;
    this.expiryChecked = true;
    void this.refresh();
  }

  isActive(): boolean {
    return ['phone', 'code', 'insufficientFunds'].includes(this.state.step);
  }

  dispose(): void {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }

  private isAllowedHere(session: CheckoutSession): boolean {
    if (this.options.surface === 'hosted') return session.id === this.options.expectedIntentId;
    const origin = this.options.parentOrigin;
    return origin !== null && isEmbeddingAllowed(origin, session.embedding);
  }

  private async sendCode(phoneNumber: string): Promise<void> {
    this.lastPhoneNumber = phoneNumber;
    try {
      const otp = await this.options.api.requestCode(phoneNumber);
      this.dispatch({ type: 'codeSent', otp });
      if (this.state.step === 'code' && this.state.notice === 'resent') {
        this.later(NOTICE_DURATION_MS, () => {
          this.dispatch({ type: 'noticeTimedOut' });
        });
      }
    } catch (error) {
      this.fail(error);
    }
  }

  private async read(): Promise<CheckoutSession | null> {
    try {
      return await this.options.api.readStatus();
    } catch (error) {
      this.fail(error);
      return null;
    }
  }

  private async refresh(eventType: 'sessionRead' | 'wrongCodeRead' | 'inProgressRead' = 'sessionRead'): Promise<void> {
    const session = await this.read();
    if (!session) return;
    this.session = session;
    this.dispatch({ type: eventType, session, now: this.now() });
  }

  private fail(error: unknown): void {
    if (!(error instanceof CheckoutRequestError)) throw error;
    this.dispatch({ type: 'requestFailed', failure: error.failure });
  }

  private dispatch(event: CheckoutEvent): void {
    const previous = this.state;
    const { state, effect } = reduce(previous, event);
    this.state = state;
    this.announce(previous);
    this.options.onChange(this.snapshot);
    this.run(effect);
  }

  private announce(previous: CheckoutState): void {
    if (!this.session) return;
    const message = outcomeMessageFor(previous, this.state, this.session);
    if (message) this.notify(message);
    this.scheduleAutoLeave(previous);
  }

  /** Mode C leaves after 3 s on a live outcome (never on a reload); the modal closes itself after a success. */
  private scheduleAutoLeave(previous: CheckoutState): void {
    if (previous.step === this.state.step || (previous.step === 'loading' && previous.initial)) return;
    const urls = this.session?.returnUrls;
    const { surface } = this.options;
    const target =
      surface !== 'hosted' || !urls
        ? null
        : this.state.step === 'success'
          ? urls.success
          : this.state.step === 'failed' || this.state.step === 'expired'
            ? urls.cancel
            : null;
    if (target) {
      this.redirecting = true;
      this.later(AUTO_LEAVE_DELAY_MS, () => {
        this.options.host.redirect(target);
      });
    }
    if (surface === 'modal' && this.state.step === 'success') {
      this.later(AUTO_LEAVE_DELAY_MS, () => {
        this.notify({ type: 'close' });
      });
    }
  }

  private run(effect: Effect): void {
    switch (effect) {
      case 'none':
        this.polls = 0;
        return;
      case 'refreshStatus':
        void this.refresh();
        return;
      case 'refreshAfterWrongCode':
        void this.refresh('wrongCodeRead');
        return;
      case 'pollStatus':
        this.polls += 1;
        this.later(POLL_DELAY_MS, () => {
          void this.refresh(this.polls >= MAX_POLLS ? 'sessionRead' : 'inProgressRead');
        });
        return;
    }
  }

  private later(delay: number, task: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      task();
    }, delay);
    this.timers.add(timer);
  }
}
