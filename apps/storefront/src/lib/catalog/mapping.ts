import { z } from 'zod';
import { moneySchema } from '@vexxx/contracts';
import type { Collection, Product } from './types';

/**
 * Boundary validation for raw catalog data. Everything entering the
 * catalog — content files today, API responses tomorrow — passes
 * through these strict schemas before becoming a domain type.
 *
 * NOTE: src/content.config.ts declares a structurally identical schema
 * with Astro's bundled zod (the two zod instances cannot share types).
 * If a field changes, change BOTH in the same commit.
 */

const localizedText = z
  .object({ es: z.string().min(1), en: z.string().min(1) })
  .strict();

const productImage = z
  .object({
    src: z.string().min(1),
    alt: localizedText,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

// NOTE: the raw field is `slugs` (plural): Astro's glob loader reserves a
// top-level `slug` and requires it to be a string, while ours is per-locale.
export const rawProductSchema = z
  .object({
    sku: z.string().min(1),
    slugs: localizedText,
    name: localizedText,
    description: localizedText,
    price: moneySchema,
    images: z.array(productImage),
    collection: z.string().min(1).nullable(),
    availability: z.enum(['in-stock', 'out-of-stock', 'pre-order']),
    published: z.boolean(),
  })
  .strict();

export const rawCollectionSchema = z
  .object({
    slugs: localizedText,
    name: localizedText,
    description: localizedText,
    published: z.boolean(),
  })
  .strict();

export function parseProduct(id: string, raw: unknown): Product {
  const data = rawProductSchema.parse(raw);
  return {
    id,
    sku: data.sku,
    slug: data.slugs,
    name: data.name,
    description: data.description,
    price: data.price,
    images: data.images,
    collectionId: data.collection,
    availability: data.availability,
    published: data.published,
  };
}

export function parseCollection(id: string, raw: unknown): Collection {
  const data = rawCollectionSchema.parse(raw);
  return {
    id,
    slug: data.slugs,
    name: data.name,
    description: data.description,
    published: data.published,
  };
}
