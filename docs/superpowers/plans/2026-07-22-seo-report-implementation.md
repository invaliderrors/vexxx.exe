# SEO Report Implementation Plan (vexxx.co full audit, 2026-07-22)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement every finding of the 2026-07-22 Google SEO audit (score 49/100): repair the canonical domain, unlock product rich results and social images, fix LCP and JS-gated content, harden nginx, de-templatize product copy, add trust pages, and clear the backlog items.

**Architecture:** All storefront work stays behind the existing seams — pages call `getCatalog()`, meta goes through `<Seo />`, JSON-LD through typed builders in `src/lib/seo/jsonld.ts`, strings through `src/i18n/dictionaries/`. Product social/schema images are derived at build time from the existing SKU asset map via `astro:assets` `getImage()` (no duplicate asset copies in `public/`). nginx changes ship in the one config the Dockerfile copies.

**Tech Stack:** Astro 5 (static, node adapter), `@astrojs/sitemap`, zod, Vitest, nginx 1.27 (Docker), pnpm + Nx.

## Global Constraints

- **pnpm only. Never `npm install`.**
- **Zero `any`**, no `@ts-ignore`, no non-null assertions to dodge types. External data enters as `unknown`, narrowed with zod `.strict()`.
- Meta limits enforced at build: title ≤ 65 chars **after** the `«page» — VEXXX` template is applied (except home), description ≤ 170 chars. Fix copy, never the limits.
- Every user-visible string lives in `src/i18n/dictionaries/es.ts` (defines `Dictionary` type) + `en.ts` (must satisfy it).
- Route segments are English in both locales; new static routes go in `src/i18n/routes.ts`; never derive one locale's URL from the other by string manipulation.
- Never hand-write `<title>`, meta tags, or `<script type="application/ld+json">` — only `BaseLayout`/`<Seo />`/`<JsonLd />` + builders.
- Money stays integer minor units (`@vexxx/contracts` `moneySchema`); decimal only via `@vexxx/money`.
- The two product zod schemas are intentionally duplicated: `src/lib/catalog/mapping.ts` (authoritative) and `src/content.config.ts` (Astro's own zod). **Change both in the same commit.**
- Tests beside source (`src/**/*.test.ts`), storefront lib tests run in `node` env.
- **`pnpm verify` (typecheck + lint + test + build) before every commit.** Never fabricate results.
- Canonical origin after Task 1 is **`https://vexxx.co`** everywhere.
- All storefront paths below are relative to `apps/storefront/` unless rooted.

## Report-vs-repo corrections (verified 2026-07-22)

Facts the executor should know because they differ from the audit report's wording:

1. `meta.test.ts` / `jsonld.test.ts` do **not** import the Astro config — they pin `https://vexxx.com` as local literals. Changing `SITE_URL` alone breaks nothing; the fixtures are updated for truthfulness plus a new guard test that actually fails on drift (Task 1).
2. The wordmark PNG (`src/assets/vexxx/vexxx-wordmark.png`) is **1254×1254 square**, while `BaseLayout` declares `width={1166} height={430}` — the declared ratio is wrong on top of the wasted bytes (Task 15).
3. The report's "40px horizontal overflow at 375px from a 72px offset" could **not** be reproduced in static CSS — every named offset collapses under the ≤620px/≤850px media queries and `html/body` set `overflow-x: clip`. Task 16 measures in a real browser before changing anything.
4. Legal stub bodies are ~7 words each, not ~20 — even thinner than reported.
5. There is **no CD pipeline** (CI verifies only). "Post-deploy" steps (IndexNow ping, GSC submission) are manual until CD exists.

## Owner input needed (collect once, before Phase 2)

| Token | Used in | Question for the owner |
|---|---|---|
| `OWNER_CONTACT_EMAIL` | Task 10, 11 | Public customer-service email |
| `OWNER_IG_HANDLE` / `OWNER_TIKTOK_HANDLE` | Task 10, 11 | Real Instagram / TikTok handles |
| `OWNER_LEGAL_ENTITY` (+ country/city, optional address) | Task 10, 11 | Legal entity behind the store |
| Return policy (days + who pays return shipping, or "no returns") | Task 12 | Business decision; affects `MerchantReturnPolicy` |
| Shipping rate + destination scope (worldwide? COP flat rate?) | Task 12 | Affects `OfferShippingDetails` |
| Drop 001 end date (or "none yet") | Task 18 | Enables `priceValidUntil` |
| Real legal copy for privacy/terms/shipping (or confirm stubs stay noindexed) | Task 6 note | Legal team deliverable |

Tasks marked **[OWNER-GATED]** implement full structure with these values; if a value is missing at execution time, ask the user once via AskUserQuestion, and if still unavailable, skip only the affected step and log it in the final report.

## Manual ops checklist (outside the repo — do alongside Phase 0/1)

- [ ] DNS/hosting: 301 `vexxx.com` → `https://vexxx.co` (or complete the .com deployment — owner already implied .co is live; do not leave the split).
- [ ] `www.vexxx.co`: point at the same origin with a valid cert so the new nginx `www` server block can 301 it, **or** remove the DNS record.
- [ ] After Task 1 deploys: submit `https://vexxx.co/sitemap-index.xml` in Google Search Console; verify canonical + sitemap URLs show `vexxx.co`; watch `site:vexxx.co` over 2–4 weeks.
- [ ] After Phase 1 deploys: re-run Rich Results Test on one product URL per locale.
- [ ] After Phase 0 ships: capture drift baseline (`/seo drift baseline https://vexxx.co/`).

---

# Phase 0 — Unblock indexing

### Task 1: Canonical domain → https://vexxx.co

**Files:**
- Modify: `apps/storefront/astro.config.mjs:9`
- Modify: `apps/storefront/src/lib/seo/meta.test.ts` (lines 9, 48, 54, 59, 74–76)
- Modify: `apps/storefront/src/lib/seo/jsonld.test.ts` (lines 10, 16, 17, 26, 34, 35, 42, 48, 68, 70)
- Modify: `README.md:43`
- Create: `apps/storefront/src/lib/seo/canonical-origin.test.ts`

**Interfaces:**
- Produces: the constant string `https://vexxx.co` as the site origin for every later task; guard test `canonical-origin.test.ts` that fails if `astro.config.mjs` ever drifts.

- [ ] **Step 1: Write the failing guard test**

```ts
// apps/storefront/src/lib/seo/canonical-origin.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CANONICAL_ORIGIN = 'https://vexxx.co';
const configUrl = new URL('../../../astro.config.mjs', import.meta.url);

describe('canonical origin', () => {
  it('astro.config.mjs pins SITE_URL to the canonical origin', () => {
    const config = readFileSync(configUrl, 'utf8');
    expect(config).toContain(`const SITE_URL = '${CANONICAL_ORIGIN}';`);
  });

  it('the dead .com origin appears nowhere in the config', () => {
    expect(readFileSync(configUrl, 'utf8')).not.toContain('vexxx.com');
  });
});
```

- [ ] **Step 2: Run it — must fail**

Run: `pnpm nx run @vexxx/storefront:test -- src/lib/seo/canonical-origin.test.ts`
Expected: FAIL — config still contains `https://vexxx.com`.

- [ ] **Step 3: Flip the config**

`apps/storefront/astro.config.mjs:9`:

```js
const SITE_URL = 'https://vexxx.co';
```

- [ ] **Step 4: Sync test fixtures + README**

In `meta.test.ts` and `jsonld.test.ts`, replace every `https://vexxx.com` literal with `https://vexxx.co` (7 + 10 occurrences; they are local fixtures, but they must mirror production). In `README.md:43` replace the `https://vexxx.com` placeholder mention with `https://vexxx.co`.

- [ ] **Step 5: Run the storefront test suite**

Run: `pnpm nx run @vexxx/storefront:test`
Expected: PASS, including the new guard test.

- [ ] **Step 6: Build and inspect output**

Run: `pnpm nx run @vexxx/storefront:build`
Then verify (from `apps/storefront/`):
- `grep -r "vexxx.com" dist/client --include="*.html" --include="*.xml" --include="*.txt"` → **no matches**
- `grep -o '<link rel="canonical"[^>]*' dist/client/index.html` → `href="https://vexxx.co/"`
- `grep "Sitemap:" dist/client/robots.txt` → `Sitemap: https://vexxx.co/sitemap-index.xml`
- `grep -c "https://vexxx.co" dist/client/sitemap-0.xml` → > 0

- [ ] **Step 7: Verify + commit**

```bash
pnpm verify
git add apps/storefront/astro.config.mjs apps/storefront/src/lib/seo/ README.md
git commit -m "fix(seo): point canonical origin at vexxx.co, guard against drift

vexxx.com is unreachable; every canonical, hreflang, sitemap URL,
robots Sitemap line and JSON-LD @id pointed at a dead host.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

# Phase 1 — Critical fixes

### Task 2: Product images into JSON-LD, og:image, twitter:image + build-fail on unmapped SKUs

**Files:**
- Create: `apps/storefront/src/components/catalog/mapped-skus.ts`
- Create: `apps/storefront/src/components/catalog/product-image-coverage.test.ts`
- Modify: `apps/storefront/src/components/catalog/product-images.ts`
- Modify: `apps/storefront/src/pages/catalog/[slug].astro` (frontmatter, lines ~41–56)
- Modify: `apps/storefront/src/pages/en/catalog/[slug].astro` (same changes)
- Modify: `apps/storefront/src/pages/index.astro`, `apps/storefront/src/pages/en/index.astro` (homepage og:image)

**Interfaces:**
- Consumes: `productImage(sku: string): ImageMetadata` (existing map, now strict), `getImage` from `astro:assets`, `site` = `Astro.site` (now `https://vexxx.co`).
- Produces: `MAPPED_SKUS: readonly string[]` and `type MappedSku`; `productImage` now **throws** on unmapped SKUs (build-time failure for published products); product pages emit non-empty `image` in Product JSON-LD and `og:image`/`twitter:image`; home pages emit `og:image`.

- [ ] **Step 1: Write the failing coverage test**

```ts
// apps/storefront/src/components/catalog/product-image-coverage.test.ts
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { MAPPED_SKUS } from './mapped-skus';

const productsDir = new URL('../../content/products/', import.meta.url);
const probe = z.looseObject({ sku: z.string().min(1), published: z.boolean() });

describe('product image coverage', () => {
  it('every published product SKU has an entry in the image map', () => {
    const files = readdirSync(productsDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const raw: unknown = JSON.parse(readFileSync(new URL(file, productsDir), 'utf8'));
      const { sku, published } = probe.parse(raw);
      if (published) {
        expect(MAPPED_SKUS, `SKU ${sku} in ${file} has no mapped image`).toContain(sku);
      }
    }
  });
});
```

(If the repo's zod is v3, use `z.object({...}).passthrough()` instead of `z.looseObject`.)

- [ ] **Step 2: Run it — must fail (module missing)**

Run: `pnpm nx run @vexxx/storefront:test -- src/components/catalog/product-image-coverage.test.ts`
Expected: FAIL — `mapped-skus` does not exist.

- [ ] **Step 3: Create the pure SKU list**

```ts
// apps/storefront/src/components/catalog/mapped-skus.ts
/**
 * SKUs with real photography mapped in product-images.ts.
 * Pure data (no asset imports) so node tests can consume it.
 */
export const MAPPED_SKUS = [
  'VXX-HOOD-001',
  'VXX-TEE-002',
  'VXX-LSL-003',
  'VXX-CRG-004',
  'VXX-JKT-005',
  'VXX-CAP-006',
  'VXX-BAG-007',
] as const;

export type MappedSku = (typeof MAPPED_SKUS)[number];
```

- [ ] **Step 4: Make the image map strict (kill the silent fallback)**

Rewrite `product-images.ts` — keep the existing 8 asset imports exactly as they are, replace the map + accessor:

```ts
import { MAPPED_SKUS, type MappedSku } from './mapped-skus';

const bySku: Record<MappedSku, ImageMetadata> = {
  'VXX-HOOD-001': hood001,
  'VXX-TEE-002': tee001,
  'VXX-LSL-003': lsl003,
  'VXX-CRG-004': crg004,
  'VXX-JKT-005': jkt005,
  'VXX-CAP-006': cap006,
  'VXX-BAG-007': bag007,
};

function isMappedSku(sku: string): sku is MappedSku {
  return (MAPPED_SKUS as readonly string[]).includes(sku);
}

/** Throws at build time so an unmapped published SKU can never ship a wrong image silently. */
export function productImage(sku: string): ImageMetadata {
  if (!isMappedSku(sku)) {
    throw new Error(
      `No product image mapped for SKU "${sku}". Add the asset import and bySku entry in product-images.ts and the SKU to mapped-skus.ts.`,
    );
  }
  return bySku[sku];
}
```

Keep the `campaignGroup` import only if something still imports it from here; otherwise delete it (ProductDetail imports its campaign assets directly — see Task 15).

- [ ] **Step 5: Run the coverage test — must pass**

Run: `pnpm nx run @vexxx/storefront:test -- src/components/catalog/product-image-coverage.test.ts`
Expected: PASS.

- [ ] **Step 6: Wire the social/schema image into both product routes**

In `apps/storefront/src/pages/catalog/[slug].astro` frontmatter, add imports and replace the `absoluteImages` block (currently lines ~41–43):

```ts
import { getImage } from 'astro:assets';
import { productImage } from '../../components/catalog/product-images';
// ...
const socialImage = await getImage({
  src: productImage(product.sku),
  format: 'jpeg',
  width: 1200,
});
const socialImageUrl = new URL(socialImage.src, site).toString();
const absoluteImages = [
  socialImageUrl,
  ...product.images.map((image) =>
    image.src.startsWith('/') ? new URL(image.src, site).toString() : image.src,
  ),
];
```

The existing `image={absoluteImages[0]}` prop (line ~56) and `productJsonLd({ ..., images: absoluteImages, ... })` now receive a real URL. Mirror the identical change in `src/pages/en/catalog/[slug].astro` (import paths gain one `../`).

- [ ] **Step 7: Homepage og:image (both locales)**

In `src/pages/index.astro` frontmatter:

```ts
import { getImage } from 'astro:assets';
import campaignHero from '../assets/vexxx/campaign-hero.png';

const socialImage = await getImage({ src: campaignHero, format: 'jpeg', width: 1200 });
const socialImageUrl = new URL(socialImage.src, Astro.site ?? new URL('https://vexxx.co')).toString();
```

and pass `image={socialImageUrl}` to `<BaseLayout>`. Same in `src/pages/en/index.astro` (`../../assets/...`). If the page already destructures `site`, reuse it instead of the `??` fallback.

- [ ] **Step 8: Build and verify all three surfaces**

Run: `pnpm nx run @vexxx/storefront:build`, then from `apps/storefront/`:
- `grep -o '"image":\[[^]]*\]' dist/client/catalog/sudadera-heavyweight-system-failure.html` → non-empty array of `https://vexxx.co/_astro/...jpg` URLs
- `grep -o 'property="og:image" content="[^"]*"' dist/client/catalog/sudadera-heavyweight-system-failure.html` → present
- `grep -o 'name="twitter:card" content="[^"]*"' <same file>` → `summary_large_image`
- Same checks on `dist/client/en/catalog/system-failure-heavyweight-hoodie.html` and `dist/client/index.html` (og:image only).

- [ ] **Step 9: Verify + commit**

```bash
pnpm verify
git add apps/storefront/src/components/catalog/ apps/storefront/src/pages/
git commit -m "feat(seo): emit Product.image, og:image and twitter:image from the SKU asset map

All 7 SKUs were disqualified from rich results (image is required)
and product links shared with no image. Unmapped published SKUs now
fail the build instead of silently shipping a campaign fallback.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 3: PDP LCP image — eager + high priority

**Files:**
- Modify: `apps/storefront/src/components/catalog/ProductDetail.astro:43`

**Interfaces:** none new.

- [ ] **Step 1: Add the two attributes**

The primary `<Image>` (line 43) becomes:

```astro
<Image
  src={primary}
  alt={product.name[locale]}
  widths={[640, 960, 1280]}
  sizes="(max-width: 800px) 100vw, 55vw"
  loading="eager"
  fetchpriority="high"
/>
```

- [ ] **Step 2: Build and verify**

Run: `pnpm nx run @vexxx/storefront:build`, then:
`grep -o 'fetchpriority="high"' dist/client/catalog/sudadera-heavyweight-system-failure.html` → exactly one match (the product hero; homepage hero already has its own on `index.html`).
`grep -c 'loading="lazy"' <same file>` → decreased by one vs before (primary no longer lazy).

- [ ] **Step 3: Verify + commit**

```bash
pnpm verify
git add apps/storefront/src/components/catalog/ProductDetail.astro
git commit -m "fix(perf): eager-load PDP primary image with high fetch priority

Astro Image defaults to lazy; the product hero is the LCP element
(5.7s POOR, 1.6s load delay in the audit).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: data-reveal → progressive enhancement; exempt commerce-critical elements

**Files:**
- Modify: `apps/storefront/src/styles/global.css` (lines 134–160)
- Modify: `apps/storefront/src/layouts/BaseLayout.astro` (head — new inline script)
- Modify: `apps/storefront/src/components/catalog/ProductCard.astro:28-36`
- Modify: `apps/storefront/src/components/catalog/ProductDetail.astro:41,52`
- Modify: `apps/storefront/src/components/catalog/FilterBar.astro:68`
- Modify: `apps/storefront/src/components/home/HomePage.astro:70-73`

**Interfaces:**
- Produces: root class contract `html.vx-anim` — reveal-hiding CSS only applies when JS has announced itself. Task 5 extends the same inline script.

- [ ] **Step 1: Gate the hidden state on `html.vx-anim`**

In `global.css` lines 134–160, prefix the hiding selectors (keep every declaration byte-identical, only selectors change):

```css
html.vx-anim [data-reveal] { /* existing opacity: 0; transform: translateY(42px); transitions... */ }
html.vx-anim [data-reveal='left'] { /* existing */ }
html.vx-anim [data-reveal='right'] { /* existing */ }
[data-reveal].vx-on { opacity: 1; transform: none; }
```

Leave the `.reveal-delay-*` helpers and the reduced-motion override (lines 1327–1330) untouched — the override still wins for JS users with reduced motion.

- [ ] **Step 2: Announce JS before first paint**

In `BaseLayout.astro` `<head>`, immediately after the `<meta charset>`/viewport tags:

```astro
<script is:inline>document.documentElement.classList.add('vx-anim');</script>
```

Synchronous, so JS users never see a visible→hidden flash; no-JS users (and HTML-only crawlers/renderers) get fully visible content.

- [ ] **Step 3: Exempt commerce-critical elements entirely**

- `ProductCard.astro:29-36`: remove `data-reveal` and the inline `--reveal-delay` style from the `<article>` (keep all `data-filter-*` attributes and classes).
- `ProductDetail.astro:41`: remove `data-reveal="left"` from the gallery.
- `ProductDetail.astro:52`: remove `data-reveal="right"` from `.product-summary`.
- `FilterBar.astro:68`: remove `data-reveal` from the aside.
- `HomePage.astro:70,71,73`: remove `data-reveal` from the hero title spans and `hero__bottom` (hero text is the text-LCP candidate).

Decorative sections (manifesto, editorial, design-lab, community…) keep their reveals.

- [ ] **Step 4: Build and verify**

Run: `pnpm nx run @vexxx/storefront:build`, then:
- `grep -c 'data-reveal' dist/client/catalog.html` → only the decorative count; `grep 'product-card' dist/client/catalog.html | grep -c 'data-reveal'` → 0.
- `grep -c 'vx-anim' dist/client/index.html` → ≥ 1 (inline script present).
- Sanity: `grep -o 'html.vx-anim \[data-reveal\]' dist/client/_astro/*.css` (or wherever global.css lands) → present.

- [ ] **Step 5: Verify + commit**

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "fix(seo): make reveal animation progressive enhancement, exempt commerce UI

Product cards and the entire buy box shipped at opacity:0 pending a
JS scroll handler - JS failure meant a blank store, and the reveal
system caused ~90% of LCP as pure render delay.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 5: Boot overlay — once per session, shorter, invisible without JS

**Files:**
- Modify: `apps/storefront/src/scripts/vexxx-client.ts` (initializeBoot, lines ~14–29)
- Modify: `apps/storefront/src/layouts/BaseLayout.astro` (extend the Task 4 inline script)
- Modify: `apps/storefront/src/styles/global.css` (boot-screen block, lines ~230–261)

**Interfaces:**
- Consumes: `html.vx-anim` contract from Task 4; `shouldRunBoot(reducedMotion)` from `src/lib/motion.ts` (unchanged).
- Produces: sessionStorage key `'vx-boot-seen'` + root class `vx-boot-seen`.

- [ ] **Step 1: Session-gate and shorten in `initializeBoot`**

Replace the body of `initializeBoot` (keep its existing signature and the `shouldRunBoot` check):

```ts
const BOOT_SESSION_KEY = 'vx-boot-seen';

// inside initializeBoot, after resolving `boot` element:
let seen = false;
try {
  seen = sessionStorage.getItem(BOOT_SESSION_KEY) === '1';
} catch {
  seen = true; // storage blocked: never replay the overlay
}
if (seen || !shouldRunBoot(reducedMotion)) {
  boot.hidden = true;
  return;
}
try {
  sessionStorage.setItem(BOOT_SESSION_KEY, '1');
} catch {
  /* storage blocked - still show once */
}
document.body.classList.add('overlay-open');
window.setTimeout(() => boot.classList.add('boot-screen--leaving'), 700);
window.setTimeout(() => {
  boot.hidden = true;
  document.body.classList.remove('overlay-open');
}, 1000);
```

(1550/2050 → 700/1000: the audit measured the overlay as the dominant render-delay component.)

- [ ] **Step 2: Prevent repeat-view flash + hide from no-JS entirely**

Extend the Task 4 inline head script in `BaseLayout.astro`:

```astro
<script is:inline>
  var vxRoot = document.documentElement;
  vxRoot.classList.add('vx-anim');
  try {
    if (sessionStorage.getItem('vx-boot-seen') === '1') vxRoot.classList.add('vx-boot-seen');
  } catch (e) {
    vxRoot.classList.add('vx-boot-seen');
  }
</script>
```

In `global.css`, next to the `.boot-screen` block:

```css
/* Overlay is a JS-only enhancement: no JS, no boot screen; repeat views skip it. */
html:not(.vx-anim) .boot-screen,
html.vx-boot-seen .boot-screen {
  display: none;
}
```

The CSS failsafe (`boot-autodismiss` at 2.6s) stays as a belt-and-braces for JS users whose script dies mid-boot; shorten its delay from `2.6s` to `1.4s` to match the new timings.

- [ ] **Step 3: Existing motion tests still pass**

Run: `pnpm nx run @vexxx/storefront:test -- src/lib/motion.test.ts`
Expected: PASS (shouldRunBoot untouched).

- [ ] **Step 4: Manual check**

Run `pnpm dev`, open `http://localhost:4321/`: overlay plays once (~1s), navigate to `/catalog` → no overlay. Hard-reload with DevTools "Disable JavaScript" → no overlay, all products visible (Task 4).

- [ ] **Step 5: Verify + commit**

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "fix(perf): boot overlay runs once per session and 1s shorter

The 2s overlay ran on every pageview and was the largest LCP
render-delay contributor sitewide.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 6: noindex the legal stubs + drop them from the sitemap

**Files:**
- Modify: `apps/storefront/src/pages/privacy.astro`, `shipping.astro`, `terms.astro`
- Modify: `apps/storefront/src/pages/en/privacy.astro`, `en/shipping.astro`, `en/terms.astro`
- Modify: `apps/storefront/astro.config.mjs` (sitemap integration)

**Interfaces:**
- Consumes: existing `noindex` prop on `BaseLayout`/`Seo` (already implemented, used only by 404).

- [ ] **Step 1: Add `noindex` to all six pages**

Each page's `<BaseLayout ...>` gains one prop (example, `privacy.astro`):

```astro
<BaseLayout
  locale={locale}
  title={dict.legal.privacy.metaTitle}
  description={dict.legal.privacy.metaDescription}
  path={routePath('privacy', locale)}
  alternates={routeAlternates('privacy')}
  noindex
>
```

> When the legal team delivers real copy: put it in `dict.legal.*.body`, delete the `noindex` prop, and re-add the routes to the sitemap filter below — same commit.

- [ ] **Step 2: Exclude them from the sitemap (noindex + sitemap listing contradict)**

In `astro.config.mjs`:

```js
sitemap({
  filter: (page) => !/\/(privacy|terms|shipping)$/.test(new URL(page).pathname),
  i18n: {
    defaultLocale: 'es',
    locales: { es: 'es-ES', en: 'en-US' },
  },
}),
```

- [ ] **Step 3: Build and verify**

Run: `pnpm nx run @vexxx/storefront:build`, then:
- `grep -o 'name="robots" content="[^"]*"' dist/client/privacy.html` → `noindex, nofollow` (repeat for all six HTML files).
- `grep -c 'privacy\|terms\|shipping' dist/client/sitemap-0.xml` → 0.

- [ ] **Step 4: Verify + commit**

```bash
pnpm verify
git add apps/storefront/src/pages/ apps/storefront/astro.config.mjs
git commit -m "fix(seo): noindex placeholder legal pages until real copy exists

/privacy, /shipping and /terms are ~7-word 'pending legal team'
stubs - indexable trust pages actively hurting E-E-A-T.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 7: nginx hardening pass

**Files:**
- Modify: `apps/storefront/nginx.conf` (full rewrite below)

**Interfaces:**
- Produces: security headers on every response; `www.vexxx.co` 301; trailing-slash and `/index.html` 301s; version banner off. Dockerfile already copies this file (`Dockerfile:29`).

- [ ] **Step 1: Replace `nginx.conf` with**

```nginx
# VEXXX storefront — static serving for the prerendered Astro build.
#
# The build uses `trailingSlash: 'never'` + `format: 'file'`, so /catalog is
# served from /catalog.html via try_files. Keep the 301 map below in sync with
# the `redirects` map in astro.config.mjs (that one covers dev / node runtime).
#
# TLS terminates upstream; HSTS below applies to the public HTTPS response
# the proxy forwards. No `includeSubDomains` until www + future subdomains
# all serve valid certs.

server_tokens off;

# www → apex (requires the upstream proxy to route www.vexxx.co here with a valid cert).
server {
    listen 80;
    server_name www.vexxx.co;
    return 301 https://vexxx.co$request_uri;
}

server {
    listen 80 default_server;
    server_name _;
    root /usr/share/nginx/html;
    # Relative Location headers so redirects survive port mapping / proxies.
    absolute_redirect off;

    gzip on;
    gzip_types text/html text/css application/javascript application/json image/svg+xml application/xml;
    gzip_min_length 1024;

    # ── Security headers (server level so every location inherits them). ──
    # NOTE: nginx add_header inheritance — any location that declares its own
    # add_header must repeat this whole set (see /_astro/ below).
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header X-Content-Type-Options "nosniff" always;

    # ── One URL per resource. ──
    # Trailing-slash URLs 301 to the canonical no-slash form.
    rewrite ^/(.+)/$ /$1 permanent;
    # /index.html duplicate homepage: match the ORIGINAL request only, so the
    # try_files internal redirect to /index.html cannot loop.
    if ($request_uri ~ ^/index\.html($|\?)) {
        return 301 /;
    }

    # Renamed URLs — permanent redirects (mirror astro.config.mjs).
    location = /archivo { return 301 /archive; }
    location = /coleccion { return 301 /collection; }
    location = /manifiesto { return 301 /manifesto; }
    location = /privacidad { return 301 /privacy; }
    location = /terminos { return 301 /terms; }
    location = /envios { return 301 /shipping; }
    location = /productos { return 301 /catalog; }
    location = /colecciones { return 301 /collections; }
    location = /en/products { return 301 /en/catalog; }
    location ^~ /productos/ { rewrite ^/productos/(.*)$ /catalog/$1 permanent; }
    location ^~ /colecciones/ { rewrite ^/colecciones/(.*)$ /collections/$1 permanent; }
    location ^~ /en/products/ { rewrite ^/en/products/(.*)$ /en/catalog/$1 permanent; }

    # Hashed build assets are immutable.
    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        # add_header here suppresses the inherited server-level set — repeat it.
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
        add_header X-Frame-Options "DENY" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header X-Content-Type-Options "nosniff" always;
        try_files $uri =404;
    }

    # Clean URLs: /catalog -> /catalog.html, / -> /index.html.
    location / {
        try_files $uri $uri.html $uri/index.html =404;
    }

    error_page 404 /404.html;
}
```

(The old `location /` add_header for nosniff moved to server level — that's what makes it inherit everywhere.)

- [ ] **Step 2: Test in Docker**

```bash
docker compose up -d --build storefront
curl -sI http://localhost:8080/ 
curl -sI http://localhost:8080/catalog/
curl -sI http://localhost:8080/index.html
curl -sI -H "Host: www.vexxx.co" http://localhost:8080/
curl -sI http://localhost:8080/_astro/ --output /dev/null -w '%{http_code}\n'
docker compose down
```

Expected:
- `/` → 200 with all six security headers, `Server: nginx` (no version).
- `/catalog/` → `301` `Location: /catalog`.
- `/index.html` → `301` `Location: /`.
- Host `www.vexxx.co` → `301` `Location: https://vexxx.co/`.
- Existing checks still hold: `curl -sI http://localhost:8080/productos` → `301 /catalog`.

If Docker is unavailable on this machine, ask the user to run the block above — do not claim it verified.

- [ ] **Step 3: Commit**

```bash
pnpm verify
git add apps/storefront/nginx.conf
git commit -m "feat(infra): security headers, www redirect, URL canonicalization in nginx

Adds HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy;
turns off the version banner; 301s trailing slashes, /index.html and
www.vexxx.co to the canonical forms.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

# Phase 2 — Content & conversion

### Task 8: Per-product material/fit/care copy (fixes factual errors on cap/bag/jacket/cargo)

**Files:**
- Modify: `apps/storefront/src/lib/catalog/types.ts`, `mapping.ts`, `mapping.test.ts`
- Modify: `apps/storefront/src/content.config.ts` (mirror schema — same commit, per repo rule)
- Modify: all 7 `apps/storefront/src/content/products/*.json`
- Modify: `apps/storefront/src/components/catalog/ProductDetail.astro` (info array, lines ~30–35)
- Modify: `apps/storefront/src/i18n/dictionaries/es.ts`, `en.ts` (remove `materialBody`, `fitBody`, `careBody`)

**Interfaces:**
- Produces: `Product.details: ProductDetails` where `ProductDetails = { material: LocalizedText; fit: LocalizedText; care: LocalizedText }`. `shippingBody` **stays a global dictionary string** — deliberate deviation from the report: shipping terms are genuinely identical across SKUs; duplicating them per product would recreate the boilerplate problem in the data layer. The three product-specific fields become per-product.

- [ ] **Step 1: Write the failing tests**

Add to `mapping.test.ts` — extend `validRawProduct` with:

```ts
  details: {
    material: { es: 'Algodón de prueba.', en: 'Test cotton.' },
    fit: { es: 'Corte de prueba.', en: 'Test fit.' },
    care: { es: 'Cuidado de prueba.', en: 'Test care.' },
  },
```

and add two cases:

```ts
  it('maps per-product details to the domain type', () => {
    const product = parseProduct('vx-tee-001', validRawProduct);
    expect(product.details.material.en).toBe('Test cotton.');
    expect(product.details.care.es).toBe('Cuidado de prueba.');
  });

  it('rejects a product without details', () => {
    const { details: _details, ...withoutDetails } = validRawProduct;
    expect(() => parseProduct('x', withoutDetails)).toThrow();
  });
```

- [ ] **Step 2: Run — must fail**

Run: `pnpm nx run @vexxx/storefront:test -- src/lib/catalog/mapping.test.ts`
Expected: FAIL (schema rejects unknown `details` key — strict).

- [ ] **Step 3: Extend types + both schemas**

`types.ts`:

```ts
/** Per-product accordion copy — factual, unique per SKU. */
export interface ProductDetails {
  readonly material: LocalizedText;
  readonly fit: LocalizedText;
  readonly care: LocalizedText;
}
// in Product:
readonly details: ProductDetails;
```

`mapping.ts` — inside `rawProductSchema`:

```ts
details: z
  .object({ material: localizedText, fit: localizedText, care: localizedText })
  .strict(),
```

and in `parseProduct`'s return: `details: data.details,`.
`content.config.ts` — identical `details` object added to the products schema (its own zod instance).

- [ ] **Step 4: Author the copy in all 7 JSONs**

Add a `details` block to each file (place after `description`):

`vx-hood-001.json`:
```json
"details": {
  "material": {
    "es": "Algodón lavado de 480 GSM con costuras reforzadas y bordado metálico envejecido. Acabados diseñados para envejecer con el uso.",
    "en": "480 GSM washed cotton with reinforced seams and distressed metal embroidery. Finishes built to age with wear."
  },
  "fit": {
    "es": "Silueta oversized de bloque ancho y hombro caído. Elige tu talla habitual para conservar la proporción diseñada.",
    "en": "Oversized wide-block silhouette with dropped shoulders. Take your usual size to keep the intended proportion."
  },
  "care": {
    "es": "Lavar en frío y del revés. Secar al aire. El desgaste y la decoloración forman parte de la pieza.",
    "en": "Wash cold, inside out. Air dry. Wear and fading are part of the piece."
  }
}
```

`vx-tee-001.json` (SKU VXX-TEE-002):
```json
"details": {
  "material": {
    "es": "Jersey open-end de 250 GSM con acabado negro lavado. Cuello reforzado con tapacosturas.",
    "en": "250 GSM open-end jersey with a washed-black finish. Reinforced collar with taped seams."
  },
  "fit": {
    "es": "Bloque cuadrado de hombro ancho, largo recortado. Talla habitual para el corte boxy previsto.",
    "en": "Square block with wide shoulders and a cropped length. Usual size for the intended boxy cut."
  },
  "care": {
    "es": "Lavar en frío y del revés. Secar al aire. El lavado acentúa el acabado envejecido.",
    "en": "Wash cold, inside out. Air dry. Washing deepens the aged finish."
  }
}
```

`vxx-lsl-003.json`:
```json
"details": {
  "material": {
    "es": "Algodón de 240 GSM con lavado ácido. Cada pieza tiene un patrón de decoloración irrepetible.",
    "en": "240 GSM cotton with an acid wash. Every piece carries an unrepeatable fade pattern."
  },
  "fit": {
    "es": "Corte relajado con puños extendidos. Talla habitual; el largo de manga está pensado para acumularse.",
    "en": "Relaxed cut with extended cuffs. Usual size; the sleeve length is meant to stack."
  },
  "care": {
    "es": "Lavar en frío, del revés y por separado las primeras veces. Secar al aire.",
    "en": "Wash cold, inside out, and separately the first few times. Air dry."
  }
}
```

`vxx-crg-004.json`:
```json
"details": {
  "material": {
    "es": "Ripstop reforzado con ocho bolsillos y herrajes personalizados en gunmetal.",
    "en": "Bonded ripstop with eight pockets and custom gunmetal hardware."
  },
  "fit": {
    "es": "Pierna ancha con rodillas articuladas y tiro medio. Talla habitual; el bajo apila sobre la zapatilla.",
    "en": "Wide leg with articulated knees and a mid rise. Usual size; the hem stacks over the shoe."
  },
  "care": {
    "es": "Lavar en frío con los bolsillos cerrados. No usar secadora: protege el laminado del ripstop.",
    "en": "Wash cold with the pockets closed. No tumble drying - it protects the ripstop bonding."
  }
}
```

`vxx-jkt-005.json`:
```json
"details": {
  "material": {
    "es": "Shell técnica de tres capas con costuras selladas, capucha de tormenta y ventilaciones cortadas con láser.",
    "en": "Three-layer technical shell with taped seams, a storm hood and laser-cut vents."
  },
  "fit": {
    "es": "Corte técnico con espacio para capas intermedias. Talla habitual salvo que busques capas gruesas.",
    "en": "Technical cut with room for mid layers. Usual size unless you layer heavy."
  },
  "care": {
    "es": "Limpiar con paño húmedo. Lavado técnico ocasional en frío, sin suavizante: daña las costuras selladas.",
    "en": "Wipe clean with a damp cloth. Occasional cold technical wash, no softener - it degrades the taped seams."
  }
}
```

`vxx-cap-006.json`:
```json
"details": {
  "material": {
    "es": "Lona lavada de seis paneles con visera deshilachada y cierre ajustable de metal envejecido.",
    "en": "Six-panel washed canvas with a frayed brim and a distressed adjustable metal closure."
  },
  "fit": {
    "es": "Talla única con cierre metálico ajustable. Perfil medio y visera plana deshilachada.",
    "en": "One size with an adjustable metal closure. Mid profile with a flat frayed brim."
  },
  "care": {
    "es": "Limpiar a mano con paño húmedo. No lavar a máquina: deformaría los paneles y la visera.",
    "en": "Spot clean by hand with a damp cloth. No machine washing - it would warp the panels and brim."
  }
}
```

`vxx-bag-007.json`:
```json
"details": {
  "material": {
    "es": "Ripstop reforzado con cinchas modulares, herrajes silenciosos y funda interior oculta.",
    "en": "Bonded ripstop with modular webbing, silent hardware and a concealed inner sleeve."
  },
  "fit": {
    "es": "Talla única con correa crossbody ajustable. Cinchas modulares para portar accesorios externos.",
    "en": "One size with an adjustable crossbody strap. Modular webbing carries external accessories."
  },
  "care": {
    "es": "Limpiar con paño húmedo. Vaciar la funda interior antes de limpiar los herrajes.",
    "en": "Wipe clean with a damp cloth. Empty the inner sleeve before cleaning the hardware."
  }
}
```

- [ ] **Step 5: Consume in `ProductDetail.astro`**

Replace the `info` array (lines ~30–35):

```ts
const info: readonly (readonly [string, string])[] = [
  [dict.product.material, product.details.material[locale]],
  [dict.product.fit, product.details.fit[locale]],
  [dict.product.care, product.details.care[locale]],
  [dict.product.shipping, dict.product.shippingBody],
];
```

- [ ] **Step 6: Remove the dead dictionary keys**

Delete `materialBody`, `fitBody`, `careBody` from `product:` in **both** `es.ts` and `en.ts` (the `Dictionary` type updates automatically; `en.ts` will fail typecheck until both are edited). `shippingBody` stays.

- [ ] **Step 7: Run tests, build, verify uniqueness**

Run: `pnpm nx run @vexxx/storefront:test` → PASS.
Run: `pnpm nx run @vexxx/storefront:build`, then confirm the cap page no longer claims cotton:
`grep -c 'Algodón' dist/client/catalog/gorra-envejecida.html` → 0 in the accordion region (canvas copy present: `grep -c 'Lona lavada' <same>` → ≥ 1).

- [ ] **Step 8: Commit**

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "feat(content): per-product material/fit/care copy in product data

The global dictionary strings claimed 'washed heavyweight cotton /
oversized silhouette' on the cap, bag, jacket and cargo - duplicate
boilerplate across 14 URLs plus factual errors. Shipping copy stays
global on purpose: it is genuinely uniform.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 9: Evergreen catalog title

**Files:**
- Modify: `apps/storefront/src/i18n/dictionaries/es.ts` (`products.metaTitle`, and `products.metaDescription` if it names Drop 001)
- Modify: `apps/storefront/src/i18n/dictionaries/en.ts` (same keys)

- [ ] **Step 1: Replace the strings**

es: `metaTitle: 'Catálogo — Streetwear premium de edición limitada',`
en: `metaTitle: 'Catalog — Limited-edition premium streetwear',`

Both pass the 65-char build limit after the `— VEXXX` template (58 / 53 chars). If `metaDescription` references "Drop 001", replace with:
es: `'Catálogo completo VEXXX: streetwear premium en ediciones numeradas y limitadas. Producido una vez, después retirado.'`
en: `'The full VEXXX catalog: premium streetwear in numbered, limited editions. Produced once, then retired.'`
The drop name stays in on-page copy (`products.eyebrow` already reads `SISTEMA / CATÁLOGO / DROP_001` — unchanged).

- [ ] **Step 2: Build (the meta limits are the test) and eyeball**

Run: `pnpm nx run @vexxx/storefront:build` → succeeds (a >65-char title would throw).
`grep -o '<title>[^<]*</title>' dist/client/catalog.html` → `Catálogo — Streetwear premium de edición limitada — VEXXX`.

- [ ] **Step 3: Commit**

```bash
pnpm verify
git add apps/storefront/src/i18n/
git commit -m "fix(seo): evergreen catalog meta title, drop name stays on-page

'Drop 001 - Streetwear premium' stales the moment Drop 002 ships.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 10: About + Contact pages **[OWNER-GATED]**

**Files:**
- Modify: `apps/storefront/src/i18n/routes.ts` (add `about`, `contact`)
- Modify: `apps/storefront/src/i18n/dictionaries/es.ts`, `en.ts` (new `about` and `contact` namespaces)
- Create: `apps/storefront/src/pages/about.astro`, `contact.astro`, `en/about.astro`, `en/contact.astro`
- Modify: `apps/storefront/src/layouts/BaseLayout.astro` (footer nav links)

**Interfaces:**
- Consumes: `routePath`/`routeAlternates` from `src/i18n/routes.ts`; existing footer dict keys `footer.contact` (defined, currently unrendered).
- Produces: `/about`, `/contact`, `/en/about`, `/en/contact` — indexable, full meta, in sitemap. Contact email `OWNER_CONTACT_EMAIL` and handles `OWNER_IG_HANDLE`/`OWNER_TIKTOK_HANDLE` come from owner input.

- [ ] **Step 1: Routes**

In `routes.ts` add to the static route map:

```ts
about: { es: '/about', en: '/en/about' },
contact: { es: '/contact', en: '/en/contact' },
```

(English segments in both locales — owner decision 2026-07-22.)

- [ ] **Step 2: Dictionary namespaces**

`es.ts` (new top-level keys; `en.ts` must mirror the shape):

```ts
about: {
  metaTitle: 'Sobre la marca',
  metaDescription:
    'VEXXX es una marca de streetwear de edición limitada: piezas numeradas, producidas una vez y retiradas. Conoce el proceso detrás de cada drop.',
  eyebrow: 'VEXXX.EXE / SISTEMA',
  heading: 'SOBRE LA MARCA',
  body: [
    'VEXXX produce streetwear premium en ediciones numeradas y limitadas. Cada pieza se produce una sola vez; cuando un drop se agota, se retira y no se repone.',
    'Cada drop es una serie cerrada: materiales pesados, acabados lavados y construcción pensada para envejecer con el uso. El desgaste forma parte del diseño.',
    'El catálogo completo, las fechas de cada drop y la disponibilidad por talla se publican únicamente en este sitio.',
  ],
  operatedBy: 'Operado por OWNER_LEGAL_ENTITY.',
},
contact: {
  metaTitle: 'Contacto',
  metaDescription:
    'Contacta con VEXXX: soporte de pedidos, envíos y devoluciones. Respondemos en 48 horas laborables.',
  eyebrow: 'VEXXX.EXE / SISTEMA',
  heading: 'CONTACTO',
  intro: 'Soporte de pedidos, envíos, devoluciones y prensa.',
  emailLabel: 'Correo',
  socialLabel: 'Redes',
  responseNote: 'Respondemos en un plazo de 48 horas laborables.',
},
```

`en.ts` equivalents:

```ts
about: {
  metaTitle: 'About the brand',
  metaDescription:
    'VEXXX is a limited-edition streetwear label: numbered pieces, produced once and retired. Learn the process behind every drop.',
  eyebrow: 'VEXXX.EXE / SYSTEM',
  heading: 'ABOUT THE BRAND',
  body: [
    'VEXXX makes premium streetwear in numbered, limited editions. Every piece is produced exactly once; when a drop sells out it is retired, never restocked.',
    'Each drop is a closed series: heavy fabrics, washed finishes and construction built to age with wear. Wear is part of the design.',
    'The full catalog, drop dates and per-size availability are published only on this site.',
  ],
  operatedBy: 'Operated by OWNER_LEGAL_ENTITY.',
},
contact: {
  metaTitle: 'Contact',
  metaDescription:
    'Contact VEXXX: order support, shipping and returns. We reply within 48 business hours.',
  eyebrow: 'VEXXX.EXE / SYSTEM',
  heading: 'CONTACT',
  intro: 'Order support, shipping, returns and press.',
  emailLabel: 'Email',
  socialLabel: 'Social',
  responseNote: 'We reply within 48 business hours.',
},
```

Replace `OWNER_LEGAL_ENTITY` with the real entity name at execution time (owner input). All meta strings above are within the 65/170 limits (about metaDescription es = 148 chars).

- [ ] **Step 3: Pages**

`src/pages/about.astro` (en variant changes `locale`, import depth, and dict lookup only):

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { t } from '../i18n';
import { routeAlternates, routePath } from '../i18n/routes';

const locale = 'es' as const;
const dict = t(locale);
---

<BaseLayout
  locale={locale}
  title={dict.about.metaTitle}
  description={dict.about.metaDescription}
  path={routePath('about', locale)}
  alternates={routeAlternates('about')}
>
  <article class="section-shell">
    <p class="eyebrow">{dict.about.eyebrow}</p>
    <h1 class="display-title">{dict.about.heading}</h1>
    {dict.about.body.map((paragraph) => <p>{paragraph}</p>)}
    <p>{dict.about.operatedBy}</p>
  </article>
</BaseLayout>
```

`src/pages/contact.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SITE } from '../config/site';
import { t } from '../i18n';
import { routeAlternates, routePath } from '../i18n/routes';

