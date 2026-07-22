import { z } from 'zod';
import { SITE } from '../../config/site';
import type { Money } from '../money/money';
import { toDecimalString } from '../money/money';

/**
 * Typed schema.org JSON-LD builders. Inputs are zod-validated so a bad
 * value fails the (static) build loudly instead of shipping invalid
 * structured data that Search Console flags weeks later.
 *
 * Builders return plain objects; <JsonLd /> serializes them.
 */
export type JsonLd = Record<string, unknown>;

const absoluteUrl = z.string().url();

const moneySchema = z
  .object({
    amount: z.number().int().nonnegative(),
    currency: z.enum(['EUR', 'USD']),
  })
  .strict();

export function organizationJsonLd(input: { siteUrl: URL }): JsonLd {
  const origin = input.siteUrl.origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: SITE.legalName,
    url: `${origin}/`,
    logo: `${origin}${SITE.logoPath}`,
    ...(SITE.socialProfiles.length > 0 ? { sameAs: SITE.socialProfiles } : {}),
  };
}

export function webSiteJsonLd(input: { siteUrl: URL }): JsonLd {
  const origin = input.siteUrl.origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: SITE.name,
    url: `${origin}/`,
    publisher: { '@id': `${origin}/#organization` },
  };
}

const breadcrumbInputSchema = z
  .array(z.object({ name: z.string().min(1), url: absoluteUrl }).strict())
  .min(1);

export type BreadcrumbItem = z.infer<typeof breadcrumbInputSchema>[number];

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLd {
  const parsed = breadcrumbInputSchema.parse(items);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: parsed.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const AVAILABILITY = {
  inStock: 'https://schema.org/InStock',
  outOfStock: 'https://schema.org/OutOfStock',
  preOrder: 'https://schema.org/PreOrder',
} as const;

export type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY];

/** Maps the catalog's availability union to schema.org URIs. */
export function schemaAvailability(
  value: 'in-stock' | 'out-of-stock' | 'pre-order',
): Availability {
  const map = {
    'in-stock': AVAILABILITY.inStock,
    'out-of-stock': AVAILABILITY.outOfStock,
    'pre-order': AVAILABILITY.preOrder,
  } as const;
  return map[value];
}

const productInputSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    url: absoluteUrl,
    sku: z.string().min(1),
    images: z.array(absoluteUrl),
    price: moneySchema,
    availability: z.enum([
      AVAILABILITY.inStock,
      AVAILABILITY.outOfStock,
      AVAILABILITY.preOrder,
    ]),
  })
  .strict();

export interface ProductJsonLdInput {
  name: string;
  description: string;
  url: string;
  sku: string;
  images: readonly string[];
  price: Money;
  availability: Availability;
}

export function productJsonLd(input: ProductJsonLdInput): JsonLd {
  const parsed = productInputSchema.parse(input);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: parsed.name,
    description: parsed.description,
    sku: parsed.sku,
    ...(parsed.images.length > 0 ? { image: parsed.images } : {}),
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      url: parsed.url,
      price: toDecimalString(parsed.price),
      priceCurrency: parsed.price.currency,
      availability: parsed.availability,
    },
  };
}
