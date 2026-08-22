/**
 * Parsing and re-formatting of amounts as the user types. The invariant that makes caret handling
 * tractable: parsing never adds or removes digits, it only reinterprets separators. Normalisation
 * that does change digits (leading zeros, fraction padding) is deferred to blur.
 */
import { groupDigits, toLocaleDigits, type NumberSymbols } from './numberFormat'

/** Digits are ASCII here regardless of the display locale. `fraction` is null until a separator is typed. */
export interface CanonicalAmount {
  integer: string
  fraction: string | null
}

export type ParseFailure =
  'invalid-character' | 'multiple-decimals' | 'negative' | 'too-many-digits'

export type ParseResult = { ok: true; value: CanonicalAmount } | { ok: false; reason: ParseFailure }

/** Beyond this, IEEE-754 display and most currency inputs stop being meaningful. */
const MAX_DIGITS = 15

/** Separators people actually paste, on top of whatever the locale itself uses. */
const ALWAYS_DECIMAL_CANDIDATES = new Set(['.', ',', '\u066B'])
const IGNORABLE = new Set([' ', '\u00A0', '\u202F', '\u2009', "'", '\u2019', '\u066C'])

interface Separator {
  char: string
  index: number
  digitsBefore: number
}

export function parseAmount(input: string, symbols: NumberSymbols): ParseResult {
  const digits: string[] = []
  const separators: Separator[] = []

  for (const char of input.trim()) {
    if (char === '-' || char === '\u2212') return { ok: false, reason: 'negative' }

    const ascii = symbols.toAscii.get(char) ?? (char >= '0' && char <= '9' ? char : undefined)
    if (ascii !== undefined) {
      digits.push(ascii)
      continue
    }

    if (char === symbols.decimal || ALWAYS_DECIMAL_CANDIDATES.has(char)) {
      separators.push({ char, index: separators.length, digitsBefore: digits.length })
      continue
    }

    if (char === symbols.group || IGNORABLE.has(char)) continue

    return { ok: false, reason: 'invalid-character' }
  }

  if (digits.length > MAX_DIGITS) return { ok: false, reason: 'too-many-digits' }

  const split = resolveDecimalPosition(separators, symbols)
  if (split === 'invalid') return { ok: false, reason: 'multiple-decimals' }

  const all = digits.join('')
  if (split === null) return { ok: true, value: { integer: all, fraction: null } }

  return { ok: true, value: { integer: all.slice(0, split), fraction: all.slice(split) } }
}

/**
 * Decides which separator, if any, is the decimal point. The locale's own group character is never
 * a decimal point, otherwise editing inside an already-grouped value (`1,2934`) would be misread.
 * Foreign separators stay lenient, so a pasted `1.234,56` still resolves in en-US.
 */
function resolveDecimalPosition(
  separators: Separator[],
  symbols: NumberSymbols,
): number | null | 'invalid' {
  if (separators.length === 0) return null

  const distinct = new Set(separators.map((separator) => separator.char))
  if (distinct.size > 2) return 'invalid'

  if (distinct.size === 2) {
    // In every real format the decimal point comes last, so the trailing separator wins.
    const last = separators[separators.length - 1]
    if (last === undefined) return 'invalid'
    const others = separators.slice(0, -1)
    if (others.some((separator) => separator.char === last.char)) return 'invalid'
    return last.digitsBefore
  }

  const only = separators[0]
  if (only === undefined) return null

  if (only.char === symbols.group) return null
  if (separators.length > 1) return 'invalid'

  return only.digitsBefore
}

/** Renders a canonical amount for display, preserving exactly the digits the user typed. */
export function formatCanonical(value: CanonicalAmount, symbols: NumberSymbols): string {
  const integer = groupDigits(value.integer, symbols)
  if (value.fraction === null) return integer
  return `${integer}${symbols.decimal}${toLocaleDigits(value.fraction, symbols)}`
}

/** Blur-time cleanup: drop redundant leading zeros and settle the fraction at a fixed width. */
export function normaliseCanonical(
  value: CanonicalAmount,
  fractionDigits: number,
): CanonicalAmount {
  const stripped = value.integer.replace(/^0+(?=\d)/, '')
  const integer = stripped === '' ? '0' : stripped

  if (fractionDigits === 0) return { integer, fraction: null }

  const fraction = (value.fraction ?? '').slice(0, fractionDigits).padEnd(fractionDigits, '0')
  return { integer, fraction }
}

export function canonicalToNumeric(value: CanonicalAmount): string {
  const integer = value.integer === '' ? '0' : value.integer
  return value.fraction === null || value.fraction === '' ? integer : `${integer}.${value.fraction}`
}

export function isEmpty(value: CanonicalAmount): boolean {
  return value.integer === '' && (value.fraction === null || value.fraction === '')
}

/**
 * Caret mapping. Group separators shift as digits are inserted, so the caret is tracked by how many
 * meaningful characters precede it rather than by raw string offset.
 */
function isMeaningful(char: string, symbols: NumberSymbols): boolean {
  return symbols.digitSet.has(char) || (char >= '0' && char <= '9') || char === symbols.decimal
}

export function countMeaningfulBefore(text: string, caret: number, symbols: NumberSymbols): number {
  let count = 0
  for (let index = 0; index < caret && index < text.length; index += 1) {
    const char = text[index]
    if (char !== undefined && isMeaningful(char, symbols)) count += 1
  }
  return count
}

export function caretAfterMeaningful(text: string, target: number, symbols: NumberSymbols): number {
  if (target <= 0) return 0

  let count = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char !== undefined && isMeaningful(char, symbols)) {
      count += 1
      if (count === target) return index + 1
    }
  }
  return text.length
}
