import type { Locale } from '../../i18n/config';
import { LOCALE_TAGS } from '../../i18n/config';

/**
 * Money is INTEGER minor units end-to-end (cents). Floats never enter
 * arithmetic; conversion to a decimal happens only at the display /
 * serialization boundary, in this module and nowhere else.
 */
export interface Money {
  /** Integer amount in minor units (e.g. cents). */
  readonly amount: number;
  /** ISO 4217 code. */
  readonly currency: 'EUR' | 'USD';
}

const MINOR_UNITS_PER_MAJOR = 100;

export function assertValidMoney(money: Money): void {
  if (!Number.isSafeInteger(money.amount)) {
    throw new Error(
      `Money amount must be an integer in minor units, got: ${String(money.amount)}`,
    );
  }
  if (money.amount < 0) {
    throw new Error(
      `Money amount must not be negative, got: ${String(money.amount)}`,
    );
  }
}

/** Locale-aware currency string for UI, e.g. "49,90 €" / "$49.90". */
export function formatMoney(money: Money, locale: Locale): string {
  assertValidMoney(money);
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'currency',
    currency: money.currency,
  }).format(money.amount / MINOR_UNITS_PER_MAJOR);
}

/** Plain decimal string for machine consumers (JSON-LD offers), e.g. "49.90". */
export function toDecimalString(money: Money): string {
  assertValidMoney(money);
  const major = Math.trunc(money.amount / MINOR_UNITS_PER_MAJOR);
  const minor = Math.abs(money.amount % MINOR_UNITS_PER_MAJOR);
  return `${String(major)}.${String(minor).padStart(2, '0')}`;
}
