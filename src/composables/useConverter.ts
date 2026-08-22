import { computed, ref, watch } from 'vue'
import { z } from 'zod'

import { convertToCanonical } from '@/lib/convert'
import { defaultPair } from '@/lib/localeCurrency'
import { getCurrencyFractionDigits } from '@/lib/numberFormat'
import { isEmpty, normaliseCanonical, type CanonicalAmount } from '@/lib/numberParse'
import { readStored, storageKeys, writeStored } from '@/lib/storage'

import { resolveSystemLocale } from './useLocale'
import { useRateTable } from './useRates'

const pairSchema = z.object({
  base: z.string().regex(/^[A-Z]{3}$/),
  quote: z.string().regex(/^[A-Z]{3}$/),
})

const EMPTY: CanonicalAmount = { integer: '', fraction: null }

const initialPair = readStored(storageKeys.pair, pairSchema) ?? defaultPair(resolveSystemLocale())

const base = ref(initialPair.base)
const quote = ref(initialPair.quote)
/** Which field the user last typed in; the other one is derived from it. */
const source = ref<'base' | 'quote'>('base')
const sourceAmount = ref<CanonicalAmount>(
  normaliseCanonical({ integer: '1', fraction: null }, getCurrencyFractionDigits(initialPair.base)),
)

interface KnownRate {
  base: string
  quote: string
  rate: number
}

const lastKnownRate = ref<KnownRate | null>(null)

export function useConverter() {
  const { table, date, isStale, isLoading, isFetching, isError, error, refetch } =
    useRateTable(base)

  const directRate = computed<number | null>(() => {
    if (base.value === quote.value) return 1
    // The table lags the ref for one tick after the base changes.
    if (table.value?.base !== base.value) return null
    return table.value.rates[quote.value] ?? null
  })

  watch(directRate, (rate) => {
    if (rate !== null) lastKnownRate.value = { base: base.value, quote: quote.value, rate }
  })

  /** Falls back to inverting the previous pair so a swap stays responsive while the new base loads. */
  const rate = computed<number | null>(() => {
    if (directRate.value !== null) return directRate.value
    const known = lastKnownRate.value
    if (known !== null && known.base === quote.value && known.quote === base.value) {
      return 1 / known.rate
    }
    return null
  })

  function derive(amount: CanonicalAmount, factor: number | null, currency: string) {
    if (factor === null || isEmpty(amount)) return EMPTY
    return convertToCanonical(amount, factor, currency)
  }

  const baseAmount = computed(() =>
    source.value === 'base'
      ? sourceAmount.value
      : derive(sourceAmount.value, rate.value === null ? null : 1 / rate.value, base.value),
  )

  const quoteAmount = computed(() =>
    source.value === 'quote'
      ? sourceAmount.value
      : derive(sourceAmount.value, rate.value, quote.value),
  )

  function persist(): void {
    writeStored(storageKeys.pair, { base: base.value, quote: quote.value })
  }

  function setBaseAmount(amount: CanonicalAmount): void {
    source.value = 'base'
    sourceAmount.value = amount
  }

  function setQuoteAmount(amount: CanonicalAmount): void {
    source.value = 'quote'
    sourceAmount.value = amount
  }

  function setBase(code: string): void {
    if (code === quote.value) {
      swap()
      return
    }
    base.value = code
    persist()
  }

  function setQuote(code: string): void {
    if (code === base.value) {
      swap()
      return
    }
    quote.value = code
    persist()
  }

  /** Swaps the currencies and the amounts together, so the displayed equation still holds. */
  function swap(): void {
    const carried = quoteAmount.value
    const previousBase = base.value
    base.value = quote.value
    quote.value = previousBase
    source.value = 'base'
    if (!isEmpty(carried)) sourceAmount.value = carried
    persist()
  }

  return {
    base,
    quote,
    baseAmount,
    quoteAmount,
    rate,
    date,
    source,
    isStale,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    setBaseAmount,
    setQuoteAmount,
    setBase,
    setQuote,
    swap,
  }
}

/** Test seam: module-scoped state outlives a component, so specs need a way back to a known state. */
export function resetConverter(pair = initialPair): void {
  base.value = pair.base
  quote.value = pair.quote
  source.value = 'base'
  sourceAmount.value = normaliseCanonical(
    { integer: '1', fraction: null },
    getCurrencyFractionDigits(pair.base),
  )
  lastKnownRate.value = null
}
