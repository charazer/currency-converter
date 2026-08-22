import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { useTheme } from '@/composables/useTheme'

import ThemeToggle from './ThemeToggle.vue'

afterEach(() => {
  useTheme().setTheme('system')
  localStorage.clear()
})

describe('ThemeToggle', () => {
  it('offers light, dark and system', () => {
    const wrapper = mount(ThemeToggle)
    const titles = wrapper.findAll('.option').map((button) => button.attributes('title'))
    expect(titles).toEqual(['Light theme', 'Dark theme', 'Match system theme'])
  })

  it('marks the active theme', () => {
    const wrapper = mount(ThemeToggle)
    expect(wrapper.get('[aria-pressed="true"]').attributes('title')).toBe('Match system theme')
  })

  it('switches theme on click', async () => {
    const wrapper = mount(ThemeToggle)
    await wrapper.findAll('.option')[1]?.trigger('click')
    expect(wrapper.get('[aria-pressed="true"]').attributes('title')).toBe('Dark theme')
    expect(document.documentElement.dataset['theme']).toBe('dark')
  })

  it('is exposed as a labelled group', () => {
    expect(mount(ThemeToggle).get('[role="group"]').attributes('aria-label')).toBe('Theme')
  })
})
