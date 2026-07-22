import { z } from 'zod';
import { moneySchema } from './money.js';

export const paymentStatusSchema = z.enum([
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'MISMATCH',
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/**
 * A payment attempt as reported by the PSP. The reported amount is
 * UNTRUSTED input: the API compares it against the order's own total
 * before any state change. Mismatch → status MISMATCH, never SUCCEEDED.
 */
export const paymentSchema = z
  .object({
    id: z.string().min(1),
    orderId: z.string().min(1),
    amount: moneySchema,
    status: paymentStatusSchema,
    /** PSP identifier, e.g. "tagadapay", "stripe". */
    provider: z.string().min(1),
    /** The PSP's own reference for reconciliation. */
    providerReference: z.string().min(1).nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();
export type Payment = z.infer<typeof paymentSchema>;
