import { getCollection } from 'astro:content';
import type { Locale } from '../../../i18n/config';
import type { CatalogAdapter } from '../adapter';
import { parseCollection, parseProduct } from '../mapping';
import type { Collection, Product } from '../types';

/**
 * CatalogAdapter backed by Astro content collections — the placeholder
 * source until the real commerce API exists. Kept deliberately thin:
 * all validation/mapping logic lives in mapping.ts, which is pure and
 * unit-tested.
 */

async function loadProducts(): Promise<readonly Product[]> {
  const entries = await getCollection('products');
  return entries.map((entry) => parseProduct(entry.id, entry.data));
}

async function loadCollections(): Promise<readonly Collection[]> {
  const entries = await getCollection('collections');
  return entries.map((entry) => parseCollection(entry.id, entry.data));
}

export const contentCatalog: CatalogAdapter = {
  async getPublishedProducts() {
    return (await loadProducts()).filter((p) => p.published);
  },

  async getProductBySlug(locale: Locale, slug: string) {
    const products = await this.getPublishedProducts();
    return products.find((p) => p.slug[locale] === slug) ?? null;
  },

  async getProductsByCollection(collectionId: string) {
    const products = await this.getPublishedProducts();
    return products.filter((p) => p.collectionId === collectionId);
  },

  async getPublishedCollections() {
    return (await loadCollections()).filter((c) => c.published);
  },

  async getCollectionBySlug(locale: Locale, slug: string) {
    const collections = await this.getPublishedCollections();
    return collections.find((c) => c.slug[locale] === slug) ?? null;
  },
};
