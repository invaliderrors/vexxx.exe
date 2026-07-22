# vexxx

SEO-first Astro storefront base for **VEXXX**, a streetwear clothing brand.
Bilingual (Spanish default at `/`, English at `/en`). Zero visual design by
intent — this repo ships the structural, SEO and data foundations only.

## Stack

- [Astro 5](https://astro.build) — static-first, `@astrojs/node` adapter ready
  for future on-demand routes (cart, checkout, API).
- TypeScript (`strictest` preset), ESLint (flat, astro + ts-strict), Prettier.
- Tailwind CSS v4 (tooling installed; no design tokens yet).
- Vitest for unit tests, zod for boundary validation.
- `@astrojs/sitemap` + generated `robots.txt`.

## Getting started

Requires Node >= 20.19 and pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:4321
```

Before committing:

```bash
pnpm verify     # typecheck + lint + test + build
```

## Project layout

```
src/
  components/seo/   Seo.astro (head meta) + JsonLd.astro (structured data)
  config/           site.ts — brand identity (name, title template, socials)
  content/          Placeholder catalog data (products, collections as JSON)
  i18n/             Locales, typed dictionaries (es defines, en satisfies),
                    localized route map + helpers
  layouts/          BaseLayout.astro — head, sitewide JSON-LD, semantic shell
  lib/
    catalog/        Backend-agnostic catalog: domain types, CatalogAdapter
                    interface, zod boundary mapping, content-collection source
    money/          Integer minor-unit Money + the only formatting code
    seo/            meta.ts (titles, canonical, hreflang) + jsonld.ts builders
  pages/            es routes at root, en mirror under /en, robots.txt endpoint
public/             Static assets (favicon placeholder)
docs/specs/         Design documents
```

## Key decisions

- **Canonical origin** is `site` in `astro.config.mjs` (`https://vexxx.com`
  placeholder — change it there and nowhere else).
- **Catalog is swappable**: pages call `getCatalog()` and never touch the data
  source. The future commerce API implements `CatalogAdapter` and replaces the
  content source in one line.
- **Meta is enforced**: empty/over-long titles and descriptions throw at build
  time. hreflang + canonical are required props of every page.
- **Money is integer minor units** end-to-end; formatting only via
  `src/lib/money`.

See `CLAUDE.md` for the full rule set and `docs/specs/` for the design record.
