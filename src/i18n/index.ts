import type { Locale } from './config';
import { es, type Dictionary } from './dictionaries/es';
import { en } from './dictionaries/en';

const dictionaries: Record<Locale, Dictionary> = { es, en };

/** Returns the full typed dictionary for a locale. */
export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export { LOCALES, DEFAULT_LOCALE, LOCALE_TAGS, isLocale } from './config';
export type { Locale } from './config';
export type { Dictionary } from './dictionaries/es';
