import type { APIRoute } from 'astro';

/**
 * robots.txt as a build-time endpoint so the sitemap URL always derives
 * from the configured `site` — no hand-maintained static file to drift.
 */
export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('SEO: `site` must be configured in astro.config.mjs');
  }
  const sitemapUrl = new URL('/sitemap-index.xml', site).toString();
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
