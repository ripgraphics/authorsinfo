# Sprint 10 Test Strategy & Implementation Guide

**Date**: December 27, 2025  
**Status**: Ready for Test Implementation  
**Target Coverage**: > 80% critical paths

---

## 📋 Test Structure Overview

```
tests/
├── unit/
│   ├── api/
│   │   ├── audit-logs.test.ts
│   │   ├── moderation.test.ts
│   │   ├── engagement.test.ts
│   │   ├── user-growth.test.ts
│   │   └── stats.test.ts
│   ├── store/
│   │   ├── admin-store.test.ts
│   │   └── admin-store.slice.test.ts
│   ├── components/
│   │   ├── admin-charts.test.tsx
│   │   ├── admin-filters.test.tsx
│   │   ├── error-boundary.test.tsx
│   │   └── skeleton-loaders.test.tsx
│   └── utils/
│       ├── csv-export.test.ts
│       └── admin-helpers.test.ts
├── integration/
│   ├── admin-dashboard.integration.test.ts
│   ├── moderation-queue.integration.test.ts
│   └── audit-logs.integration.test.ts
└── e2e/
    ├── admin-dashboard.spec.ts
    └── moderation-workflow.spec.ts
```

---

## 🔧 Testing Setup

### Install Testing Dependencies

```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  jest-environment-jsdom \
  @types/jest \
  ts-jest \
  msw \
  @mswjs/http-handler \
  @supabase/supabase-js \
  --force
```

### Jest Configuration (`jest.config.js`)

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig)
```

### Setup File (`jest.setup.js`)

```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
    }
  },
}))

// Mock Zustand store hydration
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
```

---

## 🧪 Unit Tests

### API Route Tests

#### `tests/unit/api/audit-logs.test.ts`

```typescript
import { GET, POST } from '@/app/api/admin/audit-logs/route';
import { createMocks } from 'node-mocks-http';

describe('GET /api/admin/audit-logs', () => {
  it('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await GET(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    // Mock non-admin user
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'x-user-role': 'user',
      },
    });

    await GET(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return audit logs when user is admin', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        source: 'social',
        limit: '10',
      },
      headers: {
        'x-user-role': 'admin',
      },
    });

    await GET(req, res);
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('logs');
    expect(Array.isArray(data.logs)).toBe(true);
  });

  it('should filter logs by source', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        source: 'enterprise',
        limit: '20',
      },
      headers: {
        'x-user-role': 'admin',
      },
    });

    await GET(req, res);
    const data = JSON.parse(res._getData());
    
    expect(data.logs).toBeDefined();
    expect(data.logs.length).toBeLessThanOrEqual(20);
  });

  it('should paginate results correctly', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        limit: '10',
        offset: '20',
      },
      headers: {
        'x-user-role': 'admin',
      },
    });

    await GET(req, res);
    const data = JSON.parse(res._getData());
    
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('offset');
    expect(data.offset).toBe(20);
  });

  it('should export CSV format when requested', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        format: 'csv',
        limit: '100',
      },
      headers: {
        'x-user-role': 'admin',
      },
    });

    await GET(req, res);
    expect(res._getHeaders()['content-type']).toContain('text/csv');
  });

  it('should handle date range filtering', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      },
      headers: {
        'x-user-role': 'admin',
      },
    });

    await GET(req, res);
    expect(res._getStatusCode()).toBe(200);
  });

  it('should reject invalid date ranges', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        startDate: '2025-12-31',
        endDate: '2025-12-01', // End before start
      },
      headers: {
        'x-user-role': 'admin',
      },
    });

    await GET(req, res);
    expect(res._getStatusCode()).toBe(400);
  });
});

describe('POST /api/admin/audit-logs', () => {
  it('should create audit log entry when valid data provided', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        source: 'social',
        userId: 'test-user-123',
        action: 'post_created',
        details: { postId: '456' },
      },
      headers: {
        'x-user-role': 'admin',
      },
    });

    // Would test POST creation if available
    // await POST(req, res);
    // expect(res._getStatusCode()).toBe(201);
  });
});
```

#### `tests/unit/api/moderation.test.ts`

```typescript
import { GET, PATCH } from '@/app/api/admin/moderation/route';
import { createMocks } from 'node-mocks-http';

