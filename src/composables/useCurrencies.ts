import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { currenciesQuery } from '@/api/queries'

export function useCurrencies() {
  const query = useQuery(currenciesQuery())

  const byCode = computed(
    () => new Map((query.data.value ?? []).map((currency) => [currency.code, currency])),
  )

  return {
    currencies: computed(() => query.data.value ?? []),
    byCode,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCurrency(code: MaybeRefOrGetter<string>) {
  const { byCode } = useCurrencies()
  return computed(() => byCode.value.get(toValue(code)) ?? null)
}
