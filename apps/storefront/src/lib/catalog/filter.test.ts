import { describe, expect, it } from 'vitest';
import {
  compareCards,
  emptyFilterState,
  hasActiveFilters,
  isSortOrder,
  matchesFilters,
  parseFacetList,
  parsePrice,
  type CardFacts,
  type FilterState,
} from './filter';

function facts(overrides: Partial<CardFacts> = {}): CardFacts {
  return {
    category: 'hoodies',
    sizes: ['S', 'M', 'L'],
    colors: ['washed-black'],
    availability: 'in-stock',
    price: 12000,
    index: 0,
    ...overrides,
  };
}

function state(overrides: Partial<FilterState> = {}): FilterState {
  return { ...emptyFilterState(), ...overrides };
}

describe('parseFacetList', () => {
  it('returns an empty list for undefined', () => {
    expect(parseFacetList(undefined)).toEqual([]);
  });

  it('returns an empty list for an empty string', () => {
    expect(parseFacetList('')).toEqual([]);
  });

  it('splits a comma-separated list', () => {
    expect(parseFacetList('XS,S,M')).toEqual(['XS', 'S', 'M']);
  });

  it('trims whitespace and drops empty segments', () => {
    expect(parseFacetList(' washed-black , ,gunmetal ')).toEqual(['washed-black', 'gunmetal']);
  });
});

describe('parsePrice', () => {
  it('parses an integer minor-unit amount', () => {
    expect(parsePrice('88000')).toBe(88_000);
  });

  it('returns 0 for undefined', () => {
    expect(parsePrice(undefined)).toBe(0);
  });

  it('returns 0 for a non-numeric value', () => {
    expect(parsePrice('not-a-number')).toBe(0);
  });
});

describe('isSortOrder', () => {
  it('accepts the three known sort orders', () => {
    expect(isSortOrder('featured')).toBe(true);
    expect(isSortOrder('price-asc')).toBe(true);
    expect(isSortOrder('price-desc')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isSortOrder('alphabetical')).toBe(false);
    expect(isSortOrder('')).toBe(false);
  });
});

describe('hasActiveFilters', () => {
  it('is false for the empty state', () => {
    expect(hasActiveFilters(emptyFilterState())).toBe(false);
  });

  it('is true when any group has a selection', () => {
    expect(hasActiveFilters(state({ category: new Set(['tees']) }))).toBe(true);
    expect(hasActiveFilters(state({ size: new Set(['M']) }))).toBe(true);
    expect(hasActiveFilters(state({ color: new Set(['bone']) }))).toBe(true);
    expect(hasActiveFilters(state({ availability: new Set(['pre-order']) }))).toBe(true);
  });
});

describe('matchesFilters', () => {
  it('matches everything when no filter is active', () => {
    expect(matchesFilters(facts(), emptyFilterState())).toBe(true);
  });

  it('filters by category', () => {
    const selected = state({ category: new Set(['hoodies']) });
    expect(matchesFilters(facts({ category: 'hoodies' }), selected)).toBe(true);
    expect(matchesFilters(facts({ category: 'tees' }), selected)).toBe(false);
  });

  it('is OR within a group (multi-select)', () => {
    const selected = state({ category: new Set(['hoodies', 'tees']) });
    expect(matchesFilters(facts({ category: 'hoodies' }), selected)).toBe(true);
    expect(matchesFilters(facts({ category: 'tees' }), selected)).toBe(true);
    expect(matchesFilters(facts({ category: 'bottoms' }), selected)).toBe(false);
  });

  it('matches a size when any card size overlaps the selection', () => {
    const selected = state({ size: new Set(['XL', 'OS']) });
    expect(matchesFilters(facts({ sizes: ['L', 'XL'] }), selected)).toBe(true);
    expect(matchesFilters(facts({ sizes: ['XS', 'S'] }), selected)).toBe(false);
  });

  it('matches a color when any card color overlaps the selection', () => {
    const selected = state({ color: new Set(['gunmetal']) });
    expect(matchesFilters(facts({ colors: ['washed-black', 'gunmetal'] }), selected)).toBe(true);
    expect(matchesFilters(facts({ colors: ['washed-black'] }), selected)).toBe(false);
  });

  it('filters by availability', () => {
    const selected = state({ availability: new Set(['in-stock', 'pre-order']) });
    expect(matchesFilters(facts({ availability: 'pre-order' }), selected)).toBe(true);
    expect(matchesFilters(facts({ availability: 'out-of-stock' }), selected)).toBe(false);
  });

  it('is AND across groups', () => {
    const selected = state({
      category: new Set(['hoodies']),
      color: new Set(['gunmetal']),
    });
    expect(
      matchesFilters(facts({ category: 'hoodies', colors: ['gunmetal'] }), selected),
    ).toBe(true);
    expect(
      matchesFilters(facts({ category: 'hoodies', colors: ['washed-black'] }), selected),
    ).toBe(false);
    expect(
      matchesFilters(facts({ category: 'tees', colors: ['gunmetal'] }), selected),
    ).toBe(false);
  });
});

describe('compareCards', () => {
  const cheapFirst = facts({ price: 8_000, index: 0 });
  const expensiveSecond = facts({ price: 22_000, index: 1 });
  const midThird = facts({ price: 12_000, index: 2 });

  it('featured keeps the original document order', () => {
    const sorted = [midThird, cheapFirst, expensiveSecond].sort((a, b) =>
      compareCards(a, b, 'featured'),
    );
    expect(sorted.map((card) => card.index)).toEqual([0, 1, 2]);
  });

  it('price-asc sorts cheapest first', () => {
    const sorted = [expensiveSecond, midThird, cheapFirst].sort((a, b) =>
      compareCards(a, b, 'price-asc'),
    );
    expect(sorted.map((card) => card.price)).toEqual([8_000, 12_000, 22_000]);
  });

  it('price-desc sorts most expensive first', () => {
    const sorted = [cheapFirst, midThird, expensiveSecond].sort((a, b) =>
      compareCards(a, b, 'price-desc'),
    );
    expect(sorted.map((card) => card.price)).toEqual([22_000, 12_000, 8_000]);
  });

  it('breaks price ties by original order', () => {
    const first = facts({ price: 9_000, index: 0 });
    const second = facts({ price: 9_000, index: 1 });
    const ascending = [second, first].sort((a, b) => compareCards(a, b, 'price-asc'));
    const descending = [second, first].sort((a, b) => compareCards(a, b, 'price-desc'));
    expect(ascending.map((card) => card.index)).toEqual([0, 1]);
    expect(descending.map((card) => card.index)).toEqual([0, 1]);
  });
});
