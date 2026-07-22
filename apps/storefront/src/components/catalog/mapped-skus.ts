/**
 * SKUs with real photography mapped in product-images.ts.
 * Pure data (no asset imports) so node tests can consume it.
 */
export const MAPPED_SKUS = [
  'VXX-HOOD-001',
  'VXX-TEE-002',
  'VXX-LSL-003',
  'VXX-CRG-004',
  'VXX-JKT-005',
  'VXX-CAP-006',
  'VXX-BAG-007',
] as const;

export type MappedSku = (typeof MAPPED_SKUS)[number];
