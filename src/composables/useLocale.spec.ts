import { afterEach, describe, expect, it, vi } from 'vitest'

import { storageKeys } from '@/lib/storage'

import { resolveSystemLocale, SUPPORTED_LOCALES, useLocale } from './useLocale'

function stubNavigatorLanguages(languages: string[]): void {
  vi.spyOn(globalThis.navigator, 'languages', 'get').mockReturnValue(languages)
}

afterEach(() => {
  useLocale().setLocale(null)
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('resolveSystemLocale', () => {
  it('prefers the first usable browser language', () => {
    stubNavigatorLanguages(['de-DE', 'en-US'])
    expect(resolveSystemLocale()).toBe('de-DE')
  })

  it('skips malformed entries', () => {
    stubNavigatorLanguages(['not a locale!', 'fr-FR'])
    expect(resolveSystemLocale()).toBe('fr-FR')
  })

  it('falls back to en-US when nothing is usable', () => {
    stubNavigatorLanguages([])
    vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('')
    expect(resolveSystemLocale()).toBe('en-US')
  })
})

describe('useLocale', () => {
  it('follows the system locale when there is no override', () => {
    stubNavigatorLanguages(['ja-JP'])
    const { locale, override } = useLocale()
    expect(override.value).toBeNull()
    expect(locale.value).toBe('ja-JP')
  })

  it('prefers an explicit override', () => {
    stubNavigatorLanguages(['ja-JP'])
    const { locale, setLocale } = useLocale()
    setLocale('de-DE')
    expect(locale.value).toBe('de-DE')
  })

  it('persists the override', () => {
    useLocale().setLocale('fr-FR')
    expect(localStorage.getItem(storageKeys.locale)).toBe('"fr-FR"')
  })

  it('clears the stored override when reset to system', () => {
    const { setLocale, override } = useLocale()
    setLocale('fr-FR')
    setLocale(null)
    expect(override.value).toBeNull()
    expect(localStorage.getItem(storageKeys.locale)).toBeNull()
  })

  it('ignores an unusable override', () => {
    const { setLocale, override } = useLocale()
    setLocale('not a locale!')
    expect(override.value).toBeNull()
  })

  it('offers only locales Intl can resolve', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(Intl.getCanonicalLocales(locale)).toHaveLength(1)
    }
  })
})
