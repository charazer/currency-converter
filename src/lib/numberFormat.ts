/**
 * Locale-aware number presentation. Separator placement always comes from `Intl`, never from
 * hand-maintained tables, so Indian lakh grouping and non-Latin numbering systems work for free.
 */

export interface NumberSymbols {
  locale: string
  numberingSystem: string
  group: string
  decimal: string
  /** The locale's digits 0-9, in order. Identical to ASCII for the `latn` numbering system. */
  digits: readonly string[]
  digitSet: ReadonlySet<string>
  /** Maps every locale digit back to its ASCII counterpart. */
  toAscii: ReadonlyMap<string, string>
}

const symbolsCache = new Map<string, NumberSymbols>()
const integerFormatters = new Map<string, Intl.NumberFormat>()

export function getNumberSymbols(locale: string): NumberSymbols {
  const cached = symbolsCache.get(locale)
  if (cached !== undefined) return cached

  const formatter = new Intl.NumberFormat(locale)
  const parts = formatter.formatToParts(12345.6)
  const plain = new Intl.NumberFormat(locale, { useGrouping: false })
  const digits = Array.from({ length: 10 }, (_, digit) => plain.format(digit))

  const symbols: NumberSymbols = {
    locale,
    numberingSystem: formatter.resolvedOptions().numberingSystem,
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
    digits,
    digitSet: new Set(digits),
    toAscii: new Map(digits.map((digit, index) => [digit, String(index)])),
  }

  symbolsCache.set(locale, symbols)
  return symbols
}

function getIntegerFormatter(locale: string): Intl.NumberFormat {
  let formatter = integerFormatters.get(locale)
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 })
    integerFormatters.set(locale, formatter)
  }
  return formatter
}

/**
 * Groups a run of ASCII digits without dropping leading zeros, which `Intl` would normalise away.
 * A same-length reference number supplies the separator positions, then the real digits are
 * substituted back in.
 */
export function groupDigits(ascii: string, symbols: NumberSymbols): string {
  if (ascii === '') return ''

  const reference = ascii.startsWith('0') ? `1${ascii.slice(1)}` : ascii
  const formatted = getIntegerFormatter(symbols.locale).format(BigInt(reference))

  let index = 0
  let out = ''
  for (const char of formatted) {
    if (symbols.digitSet.has(char)) {
      out += symbols.digits[Number(ascii[index])] ?? char
      index += 1
    } else {
      out += char
    }
  }
  return out
}

export function toLocaleDigits(ascii: string, symbols: NumberSymbols): string {
  let out = ''
  for (const char of ascii) out += symbols.digits[Number(char)] ?? char
  return out
}

/** ISO minor units for a currency, e.g. 2 for USD, 0 for JPY, 3 for KWD. */
export function getCurrencyFractionDigits(currency: string, locale = 'en-US'): number {
  try {
    const resolved = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).resolvedOptions()
    return resolved.maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

/** Rates need more precision than money: enough decimals to keep four significant digits. */
export function formatRate(rate: number, locale: string): string {
  const magnitude = rate > 0 ? Math.floor(Math.log10(rate)) : 0
  const decimals = Math.min(6, Math.max(4, 4 - magnitude))
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate)
}

export function formatDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}
