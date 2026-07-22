import type { CatalogAdapter } from './adapter';
import { contentCatalog } from './sources/content';

/**
 * The one place that decides which catalog source is live. Pages call
 * `getCatalog()` and stay ignorant of the backend. Swapping to the
 * real API later is a one-line change here.
 */
export function getCatalog(): CatalogAdapter {
  return contentCatalog;
}

export type { CatalogAdapter } from './adapter';
export type {
  Collection,
  LocalizedText,
  Product,
  ProductAvailability,
  ProductImage,
} from './types';
