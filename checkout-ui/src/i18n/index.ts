import type { Locale } from '../domain/locale';
import type { Dictionary } from './dictionary';
import { en } from './en';
import { fr } from './fr';

const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { fr, en };

export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary } from './dictionary';
