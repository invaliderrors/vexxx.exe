import { z } from 'zod';

/** Stock level for a SKU. `available` excludes `reserved`. */
export const inventoryLevelSchema = z
  .object({
    sku: z.string().min(1),
    available: z.number().int().nonnegative(),
    reserved: z.number().int().nonnegative(),
  })
  .strict();
export type InventoryLevel = z.infer<typeof inventoryLevelSchema>;

export const inventoryAdjustmentReasonSchema = z.enum([
  'RESTOCK',
  'SALE',
  'RETURN',
  'CORRECTION',
  'DAMAGE',
]);
export type InventoryAdjustmentReason = z.infer<
  typeof inventoryAdjustmentReasonSchema
>;

/** An audited stock movement. Every level change happens through one. */
export const inventoryAdjustmentSchema = z
  .object({
    sku: z.string().min(1),
    /** Signed delta in units; zero is meaningless and rejected. */
    delta: z
      .number()
      .int()
      .refine((value) => value !== 0, { message: 'delta must not be zero' }),
    reason: inventoryAdjustmentReasonSchema,
    occurredAt: z.string().datetime(),
  })
  .strict();
export type InventoryAdjustment = z.infer<typeof inventoryAdjustmentSchema>;
