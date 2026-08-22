import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/test/setup'

import { ApiError } from './errors'
import { API_BASE, fetchCurrencies, fetchHistory, fetchRateTable } from './frankfurter'

describe('fetchCurrencies', () => {
  it('maps the API payload to the domain model, sorted by code', async () => {
    const currencies = await fetchCurrencies()

    expect(currencies.map((c) => c.code)).toEqual(['EUR', 'JPY', 'USD'])
    expect(currencies[0]).toEqual({
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      startDate: '1999-01-04',
      endDate: '2026-08-21',
    })
  })

  it('defaults absent optional fields to null rather than undefined', async () => {
    server.use(
      http.get(`${API_BASE}/currencies`, () =>
        HttpResponse.json([{ iso_code: 'XAU', name: 'Gold' }]),
      ),
    )

    expect(await fetchCurrencies()).toEqual([
      { code: 'XAU', name: 'Gold', symbol: null, startDate: null, endDate: null },
    ])
  })

  it('drops rows whose code is not a three-letter ISO code', async () => {
    server.use(
      http.get(`${API_BASE}/currencies`, () =>
        HttpResponse.json([
          { iso_code: 'EUR', name: 'Euro' },
          { iso_code: 'not a code', name: 'Junk' },
        ]),
      ),
    )

    expect((await fetchCurrencies()).map((c) => c.code)).toEqual(['EUR'])
  })
})

describe('fetchRateTable', () => {
  it('collapses the row array into a quote-keyed table', async () => {
    const table = await fetchRateTable('EUR')

    expect(table).toEqual({
      base: 'EUR',
      date: '2026-08-21',
      rates: { EUR: 1, JPY: 170.31, USD: 1.1568 },
    })
  })

  it('sends the base as a query parameter', async () => {
    let seen: string | null = null
    server.use(
      http.get(`${API_BASE}/rates`, ({ request }) => {
        seen = new URL(request.url).searchParams.get('base')
        return HttpResponse.json([{ date: '2026-08-21', base: 'USD', quote: 'USD', rate: 1 }])
      }),
    )

    await fetchRateTable('USD')
    expect(seen).toBe('USD')
  })

  it('rejects a malformed currency code before issuing a request', async () => {
    server.use(
      http.get(`${API_BASE}/rates`, () => {
        throw new Error('request should not have been made')
      }),
    )

    await expect(fetchRateTable('../secrets')).rejects.toMatchObject({ kind: 'invalid-request' })
  })

  it('treats an empty result as not found', async () => {
    server.use(http.get(`${API_BASE}/rates`, () => HttpResponse.json([])))
    await expect(fetchRateTable('EUR')).rejects.toMatchObject({ kind: 'not-found' })
  })
})

describe('fetchHistory', () => {
  it('returns points for the requested quote in date order', async () => {
    const points = await fetchHistory('EUR', 'USD', '2026-08-19', '2026-08-21')

    expect(points).toEqual([
      { date: '2026-08-19', rate: 1.1502 },
      { date: '2026-08-20', rate: 1.1533 },
      { date: '2026-08-21', rate: 1.1568 },
    ])
  })

  it('rejects a malformed date', async () => {
    await expect(fetchHistory('EUR', 'USD', '19-08-2026', '2026-08-21')).rejects.toMatchObject({
      kind: 'invalid-request',
    })
  })
})

describe('error mapping', () => {
  it.each([
    [404, 'not-found', false],
    [422, 'invalid-request', false],
    [503, 'unavailable', true],
    [500, 'unavailable', true],
  ])('maps HTTP %i to %s', async (status, kind, retryable) => {
    server.use(http.get(`${API_BASE}/currencies`, () => new HttpResponse(null, { status })))

    const error = await fetchCurrencies().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind, status, retryable })
  })

  it('reports an unreachable service as a retryable network error', async () => {
    server.use(http.get(`${API_BASE}/currencies`, () => HttpResponse.error()))

    await expect(fetchCurrencies()).rejects.toMatchObject({ kind: 'network', retryable: true })
  })

  it('rejects a response whose shape does not match the schema', async () => {
    server.use(
      http.get(`${API_BASE}/rates`, () =>
        HttpResponse.json([{ date: '2026-08-21', base: 'EUR', quote: 'USD', rate: 'free' }]),
      ),
    )

    await expect(fetchRateTable('EUR')).rejects.toMatchObject({ kind: 'malformed' })
  })

  it('rejects a non-positive rate', async () => {
    server.use(
      http.get(`${API_BASE}/rates`, () =>
        HttpResponse.json([{ date: '2026-08-21', base: 'EUR', quote: 'USD', rate: 0 }]),
      ),
    )

    await expect(fetchRateTable('EUR')).rejects.toMatchObject({ kind: 'malformed' })
  })

  it('propagates an abort instead of disguising it as a network failure', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(fetchCurrencies(controller.signal)).rejects.not.toBeInstanceOf(ApiError)
  })
})
