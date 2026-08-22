import Decimal from 'decimal.js-light'

import { getCurrencyFractionDigits } from './numberFormat'
import { canonicalToNumeric, type CanonicalAmount } from './numberParse'

Decimal.config({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export function toDecimal(value: CanonicalAmount | string | number): Decimal {
  if (typeof value === 'object') return new Decimal(canonicalToNumeric(value))
  return new Decimal(value)
}

export function convert(amount: CanonicalAmount | string | number, rate: number): Decimal {
  return toDecimal(amount).times(rate)
}

/** Money is rounded half-up, matching what people expect from a till rather than banker's rounding. */
export function roundToCurrency(value: Decimal, currency: string): Decimal {
  return value.toDecimalPlaces(getCurrencyFractionDigits(currency), Decimal.ROUND_HALF_UP)
}

/** Splits a decimal into the digit strings the formatter consumes, avoiding a float round trip. */
export function decimalToCanonical(value: Decimal, fractionDigits: number): CanonicalAmount {
  const fixed = value.toFixed(fractionDigits, Decimal.ROUND_HALF_UP)
  const [integer = '0', fraction] = fixed.split('.')
  return { integer, fraction: fractionDigits === 0 ? null : (fraction ?? '') }
}

export function convertToCanonical(
  amount: CanonicalAmount | string | number,
  rate: number,
  targetCurrency: string,
): CanonicalAmount {
  const digits = getCurrencyFractionDigits(targetCurrency)
  return decimalToCanonical(convert(amount, rate), digits)
}
