# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project

**vexxx** — SEO-first Astro storefront for the VEXXX streetwear brand.
Bilingual: Spanish (default) at `/`, English at `/en`.

The repo is the **base** of the store: SEO infrastructure, i18n, a
backend-agnostic catalog, and strict tooling. There is deliberately **zero visual
design** — semantic HTML placeholders only. A future pass owns the brand's look;
a future commerce API replaces the content-collection catalog source.

## Commands

**pnpm only. Never `npm install`** — one lockfile, one dependency graph.

```bash
pnpm install
pnpm dev            # dev server on :4321
pnpm build          # production build (static, into dist/)
pnpm preview        # serve the production build
pnpm typecheck      # astro check (tsc over .ts and .astro)
pnpm lint           # eslint (flat config, astro + ts strict)
pnpm test           # vitest run
pnpm verify         # typecheck + lint + test + build — run before every commit
```

## Non-negotiable engineering rules

1. **Zero `any`.** No `as any`, no `@ts-ignore`, no non-null assertion to dodge a
   type error. External data enters as `unknown` and is narrowed with zod.
   ESLint enforces this at `error`.
2. **Validate every external input at the boundary** with zod `.strict()`
   schemas. The static type must be earned at runtime, not asserted.
   `src/lib/catalog/mapping.ts` is the reference pattern.
3. **Money is INTEGER minor units end-to-end.** Never floats, never strings for
   arithmetic. Format only through `src/lib/money`. Decimal conversion exists
   solely at display/serialization boundaries inside that module.
4. **No secrets in code.** Runtime config comes from environment variables,
   documented in `.env.example`.
5. **Every lib module ships tests.** TDD: failing test → minimal implementation
   → pass. `pnpm test` must stay green; vitest deliberately has no
   `passWithNoTests` — an empty test glob fails.
6. **Never fabricate passing results.** Run the command; report real output.

## SEO rules — the reason this repo exists

These are review-blocking, not suggestions:

1. **No page without complete meta.** Every page renders through
   `BaseLayout`, which mounts `<Seo />`. Unique `title` + `description`,
   canonical URL and hreflang alternates are **required props** — a page that
   cannot supply them does not ship. Never write `<title>` or meta tags by hand.
2. **Meta limits fail the build.** Titles > 65 chars, descriptions > 170 chars,
   or empty values throw in `src/lib/seo/meta.ts` at build time. Do not weaken
   these limits to make a page pass; fix the copy.
3. **Structured data comes from typed builders.** JSON-LD only via
   `src/lib/seo/jsonld.ts` builders rendered through `<JsonLd />`. Never
   hand-write `<script type="application/ld+json">`. Required per page type:
   product pages → `Product` + `BreadcrumbList`; listing pages →
   `BreadcrumbList`; all pages inherit `Organization` + `WebSite` from the
   layout.
4. **Static-first.** `output: 'static'`; every page prerenders. A page may opt
   into SSR (`export const prerender = false`) only for genuinely dynamic
   concerns (future cart/checkout/API routes) — never for content a crawler
   should see.
5. **Zero client JavaScript by default.** No UI framework is installed. Adding
   an island (or a framework integration) requires a stated justification in the
   PR — "interactivity" isn't one unless the interaction genuinely needs JS.
6. **One URL per resource.** Trailing-slash policy is `'never'` and build format
   `'file'` — canonical and served URL must always match. Permanent URL changes
   get a 301 in the `redirects` map in `astro.config.mjs`, in the same commit
   that moves the page.
7. **Images go through `astro:assets`** (`<Image />` / `<Picture />`) once real
   assets exist. Every image ships `alt` (localized), `width` and `height` — no
   layout shift, no exceptions. Social/OG images are absolute URLs.
8. **Core Web Vitals are a budget, not an aspiration.** Nothing render-blocking
   in `<head>` beyond what the base ships. Fonts, when added, are self-hosted
   with `font-display: swap` and preloaded — never a third-party CSS request.
9. **`robots.txt` and the sitemap are generated** (`src/pages/robots.txt.ts`,
   `@astrojs/sitemap`). Never hand-maintain either. Pages that must not be
   indexed use the `noindex` prop (see `404.astro`), not robots.txt entries.

## i18n rules

- **Every user-visible string lives in `src/i18n/dictionaries/`.** Hardcoded
  UI text in a page or component is a defect. `es.ts` defines the `Dictionary`
  type; `en.ts` must satisfy it — a missing translation is a type error.
- **Localized slugs are intentional.** Spanish routes are unprefixed
  (`/productos`), English lives under `/en/products`. The mapping lives in
  `src/i18n/routes.ts`; detail pages carry per-locale slugs in their data
  (`slug: { es, en }`). Never derive one locale's URL from another's by string
  manipulation — use the route helpers.
- **hreflang is mandatory.** Every page passes `alternates` to `BaseLayout`.
  For static routes use `routeAlternates()`; for detail pages build the map from
  both locales' slugs.

## Architecture facts

- **Pages depend on `getCatalog()`, never on a backend.**
  `src/lib/catalog/adapter.ts` is the seam. Today's source reads Astro content
  collections (`sources/content.ts`); the future commerce API becomes a new
  source implementing the same interface, switched in `src/lib/catalog/index.ts`.
  If a page imports `astro:content` for product data directly, it is wrong.
- **Catalog validation is duplicated on purpose.** `src/content.config.ts`
  (Astro's bundled zod) and `src/lib/catalog/mapping.ts` (our zod) declare
  structurally identical schemas — the two zod instances cannot share objects.
  A field change edits **both files in the same commit**; mapping.ts is
  authoritative and rejects drift at build time.
- **`src/config/site.ts` is the only source of brand identity** (name, title
  template, social profiles). The canonical origin lives in `astro.config.mjs`
  `site` and reaches code via `Astro.site` — never hardcode the domain.
- **Fail fast on missing config.** Code that needs `Astro.site` throws when it
  is absent rather than falling back to a relative URL.

## TypeScript conventions

- `astro/tsconfigs/strictest` plus `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`. No exemptions.
- Optional Astro component props are typed `foo?: T | undefined` so callers may
  pass an explicitly-undefined value under `exactOptionalPropertyTypes`.
- Component props: explicit `interface Props` in the frontmatter. Callbacks
  typed precisely — never `Function`.
- Imports of types use `import type` (`consistent-type-imports` at `error`).

## Testing conventions

- Vitest, `node` environment, tests beside source: `src/**/*.test.ts`.
- Pure logic lives in plain TS modules (`src/lib/**`) so it tests without an
  Astro runtime. Astro-coupled files (`sources/content.ts`, components, pages)
  stay thin; logic worth testing gets extracted to a pure module first.
- The catalog mapping tests are the boundary-validation reference: valid input
  maps, floats/missing locales/unknown fields throw.

## Design (deliberately absent)

- `src/styles/global.css` imports Tailwind and nothing else. The `@theme` block
  arrives with the brand identity — do not invent tokens, colors, fonts or
  layout before that pass.
- Keep placeholder markup semantic (`article`, `nav`, `data`, heading
  hierarchy) — structure is SEO; styling is not.
