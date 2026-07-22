import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [HealthModule, PaymentsModule, InventoryModule, OrdersModule],
})
export class AppModule {}
