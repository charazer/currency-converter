import type { Page } from '@playwright/test'

const CURRENCIES = [
  { iso_code: 'EUR', iso_numeric: '978', name: 'Euro', symbol: '€' },
  { iso_code: 'JPY', iso_numeric: '392', name: 'Japanese Yen', symbol: '¥' },
  { iso_code: 'USD', iso_numeric: '840', name: 'United States Dollar', symbol: '$' },
]

const EUR_RATES: Record<string, number> = { EUR: 1, JPY: 170.31, USD: 1.1568 }

/** Keeps the suite deterministic and independent of the live service. */
export async function mockApi(page: Page): Promise<void> {
  await page.route('https://api.frankfurter.dev/v2/**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/currencies')) {
      await route.fulfill({ json: CURRENCIES })
      return
    }

    const base = url.searchParams.get('base') ?? 'EUR'
    const anchor = EUR_RATES[base] ?? 1

    const from = url.searchParams.get('from')
    if (from !== null) {
      const quote = url.searchParams.get('quotes') ?? 'USD'
      const start = (EUR_RATES[quote] ?? 1) / anchor
      await route.fulfill({
        json: Array.from({ length: 12 }, (_, index) => ({
          date: `2026-08-${String(index + 10).padStart(2, '0')}`,
          base,
          quote,
          rate: start * (1 + index * 0.001),
        })),
      })
      return
    }

    await route.fulfill({
      json: Object.entries(EUR_RATES).map(([quote, rate]) => ({
        date: '2026-08-21',
        base,
        quote,
        rate: rate / anchor,
      })),
    })
  })
}

/**
 * Without this the pair is guessed from the browser locale. Seeded only when absent, so tests can
 * still observe what the app itself persisted across a reload.
 */
export async function seedPair(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (window.localStorage.getItem('cc:pair') === null) {
      window.localStorage.setItem('cc:pair', JSON.stringify({ base: 'EUR', quote: 'USD' }))
    }
  })
}
