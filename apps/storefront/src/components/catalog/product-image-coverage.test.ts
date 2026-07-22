import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { MAPPED_SKUS } from './mapped-skus';
import { productImage } from './product-images';

const productsDir = new URL('../../content/products/', import.meta.url);
const probe = z.object({ sku: z.string().min(1), published: z.boolean() }).passthrough();

describe('product image coverage', () => {
  it('every published product SKU has an entry in the image map', () => {
    const files = readdirSync(productsDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const raw: unknown = JSON.parse(readFileSync(new URL(file, productsDir), 'utf8'));
      const { sku, published } = probe.parse(raw);
      if (published) {
        expect(MAPPED_SKUS, `SKU ${sku} in ${file} has no mapped image`).toContain(sku);
      }
    }
  });

  it('productImage throws for an unmapped SKU', () => {
    expect(() => productImage('VXX-NOPE-999')).toThrow(/No product image mapped/);
  });
});