const locale = 'es' as const;
const dict = t(locale);
---

<BaseLayout
  locale={locale}
  title={dict.contact.metaTitle}
  description={dict.contact.metaDescription}
  path={routePath('contact', locale)}
  alternates={routeAlternates('contact')}
>
  <article class="section-shell">
    <p class="eyebrow">{dict.contact.eyebrow}</p>
    <h1 class="display-title">{dict.contact.heading}</h1>
    <p>{dict.contact.intro}</p>
    <dl>
      <dt>{dict.contact.emailLabel}</dt>
      <dd><a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></dd>
      <dt>{dict.contact.socialLabel}</dt>
      <dd>
        {SITE.socialProfiles.map((profile) => (
          <a href={profile} rel="noreferrer">{new URL(profile).hostname.replace('www.', '')}</a>
        ))}
      </dd>
    </dl>
    <p>{dict.contact.responseNote}</p>
  </article>
</BaseLayout>
```

`SITE.contactEmail` / real `socialProfiles` land in Task 11 — do Task 11's `site.ts` change **before** this page compiles, or execute Tasks 10+11 as one unit. Match existing pages' class usage (`section-shell`, `eyebrow`, `display-title` exist in global.css); reuse `DocumentPage.astro` instead if its props fit better — semantic structure is what matters.

- [ ] **Step 4: Footer links**

In `BaseLayout.astro` footer nav (near the existing shipping/privacy/terms links), add:

```astro
<a href={routePath('about', locale)}>{dict.about.metaTitle}</a>
<a href={routePath('contact', locale)}>{dict.footer.contact}</a>
```

- [ ] **Step 5: Build + verify**

Run: `pnpm nx run @vexxx/storefront:build`, then:
- `dist/client/about.html`, `contact.html`, `en/about.html`, `en/contact.html` exist.
- `grep -c 'hreflang' dist/client/about.html` → 3 (es, en, x-default).
- Both new routes present in `dist/client/sitemap-0.xml`.

- [ ] **Step 6: Commit**

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "feat(content): add About and Contact pages in both locales

The site had zero entity/contact information anywhere - the
highest-weighted missing E-E-A-T trust signal.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 11: Real social profiles + Organization contactPoint **[OWNER-GATED]**

**Files:**
- Modify: `apps/storefront/src/config/site.ts`
- Modify: `apps/storefront/src/lib/seo/jsonld.ts` (`organizationJsonLd`)
- Modify: `apps/storefront/src/lib/seo/jsonld.test.ts`
- Modify: `apps/storefront/src/layouts/BaseLayout.astro:179-183` (footer social links)

**Interfaces:**
- Produces: `SITE.contactEmail: string`, `SITE.socialProfiles` populated; Organization JSON-LD gains `sameAs` + `contactPoint`. Task 10's contact page consumes both.

- [ ] **Step 1: Failing test**

In `jsonld.test.ts`, add to the organization describe block:

```ts
  it('includes contactPoint with the support email', () => {
    const org = organizationJsonLd({ siteUrl });
    expect(org['contactPoint']).toEqual({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'OWNER_CONTACT_EMAIL',
    });
  });
