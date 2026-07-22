import { z } from 'zod';
import { moneySchema } from './money.js';

/**
 * Order lifecycle. PAID is reachable ONLY via a verified payment whose
 * amount matches our own computed total; a mismatch parks the order in
 * PAYMENT_MISMATCH and alerts — it never silently becomes PAID.
 */
export const orderStatusSchema = z.enum([
  'PENDING',
  'AWAITING_PAYMENT',
  'PAID',
  'PAYMENT_MISMATCH',
  'CANCELLED',
  'REFUNDED',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderItemSchema = z
  .object({
    productId: z.string().min(1),
    sku: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    /** Unit price snapshot at order time — server-computed, never client-sent. */
    unitPrice: moneySchema,
  })
  .strict();
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderSchema = z
  .object({
    id: z.string().min(1),
    items: z.array(orderItemSchema).min(1),
    /** All totals are server-recomputed. The API never accepts a client amount. */
    subtotal: moneySchema,
    shipping: moneySchema,
    total: moneySchema,
    status: orderStatusSchema,
    createdAt: z.string().datetime(),
  })
  .strict();
export type Order = z.infer<typeof orderSchema>;
