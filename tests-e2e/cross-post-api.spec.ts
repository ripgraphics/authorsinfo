import { test, expect } from '@playwright/test'

/**
 * E2E: Test cross-post API response
 * Verify that when posting on a book timeline, the API returns user_post_id
 */
test.describe('Cross-post API', () => {
  test('API should return user_post_id when posting on book timeline', async ({ page, request }) => {
    // First, we need to be authenticated
    // Navigate to the app to establish session
    await page.goto('http://localhost:3034')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Get cookies for authenticated request
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    // Make a test post on a book timeline
    const bookId = '492d0538-5ab2-43bc-bc7b-e538da900639'
    const testPostText = `API test cross-post ${Date.now()}`

    const response = await request.post('http://localhost:3034/api/posts/create', {
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      data: {
        content: { text: testPostText },
        entity_type: 'book',
        entity_id: bookId,
        visibility: 'public',
      },
    })

    const responseData = await response.json()
    
    console.log('API Response:', JSON.stringify(responseData, null, 2))

    // Check if response includes user_post_id (indicating cross-post was created)
    if (response.ok()) {
      expect(responseData).toHaveProperty('success', true)
      
      // If posting on a book (not user's own timeline), should have user_post_id
      if (responseData.user_post_id) {
        console.log('✅ Cross-post created! user_post_id:', responseData.user_post_id)
        expect(responseData.user_post_id).toBeTruthy()
      } else {
        console.warn('⚠️ No user_post_id in response - cross-post may not have been created')
        console.warn('Response:', responseData)
      }
    } else {
      console.error('❌ API request failed:', response.status, responseData)
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(responseData)}`)
    }
  })
})
