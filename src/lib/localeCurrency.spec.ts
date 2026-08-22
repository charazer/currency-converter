import { describe, expect, it } from 'vitest'

import { currencyForLocale, defaultPair } from './localeCurrency'

describe('currencyForLocale', () => {
  it.each([
    ['de-DE', 'EUR'],
    ['de', 'EUR'],
    ['fr-FR', 'EUR'],
    ['en-US', 'USD'],
    ['en-GB', 'GBP'],
    ['en-IN', 'INR'],
    ['ja-JP', 'JPY'],
    ['de-CH', 'CHF'],
    ['pt-BR', 'BRL'],
    ['pl-PL', 'PLN'],
  ])('maps %s to %s', (locale, expected) => {
    expect(currencyForLocale(locale)).toBe(expected)
  })

  it('falls back to USD for an unmapped region', () => {
    expect(currencyForLocale('en-KE')).toBe('USD')
  })

  it('falls back to USD for a malformed locale', () => {
    expect(currencyForLocale('not a locale!')).toBe('USD')
  })
})

describe('defaultPair', () => {
  it('pairs the local currency against USD', () => {
    expect(defaultPair('de-DE')).toEqual({ base: 'EUR', quote: 'USD' })
  })

  it('avoids pairing USD with itself', () => {
    expect(defaultPair('en-US')).toEqual({ base: 'USD', quote: 'EUR' })
  })
})
