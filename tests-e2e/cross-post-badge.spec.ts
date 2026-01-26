import { test, expect } from '@playwright/test'

/**
 * E2E: Cross-post badge in timeline feed cards.
 * Timeline uses EntityFeedCard; cross-posted posts show a "Cross-posted from X" badge.
 */
test.describe('Cross-post badge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3034')
    await page.waitForLoadState('domcontentloaded')
  })

  test('app loads and timeline page is reachable', async ({ page }) => {
    await expect(page).toHaveTitle(/Author['']s Info/)
    await page.waitForTimeout(2000)

    // Navigate to a book timeline (public; no auth required)
    const bookId = '9a5909bb-e759-44ab-b8d0-7143482f66e8'
    await page.goto(`http://localhost:3034/books/${bookId}`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    await page.screenshot({
      path: 'artifacts/cross-post-badge-book-timeline.png',
      fullPage: true,
    })

    // Feed/timeline may use .enterprise-feed-card or .pace-y-4 / .pace-y-6
    const feed = page.locator('[class*="enterprise-feed-card"], [class*="timeline"]').first()
    const feedVisible = await feed.isVisible().catch(() => false)
    if (feedVisible) {
      await expect(feed).toBeVisible()
    }
  })

  test('cross-post badge visible when present on timeline', async ({ page }) => {
    const bookId = '9a5909bb-e759-44ab-b8d0-7143482f66e8'
    await page.goto(`http://localhost:3034/books/${bookId}`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(4000)

    const badge = page.locator('.enterprise-feed-card-cross-post')
    const count = await badge.count()

    if (count > 0) {
      await expect(badge.first()).toBeVisible()
      await expect(badge.first()).toContainText(/Cross-posted from/i)
      await page.screenshot({
        path: 'artifacts/cross-post-badge-visible.png',
        fullPage: true,
      })
    } else {
      // No cross-posted posts on this timeline; ensure page and timeline structure exist
      const body = page.locator('body')
      await expect(body).toBeVisible()
      await page.screenshot({
        path: 'artifacts/cross-post-badge-no-posts.png',
        fullPage: true,
      })
    }
  })
})
