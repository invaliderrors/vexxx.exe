import type { ProductColor } from '../../lib/catalog/types';

/**
 * Visual swatch hex per catalog color key. These are presentation values for
 * the filter UI only — they are never user-visible text, so they live here
 * rather than in the i18n dictionaries (which own the localized color NAMES).
 */
export const colorSwatchHex: Record<ProductColor, string> = {
  'washed-black': '#26262a',
  bone: '#d9d2c2',
  gunmetal: '#52565e',
  'signal-red': '#ff3b3b',
  'olive-drab': '#5b5e41',
  concrete: '#97999b',
};
