import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections are the placeholder catalog source.
 *
 * NOTE: these schemas structurally mirror src/lib/catalog/mapping.ts
 * (Astro bundles its own zod, so the schema objects cannot be shared).
 * If a field changes, change BOTH in the same commit — mapping.ts is
 * the authoritative boundary and will reject drift at build time.
 */

const localizedText = z
  .object({ es: z.string().min(1), en: z.string().min(1) })
  .strict();

const productsCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z
    .object({
      sku: z.string().min(1),
      // `slugs` (plural) on purpose: the glob loader reserves top-level
      // `slug` and requires a string; ours is per-locale.
      slugs: localizedText,
      name: localizedText,
      description: localizedText,
      price: z
        .object({
          amount: z.number().int().nonnegative(),
          currency: z.enum(['COP', 'EUR', 'USD']),
        })
        .strict(),
      images: z.array(
        z
          .object({
            src: z.string().min(1),
            alt: localizedText,
            width: z.number().int().positive(),
            height: z.number().int().positive(),
          })
          .strict(),
      ),
      collection: z.string().min(1).nullable(),
      category: z.enum([
        'hoodies',
        'tees',
        'bottoms',
        'outerwear',
        'accessories',
      ]),
      sizes: z.array(z.enum(['XS', 'S', 'M', 'L', 'XL', 'OS'])).min(1),
      colors: z
        .array(
          z.enum([
            'washed-black',
            'bone',
            'gunmetal',
            'signal-red',
            'olive-drab',
            'concrete',
          ]),
        )
        .min(1),
      availability: z.enum(['in-stock', 'out-of-stock', 'pre-order']),
      published: z.boolean(),
      details: z
        .object({ material: localizedText, fit: localizedText, care: localizedText })
        .strict(),
    })
    .strict(),
});

const collectionsCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/collections' }),
  schema: z
    .object({
      slugs: localizedText,
      name: localizedText,
      description: localizedText,
      published: z.boolean(),
    })
    .strict(),
});

export const collections = {
  products: productsCollection,
  collections: collectionsCollection,
};
