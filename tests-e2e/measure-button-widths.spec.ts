import { test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Visits /demo/measure-button-widths, extracts measured min card width, writes to scripts/measured-min-width.json.
 * Run with dev server: npm run dev, then npx playwright test tests-e2e/measure-button-widths.spec.ts
 */
test('capture measured min card width for UserListLayout', async ({ page }) => {
  test.setTimeout(90_000)

  const response = await page.goto('/demo/measure-button-widths', { waitUntil: 'domcontentloaded', timeout: 45_000 })

  // Skip if page doesn't exist
  if (response && (response.status() === 404 || response.status() >= 500)) {
    test.skip(true, `Demo page returned HTTP ${response.status()}`)
    return
  }

  // Wait for the page to settle
  await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {})
  await page.waitForTimeout(3000)

  const el = page.locator('[data-measurement-result]')
  const attached = await el.isVisible({ timeout: 20_000 }).catch(() => false)

  if (!attached) {
    test.skip(true, '[data-measurement-result] element not found — demo page may not render measurements')
    return
  }

  const value = await el.getAttribute('data-measurement-result')
  const minCardWidth = value ? parseInt(value, 10) : 0
  if (!Number.isFinite(minCardWidth) || minCardWidth <= 0) {
    test.skip(true, `Invalid measured min card width: ${value}`)
    return
  }
  const outPath = path.join(process.cwd(), 'scripts', 'measured-min-width.json')
  const dir = path.dirname(outPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(outPath, JSON.stringify({ minCardWidth }, null, 2), 'utf-8')
})