```

(Use the real email; the literal here marks the owner-input slot.)

Run: `pnpm nx run @vexxx/storefront:test -- src/lib/seo/jsonld.test.ts` → FAIL.

- [ ] **Step 2: site.ts**

```ts
socialProfiles: [
  'https://www.instagram.com/OWNER_IG_HANDLE',
  'https://www.tiktok.com/@OWNER_TIKTOK_HANDLE',
] as readonly string[],
contactEmail: 'OWNER_CONTACT_EMAIL',
```

- [ ] **Step 3: organizationJsonLd**

After the existing `sameAs` conditional:

```ts
contactPoint: {
  '@type': 'ContactPoint',
  contactType: 'customer support',
  email: SITE.contactEmail,
},
```

If the owner supplied a public address, also add `address` as a `PostalAddress`; otherwise omit (never fabricate an address).

- [ ] **Step 4: Footer uses the same source of truth**

Replace the hardcoded `https://www.instagram.com` / `https://www.tiktok.com` anchors in `BaseLayout.astro:179-183` with links derived from `SITE.socialProfiles` (keep `dict.footer.instagram`/`tiktok` labels, matching by hostname).

- [ ] **Step 5: Test, build, commit**

Run: `pnpm nx run @vexxx/storefront:test` → PASS. Build and check `grep -o '"sameAs":\[[^]]*\]' dist/client/index.html` shows the real profile URLs.

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "feat(seo): real social profiles and support contact in Organization JSON-LD

