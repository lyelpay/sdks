export type CheckoutState =
  | { name: 'LOADING' }
  | { name: 'PHONE_INPUT'; error?: string }
  | { name: 'SENDING_OTP'; phoneNumber: string }
  | { name: 'OTP_INPUT'; phoneNumber: string; error?: string }
  | { name: 'CONFIRMING'; phoneNumber: string }
  | { name: 'SUCCESS'; reference: string }
  | { name: 'FAILED'; reason: string };

export type CheckoutParams = {
  pk: string;
  sessionToken: string;
  amount: string;
  currency: string;
  origin: string;
  merchantName: string;
  locale: string;
  isSandbox: boolean;
};

type StateListener = (state: CheckoutState) => void;

export class StateMachine {
  private state: CheckoutState = { name: 'LOADING' };
  private listeners: StateListener[] = [];

  subscribe(fn: StateListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  get current(): CheckoutState {
    return this.state;
  }

  transition(next: CheckoutState): void {
    this.state = next;
    for (const fn of this.listeners) fn(next);
  }
}
