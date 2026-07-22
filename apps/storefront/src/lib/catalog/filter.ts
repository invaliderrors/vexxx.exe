/**
 * Pure client-side catalog filtering logic. The FilterBar island script reads
 * `data-*` facts stamped on each product card at build time, parses them here,
 * and decides visibility + order. Framework-free on purpose: this module runs
 * both under Vitest (node) and in the browser bundle.
 *
 * Semantics: multi-select is OR within a group, AND across groups.
 */

export type SortOrder = 'featured' | 'price-asc' | 'price-desc';

const SORT_ORDERS: readonly SortOrder[] = ['featured', 'price-asc', 'price-desc'];

/** Facts parsed from one product card's data attributes. */
export interface CardFacts {
  readonly category: string;
  readonly sizes: readonly string[];
  readonly colors: readonly string[];
  readonly availability: string;
  /** Integer minor units — safe to compare numerically, never formatted here. */
  readonly price: number;
  /** Original document position; the "featured" order and the tie-breaker. */
  readonly index: number;
}

/** Current selection per filter group. Empty set = group not filtering. */
export interface FilterState {
  readonly category: ReadonlySet<string>;
  readonly size: ReadonlySet<string>;
  readonly color: ReadonlySet<string>;
  readonly availability: ReadonlySet<string>;
}

export function emptyFilterState(): FilterState {
  return {
    category: new Set(),
    size: new Set(),
    color: new Set(),
    availability: new Set(),
  };
}

export function hasActiveFilters(state: FilterState): boolean {
  return (
    state.category.size > 0 ||
    state.size.size > 0 ||
    state.color.size > 0 ||
    state.availability.size > 0
  );
}

/** Parse a comma-separated `data-*` list ("XS, S,M") into clean tokens. */
export function parseFacetList(raw: string | undefined): readonly string[] {
  if (raw === undefined) return [];
  return raw
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

/** Parse a `data-price` attribute; missing or malformed values become 0. */
export function parsePrice(raw: string | undefined): number {
  if (raw === undefined) return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function isSortOrder(value: string): value is SortOrder {
  return (SORT_ORDERS as readonly string[]).includes(value);
}

function groupMatches(selected: ReadonlySet<string>, values: readonly string[]): boolean {
  if (selected.size === 0) return true;
  return values.some((value) => selected.has(value));
}

/** True when the card passes every active group (AND across groups). */
export function matchesFilters(facts: CardFacts, state: FilterState): boolean {
  return (
    groupMatches(state.category, [facts.category]) &&
    groupMatches(state.size, facts.sizes) &&
    groupMatches(state.color, facts.colors) &&
    groupMatches(state.availability, [facts.availability])
  );
}

/** Comparator for DOM reordering; ties always fall back to document order. */
export function compareCards(a: CardFacts, b: CardFacts, sort: SortOrder): number {
  if (sort === 'price-asc' && a.price !== b.price) return a.price - b.price;
  if (sort === 'price-desc' && a.price !== b.price) return b.price - a.price;
  return a.index - b.index;
}
