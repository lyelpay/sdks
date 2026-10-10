import type { Theme } from '../domain/contrast';

/** The merchant colour reaches the stylesheet only through these custom properties. */
export function applyTheme(element: HTMLElement, theme: Theme): void {
  element.style.setProperty('--lp-accent', theme.accent);
  element.style.setProperty('--lp-on-accent', theme.onAccent);
  element.style.setProperty('--lp-link', theme.link);
  element.style.setProperty('--lp-focus', theme.focus);
  element.style.setProperty('--lp-halo', theme.halo);
}
