import type { Money } from '@vexxx/contracts';
import { formatMoney } from '@vexxx/money';
import type { Locale } from '../i18n/config';
import { LOCALE_TAGS } from '../i18n/config';

/** Storefront-locale price formatting. The only money display path. */
export function formatPrice(money: Money, locale: Locale): string {
  return formatMoney(money, LOCALE_TAGS[locale]);
}
