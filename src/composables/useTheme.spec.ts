import { afterEach, describe, expect, it } from 'vitest'

import { storageKeys } from '@/lib/storage'

import { useTheme } from './useTheme'

afterEach(() => {
  useTheme().setTheme('system')
  localStorage.clear()
})

describe('useTheme', () => {
  it('defaults to following the system', () => {
    expect(useTheme().theme.value).toBe('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('applies an explicit theme to the document', () => {
    useTheme().setTheme('dark')
    expect(document.documentElement.dataset['theme']).toBe('dark')
  })

  it('removes the attribute again when returning to system', () => {
    const { setTheme } = useTheme()
    setTheme('dark')
    setTheme('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('persists the choice', () => {
    useTheme().setTheme('light')
    expect(localStorage.getItem(storageKeys.theme)).toBe('"light"')
  })
})
