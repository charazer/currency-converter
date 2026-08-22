import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { resetFavourites, useFavourites } from '@/composables/useFavourites'

import FavouritePairs from './FavouritePairs.vue'

function factory(props: { base?: string; quote?: string } = {}) {
  return mount(FavouritePairs, { props: { base: 'EUR', quote: 'USD', ...props } })
}

beforeEach(() => {
  localStorage.clear()
  resetFavourites()
})

describe('FavouritePairs', () => {
  it('prompts when there is nothing saved', () => {
    expect(factory().get('.empty').text()).toContain('Star a pair')
  })

  it('stars the current pair', async () => {
    const wrapper = factory()
    await wrapper.get('.star').trigger('click')
    expect(wrapper.get('.star').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.load').text()).toBe('EUR → USD')
  })

  it('unstars on a second click', async () => {
    const wrapper = factory()
    await wrapper.get('.star').trigger('click')
    await wrapper.get('.star').trigger('click')
    expect(wrapper.findAll('.chip')).toHaveLength(0)
  })

  it('reflects a pair saved elsewhere', () => {
    useFavourites().toggle({ base: 'EUR', quote: 'USD' })
    expect(factory().get('.star').attributes('aria-pressed')).toBe('true')
  })

  it('emits the pair when a chip is clicked', async () => {
    useFavourites().toggle({ base: 'GBP', quote: 'JPY' })
    const wrapper = factory()
    await wrapper.get('.load').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([{ base: 'GBP', quote: 'JPY' }])
  })

  it('removes a chip', async () => {
    useFavourites().toggle({ base: 'GBP', quote: 'JPY' })
    const wrapper = factory()
    await wrapper.get('.drop').trigger('click')
    expect(wrapper.findAll('.chip')).toHaveLength(0)
  })

  it('names the star action for screen readers', () => {
    expect(factory().get('.star').text()).toContain('Save EUR to USD as a favourite')
  })
})