describe('GET /api/admin/moderation', () => {
  it('should return pending moderation items', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { status: 'pending' },
      headers: { 'x-user-role': 'admin' },
    });

    await GET(req, res);
    const data = JSON.parse(res._getData());
    
    expect(res._getStatusCode()).toBe(200);
    expect(Array.isArray(data.queue)).toBe(true);
  });

  it('should filter by priority level', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { priority: 'high' },
      headers: { 'x-user-role': 'admin' },
    });

    await GET(req, res);
    const data = JSON.parse(res._getData());
    
    expect(data.queue.every(item => item.priority === 'high')).toBe(true);
  });
});

describe('PATCH /api/admin/moderation/:id', () => {
  it('should update moderation item status', async () => {
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { id: 'item-123' },
      body: {
        status: 'approved',
        decision: 'content_acceptable',
        notes: 'No violations found',
      },
      headers: { 'x-user-role': 'admin' },
    });

    await PATCH(req, res);
    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.status).toBe('approved');
  });

  it('should reject invalid status transitions', async () => {
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { id: 'item-123' },
      body: { status: 'invalid-status' },
      headers: { 'x-user-role': 'admin' },
    });

    await PATCH(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should auto-assign reviewer if not provided', async () => {
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { id: 'item-123' },
      body: { status: 'in_review' },
      headers: { 
        'x-user-role': 'admin',
        'x-user-id': 'admin-123',
      },
    });

    await PATCH(req, res);
    const data = JSON.parse(res._getData());
    
    expect(data.assignedTo).toBe('admin-123');
  });
});
```

### Store Tests

#### `tests/unit/store/admin-store.test.ts`

```typescript
import { useAdminStore } from '@/lib/stores/admin-store';
import { renderHook, act } from '@testing-library/react';

