import type { Locale } from './config';

/**
 * Route map between locales. Slugs are localized (es is unprefixed,
 * en lives under /en) — this map is what makes hreflang alternates
 * and locale switchers possible without string manipulation.
 */
export const routes = {
  home: { es: '/', en: '/en' },
  products: { es: '/productos', en: '/en/products' },
  collections: { es: '/colecciones', en: '/en/collections' },
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
  return locale === 'es' ? `/productos/${slug}` : `/en/products/${slug}`;
}

export function collectionPath(locale: Locale, slug: string): string {
  return locale === 'es' ? `/colecciones/${slug}` : `/en/collections/${slug}`;
}
