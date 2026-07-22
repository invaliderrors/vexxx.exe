import type { Money } from '@vexxx/contracts';
import type { Locale } from '../../i18n/config';

/**
 * Domain types for the catalog. Pages and components depend on THESE,
 * never on the shape of whatever backend currently supplies the data.
 */

export type LocalizedText = Record<Locale, string>;

export type ProductAvailability = 'in-stock' | 'out-of-stock' | 'pre-order';

export interface ProductImage {
  /** Path under /public or an absolute URL. */
  readonly src: string;
  readonly alt: LocalizedText;
  readonly width: number;
  readonly height: number;
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
  readonly availability: ProductAvailability;
  readonly published: boolean;
}

export interface Collection {
  readonly id: string;
  readonly slug: LocalizedText;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly published: boolean;
}
