import { keepPreviousData, queryOptions } from '@tanstack/vue-query'

import { fetchCurrencies, fetchHistory, fetchRateTable } from './frankfurter'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const queryKeys = {
  currencies: ['currencies'] as const,
  rateTable: (base: string) => ['rates', base] as const,
  history: (base: string, quote: string, from: string, to: string) =>
    ['history', base, quote, from, to] as const,
}

export const currenciesQuery = () =>
  queryOptions({
    queryKey: queryKeys.currencies,
    queryFn: ({ signal }) => fetchCurrencies(signal),
    staleTime: DAY,
  })

export const rateTableQuery = (base: string) =>
  queryOptions({
    queryKey: queryKeys.rateTable(base),
    queryFn: ({ signal }) => fetchRateTable(base, signal),
    staleTime: HOUR,
  })

export const historyQuery = (
  base: string,
  quote: string,
  from: string,
  to: string,
  enabled = true,
) =>
  queryOptions({
    queryKey: queryKeys.history(base, quote, from, to),
    queryFn: ({ signal }) => fetchHistory(base, quote, from, to, signal),
    staleTime: HOUR,
    enabled,
    // Switching range keeps the old series on screen instead of blanking the chart.
    placeholderData: keepPreviousData,
  })
