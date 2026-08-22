import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { Currency } from '@/api/types'

import CurrencySelect from './CurrencySelect.vue'

const currencies: Currency[] = [
  { code: 'EUR', name: 'Euro', symbol: '€', startDate: null, endDate: null },
  { code: 'GBP', name: 'British Pound', symbol: '£', startDate: null, endDate: null },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', startDate: null, endDate: null },
  { code: 'USD', name: 'United States Dollar', symbol: '$', startDate: null, endDate: null },
]

function factory(modelValue = 'EUR') {
  return mount(CurrencySelect, {
    props: { modelValue, currencies, label: 'Convert from', inputId: 'currency' },
    attachTo: document.body,
  })
}

async function open(wrapper: ReturnType<typeof factory>) {
  await wrapper.find('input').trigger('focus')
  return wrapper
}

async function search(wrapper: ReturnType<typeof factory>, text: string) {
  const input = wrapper.find('input')
  input.element.value = text
  await input.trigger('input')
}

describe('CurrencySelect', () => {
  it('shows the selected code when closed', () => {
    const wrapper = factory('JPY')
    expect(wrapper.find('input').element.value).toBe('JPY')
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('false')
  })

  it('lists every currency once open', async () => {
    const wrapper = await open(factory())
    expect(wrapper.findAll('[role="option"]')).toHaveLength(4)
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true')
  })

  it('filters on code', async () => {
    const wrapper = await open(factory())
    await search(wrapper, 'jp')
    const options = wrapper.findAll('[role="option"]')
    expect(options).toHaveLength(1)
    expect(options[0]?.text()).toContain('JPY')
  })

  it('filters on name', async () => {
    const wrapper = await open(factory())
    await search(wrapper, 'pound')
    expect(wrapper.findAll('[role="option"]')[0]?.text()).toContain('GBP')
  })

  it('reports when nothing matches', async () => {
    const wrapper = await open(factory())
    await search(wrapper, 'zzz')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('No match')
  })

  it('selects with the mouse', async () => {
    const wrapper = await open(factory())
    await wrapper.findAll('[role="option"]')[2]?.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['JPY'])
  })

  it('marks the current selection for assistive tech', async () => {
    const wrapper = await open(factory('GBP'))
    const selected = wrapper
      .findAll('[role="option"]')
      .filter((option) => option.attributes('aria-selected') === 'true')
    expect(selected).toHaveLength(1)
    expect(selected[0]?.text()).toContain('GBP')
  })
})

describe('CurrencySelect — keyboard', () => {
  it('opens on ArrowDown', async () => {
    const wrapper = factory()
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true')
  })

  it('moves the active option and selects it with Enter', async () => {
    const wrapper = await open(factory('EUR'))
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['GBP'])
  })

  it('wraps around at the ends', async () => {
    const wrapper = await open(factory('EUR'))
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'ArrowUp' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['USD'])
  })

  it('jumps to the last option with End', async () => {
    const wrapper = await open(factory())
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'End' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['USD'])
  })

  it('closes on Escape without selecting', async () => {
    const wrapper = await open(factory())
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'Escape' })
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('tracks the active option with aria-activedescendant', async () => {
    const wrapper = await open(factory('EUR'))
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('currency-option-GBP')
  })

  it('resets the active option when the filter changes', async () => {
    const wrapper = await open(factory())
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'End' })
    await search(wrapper, 'u')
    expect(input.attributes('aria-activedescendant')).toBe('currency-option-EUR')
  })
})
