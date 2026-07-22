import { describe, expect, it } from 'vitest';
import {
  inventoryAdjustmentSchema,
  inventoryLevelSchema,
  moneySchema,
  orderSchema,
  paymentSchema,
} from './index.js';

const money = { amount: 4990, currency: 'EUR' } as const;

describe('moneySchema', () => {
  it('accepts integer minor units', () => {
    expect(moneySchema.parse(money)).toEqual(money);
  });

  it('accepts Colombian pesos', () => {
    const cop = { amount: 89_900_000, currency: 'COP' } as const;
    expect(moneySchema.parse(cop)).toEqual(cop);
  });

  it('rejects float amounts', () => {
    expect(() =>
      moneySchema.parse({ amount: 49.9, currency: 'EUR' }),
    ).toThrow();
  });

  it('rejects negative amounts', () => {
    expect(() => moneySchema.parse({ amount: -1, currency: 'EUR' })).toThrow();
  });

  it('rejects unknown currencies and extra fields', () => {
    expect(() => moneySchema.parse({ amount: 100, currency: 'GBP' })).toThrow();
    expect(() => moneySchema.parse({ ...money, note: 'x' })).toThrow();
  });
});

describe('orderSchema', () => {
  const validOrder = {
    id: 'ord_1',
    items: [
      {
        productId: 'vx-tee-001',
        sku: 'VX-TEE-001',
        name: 'Oversized Tee 001',
        quantity: 2,
        unitPrice: money,
      },
    ],
    subtotal: { amount: 9980, currency: 'EUR' },
    shipping: { amount: 500, currency: 'EUR' },
    total: { amount: 10480, currency: 'EUR' },
    status: 'PENDING',
    createdAt: '2026-07-22T12:00:00Z',
  };

  it('accepts a valid order', () => {
    expect(orderSchema.parse(validOrder).status).toBe('PENDING');
  });

  it('rejects empty item lists', () => {
    expect(() => orderSchema.parse({ ...validOrder, items: [] })).toThrow();
  });

  it('rejects zero/negative quantities', () => {
    const bad = {
      ...validOrder,
      items: [{ ...validOrder.items[0], quantity: 0 }],
    };
    expect(() => orderSchema.parse(bad)).toThrow();
  });

  it('rejects unknown statuses', () => {
    expect(() =>
      orderSchema.parse({ ...validOrder, status: 'SHIPPED' }),
    ).toThrow();
  });
});

describe('paymentSchema', () => {
  const validPayment = {
    id: 'pay_1',
    orderId: 'ord_1',
    amount: money,
    status: 'PENDING',
    provider: 'tagadapay',
    providerReference: null,
    createdAt: '2026-07-22T12:00:00Z',
  };

  it('accepts a valid payment', () => {
    expect(paymentSchema.parse(validPayment).provider).toBe('tagadapay');
  });

  it('rejects a float amount', () => {
    expect(() =>
      paymentSchema.parse({
        ...validPayment,
        amount: { amount: 49.9, currency: 'EUR' },
      }),
    ).toThrow();
  });
});

describe('inventory schemas', () => {
  it('accepts valid levels', () => {
    expect(
      inventoryLevelSchema.parse({
        sku: 'VX-TEE-001',
        available: 10,
        reserved: 2,
      }),
    ).toBeTruthy();
  });

  it('rejects negative availability', () => {
    expect(() =>
      inventoryLevelSchema.parse({ sku: 'x', available: -1, reserved: 0 }),
    ).toThrow();
  });

  it('rejects zero-delta adjustments', () => {
    expect(() =>
      inventoryAdjustmentSchema.parse({
        sku: 'x',
        delta: 0,
        reason: 'CORRECTION',
        occurredAt: '2026-07-22T12:00:00Z',
      }),
    ).toThrow();
  });

  it('accepts negative deltas for sales', () => {
    const parsed = inventoryAdjustmentSchema.parse({
      sku: 'VX-TEE-001',
      delta: -2,
      reason: 'SALE',
      occurredAt: '2026-07-22T12:00:00Z',
    });
    expect(parsed.delta).toBe(-2);
  });
});
