import { CODE_INPUT_LENGTH } from './views/code-step';

/** Keeps only digits (paste, autofill) and mirrors them in the six drawn boxes. */
export function syncCodeBoxes(input: HTMLInputElement): void {
  const digits = input.value.replace(/\D/g, '').slice(0, CODE_INPUT_LENGTH);
  if (digits !== input.value) input.value = digits;
  const boxes = input.parentElement?.querySelectorAll<HTMLElement>('.lp-code-box') ?? [];
  boxes.forEach((box, index) => {
    box.textContent = digits.charAt(index);
    box.classList.toggle('is-current', document.activeElement === input && index === Math.min(digits.length, CODE_INPUT_LENGTH - 1));
  });
}
