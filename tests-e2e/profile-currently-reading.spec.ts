import { test, expect } from '@playwright/test'
import {
  computeExpectedVisibleCurrentlyReadingCount,
  getUserByPermalink,
} from './helpers/supabase-facts'

const PROFILE_PERMALINK = 'paul.parker'
const MAX_BOOKS_SHOWN = 3

async function getDisplayedCurrentlyReadingCount(page: any): Promise<number> {
  const heading = page.getByRole('heading', { name: 'Currently Reading' })
  await expect(heading).toBeVisible()

  const sectionCard = heading.locator('xpath=ancestor::div[contains(@class,"content-section__container")][1]')
  const titles = sectionCard.locator('h4')
  return await titles.count()
}

async function expectEmptyMessageVisible(page: any) {
  const heading = page.getByRole('heading', { name: 'Currently Reading' })
  const sectionCard = heading.locator('xpath=ancestor::div[contains(@class,"content-section__container")][1]')
  await expect(sectionCard.getByText('No books currently being read')).toBeVisible()
}

test.describe('Profile Currently Reading visibility', () => {
  test('public and other-user views match Supabase facts', async ({ page }) => {
    let paul = null as any
    try {
      paul = await getUserByPermalink(PROFILE_PERMALINK)
    } catch (e: any) {
      test.skip(true, `Supabase facts query failed (env?): ${e?.message ?? String(e)}`)
    }

    if (!paul?.id) {
      test.skip(true, `User not found in Supabase: permalink=${PROFILE_PERMALINK}`)
    }

    // Public viewer expectation (derived from Supabase facts)
    const expectedPublicCount = await computeExpectedVisibleCurrentlyReadingCount({
      profileOwnerId: paul.id,
      viewerId: null,
    })
    const expectedPublicDisplayed = Math.min(MAX_BOOKS_SHOWN, expectedPublicCount)

    await page.goto(`/profile/${PROFILE_PERMALINK}`)

    if (expectedPublicDisplayed === 0) {
      await expectEmptyMessageVisible(page)
      expect(await getDisplayedCurrentlyReadingCount(page)).toBe(0)
    } else {
      expect(await getDisplayedCurrentlyReadingCount(page)).toBe(expectedPublicDisplayed)
    }

    // Pick an existing non-owner user from /api/auth-users and log in as them.
    // This avoids creating new auth users (which may be blocked by local auth DB constraints).
    const usersRes = await page.request.get('/api/auth-users')
    if (!usersRes.ok()) {
      test.skip(true, `Failed to fetch /api/auth-users (HTTP ${usersRes.status()})`)
    }

    const users = (await usersRes.json()) as Array<{ id: string; email: string; name?: string }>
    const viewer = users.find((u) => u?.id && u.id !== paul.id && u.email && u.email !== 'No email')
    if (!viewer) {
      test.skip(true, 'No suitable non-owner user found in /api/auth-users')
    }

    const expectedOtherUserCount = await computeExpectedVisibleCurrentlyReadingCount({
      profileOwnerId: paul.id,
      viewerId: viewer.id,
    })
    const expectedOtherUserDisplayed = Math.min(MAX_BOOKS_SHOWN, expectedOtherUserCount)

    // Log in via UI to establish auth cookies
    await page.goto(`/login?redirect=/profile/${PROFILE_PERMALINK}`)
    await page.getByLabel('Email').fill(viewer.email)
    await page.locator('input#password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL((url: URL) => url.pathname === `/profile/${PROFILE_PERMALINK}`)

    if (expectedOtherUserDisplayed === 0) {
      await expectEmptyMessageVisible(page)
      expect(await getDisplayedCurrentlyReadingCount(page)).toBe(0)
    } else {
      expect(await getDisplayedCurrentlyReadingCount(page)).toBe(expectedOtherUserDisplayed)
    }
  })
})
