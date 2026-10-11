export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

function asLocale(tag: string | null): Locale | null {
  const base = tag?.toLowerCase().split('-')[0];
  return LOCALES.find((l) => l === base) ?? null;
}

/** SDK option, then merchant default, then French. The browser language is never used. */
export function resolveLocale(sdkLocale: string | null, merchantLocale: string | null): Locale {
  return asLocale(sdkLocale) ?? asLocale(merchantLocale) ?? 'fr';
}
