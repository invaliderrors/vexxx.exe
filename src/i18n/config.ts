export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

/** BCP 47 tags for hreflang, sitemap and Intl APIs. */
export const LOCALE_TAGS: Record<Locale, string> = {
  es: 'es-ES',
  en: 'en-US',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
