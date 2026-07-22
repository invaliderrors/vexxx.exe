# vexxx — SEO-first storefront base (design)

Date: 2026-07-22
Status: approved (this document records the design the base was built from)

## Goal

Replace the previous repository contents with the base of an online store for
the VEXXX streetwear brand: an Astro project whose entire structure is built
around SEO, with zero visual design, ready for a commerce backend to be added
later.

## Decisions (settled with the owner)

- **Location**: this repository, wiped and re-initialized. The previous Nexum
  monorepo remains available at `github.com/invaliderrors/nexumlabs`
  (verified pushed before removal).
- **Languages**: Spanish default at `/`, English at `/en`. hreflang and
  localized sitemaps from day one. Slugs are localized per language.
- **Data layer**: backend-agnostic. Pages depend on a `CatalogAdapter`
  interface; the placeholder implementation reads Astro content collections.
  The future API becomes a second source behind the same interface.
- **Rendering**: static-first hybrid. `output: 'static'` with the Node adapter
  installed so future cart/checkout/API routes can opt into SSR per-page.

## Architecture

```
pages (es at /, en at /en)
  └─ BaseLayout ── Seo (title/description/canonical/hreflang/OG, enforced)
  │            └── JsonLd (Organization + WebSite sitewide)
  ├─ per-page JsonLd (BreadcrumbList, Product) via typed builders
  └─ getCatalog(): CatalogAdapter
       └─ sources/content.ts (Astro content collections, placeholder)
            └─ mapping.ts — zod .strict() boundary validation (authoritative)
```

Supporting modules:

- `src/lib/seo/meta.ts` — title template, hard length limits (title ≤ 65,
  description ≤ 170, both non-empty; violations throw at build), canonical URL
  normalization, hreflang link builder (+ x-default → es).
- `src/lib/seo/jsonld.ts` — zod-validated builders: Organization, WebSite,
  BreadcrumbList, Product (+Offer with decimal price from integer minor units).
- `src/lib/money` — integer minor-unit `Money`, the only formatting code.
- `src/i18n` — typed dictionaries (es defines the shape, en must satisfy it),
  localized route map, path helpers.
- `src/pages/robots.txt.ts` — generated robots.txt referencing the sitemap.

## Error handling

Fail at build time, loudly: missing `site`, invalid meta, invalid catalog
data, and invalid JSON-LD inputs all throw during the static build. Nothing
falls back silently.

## Testing

Vitest, node environment, tests beside source. Pure logic (seo/meta, jsonld,
money, catalog mapping) is fully unit-tested; Astro-coupled files stay thin.
CI (GitHub Actions): typecheck → lint → format check → test → build.

## Out of scope (later passes)

Visual design and brand tokens; real product imagery; cart/checkout; the
commerce API and its catalog source; analytics; OG image generation;
performance monitoring.
