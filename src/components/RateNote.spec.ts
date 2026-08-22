import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { ApiError } from '@/api/errors'

import RateNote from './RateNote.vue'

function factory(overrides: Partial<InstanceType<typeof RateNote>['$props']> = {}) {
  return mount(RateNote, {
    props: {
      base: 'EUR',
      quote: 'USD',
      rate: 1.1568,
      date: '2026-08-21',
      locale: 'en-US',
      isLoading: false,
      isStale: false,
      error: null,
      ...overrides,
    },
  })
}

describe('RateNote', () => {
  it('states the rate and its date', () => {
    expect(factory().text()).toContain('1 EUR = 1.1568 USD')
    expect(factory().text()).toContain('Aug 21, 2026')
  })

  it('reports loading before the first rate arrives', () => {
    const wrapper = factory({ rate: null, date: null, isLoading: true })
    expect(wrapper.text()).toContain('Fetching rates')
  })

  it('says so when a pair has no rate', () => {
    const wrapper = factory({ rate: null, date: null })
    expect(wrapper.text()).toContain('No rate available')
  })

  it('flags saved rates when the data is stale', () => {
    expect(factory({ isStale: true }).text()).toContain('Showing saved rates')
  })
})

describe('RateNote — failures', () => {
  it('keeps the last good rate on screen when a refresh fails', () => {
    const wrapper = factory({ error: new ApiError('network') })
    expect(wrapper.text()).toContain('1 EUR = 1.1568 USD')
    expect(wrapper.text()).toContain('Could not refresh')
  })

  it('shows the full message when there is no rate to fall back on', () => {
    const wrapper = factory({ rate: null, date: null, error: new ApiError('network') })
    expect(wrapper.text()).toContain('Could not reach the exchange rate service')
    expect(wrapper.text()).not.toContain('No rate available')
  })

  it('offers a retry for transient failures', () => {
    const wrapper = factory({ rate: null, error: new ApiError('unavailable') })
    expect(wrapper.find('.retry').exists()).toBe(true)
  })

  it('does not offer a retry for a request that will fail again', () => {
    const wrapper = factory({ rate: null, error: new ApiError('not-found') })
    expect(wrapper.find('.retry').exists()).toBe(false)
  })

  it('emits retry when asked', async () => {
    const wrapper = factory({ rate: null, error: new ApiError('unavailable') })
    await wrapper.get('.retry').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('falls back to a generic message for an unknown error', () => {
    const wrapper = factory({ rate: null, error: new Error('boom') })
    expect(wrapper.text()).toContain('Something went wrong')
  })

  it('reserves the secondary line so nothing below it moves', () => {
    const wrapper = factory()
    expect(wrapper.get('.secondary').classes()).toContain('is-invisible')
  })
})
