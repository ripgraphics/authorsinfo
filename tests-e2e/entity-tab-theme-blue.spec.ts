import { test, expect } from '@playwright/test'

/**
 * Verifies entity tab hover uses application theme blue #40A3D8.
 * Run with: npx playwright test tests-e2e/entity-tab-theme-blue.spec.ts
 * (Dev server must be running on port 3034 or use webServer in playwright.config)
 */

const THEME_BLUE_HEX = '#40A3D8'
const THEME_BLUE_RGB = 'rgb(64, 163, 216)'

test.describe('Entity tab theme blue (#40A3D8) hover', () => {
  test('entity tab hover background is theme blue #40A3D8', async ({ page }) => {
    await page.goto('/profile/paul.parker', { waitUntil: 'domcontentloaded', timeout: 60_000 })

    const tab = page.getByRole('tab', { name: 'Shelves' })
    await expect(tab).toBeVisible()

    await tab.hover()

    const bgColor = await tab.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    const isThemeBlue = await tab.evaluate((el, expectedRgb) => {
      const c = window.getComputedStyle(el).backgroundColor
      const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!match) return c === expectedRgb || c === '#40a3d8'
      const [, r, g, b] = match.map(Number)
      return r === 64 && g === 163 && b === 216
    }, THEME_BLUE_RGB)

    expect(
      isThemeBlue,
      `Expected entity tab hover background to be theme blue ${THEME_BLUE_HEX}, got: ${bgColor}`
    ).toBe(true)
  })
})
