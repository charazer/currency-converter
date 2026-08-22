import { expect, test } from '@playwright/test'

test('renders the app shell', async ({ page }) => {
  await page.goto('/currency-converter/')
  await expect(page.getByRole('heading', { name: 'Currency Converter' })).toBeVisible()
})