Footer previously linked bare instagram.com/tiktok.com homepages and
sameAs was empty - entity signals AI/search systems verify.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 12: Offer.shippingDetails + hasMerchantReturnPolicy **[OWNER-GATED]**

**Files:**
- Modify: `apps/storefront/src/lib/seo/jsonld.ts` (`productJsonLd`)
- Modify: `apps/storefront/src/lib/seo/jsonld.test.ts`
- Modify: `apps/storefront/src/config/site.ts` (commerce constants)

**Gate:** run after the owner decides return terms (days + fees, or no-returns) and shipping scope/rate. Google requires both blocks for full merchant-listing eligibility.

- [ ] **Step 1: Failing test**

```ts
  it('includes shipping details and return policy on the offer', () => {
    const product = productJsonLd(validInput);
    const offers = product['offers'] as Record<string, unknown>;
    expect(offers['shippingDetails']).toMatchObject({ '@type': 'OfferShippingDetails' });
    expect(offers['hasMerchantReturnPolicy']).toMatchObject({ '@type': 'MerchantReturnPolicy' });
  });
```

Run → FAIL.

- [ ] **Step 2: Commerce constants in `site.ts`**

```ts
/** Merchant-listing facts encoded in Product JSON-LD. Owner-confirmed 2026-07-22. */
commerce: {
  shipsFromCountry: 'CO',
  // OWNER INPUT: list of destination country codes, or ['CO'] until confirmed.
  shippingDestinations: ['CO'] as readonly string[],
  handlingDaysMax: 2, // "Despacho previsto en 48 horas"
  // OWNER INPUT: returns decision. 30 days by-mail is the placeholder-free default
  // ONLY if the owner confirms; for a strict no-returns drop model use
  // 'https://schema.org/MerchantReturnNotPermitted' and drop the days/fees fields.
  returnDays: 30,
},
```

