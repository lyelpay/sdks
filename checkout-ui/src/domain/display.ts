import type { Locale } from './locale';
import type { Surface } from './session';

const NBSP = ' ';
const CURRENCY_LABELS: Readonly<Record<string, string>> = { XAF: 'FCFA', XOF: 'FCFA' };
const SEPARATORS: Readonly<Record<Locale, { group: string; decimal: string }>> = {
  fr: { group: NBSP, decimal: ',' },
  en: { group: ',', decimal: '.' },
};

/** "15 000 FCFA": formatted by hand so every browser shows the same spaces. */
export function formatAmount(amount: string, currency: string, locale: Locale): string {
  const [integer = '0', fraction = ''] = amount.trim().split('.');
  const { group, decimal } = SEPARATORS[locale];
  const grouped = (integer.replace(/^0+(?=\d)/, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const decimals = fraction.replace(/0+$/, '');
  const number = decimals ? `${grouped}${decimal}${decimals}` : grouped;
  return `${number}${NBSP}${CURRENCY_LABELS[currency] ?? currency}`;
}

export function initialsOf(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return initials || '?';
}

/** Always on the hosted page; the merchant may hide it in the modal and the block (decision 2026-10-10). */
export function shouldShowSecuredBadge(surface: Surface, merchantSetting: boolean | undefined): boolean {
  return surface === 'hosted' || merchantSetting !== false;
}
