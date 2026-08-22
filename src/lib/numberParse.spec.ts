import { describe, expect, it } from 'vitest'

import { getNumberSymbols } from './numberFormat'
import {
  canonicalToNumeric,
  caretAfterMeaningful,
  countMeaningfulBefore,
  formatCanonical,
  isEmpty,
  normaliseCanonical,
  parseAmount,
  type CanonicalAmount,
} from './numberParse'

function parsed(input: string, locale: string): CanonicalAmount {
  const result = parseAmount(input, getNumberSymbols(locale))
  if (!result.ok) throw new Error(`expected "${input}" to parse in ${locale}, got ${result.reason}`)
  return result.value
}

function failure(input: string, locale: string): string {
  const result = parseAmount(input, getNumberSymbols(locale))
  if (result.ok) throw new Error(`expected "${input}" to fail in ${locale}`)
  return result.reason
}

describe('parseAmount — locale matrix', () => {
  const localised = [
    { locale: 'en-US', typed: '1,234,567.89' },
    { locale: 'de-DE', typed: '1.234.567,89' },
    { locale: 'fr-FR', typed: '1\u202F234\u202F567,89' },
    { locale: 'en-IN', typed: '12,34,567.89' },
    { locale: 'de-CH', typed: "1'234'567.89" },
    { locale: 'ja-JP', typed: '1,234,567.89' },
    { locale: 'ar-EG', typed: '١٬٢٣٤٬٥٦٧٫٨٩' },
    { locale: 'pt-BR', typed: '1.234.567,89' },
  ]

  it.each(localised)('parses fully formatted input for $locale', ({ locale, typed }) => {
    expect(parsed(typed, locale)).toEqual({ integer: '1234567', fraction: '89' })
  })

  it.each(localised)('round-trips format(parse(x)) for $locale', ({ locale, typed }) => {
    const symbols = getNumberSymbols(locale)
    expect(formatCanonical(parsed(typed, locale), symbols)).toBe(typed)
  })
})

describe('parseAmount — separator ambiguity', () => {
  it.each([
    // A lone group character with exactly three trailing digits keeps its locale meaning.
    { locale: 'en-US', input: '1,234', expected: { integer: '1234', fraction: null } },
    { locale: 'de-DE', input: '1.234', expected: { integer: '1234', fraction: null } },
    // ...but with any other digit count it can only sensibly be a decimal point.
    { locale: 'en-US', input: '1,23', expected: { integer: '1', fraction: '23' } },
    { locale: 'de-DE', input: '1,23', expected: { integer: '1', fraction: '23' } },
    { locale: 'en-US', input: '1.234', expected: { integer: '1', fraction: '234' } },
    { locale: 'de-DE', input: '1.2345', expected: { integer: '1', fraction: '2345' } },
    // The locale's own decimal character always wins.
    { locale: 'en-US', input: '1.5', expected: { integer: '1', fraction: '5' } },
    { locale: 'de-DE', input: '1,5', expected: { integer: '1', fraction: '5' } },
    // A character that is neither the locale group nor decimal is taken as a decimal point.
    { locale: 'de-CH', input: '1,5', expected: { integer: '1', fraction: '5' } },
    { locale: 'en-US', input: '1\u066B5', expected: { integer: '1', fraction: '5' } },
  ])('resolves $input in $locale', ({ locale, input, expected }) => {
    expect(parsed(input, locale)).toEqual(expected)
  })

  it('treats the last of two distinct separators as the decimal point', () => {
    expect(parsed('1,234.56', 'en-US')).toEqual({ integer: '1234', fraction: '56' })
    expect(parsed('1.234,56', 'de-DE')).toEqual({ integer: '1234', fraction: '56' })
  })

  it('recovers when a value is pasted with foreign separators', () => {
    expect(parsed('1.234,56', 'en-US')).toEqual({ integer: '1234', fraction: '56' })
    expect(parsed('1,234.56', 'de-DE')).toEqual({ integer: '1234', fraction: '56' })
  })

  it('treats repeated group characters as grouping', () => {
    expect(parsed('1,234,567', 'en-US')).toEqual({ integer: '1234567', fraction: null })
    expect(parsed('1.234.567', 'de-DE')).toEqual({ integer: '1234567', fraction: null })
  })

  it('ignores whitespace and apostrophe grouping in any locale', () => {
    expect(parsed('1 234 567', 'en-US')).toEqual({ integer: '1234567', fraction: null })
    expect(parsed('1\u00A0234\u00A0567', 'en-US')).toEqual({ integer: '1234567', fraction: null })
    expect(parsed("1'234'567", 'en-US')).toEqual({ integer: '1234567', fraction: null })
  })
})