- [ ] **Step 3: Extend the `offers` object in `productJsonLd`**

```ts
offers: {
  '@type': 'Offer',
  // ...existing fields...
  shippingDetails: {
    '@type': 'OfferShippingDetails',
    shippingDestination: SITE.commerce.shippingDestinations.map((country) => ({
      '@type': 'DefinedRegion',
      addressCountry: country,
    })),
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: SITE.commerce.handlingDaysMax,
        unitCode: 'DAY',
      },
    },
  },
  hasMerchantReturnPolicy: {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: SITE.commerce.shipsFromCountry,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: SITE.commerce.returnDays,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  },
},
```

If the owner confirms no-returns, emit `returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted'` and omit `merchantReturnDays`/`returnMethod`/`returnFees`.

- [ ] **Step 4: Test, build, validate, commit**

Run the suite → PASS. Build, paste one product page's JSON-LD into the Rich Results Test (manual ops list).

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "feat(seo): shippingDetails and MerchantReturnPolicy on product offers

Required for full merchant-listing eligibility since 2023; Search
Console flags every SKU without them.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 13: Homepage first-viewport shop strip

**Files:**
- Modify: `apps/storefront/src/components/home/HomePage.astro` (hero bottom + scoped styles)
- Modify: `apps/storefront/src/i18n/dictionaries/es.ts`, `en.ts` (`home.shopStripLabel`, `home.shopStripCta`)

