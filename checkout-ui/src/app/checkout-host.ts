import type { WidgetMessage } from '@lyel/checkout-protocol';
import type { ParentChannel } from '../messaging/contract';

/** What the checkout may do outside its own card; one adapter per surface. */
export interface CheckoutHost {
  /** Modes A and B: tell the SDK. The hosted page has nobody to tell. */
  notify(message: WidgetMessage): void;
  /** Leave the page for a merchant return address (hosted page only). */
  redirect(url: string): void;
}

export function embeddedHost(channel: ParentChannel): CheckoutHost {
  return {
    notify(message: WidgetMessage): void {
      channel.send(message);
    },
    redirect(): void {
      // Modes A and B never leave the merchant page: the SDK reacts to the messages.
    },
  };
}

export function hostedHost(location: Pick<Location, 'assign'>): CheckoutHost {
  return {
    notify(): void {
      // The hosted page is the top window: there is no SDK to tell.
    },
    redirect(url: string): void {
      location.assign(url);
    },
  };
}
