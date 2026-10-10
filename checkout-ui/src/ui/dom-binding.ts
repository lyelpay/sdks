import type { CheckoutController } from '../app/checkout-controller';
import type { Surface } from '../domain/session';
import { syncCodeBoxes } from './code-boxes';

function inputValue(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ? field.value : '';
}

/** One delegated listener per event type: the bindings survive every re-render of the card. */
export function bindInteractions(root: HTMLElement, controller: CheckoutController, surface: Surface, leave: (url: string) => void): void {
  root.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (form.dataset['form'] === 'phone') controller.submitPhone(inputValue(form, 'phone'));
    if (form.dataset['form'] === 'code') void controller.confirm(inputValue(form, 'code'));
  });

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action]') : null;
    switch (target?.dataset['action']) {
      case 'close':
        controller.close();
        return;
      case 'resend':
        controller.resendCode();
        return;
      case 'change-number':
        controller.changeNumber();
        return;
      case 'retry':
        controller.retry();
        return;
      case 'cancel': {
        event.preventDefault();
        const url = controller.cancel();
        if (url) leave(url);
        return;
      }
    }
  });

  const syncBoxes = (event: Event): void => {
    if (event.target instanceof HTMLInputElement && event.target.id === 'lp-code') syncCodeBoxes(event.target);
  };
  root.addEventListener('input', syncBoxes);
  root.addEventListener('focusin', syncBoxes);
  root.addEventListener('focusout', syncBoxes);

  if (surface === 'modal') {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') controller.close();
    });
  }
}

/** Moves the focus to what changed, so keyboard and screen-reader users follow the steps. */
export function focusStep(root: HTMLElement): void {
  root.querySelector<HTMLElement>('input:not([disabled]), [data-focus]')?.focus({ preventScroll: true });
}
