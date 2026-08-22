import { expect, test } from '@playwright/test'

import { mockApi, seedPair } from './fixtures'

declare global {
  interface Window {
    reportCsp: (violation: string) => void
  }
}

/**
 * A blocked `eval` or inline script is caught and swallowed by the library that attempted it, so
 * nothing visibly breaks — it only shows up as console noise and a weaker security posture.
 */
test('triggers no content security policy violations', async ({ page }) => {
  const violations: string[] = []
  await page.exposeFunction('reportCsp', (violation: string) => {
    violations.push(violation)
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      window.reportCsp(`${event.violatedDirective} blocked ${event.blockedURI}`)
    })
  })

  await mockApi(page)
  await seedPair(page)
  await page.goto('/currency-converter/')
  await expect(page.locator('#amount-to')).toHaveValue('1.16')

  // Exercise the paths that pull in more of the app.
  await page.locator('#currency-to').click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Swap currencies' }).click()
  await page.getByRole('button', { name: /1Y/ }).click()
  await page.waitForTimeout(500)

  expect(violations).toEqual([])
})
