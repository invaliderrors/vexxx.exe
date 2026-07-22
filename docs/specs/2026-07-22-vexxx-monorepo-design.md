# vexxx — monorepo conversion (design)

Date: 2026-07-22
Status: approved (records the design of the single-app → monorepo conversion)

## Goal

Convert the single Astro storefront repo into an Nx-orchestrated pnpm
monorepo and add the platform's other bases: a NestJS API (future home of
payments, inventory, orders) and a Next.js customer dashboard — shells plus a
shared contracts lib, no business logic, no database yet.

## Decisions (settled with the owner)

- **API**: NestJS 11. **Dashboard**: Next 15. **Scope**: shells + contracts.
- **Monorepo style**: package-based Nx over pnpm workspaces. Each project owns
  its `package.json` scripts (`dev`/`build`/`typecheck`/`test`); Nx supplies
  caching and dependency-ordered execution (`targetDefaults` with
  `dependsOn: ^build`).
- **Lib consumption**: libs build to `dist/` (ESM + d.ts) and are consumed as
  ordinary packages. Rejected alternative — TS-source path aliases — requires
  per-consumer transpile arrangements (Vite, Next SWC, Nest tsc all differ)
  and breaks Nest's compile boundary; dist consumption works identically
  everywhere.
- **ESM libs / CJS API**: Nest stays CommonJS (its default, least friction)
  and consumes ESM libs via Node `require(esm)` — supported from Node 20.19,
  which is the engine floor. Verified against the local runtime before
  committing to it.

## Architecture

```
libs/contracts  zod only. Money, Order (+status machine), Payment, Inventory.
libs/money      integer minor units; imports the Money type from contracts.
apps/storefront unchanged behavior; now imports @vexxx/{contracts,money}.
apps/api        Nest shell: health endpoint, fail-fast zod env config,
                empty payments/inventory/orders modules marking structure.
apps/dashboard  Next shell: one page, robots noindex + X-Robots-Tag header.
```

Contracts encode payment invariants before any implementation exists:
server-recomputed totals, PSP amounts as untrusted input with a MISMATCH
state, audited inventory adjustments. Cheap now, expensive to retrofit.

## Testing

- Same conventions as before; every project has a `test` target with real
  tests (53 total after conversion).
- `apps/api/src/nest-di.test.ts` is an architecture gate: proves decorator
  metadata survives vitest's transformer (unplugin-swc), so DI failures
  surface here instead of as opaque errors in future service tests.
- CI unchanged in shape: typecheck → lint → format check → test → build, now
  fanned out by Nx across all projects.

## Out of scope (later passes)

Database (Prisma/Postgres), auth, real payments/inventory/orders logic, the
API-backed catalog source, dashboard features, e2e suites, deployment.
