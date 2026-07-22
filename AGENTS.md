# AGENTS.md

Guidance for Codex (Codex.ai/code) working in this repository.

## Project

**vexxx** — monorepo for the VEXXX streetwear e-commerce platform.
Bilingual throughout (Spanish default at `/`, English at `/en`).

The repo is the **base** of the platform: SEO-first storefront, shell API and
dashboard, shared contracts, strict tooling. There is deliberately **zero
visual design** — semantic HTML placeholders only. Later passes own: brand
look, commerce API internals (payments, inventory, orders), dashboard
features, database.

## Workspace layout

```
apps/
  storefront/   Astro 5 public storefront. SEO-first, static-first. Bilingual.
  api/          NestJS 11 HTTP API. SHELL — health + domain module stubs
                (payments, inventory, orders). Port 3300.
  dashboard/    Next 15 customer dashboard. SHELL — never indexed. Port 3001.
libs/
  contracts/    zod schemas + types (money, order, payment, inventory).
                Depends on NOTHING but zod.
  money/        The ONLY money implementation. Depends on contracts.
```

Libs compile to `dist/` (plain ESM JS + d.ts) and are consumed as built
packages — no transpile hacks in any consumer. Nx orders and caches builds:
`typecheck`/`test`/`build` all `dependsOn ^build`, so lib dist is always fresh.

## Commands

**pnpm only. Never `npm install`** — one lockfile, one dependency graph.

```bash
pnpm install
pnpm dev              # storefront on :4321
pnpm dev:api          # API on :3300
pnpm dev:dashboard    # dashboard on :3001
pnpm build            # nx run-many -t build (libs first, then apps)
pnpm typecheck        # nx run-many -t typecheck
pnpm test             # nx run-many -t test
pnpm lint             # eslint . (single root flat config)
pnpm affected         # typecheck,test,build on affected projects only
pnpm verify           # typecheck + lint + test + build — run before every commit

pnpm nx run @vexxx/storefront:test        # one project
```

## Module boundaries — enforced by review, structural where possible

- `libs/contracts` depends on **zod only**. Never on another workspace package,
  never on a framework. It is the shared language of the platform.
- `libs/money` depends on `@vexxx/contracts` only.
- Apps depend on libs via `@vexxx/*` workspace packages. **Apps never import
  from other apps**, and never deep-import lib internals (`@vexxx/money` — not
  `@vexxx/money/src/...`).
- The storefront's catalog boundary: pages call `getCatalog()`
  (`apps/storefront/src/lib/catalog/adapter.ts` is the seam). When the API
  exists for real, it becomes a new source behind that interface — pages do
  not change. A page importing `astro:content` for product data directly is
  wrong.

## Non-negotiable engineering rules

1. **Zero `any`.** No `as any`, no `@ts-ignore`, no non-null assertion to dodge
   a type error. External data enters as `unknown` and is narrowed with zod.
   ESLint enforces this at `error`.
2. **Validate every external input at the boundary** with zod `.strict()`
   schemas. The static type must be earned at runtime, not asserted.
   Reference patterns: `libs/contracts/src/*`, `apps/storefront/src/lib/catalog/mapping.ts`,
   `apps/api/src/config/env.ts`.
3. **Money is INTEGER minor units end-to-end.** Never floats, never strings for
   arithmetic. The shape is `@vexxx/contracts` `moneySchema`; formatting only
   through `@vexxx/money`. Decimal conversion exists solely at
   display/serialization boundaries inside that lib.
4. **No secrets in code.** API config flows through `apps/api/src/config/env.ts`
   (zod, fail-fast on boot). Every env var is documented in the app's
   `.env.example` in the same commit that introduces it.
5. **Every module ships tests.** TDD: failing test → minimal implementation →
   pass. No `passWithNoTests` anywhere — an empty test glob must fail.
6. **Never fabricate passing results.** Run the command; report real output.

## Payments / orders — locked early, before any implementation exists

These invariants are encoded in `libs/contracts` and bind every future pass:

- **Totals are server-recomputed. The API never accepts an amount from the
  client.** `orderSchema` totals are snapshots our code computed.
- **A PSP-reported amount is untrusted input.** Payment reconciliation compares
  it against our own order total; mismatch → `PAYMENT_MISMATCH` / `MISMATCH`
  status and an alert. It never silently becomes `PAID`/`SUCCEEDED`.
- **Inventory changes only through audited adjustments**
  (`inventoryAdjustmentSchema`), never direct level writes.

## SEO rules — the storefront's reason to exist

Review-blocking, not suggestions. All paths under `apps/storefront/`:

1. **No page without complete meta.** Every page renders through `BaseLayout`,
   which mounts `<Seo />`. Unique `title` + `description`, canonical URL and
   hreflang alternates are **required props**. Never write `<title>` or meta
   tags by hand.
