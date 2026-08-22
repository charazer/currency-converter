import type { z } from 'zod'

import { ApiError, apiErrorForStatus } from './errors'
import {
  CURRENCY_CODE_PATTERN,
  ISO_DATE_PATTERN,
  apiCurrencyListSchema,
  apiRateListSchema,
} from './schemas'
import type { Currency, HistoryPoint, RateTable } from './types'

export const API_BASE = 'https://api.frankfurter.dev/v2'

/** Codes reach path segments, so they are validated before they are ever interpolated. */
function assertCurrencyCode(code: string): void {
  if (!CURRENCY_CODE_PATTERN.test(code)) throw new ApiError('invalid-request')
}

function assertIsoDate(date: string): void {
  if (!ISO_DATE_PATTERN.test(date)) throw new ApiError('invalid-request')
}

async function requestJson<S extends z.ZodType>(
  path: string,
  params: Record<string, string>,
  schema: S,
  signal?: AbortSignal,
): Promise<z.infer<S>> {
  const url = new URL(`${API_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  let response: Response
  try {
    response = await fetch(url, {
      signal: signal ?? null,
      headers: { accept: 'application/json' },
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('network', undefined, { cause })
  }

  if (!response.ok) throw apiErrorForStatus(response.status)

  let body: unknown
  try {
    body = await response.json()
  } catch (cause) {
    throw new ApiError('malformed', response.status, { cause })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new ApiError('malformed', response.status, { cause: parsed.error })
  return parsed.data
}

export async function fetchCurrencies(signal?: AbortSignal): Promise<Currency[]> {
  const rows = await requestJson('/currencies', {}, apiCurrencyListSchema, signal)
  return rows
    .filter((row) => CURRENCY_CODE_PATTERN.test(row.iso_code))
    .map((row) => ({
      code: row.iso_code,
      name: row.name,
      symbol: row.symbol,
      startDate: row.start_date,
      endDate: row.end_date,
    }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

/**
 * One request covers every target currency for a base, so changing or swapping the
 * target is instant and costs nothing.
 */
export async function fetchRateTable(base: string, signal?: AbortSignal): Promise<RateTable> {
  assertCurrencyCode(base)
  const rows = await requestJson('/rates', { base }, apiRateListSchema, signal)

  const first = rows[0]
  if (first === undefined) throw new ApiError('not-found')

  const rates: Record<string, number> = {}
  for (const row of rows) rates[row.quote] = row.rate

  return { base, date: first.date, rates }
}

export async function fetchHistory(
  base: string,
  quote: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<HistoryPoint[]> {
  assertCurrencyCode(base)
  assertCurrencyCode(quote)
  assertIsoDate(from)
  assertIsoDate(to)

  const rows = await requestJson(
    '/rates',
    { base, quotes: quote, from, to },
    apiRateListSchema,
    signal,
  )

  return rows
    .filter((row) => row.quote === quote)
    .map((row) => ({ date: row.date, rate: row.rate }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
