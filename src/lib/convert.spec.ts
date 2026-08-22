import Decimal from 'decimal.js-light'
import { describe, expect, it } from 'vitest'

import {
  convert,
  convertToCanonical,
  decimalToCanonical,
  roundToCurrency,
  toDecimal,
} from './convert'

describe('toDecimal', () => {
  it('accepts a canonical amount', () => {
    expect(toDecimal({ integer: '1234', fraction: '56' }).toString()).toBe('1234.56')
  })

  it('treats an empty integer part as zero', () => {
    expect(toDecimal({ integer: '', fraction: '5' }).toString()).toBe('0.5')
  })

  it('accepts strings and numbers', () => {
    expect(toDecimal('12.5').toString()).toBe('12.5')
    expect(toDecimal(12.5).toString()).toBe('12.5')
  })
})

describe('convert', () => {
  it('multiplies without float drift', () => {
    // 0.1 * 3 is 0.30000000000000004 in IEEE-754.
    expect(convert('0.1', 3).toString()).toBe('0.3')
  })

  it('keeps precision on large amounts', () => {
    expect(convert('1000000', 1.1568).toString()).toBe('1156800')
  })

  it('returns the amount unchanged for an identity rate', () => {
    expect(convert('1234.56', 1).toString()).toBe('1234.56')
  })
})

describe('roundToCurrency', () => {
  it('rounds half away from zero rather than to even', () => {
    expect(roundToCurrency(new Decimal('1.005'), 'USD').toString()).toBe('1.01')
    expect(roundToCurrency(new Decimal('1.015'), 'USD').toString()).toBe('1.02')
    expect(roundToCurrency(new Decimal('2.675'), 'USD').toString()).toBe('2.68')
  })

  it('respects zero-decimal currencies', () => {
    expect(roundToCurrency(new Decimal('1234.5'), 'JPY').toString()).toBe('1235')
  })

  it('respects three-decimal currencies', () => {
    expect(roundToCurrency(new Decimal('1.23456'), 'KWD').toString()).toBe('1.235')
  })
})

describe('decimalToCanonical', () => {
  it('splits into digit strings', () => {
    expect(decimalToCanonical(new Decimal('1234.5'), 2)).toEqual({
      integer: '1234',
      fraction: '50',
    })
  })

  it('omits the fraction when the currency has none', () => {
    expect(decimalToCanonical(new Decimal('1234.5'), 0)).toEqual({
      integer: '1235',
      fraction: null,
    })
  })

  it('avoids exponential notation for large values', () => {
    expect(decimalToCanonical(new Decimal('123456789012345'), 2).integer).toBe('123456789012345')
  })

  it('handles values below one', () => {
    expect(decimalToCanonical(new Decimal('0.5'), 2)).toEqual({ integer: '0', fraction: '50' })
  })
})

describe('convertToCanonical', () => {
  it('converts and rounds to the target currency', () => {
    expect(convertToCanonical({ integer: '100', fraction: null }, 1.1568, 'USD')).toEqual({
      integer: '115',
      fraction: '68',
    })
  })

  it('drops decimals for yen', () => {
    expect(convertToCanonical({ integer: '100', fraction: null }, 172.45, 'JPY')).toEqual({
      integer: '17245',
      fraction: null,
    })
  })

  it('keeps three decimals for dinar', () => {
    expect(convertToCanonical({ integer: '100', fraction: null }, 0.35712, 'KWD')).toEqual({
      integer: '35',
      fraction: '712',
    })
  })

  it('converts zero to zero', () => {
    expect(convertToCanonical({ integer: '0', fraction: null }, 1.1568, 'USD')).toEqual({
      integer: '0',
      fraction: '00',
    })
  })
})
