import type { Money } from '@vexxx/contracts';
import type { Locale } from '../../i18n/config';

/**
 * Domain types for the catalog. Pages and components depend on THESE,
 * never on the shape of whatever backend currently supplies the data.
 */

export type LocalizedText = Record<Locale, string>;

export type ProductAvailability = 'in-stock' | 'out-of-stock' | 'pre-order';

export type ProductCategory =
  | 'hoodies'
  | 'tees'
  | 'bottoms'
  | 'outerwear'
  | 'accessories';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'OS';

export type ProductColor =
  | 'washed-black'
  | 'bone'
  | 'gunmetal'
  | 'signal-red'
  | 'olive-drab'
  | 'concrete';

export interface ProductImage {
  /** Path under /public or an absolute URL. */
  readonly src: string;
  readonly alt: LocalizedText;
  readonly width: number;
  readonly height: number;
}

/** Per-product accordion copy — factual, unique per SKU. */
export interface ProductDetails {
  readonly material: LocalizedText;
  readonly fit: LocalizedText;
  readonly care: LocalizedText;
}

export interface Product {
  /** Stable internal id (content entry id today, DB id tomorrow). */
  readonly id: string;
  readonly sku: string;
  /** Localized URL slugs — es and en pages have different slugs. */
  readonly slug: LocalizedText;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  /** Integer minor units. See src/lib/money. */
  readonly price: Money;
  readonly images: readonly ProductImage[];
  /** Collection id, or null for uncollected products. */
  readonly collectionId: string | null;
  readonly category: ProductCategory;
  /** Sizes the piece is cut in; accessories are one-size (`OS`). */
  readonly sizes: readonly ProductSize[];
  readonly colors: readonly ProductColor[];
  readonly availability: ProductAvailability;
  readonly published: boolean;
  readonly details: ProductDetails;
}

export interface Collection {
  readonly id: string;
  readonly slug: LocalizedText;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly published: boolean;
}
