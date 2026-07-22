import { describe, expect, it } from 'vitest';
import { formatMoney, toDecimalString, type Money } from './money';

const eur = (amount: number): Money => ({ amount, currency: 'EUR' });

describe('toDecimalString', () => {
  it('converts minor units to a two-decimal string', () => {
    expect(toDecimalString(eur(4990))).toBe('49.90');
  });

  it('pads sub-10 minor remainders', () => {
    expect(toDecimalString(eur(4905))).toBe('49.05');
  });

  it('handles zero', () => {
    expect(toDecimalString(eur(0))).toBe('0.00');
  });

  it('handles exact major amounts', () => {
    expect(toDecimalString(eur(10000))).toBe('100.00');
  });

  it('rejects non-integer amounts', () => {
    expect(() => toDecimalString(eur(49.9))).toThrow(/integer/);
  });

  it('rejects negative amounts', () => {
    expect(() => toDecimalString(eur(-100))).toThrow(/negative/);
  });
});

describe('formatMoney', () => {
  it('formats EUR for es with symbol', () => {
    const formatted = formatMoney(eur(4990), 'es');
    expect(formatted).toContain('€');
    expect(formatted).toContain('49,90');
  });

  it('formats USD for en with symbol', () => {
    const formatted = formatMoney({ amount: 4990, currency: 'USD' }, 'en');
    expect(formatted).toBe('$49.90');
  });

  it('rejects float amounts', () => {
    expect(() => formatMoney(eur(12.5), 'es')).toThrow(/integer/);
  });
});
