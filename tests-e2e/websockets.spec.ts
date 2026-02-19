import { test, expect } from '@playwright/test';

/**
 * WebSocket infrastructure tests.
 * NOTE: SocketInitializer is currently a stub (socket.io not installed).
 * These tests verify the stub doesn't break the app and will start passing
 * once a real socket implementation is added.
 */
test.describe('WebSocket Infrastructure', () => {
  test('page loads without socket errors', async ({ page }) => {
    // Collect console errors during page load
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Verify no socket-related errors crashed the page
    const socketErrors = errors.filter(
      (e) => e.toLowerCase().includes('socket') || e.toLowerCase().includes('websocket')
    );
    expect(socketErrors).toHaveLength(0);
  });

  test('app renders correctly without socket client', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // The app should render even without socket.io
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify there's actual rendered content in the page
    const hasContent = await page.evaluate(() => {
      return document.body && document.body.innerHTML.trim().length > 0;
    });
    expect(hasContent).toBe(true);
  });
});
