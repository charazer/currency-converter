import { http, HttpResponse } from 'msw'

import { API_BASE } from '@/api/frankfurter'

const currenciesFixture = [
  {
    iso_code: 'EUR',
    iso_numeric: '978',
    name: 'Euro',
    symbol: '€',
    start_date: '1999-01-04',
    end_date: '2026-08-21',
  },
  {
    iso_code: 'JPY',
    iso_numeric: '392',
    name: 'Japanese Yen',
    symbol: '¥',
    start_date: '1999-01-04',
    end_date: '2026-08-21',
  },
  {
    iso_code: 'USD',
    iso_numeric: '840',
    name: 'United States Dollar',
    symbol: '$',
    start_date: '1999-01-04',
    end_date: '2026-08-21',
  },
]

const ratesFixture = [
  { date: '2026-08-21', base: 'EUR', quote: 'EUR', rate: 1.0 },
  { date: '2026-08-21', base: 'EUR', quote: 'JPY', rate: 170.31 },
  { date: '2026-08-21', base: 'EUR', quote: 'USD', rate: 1.1568 },
]

const historyFixture = [
  { date: '2026-08-19', base: 'EUR', quote: 'USD', rate: 1.1502 },
  { date: '2026-08-21', base: 'EUR', quote: 'USD', rate: 1.1568 },
  { date: '2026-08-20', base: 'EUR', quote: 'USD', rate: 1.1533 },
]

/** The API serves any base; the fixture is EUR-based, so cross rates are derived from it. */
function ratesFor(base: string) {
  const anchor = ratesFixture.find((entry) => entry.quote === base)
  if (anchor === undefined) return []
  return ratesFixture.map((entry) => ({
    date: entry.date,
    base,
    quote: entry.quote,
    rate: entry.rate / anchor.rate,
  }))
}

export const handlers = [
  http.get(`${API_BASE}/currencies`, () => HttpResponse.json(currenciesFixture)),
  http.get(`${API_BASE}/rates`, ({ request }) => {
    const params = new URL(request.url).searchParams
    if (params.get('from') !== null) return HttpResponse.json(historyFixture)
    return HttpResponse.json(ratesFor(params.get('base') ?? 'EUR'))
  }),
]
