import { test, expect } from '@playwright/test';

test.describe('WebSocket Infrastructure', () => {
  test('should initialize socket client on page load', async ({ page }) => {
    await page.goto('/');

    // Wait for client-side hydration to run and SocketInitializer to set window.socket
    await page.waitForFunction(() => !!(window as any).socket);
    
    // Check if window.socket is defined
    const isSocketDefined = await page.evaluate(() => {
      return !!(window as any).socket;
    });
    
    expect(isSocketDefined).toBe(true);
  });

  test('should have correct socket configuration', async ({ page }) => {
    await page.goto('/');

    // Ensure the socket has been initialized on the client
    await page.waitForFunction(() => !!(window as any).socket);
    
    const socketConfig = await page.evaluate(() => {
      const socket = (window as any).socket;
      return {
        connected: socket.connected,
        disconnected: socket.disconnected,
        // We can check other properties if needed
      };
    });

    // Should be disconnected initially (requires auth)
    expect(socketConfig.connected).toBe(false);
    expect(socketConfig.disconnected).toBe(true);
  });
});