describe('parseAmount — typing states', () => {
  it('accepts an empty field', () => {
    const value = parsed('', 'en-US')
    expect(isEmpty(value)).toBe(true)
  })

  it('keeps a trailing decimal separator so the field does not fight the user', () => {
    expect(parsed('1.', 'en-US')).toEqual({ integer: '1', fraction: '' })
    expect(parsed('1,', 'de-DE')).toEqual({ integer: '1', fraction: '' })
  })

  it('preserves trailing zeros in the fraction', () => {
    expect(parsed('1.50', 'en-US')).toEqual({ integer: '1', fraction: '50' })
    expect(parsed('1.500', 'en-US')).toEqual({ integer: '1', fraction: '500' })
  })

  it('preserves leading zeros while typing', () => {
    expect(parsed('01', 'en-US')).toEqual({ integer: '01', fraction: null })
    expect(parsed('0', 'en-US')).toEqual({ integer: '0', fraction: null })
  })

  it('accepts a leading decimal separator', () => {
    expect(parsed('.5', 'en-US')).toEqual({ integer: '', fraction: '5' })
  })

  it('never changes the digit count, so caret tracking stays sound', () => {
    for (const input of ['1', '12', '123', '1234', '12345', '0012', '1.2', '1.']) {
      const value = parsed(input, 'en-US')
      const digits = input.replace(/[^0-9]/g, '')
      expect(value.integer + (value.fraction ?? '')).toBe(digits)
    }
  })
})

describe('parseAmount — rejections', () => {
  it.each([
    { input: 'abc', reason: 'invalid-character' },
    { input: '12a', reason: 'invalid-character' },
    { input: '1$', reason: 'invalid-character' },
    { input: '-5', reason: 'negative' },
    { input: '\u22125', reason: 'negative' },
    { input: '1.2.3', reason: 'multiple-decimals' },
    { input: '1.2,3.4', reason: 'multiple-decimals' },
    { input: '1234567890123456', reason: 'too-many-digits' },
  ])('rejects $input as $reason', ({ input, reason }) => {
    expect(failure(input, 'en-US')).toBe(reason)
  })

  it('allows exactly the digit cap', () => {
    expect(parsed('123456789012345', 'en-US').integer).toHaveLength(15)
  })

  it('counts fraction digits towards the cap', () => {
    expect(failure('1234567890123.456', 'en-US')).toBe('too-many-digits')
  })

  it('rejects three different separator characters', () => {
    expect(failure('1.2,3\u066B4', 'en-US')).toBe('multiple-decimals')
  })

  it('rejects a group character appearing after the decimal point', () => {
    expect(failure('1.234,567,890', 'en-US')).toBe('multiple-decimals')
  })
})

describe('formatCanonical', () => {
  it('formats an integer-only value without a trailing separator', () => {
    expect(formatCanonical({ integer: '1234', fraction: null }, getNumberSymbols('en-US'))).toBe(
      '1,234',
    )
  })

  it('keeps a bare trailing separator visible', () => {
    expect(formatCanonical({ integer: '1', fraction: '' }, getNumberSymbols('de-DE'))).toBe('1,')
  })

  it('leaves an empty integer part empty rather than inventing a zero', () => {
    expect(formatCanonical({ integer: '', fraction: '5' }, getNumberSymbols('en-US'))).toBe('.5')
  })

  it('does not group or pad the fraction', () => {
    expect(formatCanonical({ integer: '1', fraction: '23456789' }, getNumberSymbols('en-US'))).toBe(
      '1.23456789',
    )
  })
})

