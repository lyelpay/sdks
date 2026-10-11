import type { CheckoutController } from '../app/checkout-controller';
import type { Surface } from '../domain/session';
import { phoneFieldValue } from '../domain/phone';
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
  root.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.id === 'lp-phone') {
      event.target.value = phoneFieldValue(event.target.value);
    }
  });

  if (surface === 'modal') {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') controller.close();
      if (event.key === 'Tab') trapFocus(root, event);
    });
  }
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mode A: Tab and Shift+Tab cycle inside the dialog. */
export function trapFocus(root: HTMLElement, event: KeyboardEvent): void {
  const dialog = root.querySelector<HTMLElement>('[role="dialog"]');
  if (!dialog) return;
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const outside = !(active instanceof Node) || !dialog.contains(active);
  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}

export interface TypingSnapshot {
  id: string;
  value: string;
  focused: boolean;
}

/** A re-render within the same step must not wipe what the customer is typing, nor move the focus. */
export function captureTyping(root: HTMLElement): TypingSnapshot | null {
  const input = root.querySelector<HTMLInputElement>('#lp-code, #lp-phone');
  if (!input) return null;
  return { id: input.id, value: input.value, focused: document.activeElement === input };
}

export function restoreTyping(root: HTMLElement, typing: TypingSnapshot): void {
  const input = root.querySelector<HTMLInputElement>(`#${typing.id}`);
  if (!input || input.disabled) return;
  input.value = typing.value;
  if (input.id === 'lp-code') syncCodeBoxes(input);
  if (typing.focused) input.focus({ preventScroll: true });
}

/** Moves the focus to what changed, so keyboard and screen-reader users follow the steps. */
export function focusStep(root: HTMLElement): void {
  root.querySelector<HTMLElement>('input:not([disabled]), [data-focus]')?.focus({ preventScroll: true });
}
