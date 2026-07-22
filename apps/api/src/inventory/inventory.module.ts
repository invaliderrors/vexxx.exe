import { Module } from '@nestjs/common';

/**
 * Inventory domain shell. A later pass owns: stock levels, reservations,
 * audited adjustments (see @vexxx/contracts inventoryAdjustmentSchema).
 */
@Module({})
export class InventoryModule {}