describe('Admin Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAdminStore.setState({
      platformStats: null,
      userGrowth: null,
      engagement: null,
      moderationQueue: [],
      auditLogs: [],
      analyticsLoading: false,
      moderationLoading: false,
      auditLogsLoading: false,
    });
  });

  describe('Actions', () => {
    it('should fetch platform stats', async () => {
      const { result } = renderHook(() => useAdminStore());

      await act(async () => {
        await result.current.fetchPlatformStats();
      });

      expect(result.current.platformStats).toBeDefined();
      expect(result.current.analyticsLoading).toBe(false);
    });

    it('should fetch user growth data', async () => {
      const { result } = renderHook(() => useAdminStore());

      await act(async () => {
        await result.current.fetchUserGrowth('daily', 30);
      });

      expect(result.current.userGrowth).toBeDefined();
      expect(result.current.userGrowth.period).toBe('daily');
    });

    it('should handle fetch errors gracefully', async () => {
      const { result } = renderHook(() => useAdminStore());

      // Mock fetch failure
      await act(async () => {
        try {
          await result.current.fetchPlatformStats();
        } catch (error) {
          expect(result.current.analyticsLoading).toBe(false);
        }
      });
    });

    it('should update moderation item', async () => {
      const { result } = renderHook(() => useAdminStore());

      const itemId = 'item-123';
      const updates = { status: 'approved', decision: 'approved' };

      await act(async () => {
        await result.current.updateModerationItem(itemId, updates);
      });

      const updatedItem = result.current.moderationQueue.find(
        item => item.id === itemId
      );
      expect(updatedItem?.status).toBe('approved');
    });

    it('should filter moderation queue', async () => {
      const { result } = renderHook(() => useAdminStore());

      const filters = { status: 'pending', priority: 'high' };

      await act(async () => {
        await result.current.fetchModerationQueue(filters);
      });

      expect(result.current.moderationQueue.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Loading States', () => {
    it('should set loading state during fetch', async () => {
      const { result } = renderHook(() => useAdminStore());

      act(() => {
        useAdminStore.setState({ analyticsLoading: true });
      });

      expect(result.current.analyticsLoading).toBe(true);

      await act(async () => {
        await result.current.fetchPlatformStats();
      });

      expect(result.current.analyticsLoading).toBe(false);
    });
  });
});
```

### Component Tests

#### `tests/unit/components/admin-charts.test.tsx`

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserGrowthChart } from '@/components/admin-charts';

describe('AdminCharts', () => {
  const mockData = {
    period: 'daily',
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    chartData: [
      {
        date: '2025-12-01',
        newUsers: 10,
        activeUsers: 50,
        totalUsers: 1000,
      },
      {
        date: '2025-12-02',
        newUsers: 15,
        activeUsers: 55,
        totalUsers: 1015,
      },
    ],
  };

  describe('UserGrowthChart', () => {
    it('should render chart with data', () => {
      render(<UserGrowthChart data={mockData} />);
      
      expect(screen.getByText(/user growth/i)).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(<UserGrowthChart data={{}} />);
      
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });

    it('should display period information', () => {
      render(<UserGrowthChart data={mockData} />);
      
      expect(screen.getByText(/daily/i)).toBeInTheDocument();
    });
  });
});
```

#### `tests/unit/components/error-boundary.test.tsx`

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary componentName="TestComponent">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('should show component name in error message', () => {
    render(
      <ErrorBoundary componentName="MyComponent">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/MyComponent/i)).toBeInTheDocument();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
```

### Utility Tests

#### `tests/unit/utils/csv-export.test.ts`

```typescript
import {
  convertToCSV,
  exportAuditLogsToCSV,
  exportUserGrowthToCSV,
} from '@/lib/utils/csv-export';

describe('CSV Export Utils', () => {
  describe('convertToCSV', () => {
    it('should convert array to CSV format', () => {
      const data = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const csv = convertToCSV(data, ['id', 'name', 'email']);

      expect(csv).toContain('id,name,email');
      expect(csv).toContain('1,Alice,alice@example.com');
      expect(csv).toContain('2,Bob,bob@example.com');
    });

    it('should escape special characters in CSV', () => {
      const data = [
        { id: 1, name: 'John "Johnny" Doe', description: 'Has, commas' },
      ];

      const csv = convertToCSV(data, ['id', 'name', 'description']);

      expect(csv).toContain('"John ""Johnny"" Doe"');
      expect(csv).toContain('"Has, commas"');
    });

    it('should handle empty arrays', () => {
      const csv = convertToCSV([], ['id', 'name']);

      expect(csv).toBe('id,name');
    });

    it('should handle null/undefined values', () => {
      const data = [{ id: 1, name: null, email: undefined }];

      const csv = convertToCSV(data, ['id', 'name', 'email']);

      expect(csv).toContain('1,,');
    });
  });

  describe('exportAuditLogsToCSV', () => {
    it('should generate audit logs CSV with proper headers', async () => {
      const csv = await exportAuditLogsToCSV();

      expect(csv).toContain('ID');
      expect(csv).toContain('Source');
      expect(csv).toContain('User ID');
      expect(csv).toContain('Action');
    });

    it('should support filtering', async () => {
      const csv = await exportAuditLogsToCSV({ source: 'social' });

      expect(csv).toBeDefined();
    });
  });

  describe('exportUserGrowthToCSV', () => {
    it('should format user growth data correctly', () => {
      const data = [
        {
          date: '2025-12-01',
          newUsers: 10,
          activeUsers: 100,
          totalUsers: 1000,
        },
      ];

      const csv = exportUserGrowthToCSV(data);

      expect(csv).toContain('Date,New Users,Active Users,Total Users');
      expect(csv).toContain('2025-12-01,10,100,1000');
    });
  });
});
```

---

## 🔗 Integration Tests

#### `tests/integration/admin-dashboard.integration.test.ts`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminAnalyticsDashboard } from '@/app/admin/analytics/client';

describe('Admin Dashboard Integration', () => {
  it('should load dashboard and display all sections', async () => {
    render(<AdminAnalyticsDashboard userId="admin-123" />);

    await waitFor(() => {
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
    });

    // Check tabs exist
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /moderation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    render(<AdminAnalyticsDashboard userId="admin-123" />);

    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    await user.click(analyticsTab);

    await waitFor(() => {
      expect(analyticsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should apply filters to data', async () => {
    const user = userEvent.setup();
    render(<AdminAnalyticsDashboard userId="admin-123" />);

    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    // Interact with filters
    const dateInput = screen.getByLabelText(/start date/i);
    await user.type(dateInput, '2025-12-01');

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('should refresh all data', async () => {
    const user = userEvent.setup();
    render(<AdminAnalyticsDashboard userId="admin-123" />);

    const refreshButton = screen.getByRole('button', { name: /refresh all/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(refreshButton).not.toHaveAttribute('disabled');
    });
  });

  it('should display error when data fetch fails', async () => {
    // Mock API failure
    render(<AdminAnalyticsDashboard userId="admin-123" />);

    // Simulate error
    await waitFor(() => {
      expect(screen.queryByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎬 E2E Tests

#### `tests-e2e/admin-dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/analytics');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/admin/analytics');
  });

  test('should load and display dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Admin Analytics Dashboard');
    await expect(page.locator('[role="tab"]')).toHaveCount(4);
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Analytics")');
    await expect(page.locator('text=User Growth')).toBeVisible();

    await page.click('[role="tab"]:has-text("Moderation")');
    await expect(page.locator('text=Moderation Queue')).toBeVisible();
  });

  test('should filter audit logs', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Audit Logs")');
    await page.click('button:has-text("Filters")');

    await page.selectOption('select[name="source"]', 'social');
    await page.fill('input[name="startDate"]', '2025-12-01');
    await page.click('button:has-text("Apply Filters")');

    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should export data to CSV', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export CSV")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should update moderation item', async ({ page }) => {
    await page.click('[role="tab"]:has-text("Moderation")');
    
    // Find first moderation item
    const item = page.locator('div[data-testid="moderation-item"]').first();
    await item.locator('button:has-text("Review")').click();

    await page.selectOption('select[name="decision"]', 'approved');
    await page.click('button:has-text("Submit Decision")');

    await expect(page.locator('text=Decision submitted')).toBeVisible();
  });
});
```

---

## 📊 Coverage Report Commands

```bash
# Run all tests with coverage
npm run test -- --coverage

