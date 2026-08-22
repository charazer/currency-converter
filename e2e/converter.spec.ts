import { expect, test } from '@playwright/test'

import { mockApi, seedPair } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await seedPair(page)
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

test('shows the last known rates when the service is unreachable', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.getByText('1 EUR = 1.1568 USD')).toBeVisible()

  // Simulate being offline: every API call now fails.
  await page.route('https://api.frankfurter.dev/v2/**', (route) => route.abort('failed'))
  await page.reload()

  await expect(page.getByText('1 EUR = 1.1568 USD')).toBeVisible()
  await expect(page.locator('#amount-to')).toHaveValue('1.16')
})

test('does not overflow horizontally at 200% zoom', async ({ page }) => {
  // 320 CSS px is roughly a 640px window at 200% zoom.
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth)
})
