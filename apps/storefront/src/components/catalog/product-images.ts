import type { ImageMetadata } from 'astro';
import bag007 from '../../assets/vexxx/products/vxx-bag-007.png';
import cap006 from '../../assets/vexxx/products/vxx-cap-006.png';
import crg004 from '../../assets/vexxx/products/vxx-crg-004.png';
import hood001 from '../../assets/vexxx/products/vxx-hood-001.png';
import jkt005 from '../../assets/vexxx/products/vxx-jkt-005.png';
import lsl003 from '../../assets/vexxx/products/vxx-lsl-003.png';
import tee001 from '../../assets/vexxx/products/vxx-tee-001.png';
import { MAPPED_SKUS, type MappedSku } from './mapped-skus';

/**
 * Per-SKU product photography (AI-generated campaign set, DROP_001).
 */
const bySku: Record<MappedSku, ImageMetadata> = {
  'VXX-HOOD-001': hood001,
  'VXX-TEE-002': tee001,
  'VXX-LSL-003': lsl003,
  'VXX-CRG-004': crg004,
  'VXX-JKT-005': jkt005,
  'VXX-CAP-006': cap006,
  'VXX-BAG-007': bag007,
};

function isMappedSku(sku: string): sku is MappedSku {
  return (MAPPED_SKUS as readonly string[]).includes(sku);
}

/** Throws at build time so an unmapped published SKU can never ship a wrong image silently. */
export function productImage(sku: string): ImageMetadata {
  if (!isMappedSku(sku)) {
    throw new Error(
      `No product image mapped for SKU "${sku}". Add the asset import and bySku entry in product-images.ts and the SKU to mapped-skus.ts.`,
    );
  }
  return bySku[sku];
}
