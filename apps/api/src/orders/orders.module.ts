import { Module } from '@nestjs/common';

/**
 * Orders domain shell. A later pass owns: order creation with
 * server-recomputed totals (never client amounts), state machine per
 * @vexxx/contracts orderStatusSchema.
 */
@Module({})
export class OrdersModule {}
