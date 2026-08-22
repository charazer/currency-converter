import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { storageKeys } from '@/lib/storage'

import { resetConverter, useConverter } from './useConverter'

type Converter = ReturnType<typeof useConverter>

function withConverter(): Converter {
  let api: Converter | undefined

  const Host = defineComponent({
    setup() {
      api = useConverter()
      return () => null
    },
  })

  mount(Host, {
    global: {
      plugins: [
        [
          VueQueryPlugin,
          { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
        ],
      ],
    },
  })

  if (api === undefined) throw new Error('useConverter did not run')
  return api
}

async function ready(api: Converter): Promise<void> {
  await vi.waitFor(() => {
    if (api.rate.value === null) throw new Error('rate not loaded')
  })
}

beforeEach(() => {
  localStorage.clear()
  resetConverter({ base: 'EUR', quote: 'USD' })
})

describe('useConverter', () => {
  it('loads the rate for the current pair', async () => {
    const api = withConverter()
    await ready(api)
    expect(api.rate.value).toBe(1.1568)
    expect(api.date.value).toBe('2026-08-21')
  })

  it('derives the quote amount from the base amount', async () => {
    const api = withConverter()
    await ready(api)
    expect(api.baseAmount.value).toEqual({ integer: '1', fraction: '00' })
    expect(api.quoteAmount.value).toEqual({ integer: '1', fraction: '16' })
  })

  it('recalculates when the base amount changes', async () => {
    const api = withConverter()
    await ready(api)
    api.setBaseAmount({ integer: '1000000', fraction: null })
    expect(api.quoteAmount.value).toEqual({ integer: '1156800', fraction: '00' })
  })

  it('runs the conversion backwards when the quote field is edited', async () => {
    const api = withConverter()
    await ready(api)
    api.setQuoteAmount({ integer: '1156800', fraction: '00' })
    expect(api.baseAmount.value).toEqual({ integer: '1000000', fraction: '00' })
  })

  it('rounds to the target currency minor units', async () => {
    const api = withConverter()
    await ready(api)
    api.setQuote('JPY')
    await vi.waitFor(() => {
      if (api.quoteAmount.value.fraction !== null) throw new Error('still two decimals')
    })
    expect(api.quoteAmount.value).toEqual({ integer: '170', fraction: null })
  })

  it('leaves the other field empty when the amount is cleared', async () => {
    const api = withConverter()
    await ready(api)
    api.setBaseAmount({ integer: '', fraction: null })
    expect(api.quoteAmount.value).toEqual({ integer: '', fraction: null })
  })
})

describe('useConverter — swapping', () => {
  it('exchanges the currencies', async () => {
    const api = withConverter()
    await ready(api)
    api.swap()
    expect(api.base.value).toBe('USD')
    expect(api.quote.value).toBe('EUR')
  })

  it('carries the converted amount across so the equation still holds', async () => {
    const api = withConverter()
    await ready(api)
    api.setBaseAmount({ integer: '100', fraction: '00' })
    const carried = api.quoteAmount.value
    api.swap()
    expect(api.baseAmount.value).toEqual(carried)
  })

  it('stays usable while the new base loads by inverting the known rate', async () => {
    const api = withConverter()
    await ready(api)
    api.swap()
    // No await: the USD table has not arrived yet.
    expect(api.rate.value).toBeCloseTo(1 / 1.1568, 10)
  })

  it('swaps instead of allowing a currency to be paired with itself', async () => {
    const api = withConverter()
    await ready(api)
    api.setQuote('EUR')
    expect(api.base.value).toBe('USD')
    expect(api.quote.value).toBe('EUR')
  })
})

describe('useConverter — persistence', () => {
  it('stores the pair when it changes', async () => {
    const api = withConverter()
    await ready(api)
    api.setQuote('JPY')
    expect(JSON.parse(localStorage.getItem(storageKeys.pair) ?? 'null')).toEqual({
      base: 'EUR',
      quote: 'JPY',
    })
  })

  it('stores the pair after a swap', async () => {
    const api = withConverter()
    await ready(api)
    api.swap()
    expect(JSON.parse(localStorage.getItem(storageKeys.pair) ?? 'null')).toEqual({
      base: 'USD',
      quote: 'EUR',
    })
  })
})
