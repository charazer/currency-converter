/**
 * Picking a sensible starting currency from the user's locale. `Intl` exposes no locale-to-currency
 * mapping, so a small region table is unavoidable; it only has to be good enough for a first guess.
 */
const REGION_CURRENCY: Readonly<Record<string, string>> = {
  AT: 'EUR',
  BE: 'EUR',
  CY: 'EUR',
  DE: 'EUR',
  EE: 'EUR',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  GR: 'EUR',
  HR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  LV: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
  AU: 'AUD',
  BG: 'BGN',
  BR: 'BRL',
  CA: 'CAD',
  CH: 'CHF',
  CN: 'CNY',
  CZ: 'CZK',
  DK: 'DKK',
  GB: 'GBP',
  HK: 'HKD',
  HU: 'HUF',
  ID: 'IDR',
  IL: 'ILS',
  IN: 'INR',
  IS: 'ISK',
  JP: 'JPY',
  KR: 'KRW',
  MX: 'MXN',
  MY: 'MYR',
  NO: 'NOK',
  NZ: 'NZD',
  PH: 'PHP',
  PL: 'PLN',
  RO: 'RON',
  SE: 'SEK',
  SG: 'SGD',
  TH: 'THB',
  TR: 'TRY',
  US: 'USD',
  ZA: 'ZAR',
}

const FALLBACK_CURRENCY = 'USD'

export function currencyForLocale(locale: string): string {
  try {
    const region = new Intl.Locale(locale).maximize().region
    if (region === undefined) return FALLBACK_CURRENCY
    return REGION_CURRENCY[region] ?? FALLBACK_CURRENCY
  } catch {
    return FALLBACK_CURRENCY
  }
}

export function defaultPair(locale: string): { base: string; quote: string } {
  const base = currencyForLocale(locale)
  return { base, quote: base === 'USD' ? 'EUR' : 'USD' }
}
