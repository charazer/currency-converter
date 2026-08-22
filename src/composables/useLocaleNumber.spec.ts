import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useLocaleNumber } from './useLocaleNumber'

describe('useLocaleNumber', () => {
  it('exposes symbols for the requested locale', () => {
    const { symbols } = useLocaleNumber('de-DE')
    expect(symbols.value.decimal).toBe(',')
    expect(symbols.value.group).toBe('.')
  })

  it('parses and reformats in that locale', () => {
    const { parse, format } = useLocaleNumber('de-DE')
    const result = parse('1.234.567,89')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(format(result.value)).toBe('1.234.567,89')
  })

  it('reacts to a changing locale', () => {
    const locale = ref('en-US')
    const { format } = useLocaleNumber(locale)
    const value = { integer: '1234567', fraction: '89' }
    expect(format(value)).toBe('1,234,567.89')
    locale.value = 'de-DE'
    expect(format(value)).toBe('1.234.567,89')
  })

  it('normalises to the currency minor units', () => {
    const { normalise } = useLocaleNumber('en-US')
    expect(normalise({ integer: '05', fraction: '5' }, 'USD')).toEqual({
      integer: '5',
      fraction: '50',
    })
    expect(normalise({ integer: '05', fraction: '5' }, 'JPY')).toEqual({
      integer: '5',
      fraction: null,
    })
  })

  it('converts through the decimal engine', () => {
    const { convert, format } = useLocaleNumber('en-US')
    expect(format(convert({ integer: '1000000', fraction: null }, 1.1568, 'USD'))).toBe(
      '1,156,800.00',
    )
  })

  it('maps caret offsets across regrouping', () => {
    const { caretToCount, countToCaret } = useLocaleNumber('en-US')
    const count = caretToCount('999', 3)
    expect(countToCaret('9,999', count + 1)).toBe(5)
  })

  it('formats rates and dates', () => {
    const { rate, date } = useLocaleNumber('de-DE')
    expect(rate(1.1568)).toBe('1,1568')
    expect(date('2026-08-21')).toBe('21. Aug. 2026')
  })
})
