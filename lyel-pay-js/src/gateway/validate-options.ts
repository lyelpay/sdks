import type { GatewayCheckoutOptions } from './types';

const PUBLISHABLE_KEY = /^pk_(test|live)_.+$/;

/** Fails fast on a misconfigured integration, before anything is added to the page. */
export function assertValidOptions(options: GatewayCheckoutOptions): void {
  if (!PUBLISHABLE_KEY.test(options.publishableKey)) {
    throw new Error('Lyel Pay: publishableKey must start with pk_test_ or pk_live_ (never use your secret key here)');
  }
  if (options.sessionToken.trim() === '') {
    throw new Error('Lyel Pay: sessionToken is empty; pass the sessionToken your server received with the intent');
  }
}

/** `mount(document.getElementById(...))` with a wrong id passes null: say so instead of failing later. */
export function assertMountTarget(container: HTMLElement | null): asserts container is HTMLElement {
  if (!(container instanceof HTMLElement)) {
    throw new Error('Lyel Pay: mount() needs an element of the page; the container is missing');
  }
}
