import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { historyQuery, rateTableQuery } from '@/api/queries'

export function useRateTable(base: MaybeRefOrGetter<string>) {
  const query = useQuery(computed(() => rateTableQuery(toValue(base))))

  return {
    table: query.data,
    /** The rate's own publication date, which trails today on weekends and holidays. */
    date: computed(() => query.data.value?.date ?? null),
    /** True while showing cached data the server has not confirmed on this load. */
    isStale: computed(() => query.isStale.value && !query.isFetching.value),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useRateHistory(
  base: MaybeRefOrGetter<string>,
  quote: MaybeRefOrGetter<string>,
  from: MaybeRefOrGetter<string>,
  to: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const query = useQuery(
    computed(() =>
      historyQuery(
        toValue(base),
        toValue(quote),
        toValue(from),
        toValue(to),
        toValue(enabled) && toValue(base) !== toValue(quote),
      ),
    ),
  )

  return {
    points: computed(() => query.data.value ?? []),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