**Interfaces:**
- Consumes: `products` already available in `HomePage.astro` (used for `featured`); `productPath(locale, slug)` and `routePath('products', locale)` from `src/i18n/routes.ts` (HomePage already imports `productPath` for the story CTA at line ~242); `productImage(sku)` from Task 2.

- [ ] **Step 1: Dictionary strings**

es: `shopStripLabel: 'DISPONIBLE AHORA — DROP_001',` `shopStripCta: 'Ver catálogo completo',`
en: `shopStripLabel: 'AVAILABLE NOW — DROP_001',` `shopStripCta: 'View full catalog',`

- [ ] **Step 2: Markup inside the hero (so it is in the first viewport)**

In `HomePage.astro` frontmatter: `const shopStrip = products.filter((p) => p.availability === 'in-stock').slice(0, 3);`
Inside the `.hero` section, after the existing `hero__bottom` block (no `data-reveal` — this is commerce-critical):

```astro
<nav class="hero__shop" aria-label={dict.home.shopStripLabel}>
  <p class="hero__shop-label eyebrow">{dict.home.shopStripLabel}</p>
  <ul class="hero__shop-grid">
    {shopStrip.map((item) => (
      <li>
        <a href={productPath(locale, item.slug[locale])}>
          <Image src={productImage(item.sku)} alt={item.name[locale]} widths={[160, 320]} sizes="160px" loading="eager" />
          <span class="hero__shop-name">{item.name[locale]}</span>
        </a>
      </li>
    ))}
  </ul>
  <a class="button" href={routePath('products', locale)}>{dict.home.shopStripCta}</a>
</nav>
```

