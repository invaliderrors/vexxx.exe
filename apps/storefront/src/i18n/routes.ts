import type { Locale } from './config';

/**
 * Route map between locales. Slugs are localized (es is unprefixed,
 * en lives under /en) — this map is what makes hreflang alternates
 * and locale switchers possible without string manipulation.
 */
export const routes = {
  home: { es: '/', en: '/en' },
  // '/catalog' on both locales is a deliberate product decision (was
  // '/productos' + '/en/products'); the old URLs 301 in astro.config.mjs.
  products: { es: '/catalog', en: '/en/catalog' },
  collections: { es: '/colecciones', en: '/en/collections' },
  // '/archive' on es is a deliberate product decision (was '/archivo');
  // the old URL 301s in astro.config.mjs.
  archive: { es: '/archive', en: '/en/archive' },
  // '/drop' is intentionally shared: "drop" is brand vocabulary in both locales.
  drop: { es: '/drop', en: '/en/drop' },
  collection: { es: '/coleccion', en: '/en/collection' },
  manifesto: { es: '/manifiesto', en: '/en/manifesto' },
  privacy: { es: '/privacidad', en: '/en/privacy' },
  terms: { es: '/terminos', en: '/en/terms' },
  shipping: { es: '/envios', en: '/en/shipping' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

/** Path for a static route in a given locale. */
export function routePath(key: RouteKey, locale: Locale): string {
  return routes[key][locale];
}

/** All-locale alternates for a static route (feeds hreflang). */
export function routeAlternates(key: RouteKey): Record<Locale, string> {
  return routes[key];
}

/** Detail-page paths take per-locale slugs, so alternates need both. */
export function productPath(locale: Locale, slug: string): string {
  return locale === 'es' ? `/catalog/${slug}` : `/en/catalog/${slug}`;
}

export function collectionPath(locale: Locale, slug: string): string {
  return locale === 'es' ? `/colecciones/${slug}` : `/en/collections/${slug}`;
}
