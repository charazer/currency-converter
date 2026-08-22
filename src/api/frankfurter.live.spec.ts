import { beforeAll, describe, expect, it } from 'vitest'

import { server } from '@/test/setup'

import { fetchCurrencies, fetchHistory, fetchRateTable } from './frankfurter'

/**
 * Opt-in (`TEST_LIVE=1 pnpm test:unit`) so CI stays hermetic. Run it when the API
 * may have drifted — a failure here means the Zod schemas need updating.
 */
describe.skipIf(process.env.TEST_LIVE !== '1')('frankfurter API contract (live)', () => {
  beforeAll(() => {
    server.close()
  })

  it('still serves currencies in the expected shape', async () => {
    const currencies = await fetchCurrencies()

    expect(currencies.length).toBeGreaterThan(100)
    expect(currencies.some((c) => c.code === 'EUR')).toBe(true)
  })

  it('still serves a full rate table for a base', async () => {
    const table = await fetchRateTable('EUR')

    expect(table.rates['USD']).toBeGreaterThan(0)
    expect(table.rates['EUR']).toBe(1)
  })

  it('still serves a date range', async () => {
    const points = await fetchHistory('EUR', 'USD', '2025-01-01', '2025-01-31')

    expect(points.length).toBeGreaterThan(15)
    expect(points[0]?.rate).toBeGreaterThan(0)
  })
})
