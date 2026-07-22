import { Module } from '@nestjs/common';

/**
 * Payments domain shell. A later pass owns: PSP integration, webhook
 * signature verification, amount reconciliation against our own totals
 * (see @vexxx/contracts paymentSchema — the reported amount is untrusted).
 */
@Module({})
export class PaymentsModule {}
