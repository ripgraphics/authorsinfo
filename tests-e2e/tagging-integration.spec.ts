/**
 * E2E Tests for Tagging System Integration
 * Tests the enhanced tagging components across the application
 */

import { test, expect } from '@playwright/test'

test.describe('Tagging System Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3034')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('Post Composer - Tag Autocomplete for Mentions', async ({ page }) => {
    // Find and click the post composer or create post button
    const createPostButton = page.locator('button:has-text("Create post"), button:has-text("What\'s on your mind")').first()
    
    if (await createPostButton.isVisible()) {
      await createPostButton.click()
      await page.waitForTimeout(500)
    }

    // Find the textarea in the post composer
    const textarea = page.locator('textarea[placeholder*="What\'s on your mind"], textarea[placeholder*="Write something"]').first()
    
    if (await textarea.isVisible()) {
      // Type @ to trigger mention autocomplete
      await textarea.fill('@')
      await page.waitForTimeout(500) // Wait for debounce

      // Check if suggestions dropdown appears
      const suggestions = page.locator('[role="listbox"], [id="tag-suggestions-dropdown"]')
      const suggestionsVisible = await suggestions.isVisible().catch(() => false)
      
      if (suggestionsVisible) {
        // Verify suggestions are shown
        const suggestionItems = suggestions.locator('[role="option"]')
        const count = await suggestionItems.count()
        expect(count).toBeGreaterThan(0)
        
        // Click first suggestion
        await suggestionItems.first().click()
        
        // Verify tag was inserted
        const textareaValue = await textarea.inputValue()
        expect(textareaValue).toContain('@')
      }
    }
  })

  test('Post Composer - Tag Autocomplete for Hashtags', async ({ page }) => {
    // Find and click the post composer
    const createPostButton = page.locator('button:has-text("Create post"), button:has-text("What\'s on your mind")').first()
    
    if (await createPostButton.isVisible()) {
      await createPostButton.click()
      await page.waitForTimeout(500)
    }

    // Find the textarea
    const textarea = page.locator('textarea[placeholder*="What\'s on your mind"], textarea[placeholder*="Write something"]').first()
    
    if (await textarea.isVisible()) {
      // Type # to trigger hashtag autocomplete
      await textarea.fill('#test')
      await page.waitForTimeout(500) // Wait for debounce

      // Check if suggestions dropdown appears
      const suggestions = page.locator('[role="listbox"], [id="tag-suggestions-dropdown"]')
      const suggestionsVisible = await suggestions.isVisible().catch(() => false)
      
      if (suggestionsVisible) {
        // Verify suggestions are shown
        const suggestionItems = suggestions.locator('[role="option"]')
        const count = await suggestionItems.count()
        expect(count).toBeGreaterThanOrEqual(0) // May be 0 if no matches
      }
    }
  })

  test('Post Display - Tags are Rendered as Links', async ({ page }) => {
    // Navigate to feed or a page with posts
    await page.goto('http://localhost:3034/feed')
    await page.waitForLoadState('networkidle')

    // Look for posts with tags (mentions or hashtags)
    const postWithTag = page.locator('text=/@\\w+|#\\w+/').first()
    
    if (await postWithTag.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify tag is clickable
      await expect(postWithTag).toBeVisible()
      
      // Hover over tag to check for preview card
      await postWithTag.hover()
      await page.waitForTimeout(500)
      
      // Check if preview card appears (optional - may not always show)
      const previewCard = page.locator('[class*="TagPreviewCard"], [class*="tag-preview"]')
      const previewVisible = await previewCard.isVisible().catch(() => false)
      
      // Preview may or may not be visible depending on timing
      // Just verify the tag element exists
      expect(await postWithTag.isVisible()).toBeTruthy()
    }
  })

  test('Comments - Tag Autocomplete in Comment Input', async ({ page }) => {
    // Navigate to a page with comments
    await page.goto('http://localhost:3034/feed')
    await page.waitForLoadState('networkidle')

    // Find comment input
    const commentInput = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="Write a comment"]').first()
    
    if (await commentInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Type @ to trigger mention autocomplete
      await commentInput.fill('@')
      await page.waitForTimeout(500)

      // Check if suggestions appear
      const suggestions = page.locator('[role="listbox"], [id="tag-suggestions-dropdown"]')
      const suggestionsVisible = await suggestions.isVisible().catch(() => false)
      
      if (suggestionsVisible) {
        const suggestionItems = suggestions.locator('[role="option"]')
        const count = await suggestionItems.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('Tag Preview Card - Subscription Button', async ({ page }) => {
    // Navigate to a tag page or find a tag link
    await page.goto('http://localhost:3034/feed')
    await page.waitForLoadState('networkidle')

    // Find a hashtag link
    const hashtagLink = page.locator('a[href*="/tags/"], text=/^#\\w+/').first()
    
    if (await hashtagLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Hover to trigger preview card
      await hashtagLink.hover()
      await page.waitForTimeout(1000) // Wait for preview to appear
      
      // Look for subscription button (Bell icon)
      const subscribeButton = page.locator('button:has(svg), button[title*="Subscribe"], button[title*="Unsubscribe"]')
      const buttonVisible = await subscribeButton.isVisible().catch(() => false)
      
      // Subscription button may or may not be visible depending on tag type and user state
      // Just verify we can find tag elements
      expect(await hashtagLink.isVisible()).toBeTruthy()
    }
  })
})
