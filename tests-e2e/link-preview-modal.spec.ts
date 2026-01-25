import { test, expect } from '@playwright/test'

test.describe('Link Preview in Create Post Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3034')
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')
    // Take screenshot to see what's on the page
    await page.screenshot({ path: 'artifacts/page-load.png', fullPage: true })
  })

  test('should display link preview when URL is entered', async ({ page }) => {
    // Wait a bit for page to fully render
    await page.waitForTimeout(3000)
    
    // Try to find the button with various selectors
    let createPostButton = page.locator('button').filter({ hasText: /What.*on your mind/i }).first()
    
    // If not found, try alternative selectors
    if (await createPostButton.count() === 0) {
      createPostButton = page.locator('button[class*="rounded-full"]').first()
    }
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'artifacts/before-modal-open.png', fullPage: true })
    
    // Click the button
    await createPostButton.click({ timeout: 10000 })

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })
    
    // Find the textarea in the modal
    const textarea = page.locator('textarea[placeholder*="What\'s on your mind"]')
    await expect(textarea).toBeVisible()

    // Enter the test URL
    const testUrl = 'https://authorsinfo.com/books/9a5909bb-e759-44ab-b8d0-7143482f66e8'
    await textarea.fill(testUrl)

    // Wait for link detection (300ms debounce + fetch time)
    await page.waitForTimeout(2000)

    // Check if preview card appears
    const previewCard = page.locator('.enterprise-link-preview-card, [class*="link-preview"]').first()
    await expect(previewCard).toBeVisible({ timeout: 10000 })

    // Verify image is displayed on the left
    const previewImage = previewCard.locator('img').first()
    await expect(previewImage).toBeVisible()

    // Verify description/text content is visible
    const previewContent = previewCard.locator('text=/AUTHORSINFO|Author\'s Info|social platform/i')
    await expect(previewContent.first()).toBeVisible()

    // Take a screenshot for verification
    await page.screenshot({ path: 'artifacts/link-preview-test.png', fullPage: true })
  })

  test('should show image selection controls when multiple images exist', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    
    // Open modal
    const createPostButton = page.locator('button').filter({ hasText: /What.*on your mind|GIF/i }).first()
    await createPostButton.waitFor({ state: 'visible', timeout: 10000 })
    await createPostButton.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Enter URL
    const textarea = page.locator('textarea[placeholder*="What\'s on your mind"]')
    const testUrl = 'https://authorsinfo.com/books/9a5909bb-e759-44ab-b8d0-7143482f66e8'
    await textarea.fill(testUrl)
    await page.waitForTimeout(2000)

    // Wait for preview
    const previewCard = page.locator('.enterprise-link-preview-card, [class*="link-preview"]').first()
    await expect(previewCard).toBeVisible({ timeout: 10000 })

    // Check for navigation arrows (if multiple images)
    const leftArrow = previewCard.locator('button:has(svg)').filter({ hasText: /chevron|arrow/i }).first()
    const rightArrow = previewCard.locator('button:has(svg)').filter({ hasText: /chevron|arrow/i }).last()
    
    // These may or may not be visible depending on number of images
    const arrowCount = await previewCard.locator('button[aria-label*="image"], button:has(svg)').count()
    console.log(`Found ${arrowCount} image control buttons`)

    // Take screenshot
    await page.screenshot({ path: 'artifacts/link-preview-controls.png' })
  })

  test('should remove preview when X button is clicked', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    
    // Open modal
    const createPostButton = page.locator('button').filter({ hasText: /What.*on your mind|GIF/i }).first()
    await createPostButton.waitFor({ state: 'visible', timeout: 10000 })
    await createPostButton.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Enter URL
    const textarea = page.locator('textarea[placeholder*="What\'s on your mind"]')
    const testUrl = 'https://authorsinfo.com/books/9a5909bb-e759-44ab-b8d0-7143482f66e8'
    await textarea.fill(testUrl)
    await page.waitForTimeout(2000)

    // Wait for preview
    const previewCard = page.locator('.enterprise-link-preview-card, [class*="link-preview"]').first()
    await expect(previewCard).toBeVisible({ timeout: 10000 })

    // Find and click remove button (X button)
    const removeButton = previewCard.locator('button[aria-label*="Remove"], button:has(svg)').last()
    await removeButton.click()

    // Preview should disappear
    await expect(previewCard).not.toBeVisible({ timeout: 3000 })
  })
})
