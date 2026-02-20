import { test, expect } from '@playwright/test'

/**
 * Regression: engagement reaction hover popup in timeline feed cards.
 * Ensures hover over reaction count keeps showing the reactions popup.
 */
test.describe('Engagement hover popup', () => {
  test('hovering reaction count shows popup', async ({ page }) => {
    test.setTimeout(60_000)

    // Public timeline with known data in existing tests
    const bookId = '9a5909bb-e759-44ab-b8d0-7143482f66e8'
    await page.goto(`/books/${bookId}`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const feedCards = page.locator('.enterprise-feed-card')
    const cardCount = await feedCards.count()
    if (cardCount === 0) {
      test.skip(true, 'No feed cards found on timeline')
      return
    }

    // Reaction count only renders when >0 in EngagementDisplay
    const reactionCount = page.locator('.engagement-reaction-count').first()
    if ((await reactionCount.count()) === 0) {
      test.skip(true, 'No reaction counts available on timeline to validate hover popup')
      return
    }

    const reactionsContainer = reactionCount.locator(
      'xpath=ancestor::*[contains(@class, "engagement-reactions")][1]'
    )
    const popup = reactionsContainer.locator('div.absolute.bottom-full')

    await expect(reactionCount).toBeVisible()

    // Hover either the count or container; popup should become visible
    await reactionCount.hover()

    await expect(popup).toBeVisible()
    await expect(popup).toContainText(/Reactions|Like|Love|Care|Haha|Wow|Sad|Angry|Loading/i)

    await page.screenshot({
      path: 'artifacts/engagement-hover-popup-visible.png',
      fullPage: true,
    })
  })
})
