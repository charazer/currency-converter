import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { CanonicalAmount } from '@/lib/numberParse'

import AmountField from './AmountField.vue'

function factory(overrides: Partial<InstanceType<typeof AmountField>['$props']> = {}) {
  return mount(AmountField, {
    props: {
      modelValue: { integer: '', fraction: null },
      currency: 'USD',
      locale: 'en-US',
      label: 'From',
      inputId: 'amount',
      ...overrides,
    },
    attachTo: document.body,
  })
}

/** Simulates a keystroke: the browser writes the new text and moves the caret, then fires `input`. */
async function type(
  wrapper: ReturnType<typeof factory>,
  text: string,
  caret = text.length,
): Promise<HTMLInputElement> {
  const el = wrapper.find('input').element
  el.value = text
  el.setSelectionRange(caret, caret)
  await wrapper.find('input').trigger('input')
  return el
}

function lastEmitted(wrapper: ReturnType<typeof factory>): CanonicalAmount | undefined {
  const events = wrapper.emitted('update:modelValue')
  return events?.at(-1)?.[0] as CanonicalAmount | undefined
}

describe('AmountField — grouping while typing', () => {
  it('groups as digits are entered', async () => {
    const wrapper = factory()
    const el = await type(wrapper, '1234')
    expect(el.value).toBe('1,234')
    expect(lastEmitted(wrapper)).toEqual({ integer: '1234', fraction: null })
  })

  it('groups a large value with a fraction', async () => {
    const wrapper = factory()
    const el = await type(wrapper, '1234567.89')
    expect(el.value).toBe('1,234,567.89')
  })

  it('uses the display locale', async () => {
    const wrapper = factory({ locale: 'de-DE' })
    const el = await type(wrapper, '1234567,89')
    expect(el.value).toBe('1.234.567,89')
  })

  it('uses Indian grouping for en-IN', async () => {
    const wrapper = factory({ locale: 'en-IN' })
    const el = await type(wrapper, '1234567')
    expect(el.value).toBe('12,34,567')
  })

  it('keeps a trailing decimal separator', async () => {
    const wrapper = factory()
    const el = await type(wrapper, '1234.')
    expect(el.value).toBe('1,234.')
  })

  it('keeps trailing zeros while focused', async () => {
    const wrapper = factory()
    const el = await type(wrapper, '1.50')
    expect(el.value).toBe('1.50')
  })
})

describe('AmountField — caret handling', () => {
  it('keeps the caret at the end as a separator appears', async () => {
    const wrapper = factory({ modelValue: { integer: '999', fraction: null } })
    const el = await type(wrapper, '9999', 4)
    expect(el.value).toBe('9,999')
    expect(el.selectionStart).toBe(5)
  })

  it('keeps the caret in place when editing mid-string', async () => {
    const wrapper = factory({ modelValue: { integer: '1234', fraction: null } })
    // "1,234" with the caret after "1,2", typing "9" gives the raw string "1,2934".
    const el = await type(wrapper, '1,2934', 4)
    expect(el.value).toBe('12,934')
    expect(el.selectionStart).toBe(4)
  })

  it('keeps the caret sane when a separator disappears', async () => {
    const wrapper = factory({ modelValue: { integer: '1234', fraction: null } })
    const el = await type(wrapper, '123', 3)
    expect(el.value).toBe('123')
    expect(el.selectionStart).toBe(3)
  })
})

describe('AmountField — rejection', () => {
  it('refuses letters and leaves the value untouched', async () => {
    const wrapper = factory({ modelValue: { integer: '123', fraction: null } })
    const el = await type(wrapper, '123a', 4)
    expect(el.value).toBe('123')
    expect(el.selectionStart).toBe(3)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('refuses a second decimal separator', async () => {
    const wrapper = factory({ modelValue: { integer: '1', fraction: '5' } })
    const el = await type(wrapper, '1.5.', 4)
    expect(el.value).toBe('1.5')
  })

  it('refuses a minus sign', async () => {
    const wrapper = factory()
    const el = await type(wrapper, '-1', 2)
    expect(el.value).toBe('')
  })

  it('shows a hint describing the problem', async () => {
    const wrapper = factory({ modelValue: { integer: '123', fraction: null } })
    await type(wrapper, '123a', 4)
    expect(wrapper.get('.hint').text()).toContain('Digits and a decimal separator only')
  })

  it('clears the hint on the next valid keystroke', async () => {
    const wrapper = factory({ modelValue: { integer: '123', fraction: null } })
    await type(wrapper, '123a', 4)
    await type(wrapper, '1234', 4)
    expect(wrapper.find('.hint').exists()).toBe(false)
  })

  it('stops at the digit cap', async () => {
    const wrapper = factory()
    const el = await type(wrapper, '1234567890123456', 16)
    expect(el.value).toBe('')
    expect(wrapper.get('.hint').text()).toContain('as many digits')
  })
})

describe('AmountField — blur', () => {
  it('settles the fraction to the currency width', async () => {
    const wrapper = factory({ modelValue: { integer: '1', fraction: '5' } })
    await wrapper.find('input').trigger('blur')
    expect(lastEmitted(wrapper)).toEqual({ integer: '1', fraction: '50' })
    expect(wrapper.find('input').element.value).toBe('1.50')
  })

  it('drops the fraction for a zero-decimal currency', async () => {
    const wrapper = factory({ currency: 'JPY', modelValue: { integer: '1500', fraction: '9' } })
    await wrapper.find('input').trigger('blur')
    expect(lastEmitted(wrapper)).toEqual({ integer: '1500', fraction: null })
    expect(wrapper.find('input').element.value).toBe('1,500')
  })

  it('strips redundant leading zeros', async () => {
    const wrapper = factory({ modelValue: { integer: '007', fraction: null } })
    await wrapper.find('input').trigger('blur')
    expect(lastEmitted(wrapper)).toEqual({ integer: '7', fraction: '00' })
  })

  it('leaves an empty field empty', async () => {
    const wrapper = factory()
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('AmountField — external updates', () => {
  it('reformats when the model changes from outside', async () => {
    const wrapper = factory()
    await wrapper.setProps({ modelValue: { integer: '1156800', fraction: '00' } })
    expect(wrapper.find('input').element.value).toBe('1,156,800.00')
  })

  it('reformats when the locale changes', async () => {
    const wrapper = factory({ modelValue: { integer: '1234567', fraction: '89' } })
    await wrapper.setProps({ locale: 'de-DE' })
    expect(wrapper.find('input').element.value).toBe('1.234.567,89')
  })

  it('is announced to assistive tech through its label', () => {
    const wrapper = factory()
    expect(wrapper.get('label').attributes('for')).toBe('amount')
    expect(wrapper.get('input').attributes('inputmode')).toBe('decimal')
  })
})
