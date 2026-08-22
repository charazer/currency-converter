import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useLocale } from '@/composables/useLocale'
import { storageKeys } from '@/lib/storage'

import LocaleSelect from './LocaleSelect.vue'

function factory() {
  return mount(LocaleSelect, { attachTo: document.body })
}

beforeEach(() => {
  localStorage.clear()
  useLocale().setLocale(null)
})

afterEach(() => {
  useLocale().setLocale(null)
})

describe('LocaleSelect', () => {
  it('defaults to following the system', () => {
    expect(factory().get('select').element.value).toBe('system')
  })

  it('shows what each locale does to a number', () => {
    const text = factory().text()
    expect(text).toContain('1,234,567.89')
    expect(text).toContain('1.234.567,89')
    // Indian grouping is the clearest reason this picker exists.
    expect(text).toContain('12,34,567.89')
  })

  it('names locales in a readable form', () => {
    expect(factory().text()).toContain('German (Germany)')
  })

  it('applies a chosen locale', async () => {
    const wrapper = factory()
    await wrapper.get('select').setValue('de-DE')
    expect(useLocale().locale.value).toBe('de-DE')
  })

  it('persists the choice', async () => {
    const wrapper = factory()
    await wrapper.get('select').setValue('fr-FR')
    expect(localStorage.getItem(storageKeys.locale)).toBe('"fr-FR"')
  })

  it('returns to the system locale', async () => {
    const wrapper = factory()
    await wrapper.get('select').setValue('fr-FR')
    await wrapper.get('select').setValue('system')
    expect(useLocale().override.value).toBeNull()
    expect(localStorage.getItem(storageKeys.locale)).toBeNull()
  })

  it('is labelled for assistive tech', () => {
    const wrapper = factory()
    expect(wrapper.get('label').attributes('for')).toBe('locale')
    expect(wrapper.get('label').text()).toBe('Number format')
  })
})
