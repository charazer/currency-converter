import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { useRateTable } from './useRates'

function renderComposable<T>(composable: () => T) {
  let result!: T
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => null
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  )

  return { result, wrapper }
}

describe('useRateTable', () => {
  it('exposes the rate table and its publication date', async () => {
    const { result } = renderComposable(() => useRateTable('EUR'))

    await vi.waitUntil(() => result.table.value !== undefined)

    expect(result.table.value?.rates['USD']).toBe(1.1568)
    expect(result.date.value).toBe('2026-08-21')
    expect(result.isError.value).toBe(false)
  })

  it('refetches when the base currency changes', async () => {
    const base = ref('EUR')
    const { result } = renderComposable(() => useRateTable(base))

    await vi.waitUntil(() => result.table.value !== undefined)
    expect(result.table.value?.base).toBe('EUR')

    base.value = 'USD'
    await vi.waitUntil(() => result.table.value?.base === 'USD')

    expect(result.table.value?.base).toBe('USD')
  })
})
