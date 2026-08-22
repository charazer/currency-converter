import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetConverter } from '@/composables/useConverter'

import ConverterCard from './ConverterCard.vue'

function factory() {
  return mount(ConverterCard, {
    global: {
      plugins: [
        [
          VueQueryPlugin,
          { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
        ],
      ],
    },
    attachTo: document.body,
  })
}

function amountFields(wrapper: ReturnType<typeof factory>) {
  return {
    from: wrapper.get('#amount-from').element as HTMLInputElement,
    to: wrapper.get('#amount-to').element as HTMLInputElement,
  }
}

beforeEach(() => {
  localStorage.clear()
  resetConverter({ base: 'EUR', quote: 'USD' })
})

describe('ConverterCard', () => {
  it('shows the converted amount once rates load', async () => {
    const wrapper = factory()
    await vi.waitFor(() => {
      expect(amountFields(wrapper).to.value).toBe('1.16')
    })
    expect(amountFields(wrapper).from.value).toBe('1.00')
  })

  it('converts what the user types, with separators', async () => {
    const wrapper = factory()
    await vi.waitFor(() => {
      expect(amountFields(wrapper).to.value).toBe('1.16')
    })

    const from = wrapper.get('#amount-from')
    ;(from.element as HTMLInputElement).value = '1000000'
    await from.trigger('input')

    expect((from.element as HTMLInputElement).value).toBe('1,000,000')
    expect(amountFields(wrapper).to.value).toBe('1,156,800.00')
  })

  it('states the rate and its date', async () => {
    const wrapper = factory()
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('1 EUR = 1.1568 USD')
    })
    expect(wrapper.text()).toContain('Aug 21, 2026')
  })

  it('swaps the pair', async () => {
    const wrapper = factory()
    await vi.waitFor(() => {
      expect(amountFields(wrapper).to.value).toBe('1.16')
    })

    await wrapper.get('.swap').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('1 USD =')
    })
    expect(wrapper.get('#currency-from').attributes('placeholder')).toBe('USD')
  })

  it('labels both amount fields', () => {
    const wrapper = factory()
    expect(wrapper.get('label[for="amount-from"]').text()).toBe('From')
    expect(wrapper.get('label[for="amount-to"]').text()).toBe('To')
  })
})