describe('normaliseCanonical', () => {
  it('drops redundant leading zeros', () => {
    expect(normaliseCanonical({ integer: '0012', fraction: null }, 2)).toEqual({
      integer: '12',
      fraction: '00',
    })
  })

  it('keeps a single zero', () => {
    expect(normaliseCanonical({ integer: '0', fraction: null }, 2)).toEqual({
      integer: '0',
      fraction: '00',
    })
  })

  it('supplies a zero for an empty integer part', () => {
    expect(normaliseCanonical({ integer: '', fraction: '5' }, 2)).toEqual({
      integer: '0',
      fraction: '50',
    })
  })

  it('pads a short fraction to the currency width', () => {
    expect(normaliseCanonical({ integer: '1', fraction: '5' }, 2).fraction).toBe('50')
  })

  it('truncates an over-long fraction', () => {
    expect(normaliseCanonical({ integer: '1', fraction: '98765' }, 2).fraction).toBe('98')
  })

  it('drops the fraction entirely for zero-decimal currencies', () => {
    expect(normaliseCanonical({ integer: '1500', fraction: '9' }, 0)).toEqual({
      integer: '1500',
      fraction: null,
    })
  })

  it('gives three decimals to currencies that use them', () => {
    expect(normaliseCanonical({ integer: '1', fraction: '5' }, 3).fraction).toBe('500')
  })
})

describe('canonicalToNumeric', () => {
  it.each([
    [{ integer: '1234', fraction: '56' }, '1234.56'],
    [{ integer: '1234', fraction: null }, '1234'],
    [{ integer: '1234', fraction: '' }, '1234'],
    [{ integer: '', fraction: '5' }, '0.5'],
  ])('serialises %o', (value, expected) => {
    expect(canonicalToNumeric(value)).toBe(expected)
  })
})

describe('caret tracking', () => {
  const enUS = getNumberSymbols('en-US')
  const arEG = getNumberSymbols('ar-EG')

  it('counts digits and the decimal separator, ignoring group separators', () => {
    expect(countMeaningfulBefore('1,234', 5, enUS)).toBe(4)
    expect(countMeaningfulBefore('1,234', 1, enUS)).toBe(1)
    expect(countMeaningfulBefore('1,234', 2, enUS)).toBe(1)
    expect(countMeaningfulBefore('1,234.5', 7, enUS)).toBe(6)
  })

  it('maps a count back to an offset past the group separators', () => {
    expect(caretAfterMeaningful('1,234', 4, enUS)).toBe(5)
    expect(caretAfterMeaningful('1,234', 1, enUS)).toBe(1)
    expect(caretAfterMeaningful('1,234', 0, enUS)).toBe(0)
  })

  it('survives a group separator appearing as digits are added', () => {
    // "999" with the caret at the end becomes "9,999" — the caret must not fall before the comma.
    const before = countMeaningfulBefore('999', 3, enUS)
    expect(caretAfterMeaningful('9,999', before + 1, enUS)).toBe(5)
  })

  it('survives a group separator disappearing as digits are removed', () => {
    const before = countMeaningfulBefore('1,234', 5, enUS)
    expect(caretAfterMeaningful('123', before - 1, enUS)).toBe(3)
  })

  it('keeps the caret put when editing mid-string', () => {
    // Caret sits after "12" in "12,345"; inserting a digit there yields "123,45" -> "123,456".
    const before = countMeaningfulBefore('12,345', 2, enUS)
    expect(before).toBe(2)
    expect(caretAfterMeaningful('123,456', before + 1, enUS)).toBe(3)
  })

  it('clamps past the end of the string', () => {
    expect(caretAfterMeaningful('1,234', 99, enUS)).toBe(5)
  })

  it('clamps a caret offset past the end of the string', () => {
    expect(countMeaningfulBefore('1,234', 99, enUS)).toBe(4)
  })

  it('treats a negative target as the start of the string', () => {
    expect(caretAfterMeaningful('1,234', -3, enUS)).toBe(0)
  })

  it('works with non-Latin digits', () => {
    expect(countMeaningfulBefore('١٬٢٣٤', 5, arEG)).toBe(4)
    expect(caretAfterMeaningful('١٬٢٣٤', 4, arEG)).toBe(5)
  })
})
