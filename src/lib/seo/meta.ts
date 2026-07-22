import { SITE } from '../../config/site';
import type { Locale } from '../../i18n/config';
import { DEFAULT_LOCALE, LOCALE_TAGS } from '../../i18n/config';

/**
 * Hard limits enforced at build time. A page that ships with an
 * over-long or empty title/description fails the build instead of
 * silently shipping truncated SERP snippets.
 */
const TITLE_MAX = 65;
const DESCRIPTION_MAX = 170;

export interface HreflangLink {
  readonly hreflang: string;
  readonly href: string;
}

/** "Page — VEXXX" for inner pages; the home page owns its full title. */
export function buildTitle(
  pageTitle: string,
  options?: { isHome?: boolean },
): string {
  const trimmed = pageTitle.trim();
  if (trimmed.length === 0) {
    throw new Error('SEO: page title must not be empty');
  }
  const full = options?.isHome ? trimmed : SITE.titleTemplate(trimmed);
  if (full.length > TITLE_MAX) {
    throw new Error(
      `SEO: title exceeds ${String(TITLE_MAX)} chars (${String(full.length)}): "${full}"`,
    );
  }
  return full;
}

export function validateDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length === 0) {
    throw new Error('SEO: meta description must not be empty');
  }
  if (trimmed.length > DESCRIPTION_MAX) {
    throw new Error(
      `SEO: description exceeds ${String(DESCRIPTION_MAX)} chars (${String(trimmed.length)})`,
    );
  }
  return trimmed;
}

/**
 * Absolute canonical URL for a path. Normalizes to the no-trailing-slash
 * policy pinned in astro.config (root stays "/").
 */
export function canonicalUrl(siteUrl: URL, path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`SEO: path must start with "/", got: "${path}"`);
  }
  const url = new URL(path, siteUrl);
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

/**
 * hreflang link set for a page: one entry per locale plus x-default
 * pointing at the default locale (es).
 */
export function hreflangLinks(
  siteUrl: URL,
  alternates: Record<Locale, string>,
): readonly HreflangLink[] {
  const links: HreflangLink[] = (
    Object.entries(alternates) as [Locale, string][]
  ).map(([locale, path]) => ({
    hreflang: LOCALE_TAGS[locale],
    href: canonicalUrl(siteUrl, path),
  }));
  links.push({
    hreflang: 'x-default',
    href: canonicalUrl(siteUrl, alternates[DEFAULT_LOCALE]),
  });
  return links;
}