2. **Meta limits fail the build.** Titles > 65 chars, descriptions > 170 chars,
   or empty values throw in `src/lib/seo/meta.ts` at build time. Fix the copy,
   never weaken the limits.
3. **Structured data comes from typed builders** (`src/lib/seo/jsonld.ts`)
   rendered through `<JsonLd />`. Never hand-write
   `<script type="application/ld+json">`. Product pages → `Product` +
   `BreadcrumbList`; listings → `BreadcrumbList`; every page inherits
   `Organization` + `WebSite` from the layout.
4. **Static-first.** Every storefront page prerenders. SSR opt-out
   (`export const prerender = false`) is only for genuinely dynamic concerns
   (future cart/checkout) — never for content a crawler should see.
5. **Zero client JavaScript by default.** No UI framework in the storefront.
   Adding an island requires stated justification in the PR.
6. **One URL per resource.** Trailing-slash `'never'`, build format `'file'`.
   Permanent URL changes get a 301 in the `redirects` map of
   `astro.config.mjs`, in the same commit that moves the page.
7. **Images go through `astro:assets`** once real assets exist — localized
   `alt`, explicit `width`/`height`, no exceptions.
8. **Core Web Vitals are a budget.** Nothing render-blocking beyond what the
   base ships. Fonts, when added, are self-hosted, `font-display: swap`,
   preloaded.
9. **`robots.txt` and the sitemap are generated.** Non-indexable pages use the
   `noindex` prop, not robots.txt entries.
10. **The dashboard is never indexed** — `robots` metadata in its root layout
    plus an `X-Robots-Tag` header in `next.config.ts`. Both stay.

## i18n rules (storefront)

- **Every user-visible string lives in `src/i18n/dictionaries/`.** `es.ts`
  defines the `Dictionary` type; `en.ts` must satisfy it — a missing
  translation is a type error. Hardcoded UI text is a defect.
- **Localized slugs are intentional.** Spanish unprefixed (`/productos`),
  English under `/en/products`. Static-route mapping lives in
  `src/i18n/routes.ts`; detail pages carry per-locale slugs in data
  (`slugs: { es, en }` raw → `slug` domain field). Never derive one locale's
  URL from another by string manipulation — use the route helpers.
- **hreflang is mandatory.** Every page passes `alternates` to `BaseLayout`.

## API facts (apps/api)

- CommonJS build (Nest standard). `useDefineForClassFields: false` is pinned in
  its tsconfig — `target: ES2022` flips it true by default and silently
  destroys decorator metadata, producing opaque runtime DI failures. Do not
  remove.
- Nest DI under Vitest is **proven working** by `src/nest-di.test.ts` —
  `unplugin-swc` supplies the decorator metadata esbuild drops. That test is an
  architecture gate, not a feature test. Keep it.
- Workspace libs are ESM; the CJS API consumes them via Node's `require(esm)`
  (supported from Node 20.19, our engine floor). Do not lower the Node floor.
- `payments/`, `inventory/`, `orders/` are empty module shells marking the
  domain structure. Their doc comments state what later passes own.

## TypeScript conventions

- `tsconfig.base.json` is options-only — **no `include`**, every project
  supplies its own, so files can never leak between app programs.
- Base: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`. Apps override
  only what their framework demands (documented inline in each tsconfig).
- The storefront extends `astro/tsconfigs/strictest` instead (equivalent
  strictness; Astro-aware).
- Libs are ESM with NodeNext resolution — relative imports **must** carry the
  `.js` extension.
- Optional component props are typed `foo?: T | undefined`
  (`exactOptionalPropertyTypes` compatibility). Explicit `interface Props` /
  `interface XxxProps` above every component.
- Type imports use `import type` (`consistent-type-imports` at `error`).

## Testing conventions

- Vitest everywhere; tests beside source (`src/**/*.test.{ts,tsx}`).
- Environments: `node` for libs and api, `jsdom` for the dashboard, storefront
  lib tests run in `node`.
- The api vitest config carries the SWC plugin for decorator metadata; the
  dashboard vitest config sets `esbuild.jsx: 'automatic'` because its tsconfig
  uses `jsx: preserve` for Next. Both are load-bearing.
- Pure logic lives in plain TS modules so it tests without a framework runtime;
  framework-coupled files stay thin.

## Design (deliberately absent)

- `apps/storefront/src/styles/global.css` imports Tailwind and nothing else.
  Design tokens (`@theme`) arrive with the brand identity — do not invent
  colors, fonts or layout before that pass.
- Keep placeholder markup semantic (`article`, `nav`, `data`, heading
  hierarchy) — structure is SEO; styling is not.
