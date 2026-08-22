import { describe, expect, it } from 'vitest'

import { daysAgo, today, toIsoDate } from './dates'

const NOW = new Date('2026-08-22T09:30:00Z')

describe('dates', () => {
  it('formats as ISO', () => {
    expect(toIsoDate(NOW)).toBe('2026-08-22')
  })

  it('returns today', () => {
    expect(today(NOW)).toBe('2026-08-22')
  })

  it('subtracts days', () => {
    expect(daysAgo(30, NOW)).toBe('2026-07-23')
    expect(daysAgo(90, NOW)).toBe('2026-05-24')
    expect(daysAgo(365, NOW)).toBe('2025-08-22')
  })

  it('crosses a month boundary', () => {
    expect(daysAgo(1, new Date('2026-03-01T00:00:00Z'))).toBe('2026-02-28')
  })

  it('does not mutate its argument', () => {
    const input = new Date(NOW)
    daysAgo(30, input)
    expect(input.toISOString()).toBe(NOW.toISOString())
  })
})
