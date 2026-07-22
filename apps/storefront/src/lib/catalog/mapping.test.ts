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
  category: 'tees',
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  colors: ['washed-black'],
};

describe('parseProduct', () => {
  it('maps valid raw data to the domain type', () => {
    const product = parseProduct('vx-tee-001', validRawProduct);
    expect(product.id).toBe('vx-tee-001');
    expect(product.collectionId).toBe('drop-001');
    expect(product.price).toEqual({ amount: 4990, currency: 'EUR' });
  });

  it('maps category, sizes and colors to the domain type', () => {
    const product = parseProduct('vx-tee-001', validRawProduct);
    expect(product.category).toBe('tees');
    expect(product.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    expect(product.colors).toEqual(['washed-black']);
  });

  it('rejects an unknown category', () => {
    expect(() =>
      parseProduct('x', { ...validRawProduct, category: 'headwear' }),
    ).toThrow();
  });

  it('rejects an empty sizes array', () => {
    expect(() =>
      parseProduct('x', { ...validRawProduct, sizes: [] }),
    ).toThrow();
  });

  it('rejects sizes outside the enum', () => {
    expect(() =>
      parseProduct('x', { ...validRawProduct, sizes: ['XXL'] }),
    ).toThrow();
  });

  it('rejects an empty colors array', () => {
    expect(() =>
      parseProduct('x', { ...validRawProduct, colors: [] }),
    ).toThrow();
  });

  it('rejects colors outside the enum', () => {
    expect(() =>
      parseProduct('x', { ...validRawProduct, colors: ['neon-green'] }),
    ).toThrow();
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
