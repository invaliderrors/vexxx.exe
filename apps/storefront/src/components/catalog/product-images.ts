import type { ImageMetadata } from 'astro';
import campaignGroup from '../../assets/vexxx/campaign-group.png';
import bag007 from '../../assets/vexxx/products/vxx-bag-007.png';
import cap006 from '../../assets/vexxx/products/vxx-cap-006.png';
import crg004 from '../../assets/vexxx/products/vxx-crg-004.png';
import hood001 from '../../assets/vexxx/products/vxx-hood-001.png';
import jkt005 from '../../assets/vexxx/products/vxx-jkt-005.png';
import lsl003 from '../../assets/vexxx/products/vxx-lsl-003.png';
import tee001 from '../../assets/vexxx/products/vxx-tee-001.png';

/**
 * Per-SKU product photography (AI-generated campaign set, DROP_001).
 * Falls back to shared campaign imagery for SKUs without a dedicated shot.
 */
const bySku: Record<string, ImageMetadata> = {
  'VXX-HOOD-001': hood001,
  'VXX-TEE-002': tee001,
  'VXX-LSL-003': lsl003,
  'VXX-CRG-004': crg004,
  'VXX-JKT-005': jkt005,
  'VXX-CAP-006': cap006,
  'VXX-BAG-007': bag007,
};

export function productImage(sku: string): ImageMetadata {
  return bySku[sku] ?? campaignGroup;
}
