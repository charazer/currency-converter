import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import RateChart from './RateChart.vue'

function factory(props: { base?: string; quote?: string } = {}) {
  return mount(RateChart, {
    props: { base: 'EUR', quote: 'USD', locale: 'en-US', ...props },
    global: {
      plugins: [
        [
          VueQueryPlugin,
          { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
        ],
      ],
    },
  })
}

async function loaded(wrapper: ReturnType<typeof factory>) {
  await vi.waitFor(() => {
    expect(wrapper.find('svg.plot').exists()).toBe(true)
  })
  return wrapper
}

describe('RateChart', () => {
  it('offers the three ranges', () => {
    const wrapper = factory()
    const labels = wrapper.findAll('.range .label').map((span) => span.text())
    expect(labels).toEqual(['30D', '90D', '1Y'])
  })

  it('starts on 30 days', () => {
    const wrapper = factory()
    expect(wrapper.get('.range[aria-pressed="true"] .label').text()).toBe('30D')
  })

  it('switches range on click', async () => {
    const wrapper = factory()
    await wrapper.findAll('.range')[2]?.trigger('click')
    expect(wrapper.get('.range[aria-pressed="true"] .label').text()).toBe('1Y')
  })

  it('plots the series once loaded', async () => {
    const wrapper = await loaded(factory())
    expect(wrapper.get('path.stroke').attributes('d')).toMatch(/^M[\d.]+ [\d.]+ L/)
  })

  it('reports the low and high of the range', async () => {
    const wrapper = await loaded(factory())
    expect(wrapper.get('.bounds').text()).toContain('Low 1.1502')
    expect(wrapper.get('.bounds').text()).toContain('High 1.1568')
  })

  it('shows the latest value by default', async () => {
    const wrapper = await loaded(factory())
    expect(wrapper.get('.readout').text()).toContain('1.1568')
  })

  it('describes itself for assistive tech', async () => {
    const wrapper = await loaded(factory())
    const label = wrapper.get('svg.plot').attributes('aria-label')
    expect(label).toContain('EUR to USD')
    expect(label).toContain('low 1.1502')
    expect(label).toContain('latest 1.1568')
  })

  it('renders nothing when both sides are the same currency', () => {
    const wrapper = factory({ quote: 'EUR' })
    expect(wrapper.find('.chart').exists()).toBe(false)
  })
})
