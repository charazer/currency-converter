import { expect, test, type Page } from '@playwright/test'

const CURRENCIES = [
  { iso_code: 'EUR', iso_numeric: '978', name: 'Euro', symbol: '€' },
  { iso_code: 'JPY', iso_numeric: '392', name: 'Japanese Yen', symbol: '¥' },
  { iso_code: 'USD', iso_numeric: '840', name: 'United States Dollar', symbol: '$' },
]

const EUR_RATES: Record<string, number> = { EUR: 1, JPY: 170.31, USD: 1.1568 }

/** Keeps the suite deterministic and independent of the live service. */
async function mockApi(page: Page): Promise<void> {
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

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  // Without this the pair is guessed from the browser locale. Seeded only when absent, so the
  // reload test can still observe what the app itself persisted.
  await page.addInitScript(() => {
    if (window.localStorage.getItem('cc:pair') === null) {
      window.localStorage.setItem('cc:pair', JSON.stringify({ base: 'EUR', quote: 'USD' }))
    }
  })
})

test('converts between currencies on load', async ({ page }) => {
  await page.goto('/currency-converter/')

  await expect(page.getByRole('heading', { name: 'Currency Converter' })).toBeVisible()
  await expect(page.locator('#amount-from')).toHaveValue('1.00')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')
  await expect(page.getByText('1 EUR = 1.1568 USD')).toBeVisible()
})

test('groups digits as the user types', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const from = page.locator('#amount-from')
  await from.fill('')
  await from.pressSequentially('1234567')

  await expect(from).toHaveValue('1,234,567')
  await expect(page.locator('#amount-to')).toHaveValue('1,428,147.11')
})

test('converts backwards when the target field is edited', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const to = page.locator('#amount-to')
  await to.fill('')
  await to.pressSequentially('1156800')

  await expect(page.locator('#amount-from')).toHaveValue('1,000,000.00')
})

test('refuses characters that are not part of a number', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const from = page.locator('#amount-from')
  await from.fill('')
  await from.pressSequentially('12abc3')

  await expect(from).toHaveValue('123')
})

test('swaps the pair and keeps the equation intact', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  await page.getByRole('button', { name: 'Swap currencies' }).click()

  await expect(page.getByText('1 USD =')).toBeVisible()
  await expect(page.locator('#amount-from')).toHaveValue('1.16')
})

test('selects a currency with the keyboard', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  await page.locator('#currency-to').click()
  await page.locator('#currency-to').fill('yen')
  await page.keyboard.press('Enter')

  await expect(page.getByText('1 EUR = 170.3100 JPY')).toBeVisible()
  // Yen has no minor units, so the amount must lose its decimals.
  await expect(page.locator('#amount-to')).toHaveValue('170')
})

test('restores the last pair after a reload', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  await page.getByRole('button', { name: 'Swap currencies' }).click()
  await expect(page.getByText('1 USD =')).toBeVisible()

  await page.reload()
  await expect(page.getByText('1 USD =')).toBeVisible()
})

test('reports a failure and recovers on retry', async ({ page }) => {
  await page.route('https://api.frankfurter.dev/v2/rates**', (route) =>
    route.fulfill({ status: 503, json: { message: 'nope' } }),
  )

  await page.goto('/currency-converter/')
  await expect(page.getByText('temporarily unavailable')).toBeVisible()

  await mockApi(page)
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByText('1 EUR = 1.1568 USD')).toBeVisible()
})

test('plots the rate history and switches range', async ({ page }) => {
  await page.goto('/currency-converter/')

  const plot = page.locator('svg.plot')
  await expect(plot).toBeVisible()
  await expect(plot).toHaveAttribute('aria-label', /EUR to USD/)

  await page.getByRole('button', { name: /Last year/ }).click()
  await expect(page.getByRole('button', { name: /Last year/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(plot).toBeVisible()
})

test('does not shift the layout while history loads', async ({ page }) => {
  let holdHistory = true
  // Stall the 1Y request so the loading state is observable rather than a race.
  await page.route('https://api.frankfurter.dev/v2/rates?*from=*', async (route) => {
    while (holdHistory) await new Promise((resolve) => setTimeout(resolve, 50))
    await route.fallback()
  })

  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const chart = page.locator('section[aria-label="Rate history"]')
  const card = page.locator('section[aria-label="Currency converter"]')

  // Measured while the very first history request is still in flight.
  const loadingChart = await chart.boundingBox()
  const loadingCard = await card.boundingBox()

  holdHistory = false
  await expect(page.locator('svg.plot')).toBeVisible()

  expect((await chart.boundingBox())?.height).toBe(loadingChart?.height)
  expect((await card.boundingBox())?.y).toBe(loadingCard?.y)

  // Switching range must not blank the chart, so nothing can move.
  holdHistory = true
  await page.getByRole('button', { name: /Last year/ }).click()
  await expect(page.locator('svg.plot')).toBeVisible()
  expect((await chart.boundingBox())?.height).toBe(loadingChart?.height)
  expect((await card.boundingBox())?.y).toBe(loadingCard?.y)
  holdHistory = false
})

test('saves and reloads a favourite pair', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  await page.getByRole('button', { name: /Save EUR to USD/ }).click()
  await expect(page.getByRole('button', { name: 'EUR → USD' })).toBeVisible()

  await page.getByRole('button', { name: 'Swap currencies' }).click()
  await expect(page.getByText('1 USD =')).toBeVisible()

  await page.getByRole('button', { name: 'EUR → USD' }).click()
  await expect(page.getByText('1 EUR = 1.1568 USD')).toBeVisible()
})

test('keeps favourites across a reload', async ({ page }) => {
  await page.goto('/currency-converter/')
  await page.getByRole('button', { name: /Save EUR to USD/ }).click()
  await expect(page.getByRole('button', { name: 'EUR → USD' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'EUR → USD' })).toBeVisible()
})

test('switches theme and remembers it', async ({ page }) => {
  await page.goto('/currency-converter/')

  await page.getByRole('button', { name: 'Dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Match system theme' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/)
})
