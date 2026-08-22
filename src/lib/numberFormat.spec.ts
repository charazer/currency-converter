import { describe, expect, it, vi } from 'vitest'

import {
  formatDate,
  formatRate,
  getCurrencyFractionDigits,
  getNumberSymbols,
  groupDigits,
  toLocaleDigits,
} from './numberFormat'

describe('getNumberSymbols', () => {
  const cases = [
    { locale: 'en-US', group: ',', decimal: '.', numberingSystem: 'latn' },
    { locale: 'de-DE', group: '.', decimal: ',', numberingSystem: 'latn' },
    { locale: 'fr-FR', group: '\u202F', decimal: ',', numberingSystem: 'latn' },
    { locale: 'en-IN', group: ',', decimal: '.', numberingSystem: 'latn' },
    { locale: 'de-CH', group: "'", decimal: '.', numberingSystem: 'latn' },
    { locale: 'ja-JP', group: ',', decimal: '.', numberingSystem: 'latn' },
    { locale: 'ar-EG', group: '\u066C', decimal: '\u066B', numberingSystem: 'arab' },
    { locale: 'pt-BR', group: '.', decimal: ',', numberingSystem: 'latn' },
  ]

  it.each(cases)('reads $locale from Intl', ({ locale, group, decimal, numberingSystem }) => {
    const symbols = getNumberSymbols(locale)
    expect(symbols.group).toBe(group)
    expect(symbols.decimal).toBe(decimal)
    expect(symbols.numberingSystem).toBe(numberingSystem)
    expect(symbols.digits).toHaveLength(10)
  })

  it('maps locale digits back to ASCII', () => {
    const symbols = getNumberSymbols('ar-EG')
    expect(symbols.digits[0]).toBe('\u0660')
    expect(symbols.toAscii.get('\u0665')).toBe('5')
  })

  it('caches instances per locale', () => {
    expect(getNumberSymbols('en-US')).toBe(getNumberSymbols('en-US'))
  })
})

describe('groupDigits', () => {
  it.each([
    { locale: 'en-US', input: '1234567', expected: '1,234,567' },
    { locale: 'de-DE', input: '1234567', expected: '1.234.567' },
    { locale: 'fr-FR', input: '1234567', expected: '1\u202F234\u202F567' },
    { locale: 'de-CH', input: '1234567', expected: "1'234'567" },
    { locale: 'pt-BR', input: '1234567', expected: '1.234.567' },
    // Indian grouping is 3;2;2, not 3;3;3 — the whole reason separators come from Intl.
    { locale: 'en-IN', input: '1234567', expected: '12,34,567' },
    { locale: 'ar-EG', input: '1234567', expected: '١٬٢٣٤٬٥٦٧' },
  ])('groups $input for $locale', ({ locale, input, expected }) => {
    expect(groupDigits(input, getNumberSymbols(locale))).toBe(expected)
  })

  it('returns an empty string for no digits', () => {
    expect(groupDigits('', getNumberSymbols('en-US'))).toBe('')
  })

  it.each(['0', '00', '007', '0001234'])('preserves leading zeros in %s', (input) => {
    const grouped = groupDigits(input, getNumberSymbols('en-US'))
    expect(grouped.replace(/,/g, '')).toBe(input)
  })

  it('groups leading-zero values in the same positions as normal ones', () => {
    const symbols = getNumberSymbols('en-US')
    expect(groupDigits('0123456', symbols)).toBe('0,123,456')
  })

  it('handles values beyond Number.MAX_SAFE_INTEGER exactly', () => {
    expect(groupDigits('9007199254740993', getNumberSymbols('en-US'))).toBe('9,007,199,254,740,993')
  })
})

describe('toLocaleDigits', () => {
  it('leaves latn untouched', () => {
    expect(toLocaleDigits('4250', getNumberSymbols('en-US'))).toBe('4250')
  })

  it('converts to the locale numbering system', () => {
    expect(toLocaleDigits('4250', getNumberSymbols('ar-EG'))).toBe('٤٢٥٠')
  })

  it('passes non-digit characters through untouched', () => {
    expect(toLocaleDigits('4-2', getNumberSymbols('ar-EG'))).toBe('٤-٢')
  })
})

describe('getCurrencyFractionDigits', () => {
  it.each([
    ['USD', 2],
    ['EUR', 2],
    ['GBP', 2],
    ['JPY', 0],
    ['KRW', 0],
    ['CLP', 0],
    ['ISK', 0],
    ['KWD', 3],
    ['BHD', 3],
    ['OMR', 3],
  ])('returns %s minor units as %i', (currency, expected) => {
    expect(getCurrencyFractionDigits(currency)).toBe(expected)
  })

  it('falls back to 2 for an unknown code', () => {
    expect(getCurrencyFractionDigits('XXXXX')).toBe(2)
  })

  it('falls back to 2 if the engine omits maximumFractionDigits', () => {
    const spy = vi
      .spyOn(Intl.NumberFormat.prototype, 'resolvedOptions')
      .mockReturnValue({} as Intl.ResolvedNumberFormatOptions)
    try {
      expect(getCurrencyFractionDigits('USD')).toBe(2)
    } finally {
      spy.mockRestore()
    }
  })
})

describe('formatRate', () => {
  it('keeps four decimals for rates around one', () => {
    expect(formatRate(1.1568, 'en-US')).toBe('1.1568')
  })

  it('never truncates a small rate to two decimals', () => {
    expect(formatRate(0.0086, 'en-US')).toBe('0.008600')
  })

  it('keeps precision on large rates', () => {
    expect(formatRate(157.2345, 'en-US')).toBe('157.2345')
  })

  it('uses locale separators', () => {
    expect(formatRate(1.1568, 'de-DE')).toBe('1,1568')
  })

  it('does not blow up on a zero rate', () => {
    expect(formatRate(0, 'en-US')).toBe('0.0000')
  })
})

describe('formatDate', () => {
  it('formats an ISO date in the locale', () => {
    expect(formatDate('2026-08-21', 'en-US')).toBe('Aug 21, 2026')
  })

  it('is timezone-stable regardless of the host offset', () => {
    expect(formatDate('2026-01-01', 'en-GB')).toBe('1 Jan 2026')
  })
})
