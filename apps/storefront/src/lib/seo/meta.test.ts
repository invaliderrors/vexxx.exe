import { describe, expect, it } from 'vitest';
import {
  buildTitle,
  canonicalUrl,
  hreflangLinks,
  validateDescription,
} from './meta';

const site = new URL('https://vexxx.co');

describe('buildTitle', () => {
  it('applies the brand template to inner pages', () => {
    expect(buildTitle('Productos')).toBe('Productos — VEXXX');
  });

  it('leaves the home title untouched', () => {
    expect(buildTitle('VEXXX — Streetwear', { isHome: true })).toBe(
      'VEXXX — Streetwear',
    );
  });

  it('rejects empty titles', () => {
    expect(() => buildTitle('   ')).toThrow(/empty/);
  });

  it('rejects over-long titles', () => {
    expect(() => buildTitle('x'.repeat(80))).toThrow(/exceeds/);
  });
});

describe('validateDescription', () => {
  it('returns the trimmed description', () => {
    expect(validateDescription('  hola  ')).toBe('hola');
  });

  it('rejects empty descriptions', () => {
    expect(() => validateDescription('')).toThrow(/empty/);
  });

  it('rejects over-long descriptions', () => {
    expect(() => validateDescription('x'.repeat(200))).toThrow(/exceeds/);
  });
});

describe('canonicalUrl', () => {
  it('builds an absolute URL from a path', () => {
    expect(canonicalUrl(site, '/productos')).toBe(
      'https://vexxx.co/productos',
    );
  });

  it('strips trailing slashes per the no-trailing-slash policy', () => {
    expect(canonicalUrl(site, '/productos/')).toBe(
      'https://vexxx.co/productos',
    );
  });

  it('keeps the root as "/"', () => {
    expect(canonicalUrl(site, '/')).toBe('https://vexxx.co/');
  });

  it('rejects relative paths', () => {
    expect(() => canonicalUrl(site, 'productos')).toThrow(/start with/);
  });
});

describe('hreflangLinks', () => {
  it('emits one link per locale plus x-default pointing at es', () => {
    const links = hreflangLinks(site, {
      es: '/productos',
      en: '/en/products',
    });
    expect(links).toEqual([
      { hreflang: 'es-ES', href: 'https://vexxx.co/productos' },
      { hreflang: 'en-US', href: 'https://vexxx.co/en/products' },
      { hreflang: 'x-default', href: 'https://vexxx.co/productos' },
    ]);
  });
});
