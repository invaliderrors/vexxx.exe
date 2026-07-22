// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The canonical production origin. Every canonical URL, hreflang alternate,
// sitemap entry and JSON-LD @id derives from this single value.
const SITE_URL = 'https://vexxx.co';

export default defineConfig({
  site: SITE_URL,

  // Static-first: every page prerenders unless it opts out with
  // `export const prerender = false`. The node adapter exists so future
  // cart/checkout/API routes can go on-demand without re-architecting.
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  // One URL shape, no duplicate-content variants. `format: 'file'` emits
  // /productos.html served at /productos — never /productos/ — so canonical
  // and served URL always match.
  trailingSlash: 'never',
  build: { format: 'file' },

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    sitemap({
      // hreflang alternates for the prefix-mapped pages. Localized-slug pages
      // (products, collections) carry their alternates in <head> via <Seo />,
      // which search engines accept equally.
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-ES', en: 'en-US' },
      },
    }),
  ],

  // Permanent redirects live here so they ship as real 301s.
  // Add entries as URLs change: '/old-path': { status: 301, destination: '/new-path' }
  redirects: {
    '/archivo': { status: 301, destination: '/archive' },
    '/productos': { status: 301, destination: '/catalog' },
    '/productos/[slug]': { status: 301, destination: '/catalog/[slug]' },
    '/en/products': { status: 301, destination: '/en/catalog' },
    '/en/products/[slug]': { status: 301, destination: '/en/catalog/[slug]' },
    '/coleccion': { status: 301, destination: '/collection' },
    '/colecciones': { status: 301, destination: '/collections' },
    '/colecciones/[slug]': { status: 301, destination: '/collections/[slug]' },
    '/manifiesto': { status: 301, destination: '/manifesto' },
    '/privacidad': { status: 301, destination: '/privacy' },
    '/terminos': { status: 301, destination: '/terms' },
    '/envios': { status: 301, destination: '/shipping' },
  },

  vite: {
    plugins: [tailwindcss()],
    // zod reaches the browser via the access-form script; pre-bundling it up
    // front stops Vite's "Outdated Optimize Dep" churn on dev-server restarts.
    optimizeDeps: { include: ['zod'] },
  },
});
