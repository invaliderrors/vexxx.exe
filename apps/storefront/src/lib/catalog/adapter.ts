import type { Locale } from '../../i18n/config';
import type { Collection, Product } from './types';

/**
 * The seam between pages and the commerce backend.
 *
 * Today the only implementation reads Astro content collections
 * (sources/content.ts). When the real API exists, it gets its own
 * source file implementing this interface — pages do not change.
 */
export interface CatalogAdapter {
  getPublishedProducts(): Promise<readonly Product[]>;
  getProductBySlug(locale: Locale, slug: string): Promise<Product | null>;
  getProductsByCollection(collectionId: string): Promise<readonly Product[]>;
  getPublishedCollections(): Promise<readonly Collection[]>;
  getCollectionBySlug(locale: Locale, slug: string): Promise<Collection | null>;
}
