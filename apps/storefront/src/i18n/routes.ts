import type { Locale } from './config';

/**
 * Route map between locales (es is unprefixed, en lives under /en) —
 * this map is what makes hreflang alternates and locale switchers
 * possible without string manipulation.
 *
 * Deliberate product decision (2026-07-22): route SEGMENTS are English in
 * both locales — brand vocabulary, like the rest of the VEXXX system UI.
 * Only detail-page slugs stay per-locale (they come from data). Every
 * pre-rename Spanish URL 301s in astro.config.mjs.
 */
export const routes = {
  home: { es: '/', en: '/en' },
  products: { es: '/catalog', en: '/en/catalog' },
  collections: { es: '/collections', en: '/en/collections' },
  archive: { es: '/archive', en: '/en/archive' },
  drop: { es: '/drop', en: '/en/drop' },
  collection: { es: '/collection', en: '/en/collection' },
  manifesto: { es: '/manifesto', en: '/en/manifesto' },
  privacy: { es: '/privacy', en: '/en/privacy' },
  terms: { es: '/terms', en: '/en/terms' },
  shipping: { es: '/shipping', en: '/en/shipping' },
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
  return locale === 'es' ? `/collections/${slug}` : `/en/collections/${slug}`;
}
