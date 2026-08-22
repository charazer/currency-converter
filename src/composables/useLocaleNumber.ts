import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { convertToCanonical } from '@/lib/convert'
import {
  formatDate,
  formatRate,
  getCurrencyFractionDigits,
  getNumberSymbols,
} from '@/lib/numberFormat'
import {
  caretAfterMeaningful,
  countMeaningfulBefore,
  formatCanonical,
  normaliseCanonical,
  parseAmount,
  type CanonicalAmount,
  type ParseResult,
} from '@/lib/numberParse'

import { useLocale } from './useLocale'

/** Binds the pure formatting engine to the active locale. */
export function useLocaleNumber(localeOverride?: MaybeRefOrGetter<string>) {
  const { locale: activeLocale } = useLocale()
  const locale = computed(() =>
    localeOverride === undefined ? activeLocale.value : toValue(localeOverride),
  )
  const symbols = computed(() => getNumberSymbols(locale.value))

  return {
    locale,
    symbols,

    parse: (input: string): ParseResult => parseAmount(input, symbols.value),
    format: (value: CanonicalAmount): string => formatCanonical(value, symbols.value),
    normalise: (value: CanonicalAmount, currency: string): CanonicalAmount =>
      normaliseCanonical(value, getCurrencyFractionDigits(currency)),

    convert: (amount: CanonicalAmount, rate: number, targetCurrency: string): CanonicalAmount =>
      convertToCanonical(amount, rate, targetCurrency),

    caretToCount: (text: string, caret: number): number =>
      countMeaningfulBefore(text, caret, symbols.value),
    countToCaret: (text: string, count: number): number =>
      caretAfterMeaningful(text, count, symbols.value),

    rate: (value: number): string => formatRate(value, locale.value),
    date: (value: string): string => formatDate(value, locale.value),
  }
}