- [ ] **Step 3: Scoped styles (in HomePage's `<style>`)**

```css
.hero__shop {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding-top: 1.5rem;
}
.hero__shop-grid {
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.hero__shop-grid img {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: cover;
}
.hero__shop-name {
  display: block;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 0.4rem;
}
@media (max-width: 620px) {
  .hero__shop-grid img { width: 3.5rem; height: 3.5rem; }
}
```

Adjust spacing so the strip fits within `100svh` alongside existing hero content at 375×812 and 1440×900 (dev-server check).

- [ ] **Step 4: Verify + commit**

`pnpm dev` → at 375×812 and desktop, the three thumbnails + CTA are visible without scrolling. Build passes.

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "feat(home): in-stock shop strip inside the first viewport

Commerce was buried under ~2 viewport-heights of manifesto; SERP
leaders for the target query show products in the first screen.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 14: PDP conversion — numbered-piece line beside price, buy box first on mobile

**Files:**
- Modify: `apps/storefront/src/components/catalog/ProductDetail.astro` (summary markup + scoped styles)
- Modify: `apps/storefront/src/i18n/dictionaries/es.ts`, `en.ts` (`product.certificate`, trim `product.unitNote`)

- [ ] **Step 1: Dictionary**

es: add `certificate: 'PIEZA NUMERADA — UNIDAD ASIGNADA AL PAGAR',` and change `unitNote` to `'PRODUCIDA UNA VEZ, DESPUÉS RETIRADA'` (removing the now-duplicated first clause).
en: `certificate: 'NUMBERED PIECE — UNIT ASSIGNED AT CHECKOUT',` `unitNote: 'PRODUCED ONCE, THEN RETIRED'`.

- [ ] **Step 2: Markup**

In `ProductDetail.astro`, directly after the price row (lines ~55–58):

```astro
<p class="product-certificate">{dict.product.certificate}</p>
```

Scoped style:

```css
.product-certificate {
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.75;
  margin: 0.5rem 0 0;
}
```

- [ ] **Step 3: Buy box above the gallery on mobile**

In the existing `@media (max-width: 850px)` block of `ProductDetail.astro`'s styles (the one that already sets `grid-template-columns: 1fr`), add:

```css
.product-summary { order: -1; }
```

so name + price + CTA render in the first mobile viewport, gallery below.

- [ ] **Step 4: Verify + commit**

`pnpm dev`, 375×812 on a product page: H1, price, certificate line and the Add button all visible without scrolling; desktop layout unchanged.

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "feat(pdp): numbered-piece trust line at the price, buy box first on mobile

The '27 numbered pieces' promise never appeared at the point of
purchase, and mobile showed only the photo above the fold.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 15: Image weight — wordmark srcset, drop shared campaign shots from PDP

**Files:**
- Modify: `apps/storefront/src/layouts/BaseLayout.astro:109-111`
- Modify: `apps/storefront/src/components/catalog/ProductDetail.astro` (remove gallery figures 2–3 + their imports)

- [ ] **Step 1: Wordmark**

The asset is 1254×1254 (the declared `width={1166} height={430}` is wrong). Replace:

```astro
<Image
  src={vexxxWordmark}
  alt=""
  widths={[96, 128, 192]}
  sizes="(max-width: 620px) 84px, 112px"
/>
```

(Dimensions now come from the asset metadata; `widths` yields a srcset of ~5 KB variants instead of one 55 KB file.)

- [ ] **Step 2: PDP gallery**

Delete lines ~47–48 (`campaignPortrait` / `campaignGroup` figures with `alt=""`) and their two imports at the top of `ProductDetail.astro`. Check the gallery's scoped grid CSS for a rule expecting 3 children and simplify if present. Per-product secondary photography returns here when real assets exist (backlog note).

- [ ] **Step 3: Build + verify**

- `grep -c 'campaign-portrait' dist/client/catalog/sudadera-heavyweight-system-failure.html` → 0.
- Wordmark `<img>` in any page now has `srcset` with 96/128/192w candidates; largest referenced file in `dist/client/_astro/` for the wordmark ≤ ~10 KB.

- [ ] **Step 4: Commit**

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "fix(perf): right-size header wordmark, remove shared campaign shots from PDPs

Wordmark shipped 55.6 KB rendered at 84px (98% waste, every page);
identical campaign photos with empty alt padded all 7 product
galleries (~377 KB, image-product mismatch).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 16: Mobile — tap targets, collapsible catalog filters, overflow verification

**Files:**
- Modify: `apps/storefront/src/styles/global.css` (tap targets)
- Modify: `apps/storefront/src/components/catalog/FilterBar.astro` (toggle + scoped styles + script)
- Modify: `apps/storefront/src/components/catalog/ProductDetail.astro` (size-picker height)
- Modify: `apps/storefront/src/i18n/dictionaries/es.ts`, `en.ts` (filter toggle label)

- [ ] **Step 1: Tap targets (coarse pointers only — desktop visuals untouched)**

Append to `global.css`:

```css
/* 48px minimum touch targets on coarse pointers (audit: chips 31px, icons 40px). */
@media (pointer: coarse) {
  .icon-button {
    width: 3rem;
    height: 3rem;
  }
  .header-locale,
  .header-access,
  .cart-trigger {
    min-height: 3rem;
    display: inline-flex;
    align-items: center;
  }
}
```

In `FilterBar.astro` styles:

```css
@media (pointer: coarse) {
  .filter-chip {
    min-height: 3rem;
    padding-inline: 1rem;
  }
}
```

In `ProductDetail.astro` styles: `@media (pointer: coarse) { .size-picker span { min-height: 3rem; } }`.

- [ ] **Step 2: Collapsible filters on mobile (progressive enhancement)**

Dictionary: es `filtersToggle: 'FILTROS',` en `filtersToggle: 'FILTERS',` (add to wherever the FilterBar labels come from — follow the existing `labels` prop source in `CatalogPage.astro`).

In `FilterBar.astro`, wrap the five fieldsets:

```astro
<button type="button" class="filter-toggle" data-filter-toggle aria-expanded="true">
  {labels.filtersToggle}
</button>
<div class="filter-groups" data-filter-groups>
  <!-- existing five fieldsets, unchanged -->
</div>
```

Styles:

```css
.filter-toggle { display: none; }
@media (max-width: 620px) {
  .filter-toggle {
    display: block;
    width: 100%;
    min-height: 3rem;
    text-align: left;
  }
  [data-filter-toggle][aria-expanded='false'] + [data-filter-groups] {
    display: none;
  }
}
```

In the FilterBar client script (same island that handles chips), at init:

```ts
const toggle = root.querySelector<HTMLButtonElement>('[data-filter-toggle]');
if (toggle && window.matchMedia('(max-width: 620px)').matches) {
  toggle.setAttribute('aria-expanded', 'false');
}
toggle?.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
});
```

No-JS: button renders `aria-expanded="true"` server-side → filters stay visible. JS on mobile: collapsed by default → first product row lands in the first viewport.

- [ ] **Step 3: Verify the reported 40px overflow (report claim unconfirmed in static CSS)**

`pnpm dev`, DevTools responsive 375×812, on `/`, `/en`, and one PDP run in the console:
`document.documentElement.scrollWidth` → expect `375`. If any page reports >375, identify the offending element (`[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > 375.5)`), fix its width/offset at the mobile breakpoint, and note the fix in the commit. If all pages report 375, record "not reproducible" — the audit likely measured a pre-fix build.

- [ ] **Step 4: Verify + commit**

`pnpm dev` mobile emulation: chips/buttons ≥48px tall, catalog shows products in first viewport with filters collapsed, filters usable with JS off (desktop + mobile).

```bash
pnpm verify
git add apps/storefront/src/
git commit -m "fix(mobile): 48px touch targets and collapsible catalog filters

Filter chips were 31px tall and five filter fieldsets filled the
entire first mobile viewport before any product.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

# Phase 3 — Backlog

### Task 17: Collection-scoped related products + collection breadcrumb level

**Files:**
- Modify: `apps/storefront/src/pages/catalog/[slug].astro` (lines ~44–46 related; ~60–70 breadcrumb)
- Modify: `apps/storefront/src/pages/en/catalog/[slug].astro` (same)

**Interfaces:**
- Consumes: `getCatalog().getProductsByCollection(collectionId)`, `getPublishedCollections()` (both already on the `CatalogAdapter` interface); `collectionPath(locale, slug)` from `src/i18n/routes.ts` (signature is `(locale, slug)` — same as `productPath`).

- [ ] **Step 1: Related scoped by collection (fallback keeps 3 items)**

```ts
const catalog = getCatalog();
const collectionMates = product.collectionId
  ? await catalog.getProductsByCollection(product.collectionId)
  : [];
const others = (await catalog.getPublishedProducts()).filter(
  (item) => item.id !== product.id && !collectionMates.some((mate) => mate.id === item.id),
);
const related = [
  ...collectionMates.filter((item) => item.id !== product.id),
  ...others,
].slice(0, 3);
```

- [ ] **Step 2: Collection breadcrumb level**

```ts
const collection = product.collectionId
  ? (await catalog.getPublishedCollections()).find((entry) => entry.id === product.collectionId)
  : undefined;
```

Insert between the Products and Product items of `breadcrumbJsonLd` when `collection` is defined:

```ts
...(collection
  ? [{ name: collection.name[locale], url: canonicalUrl(site, collectionPath(locale, collection.slug[locale])) }]
  : []),
```

- [ ] **Step 3: Build + verify**

`grep -o '"itemListElement":\[[^]]*\]' dist/client/catalog/sudadera-heavyweight-system-failure.html` → 4 positions (Home → Products → Drop 001 → product). Related grid still renders 3 cards.

- [ ] **Step 4: Commit**

```bash
pnpm verify
git add apps/storefront/src/pages/
git commit -m "feat(seo): collection-aware breadcrumbs and related products

Related was 'any 3 published products' and breadcrumbs skipped the
collection level - both break topical linking once Drop 002 ships.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 18: `updatedAt` → sitemap lastmod (+ priceValidUntil if drop end date exists) **[OWNER-GATED for the date]**

**Files:**
- Modify: all 7 `apps/storefront/src/content/products/*.json` (add `"updatedAt": "2026-07-22"`)
- Modify: `apps/storefront/src/lib/catalog/types.ts`, `mapping.ts`, `mapping.test.ts`, `src/content.config.ts` (both schemas, same commit)
- Modify: `apps/storefront/astro.config.mjs` (sitemap `serialize`)

- [ ] **Step 1: Failing test** — `mapping.test.ts`: add `updatedAt: '2026-07-22'` to `validRawProduct`, plus:

```ts
  it('maps updatedAt and rejects non-date values', () => {
    expect(parseProduct('x', validRawProduct).updatedAt).toBe('2026-07-22');
    expect(() => parseProduct('x', { ...validRawProduct, updatedAt: 'yesterday' })).toThrow();
  });
```

- [ ] **Step 2: Schemas + type** — both zod schemas: `updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),`; `Product` gains `readonly updatedAt: string;`; `parseProduct` passes it through; all 7 JSONs get `"updatedAt": "2026-07-22"`. Bump a product's `updatedAt` in any future commit that changes its data.

- [ ] **Step 3: Sitemap lastmod** — in `astro.config.mjs` (node context, fs is fine):

```js
import { readdirSync, readFileSync } from 'node:fs';

const productLastmod = new Map();
for (const file of readdirSync('./src/content/products')) {
  if (!file.endsWith('.json')) continue;
  const raw = JSON.parse(readFileSync(`./src/content/products/${file}`, 'utf8'));
  productLastmod.set(`/catalog/${raw.slugs.es}`, raw.updatedAt);
  productLastmod.set(`/en/catalog/${raw.slugs.en}`, raw.updatedAt);
}
```

and in the sitemap options:

```js
serialize(item) {
  const lastmod = productLastmod.get(new URL(item.url).pathname);
  return lastmod ? { ...item, lastmod } : item;
},
```

- [ ] **Step 4: priceValidUntil** — only if the owner supplied a Drop 001 end date: add `priceValidUntil: '<date>'` to the `offers` object in `productJsonLd` (sourced from a `SITE.commerce.dropEndsOn` constant) + a jsonld.test.ts assertion. Skip cleanly otherwise and log it.

- [ ] **Step 5: Verify + commit** — tests pass; `grep -c '<lastmod>2026-07-22' dist/client/sitemap-0.xml` → 14.

```bash
pnpm verify
git add apps/storefront/
git commit -m "feat(seo): product updatedAt drives sitemap lastmod

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 19: IndexNow key + ping script

**Files:**
- Create: `apps/storefront/public/<32-hex-key>.txt`
- Create: `apps/storefront/scripts/indexnow-ping.mjs`
- Modify: `apps/storefront/package.json` (script), `README.md` (deploy note)

- [ ] **Step 1: Generate the key** (not a secret — IndexNow verifies via the public key file):

```bash
node -e "console.log(require('node:crypto').randomUUID().replaceAll('-',''))"
```

Write the output as both the filename and sole content of `apps/storefront/public/<key>.txt`.

- [ ] **Step 2: Ping script**

```js
// apps/storefront/scripts/indexnow-ping.mjs
// Submits every sitemap URL to IndexNow (Bing/Yandex/Naver). Run after each deploy.
import { readdirSync, readFileSync } from 'node:fs';

const HOST = 'vexxx.co';
const publicDir = new URL('../public/', import.meta.url);
const keyFile = readdirSync(publicDir).find((file) => /^[0-9a-f]{32}\.txt$/.test(file));
if (!keyFile) throw new Error('IndexNow key file missing from public/');
const key = readFileSync(new URL(keyFile, publicDir), 'utf8').trim();

const sitemap = await (await fetch(`https://${HOST}/sitemap-0.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (urlList.length === 0) throw new Error('No URLs found in live sitemap');

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList }),
});
console.log(`IndexNow: ${response.status} for ${urlList.length} URLs`);
if (response.status !== 200 && response.status !== 202) process.exit(1);
```

- [ ] **Step 3: Wire + document** — storefront `package.json`: `"indexnow": "node scripts/indexnow-ping.mjs"`. README deploy section: "After deploying, run `pnpm --filter @vexxx/storefront indexnow`." (There is no CD pipeline yet; when one lands, add this as a post-deploy step.)

- [ ] **Step 4: Verify + commit** — `pnpm nx run @vexxx/storefront:build` → key file lands in `dist/client/`. Run the script once **after the next real deploy**, not before (it reads the live sitemap).

```bash
pnpm verify
git add apps/storefront/ README.md
git commit -m "feat(seo): IndexNow key and post-deploy ping script

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 20: favicon.ico + llms.txt

**Files:**
- Create: `apps/storefront/public/favicon.ico`
- Create: `apps/storefront/public/llms.txt`

- [ ] **Step 1: favicon.ico** — from the mark asset (sharp is already an Astro dependency); run in `apps/storefront/`:

```bash
node -e "import('sharp').then(async ({default: sharp}) => { await sharp('src/assets/vexxx/vexxx-mark.png').resize(48, 48, { fit: 'contain', background: { r: 5, g: 5, b: 5, alpha: 1 } }).png().toFile('mark-48.png'); })"
pnpm dlx png-to-ico mark-48.png > public/favicon.ico
rm mark-48.png
```

No `<link>` change needed — legacy consumers request `/favicon.ico` by convention; the SVG link stays primary.

- [ ] **Step 2: llms.txt** (optional per report; zero-cost on a static site — expect no citation gains):

```markdown
# VEXXX

> VEXXX is a bilingual (Spanish/English) limited-edition streetwear label. Every piece is produced once in a numbered edition, then retired. Spanish at https://vexxx.co/, English at https://vexxx.co/en.

## Catalog

- [Catálogo (ES)](https://vexxx.co/catalog): all pieces in the current drop with sizes and availability
- [Catalog (EN)](https://vexxx.co/en/catalog)

## Brand

- [Manifesto (ES)](https://vexxx.co/manifesto)
- [About (EN)](https://vexxx.co/en/about)
- [Contact (EN)](https://vexxx.co/en/contact)
```

- [ ] **Step 3: Verify + commit** — build; `curl -sI http://localhost:8080/favicon.ico` in the Docker check returns 200 (or verify the file exists in `dist/client/`).

```bash
pnpm verify
git add apps/storefront/public/
git commit -m "chore(seo): ship favicon.ico and llms.txt

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 21: Housekeeping — stale docs, scratch files

**Files:**
- Modify: `CLAUDE.md` (Design section) and the matching paragraph in `AGENTS.md` if present
- Delete: `err1.log`, `err2.log`, `out1.json` (repo root)

- [ ] **Step 1: CLAUDE.md** — the "Design (deliberately absent)" section no longer matches reality (brand pass shipped: hero video, campaign imagery, full global.css). Rewrite that section to describe the current state: design tokens live in `global.css`, placeholder-markup rule replaced by "keep markup semantic; visual changes go through the design system in `global.css` / scoped styles". Do not touch any other section.
- [ ] **Step 2: Scratch files** — `err1.log`/`err2.log` (a duplicated Python stderr line) and `out1.json` (a WebFetch probe dump of vexxx.co) are untracked audit leftovers. Confirm contents match that description (open them), then delete. They are untracked — no git rm needed.
- [ ] **Step 3: Commit**

```bash
pnpm verify
git add CLAUDE.md AGENTS.md
git commit -m "docs: update stale 'zero visual design' guidance

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

*(The report's other Phase-3 CI idea — "SITE_URL matches deploy origin" — is covered by Task 1's guard test, which runs in CI via `pnpm test`. The "published products resolve a non-fallback image" check is Task 2's coverage test + build-time throw. Critical-CSS extraction is explicitly deferred to the brand/design pass per the report.)*

---

## Coverage map (report finding → task)

| Report finding | Task |
|---|---|
| SITE_URL dead domain (Critical) | 1 + manual ops |
| Product.image / og:image / twitter:image missing (Critical ×2 sections) | 2 |
| PDP LCP lazy-loaded (Critical) | 3 |
| JS-gated content, blank store without JS (Critical) | 4 |
| Boot overlay render delay (High) | 5 |
| Legal stubs indexable (Critical) | 6 (+ owner legal copy later) |
| Security headers / server_tokens / www / trailing slash / index.html (High–Low) | 7 |
| Templated accordion copy, factual errors (High) | 8 |
| Catalog title time-bound (Medium) | 9 |
| No About/Contact, no entity info (Critical) | 10, 11 |
| socialProfiles empty, generic footer links (part of Critical) | 11 |
| Offer shippingDetails/returnPolicy (High) | 12 |
| Commerce buried on homepage (High) | 13 |
| Numbered-pieces promise invisible at purchase (Medium); PDP mobile fold (High) | 14 |
| Wordmark 98% waste (Medium); campaign shots on PDPs, empty alt (High); oversized PDP images (Medium) | 15 |
| Tap targets (Medium); catalog mobile fold (Medium); 40px overflow (Medium, unconfirmed) | 16 |
| Silent image fallback (Low) | 2 |
| Related not collection-scoped, breadcrumbs skip collection (Medium) | 17 |
| Freshness/lastmod (Low); priceValidUntil (Low) | 18 |
| IndexNow (Medium) | 19 |
| favicon.ico (Low); llms.txt (Low) | 20 |
| Stale CLAUDE.md; CI guards (backlog) | 21 (+ 1, 2) |
| Thin content / citable passages / E-E-A-T depth (High/Medium) | Partially: 8, 10 add unique factual copy; full topical-coverage expansion (size guide, drop stories, reviews/UGC) deliberately deferred until real assets/policy content exist — matches the report's own "once assets exist" caveat |
| GSC submission, .com 301, www DNS, drift baseline, Rich Results validation | Manual ops checklist |