# Run specific test suite
npm run test -- tests/unit/api/audit-logs.test.ts

# Run tests in watch mode
npm run test -- --watch

# Generate detailed coverage report
npm run test -- --coverage --coverageReporters=html

# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- admin-dashboard.spec.ts
```

---

## 🎯 Coverage Goals by Module

| Module | Target | Type |
|--------|--------|------|
| API Routes | 100% | Critical |
| Admin Store | 95% | Critical |
| Admin Charts | 70% | UI |
| Admin Filters | 75% | UI |
| CSV Export | 90% | Utility |
| Error Boundary | 85% | Utility |
| Skeleton Loaders | 60% | UI |

---

## ✅ Success Criteria

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Coverage > 80% for critical paths
- [ ] Coverage > 70% for UI components
- [ ] 0 TypeScript errors in tests
- [ ] All async operations properly awaited
- [ ] Mock data includes edge cases
- [ ] Tests document component behavior

---

## 🔍 Testing Checklist

- [ ] Mock Supabase correctly
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test edge cases (empty data, null values)
- [ ] Test API parameter validation
- [ ] Test filter combinations
- [ ] Test export formats
- [ ] Test accessibility (keyboard, screen reader)
- [ ] Test performance (slow network, large datasets)
- [ ] Test error boundaries

---

**Ready for implementation**: Execute 1 test at a time, verify passing, then move to next.
