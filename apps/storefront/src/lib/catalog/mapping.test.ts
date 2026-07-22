import { describe, expect, it } from 'vitest';
import { parseCollection, parseProduct } from './mapping';

const validRawProduct = {
  sku: 'VX-TEE-001',
  slugs: { es: 'camiseta-oversized-001', en: 'oversized-tee-001' },
  name: { es: 'Camiseta Oversized 001', en: 'Oversized Tee 001' },
  description: {
    es: 'Camiseta oversized de gramaje alto.',
    en: 'Heavyweight oversized tee.',
  },
  price: { amount: 4990, currency: 'EUR' },
  images: [],
  collection: 'drop-001',
  availability: 'in-stock',
  published: true,
};

describe('parseProduct', () => {
  it('maps valid raw data to the domain type', () => {
    const product = parseProduct('vx-tee-001', validRawProduct);
    expect(product.id).toBe('vx-tee-001');
    expect(product.collectionId).toBe('drop-001');
    expect(product.price).toEqual({ amount: 4990, currency: 'EUR' });
  });

  it('rejects float prices', () => {
    expect(() =>
      parseProduct('x', {
        ...validRawProduct,
        price: { amount: 49.9, currency: 'EUR' },
      }),
    ).toThrow();
  });

  it('rejects missing locales in localized text', () => {
    expect(() =>
      parseProduct('x', { ...validRawProduct, name: { es: 'Solo español' } }),
    ).toThrow();
  });

  it('rejects unknown fields (strict boundary)', () => {
    expect(() =>
      parseProduct('x', { ...validRawProduct, surprise: true }),
    ).toThrow();
  });

  it('accepts a null collection', () => {
    const product = parseProduct('x', { ...validRawProduct, collection: null });
    expect(product.collectionId).toBeNull();
  });
});

describe('parseCollection', () => {
  it('maps valid raw data to the domain type', () => {
    const collection = parseCollection('drop-001', {
      slugs: { es: 'drop-001', en: 'drop-001' },
      name: { es: 'Drop 001', en: 'Drop 001' },
      description: { es: 'Primer drop.', en: 'First drop.' },
      published: true,
    });
    expect(collection.id).toBe('drop-001');
    expect(collection.published).toBe(true);
  });

  it('rejects incomplete data', () => {
    expect(() => parseCollection('x', { slugs: {} })).toThrow();
  });
});
