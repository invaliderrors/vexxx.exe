/**
 * Single source of truth for site-wide identity used by SEO meta,
 * JSON-LD and layouts. The canonical origin itself lives in
 * `astro.config.mjs` (`site`) and reaches pages via `Astro.site`.
 */
export const SITE = {
  name: 'VEXXX',
  legalName: 'VEXXX',
  /** Used in <title> templates: "Page — VEXXX". */
  titleTemplate: (pageTitle: string) => `${pageTitle} — VEXXX`,
  /** Social profiles, referenced by Organization JSON-LD (sameAs). */
  socialProfiles: [] as readonly string[],
  /** Placeholder until brand assets exist. Path under /public. */
  logoPath: '/favicon.svg',
  /** Merchant-listing facts encoded in Product JSON-LD. Owner-confirmed 2026-07-22. */
  commerce: {
    shipsFromCountry: 'CO',
    // Owner-confirmed 2026-07-22: 30-day mail returns, customer pays; ships to CO only for now.
    shippingDestinations: ['CO'] as readonly string[],
    handlingDaysMax: 2, // "Despacho previsto en 48 horas"
    returnDays: 30,
  },
} as const;
