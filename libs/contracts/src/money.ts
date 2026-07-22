import { z } from 'zod';

/**
 * Money is INTEGER minor units end-to-end. This schema is the single
 * definition every service validates against; arithmetic and formatting
 * live in @vexxx/money.
 */
export const currencySchema = z.enum(['EUR', 'USD']);
export type Currency = z.infer<typeof currencySchema>;

export const moneySchema = z
  .object({
    /** Integer amount in minor units (cents). Floats are rejected. */
    amount: z.number().int().nonnegative(),
    currency: currencySchema,
  })
  .strict();

export type Money = z.infer<typeof moneySchema>;
