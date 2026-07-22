import { describe, expect, it } from 'vitest';
import {
  AVAILABILITY,
  breadcrumbJsonLd,
  organizationJsonLd,
  productJsonLd,
  webSiteJsonLd,
} from './jsonld';

const siteUrl = new URL('https://vexxx.co');

describe('organizationJsonLd', () => {
  it('builds an Organization node anchored to the origin', () => {
    const node = organizationJsonLd({ siteUrl });
    expect(node['@type']).toBe('Organization');
    expect(node['@id']).toBe('https://vexxx.co/#organization');
    expect(node['url']).toBe('https://vexxx.co/');
  });
});

describe('webSiteJsonLd', () => {
  it('links the WebSite to the Organization publisher', () => {
    const node = webSiteJsonLd({ siteUrl });
    expect(node['@type']).toBe('WebSite');
    expect(node['publisher']).toEqual({
      '@id': 'https://vexxx.co/#organization',
    });
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers positions starting at 1', () => {
    const node = breadcrumbJsonLd([
      { name: 'Inicio', url: 'https://vexxx.co/' },
      { name: 'Productos', url: 'https://vexxx.co/productos' },
    ]);
    expect(node['itemListElement']).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://vexxx.co/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Productos',
        item: 'https://vexxx.co/productos',
      },
    ]);
  });

  it('rejects empty breadcrumb lists', () => {
    expect(() => breadcrumbJsonLd([])).toThrow();
  });

  it('rejects relative URLs', () => {
    expect(() =>
      breadcrumbJsonLd([{ name: 'Inicio', url: '/relative' }]),
    ).toThrow();
  });
});

describe('productJsonLd', () => {
  const validInput = {
    name: 'Oversized Tee 001',
    description: 'Heavyweight oversized tee.',
    url: 'https://vexxx.co/productos/camiseta-oversized-001',
    sku: 'VX-TEE-001',
    images: ['https://vexxx.co/images/tee-001.jpg'],
    price: { amount: 4990, currency: 'EUR' } as const,
    availability: AVAILABILITY.inStock,
  };

  it('serializes price as a decimal string in the Offer', () => {
    const node = productJsonLd(validInput);
    expect(node['offers']).toMatchObject({
      '@type': 'Offer',
      price: '49.90',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    });
  });

  it('brands the product as VEXXX', () => {
    const node = productJsonLd(validInput);
    expect(node['brand']).toEqual({ '@type': 'Brand', name: 'VEXXX' });
  });

  it('rejects float prices via the money schema', () => {
    expect(() =>
      productJsonLd({
        ...validInput,
        price: { amount: 49.9, currency: 'EUR' },
      }),
    ).toThrow();
  });

  it('rejects unknown extra fields (strict schema)', () => {
    expect(() =>
      productJsonLd({
        ...validInput,
        // @ts-expect-error -- proving the runtime schema rejects extras
        rating: 5,
      }),
    ).toThrow();
  });

  it('includes shipping details and return policy on the offer', () => {
    const product = productJsonLd(validInput);
    const offers = product['offers'] as Record<string, unknown>;
    expect(offers['shippingDetails']).toEqual({
      '@type': 'OfferShippingDetails',
      shippingDestination: [{ '@type': 'DefinedRegion', addressCountry: 'CO' }],
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: 0,
          maxValue: 2,
          unitCode: 'DAY',
        },
      },
    });
    expect(offers['hasMerchantReturnPolicy']).toEqual({
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'CO',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    });
  });
});
