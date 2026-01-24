import { test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Visits /demo/measure-button-widths, extracts measured min card width, writes to scripts/measured-min-width.json.
 * Run with dev server: npm run dev, then npx playwright test tests-e2e/measure-button-widths.spec.ts
 */
test('capture measured min card width for UserListLayout', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/demo/measure-button-widths', { waitUntil: 'networkidle', timeout: 30_000 })
  const el = page.locator('[data-measurement-result]')
  await el.waitFor({ state: 'attached', timeout: 15_000 })
  const value = await el.getAttribute('data-measurement-result')
  const minCardWidth = value ? parseInt(value, 10) : 0
  if (!Number.isFinite(minCardWidth) || minCardWidth <= 0) {
    throw new Error(`Invalid measured min card width: ${value}`)
  }
  const outPath = path.join(process.cwd(), 'scripts', 'measured-min-width.json')
  const dir = path.dirname(outPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(outPath, JSON.stringify({ minCardWidth }, null, 2), 'utf-8')
})
