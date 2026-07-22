# vexxx

Monorepo for **VEXXX**, a streetwear e-commerce platform. SEO-first Astro
storefront, NestJS API and Next.js dashboard shells, shared zod contracts.
Bilingual (Spanish default at `/`, English at `/en`). Zero visual design by
intent — this repo ships structural, SEO and data foundations only.

## Workspace

```
apps/
  storefront/   Astro 5 public storefront — SEO-first, static-first (:4321)
  api/          NestJS 11 API shell — payments/inventory/orders stubs (:3300)
  dashboard/    Next 15 customer dashboard shell — never indexed (:3001)
libs/
  contracts/    zod schemas + types: money, order, payment, inventory
  money/        Integer minor-unit money; the only formatting code
```

Orchestrated by **Nx** (package-based): builds are cached and dependency-
ordered; libs compile to `dist/` and every app consumes plain JS + d.ts.

## Getting started

Requires Node >= 20.19 and pnpm.

```bash
pnpm install
pnpm dev              # storefront http://localhost:4321
pnpm dev:api          # API http://localhost:3300/health
pnpm dev:dashboard    # dashboard http://localhost:3001
```

Before committing:

```bash
pnpm verify           # typecheck + lint + test + build, all projects
```

## Deploy

After deploying the storefront to production, submit the sitemap to search
engines:

```bash
pnpm --filter @vexxx/storefront indexnow
```

This pings IndexNow (Bing, Yandex, Naver) with all indexed URLs. When a CD
pipeline is added, this should run as a post-deploy step.

## Key decisions

- **Canonical origin** is `site` in `apps/storefront/astro.config.mjs`
  (`https://vexxx.co` placeholder — change it there and nowhere else).
- **Contracts lock invariants early**: server-recomputed totals, PSP amounts
  treated as untrusted, audited-only inventory movements — encoded in
  `libs/contracts` before any implementation exists.
- **Catalog is swappable**: storefront pages call `getCatalog()`; the future
  API implements the same `CatalogAdapter` interface behind one switch line.
- **Meta is enforced**: empty/over-long titles or descriptions fail the
  storefront build; canonical + hreflang are required props of every page.
- **Money is integer minor units** end-to-end (`@vexxx/contracts`), formatted
  only via `@vexxx/money`.

See `CLAUDE.md` for the full rule set and `docs/specs/` for design records.
