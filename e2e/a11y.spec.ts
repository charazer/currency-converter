import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { mockApi, seedPair } from './fixtures'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function analyse(page: Page) {
  return new AxeBuilder({ page }).withTags(TAGS).analyze()
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await seedPair(page)
})

test('has no accessibility violations once loaded', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const { violations } = await analyse(page)
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
})

test('has no violations with the currency listbox open', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  await page.locator('#currency-from').click()
  await expect(page.locator('#currency-from-listbox')).toBeVisible()

  const { violations } = await analyse(page)
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
})

test('has no violations in dark theme', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  await page.getByRole('button', { name: 'Dark theme' }).click()

  const { violations } = await analyse(page)
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
})

test('has no violations while showing an error', async ({ page }) => {
  await page.route('https://api.frankfurter.dev/v2/rates**', (route) =>
    route.fulfill({ status: 503, json: { message: 'nope' } }),
  )
  await page.goto('/currency-converter/')
  await expect(page.getByText('temporarily unavailable')).toBeVisible()

  const { violations } = await analyse(page)
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
})

test('is fully operable from the keyboard', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const order: string[] = []
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab')
    order.push(
      await page.evaluate(
        () => document.activeElement?.id || document.activeElement?.tagName || '',
      ),
    )
  }

  expect(order).toContain('amount-from')
  expect(order).toContain('currency-from')
  expect(order).toContain('amount-to')
  expect(order).toContain('currency-to')
})

test('keeps a visible focus indicator on every control', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  const ids = ['amount-from', 'currency-from', 'amount-to', 'currency-to']
  for (const id of ids) {
    await page.locator(`#${id}`).focus()
    const outline = await page.locator(`#${id}`).evaluate((el) => {
      const style = getComputedStyle(el)
      return { width: style.outlineWidth, style: style.outlineStyle }
    })
    expect(outline.style, `${id} has no focus outline`).not.toBe('none')
    expect(parseFloat(outline.width), `${id} focus outline is invisible`).toBeGreaterThan(0)
  }
})
