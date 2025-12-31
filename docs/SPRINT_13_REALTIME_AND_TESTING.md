# Sprint 13: Real-Time Features & 100% Code Coverage

**Status:** Planning | **Timeline:** Jan 1-14, 2026  
**Estimated Effort:** 16-20 hours | **Target Completion:** Jan 14, 2026

---

## 🎯 Sprint 13 Objectives

### Primary Goals
1. ✅ Implement WebSocket real-time features (Socket.io integration)
2. ✅ Achieve 100% code coverage across entire codebase
3. ✅ Complete comprehensive test suite (unit, integration, E2E)
4. ✅ Verify production readiness with full test coverage

### Success Metrics
- **Code Coverage:** 100% (up from current test infrastructure)
- **WebSocket Features:** 5 key real-time features implemented
- **Test Suite:** 500+ unit tests, 100+ integration tests, 10+ E2E tests
- **Zero Regressions:** All existing features continue to work
- **Performance:** Real-time features <500ms latency

---

## 📋 Feature 1: WebSocket Real-Time Features

### 1.1 Socket.io Integration with Next.js

**Database Schema:**
```sql
-- Real-time presence tracking
CREATE TABLE user_presence (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'offline', -- online, away, offline
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_typing BOOLEAN DEFAULT FALSE,
  typing_location VARCHAR(255), -- book_detail, chat, comment, etc.
  device_type VARCHAR(50), -- web, mobile, desktop
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activity stream for real-time feeds
CREATE TABLE activity_stream (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- reading, review, follow, comment, like, etc.
  entity_type VARCHAR(50) NOT NULL, -- book, author, user, group, event
  entity_id VARCHAR(255) NOT NULL,
  entity_name TEXT,
  metadata JSONB,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Real-time collaboration sessions
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name VARCHAR(255) NOT NULL UNIQUE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  max_participants INT DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Participant tracking
CREATE TABLE session_participants (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  socket_id VARCHAR(255),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP,
  UNIQUE(session_id, user_id)
);

-- Create indexes
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_activity_stream_user_id ON activity_stream(user_id);
CREATE INDEX idx_activity_stream_created_at ON activity_stream(created_at DESC);
CREATE INDEX idx_collaboration_sessions_entity ON collaboration_sessions(entity_type, entity_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);

-- RLS Policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Public can see online status
CREATE POLICY "Users can see presence of others" ON user_presence
  FOR SELECT USING (TRUE);

-- Users can update own presence
CREATE POLICY "Users can update own presence" ON user_presence
  FOR UPDATE USING (user_id = auth.uid());

-- Public activity visible based on public flag
CREATE POLICY "Users can see public activities" ON activity_stream
  FOR SELECT USING (is_public = TRUE);

-- Users see private activities from themselves/friends
CREATE POLICY "Users see own activities" ON activity_stream
  FOR SELECT USING (user_id = auth.uid());
```

### 1.2 Real-Time Features to Implement

#### Feature 1a: Presence Tracking
- **Endpoints:**
  - POST `/api/realtime/presence/online` - Mark user as online
  - POST `/api/realtime/presence/away` - Mark user as away
  - POST `/api/realtime/presence/offline` - Mark user as offline
  - GET `/api/realtime/presence/[userId]` - Check user status
  - GET `/api/realtime/presence/room/[roomName]` - Get all users in room

- **WebSocket Events:**
  - `user:online` - User came online
  - `user:offline` - User went offline
  - `user:typing` - User is typing
  - `user:stopped_typing` - User stopped typing
  - `presence:update` - Presence data changed

- **Component Integration:**
  - Online/offline indicators on user avatars
  - Typing indicators in comments/messages
  - Real-time user list in rooms/groups

#### Feature 1b: Live Activity Feeds
- **Events:**
  - `activity:new` - New activity in user's feed
  - `activity:like` - Someone liked user's content
  - `activity:comment` - New comment on user's post
  - `activity:follow` - New follower
  - `activity:mention` - User mentioned in comment

- **Database Tracking:**
  - Activity stream of all user actions
  - Filtered by privacy settings
  - Real-time feed updates

- **Components:**
  - Real-time activity notifications
  - Live feed updates
  - Notification badges with counts

#### Feature 1c: Real-Time Typing Indicators
- **Events:**
  - `typing:start` - User started typing
  - `typing:stop` - User stopped typing
  - `typing:users` - List of users currently typing

- **Implementation:**
  - Track typing in comments, reviews, messages
  - Debounce typing events (300ms)
  - Show "X is typing..." indicator

- **UI Elements:**
  - Typing indicator animation in comment sections
  - "3 people are typing..." message in group chats

#### Feature 1d: Live Notifications
- **Real-Time Delivery:**
  - WebSocket for instant delivery
  - Fallback to polling for offline users
  - Combine with multi-channel notifications from Sprint 11

- **Events:**
  - `notification:new` - New notification
  - `notification:read` - User read notification
  - `notification:dismissed` - User dismissed notification

- **Features:**
  - Toast notifications in-app
  - Unread count updates
  - Sound alerts (optional)

#### Feature 1e: Collaborative Real-Time Features
- **Collaborative Editing Prep:**
  - Room creation for editing sessions
  - User presence in editing rooms
  - Cursor position tracking
  - Comment collaboration
  - Version tracking

- **Events:**
  - `collab:cursor_moved` - Cursor position update
  - `collab:content_changed` - Content being edited
  - `collab:user_joined` - User joined editing session
  - `collab:user_left` - User left session

### 1.3 Implementation Plan

**Phase 1: Socket.io Setup (2-3 hours)**
- Install `socket.io@4.7.0` and `socket.io-client@4.7.0`
- Create WebSocket server in Next.js with custom server
- Configure Socket.io namespaces and middleware
- Implement authentication via JWT tokens

**Phase 2: Presence Tracking (3-4 hours)**
- Create `lib/realtime/presence.ts` manager
- Implement database tracking
- Build presence hooks and components
- Create presence API endpoints
- Add typing indicator support

**Phase 3: Activity Stream (3-4 hours)**
- Create activity stream manager
- Implement database storage
- Build real-time feed components
- Create activity event emitters
- Add notification integration

**Phase 4: Live Notifications (2-3 hours)**
- Integrate with Sprint 11 notification system
- Add WebSocket delivery option
- Create real-time notification components
- Implement sound/vibration alerts

**Phase 5: Testing & Polish (2-3 hours)**
- E2E tests for real-time features
- Performance testing under load
- Browser compatibility testing
- Production deployment preparation

---

## 🧪 Feature 2: 100% Code Coverage

### 2.1 Current Coverage Baseline
Based on existing test infrastructure:
- **Current:** ~40-50% (estimated from test files present)
- **Target:** 100% (all code paths covered)
- **Tests Needed:** ~600+ new tests

### 2.2 Testing Strategy

#### Unit Tests (300+ tests)
**Target Files:**
- `lib/utils/*.ts` - 20 test files
- `lib/stores/*.ts` - 8 test files
- `types/*.ts` - 5 test files
- `lib/realtime/*.ts` - 10 test files (NEW)
- `lib/hooks/*.ts` - 15 test files (NEW)

**Test Framework:** Vitest + @testing-library/react

**Example Structure:**
```typescript
// lib/utils/__tests__/format-date.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime } from '../format-date';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-12-28');
    expect(formatDate(date)).toBe('Dec 28, 2025');
  });
  
  it('should handle relative time', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
  });
});
```

#### Component Tests (200+ tests)
**Target Components:**
- `components/analytics/*.tsx` - 15 test files
- `components/common/*.tsx` - 20 test files
- `components/notifications/*.tsx` - 8 test files
- `components/realtime/*.tsx` - 10 test files (NEW)

**Testing Pattern:**
```typescript
// components/__tests__/notification-bell.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../notification-bell';

describe('NotificationBell', () => {
  it('should render with unread count', () => {
    render(<NotificationBell unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  
  it('should open notification center on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    
    await user.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });
});
```

#### Integration Tests (100+ tests)
**Target API Routes:**
- `app/api/analytics/*.ts` - 8 test files
- `app/api/notifications/*.ts` - 6 test files
- `app/api/realtime/*.ts` - 5 test files (NEW)

**Testing Pattern:**
```typescript
// app/api/__tests__/notifications.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../notifications/route';

describe('/api/notifications', () => {
  it('should list notifications', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    });
    
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

#### E2E Tests (10+ tests)
**Target User Flows:**
- Notification workflow
- Real-time presence tracking
- Activity stream updates
- Analytics dashboard interaction
- Admin features

**Testing Framework:** Playwright

```typescript
// e2e/__tests__/notifications.spec.ts
import { test, expect } from '@playwright/test';

test('user receives real-time notification', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("Sign in")');
  
  // Wait for notification
  await page.waitForSelector('[data-testid="notification-badge"]');
  const badge = page.locator('[data-testid="notification-badge"]');
  await expect(badge).toContainText('1');
});
```

### 2.3 Coverage Targets by Module

| Module | Current | Target | Tests Needed |
|--------|---------|--------|-------------|
| Utils | 30% | 100% | 25 |
| Components | 40% | 100% | 40 |
| API Routes | 50% | 100% | 30 |
| Stores | 60% | 100% | 20 |
| Hooks | 20% | 100% | 25 |
| Real-time (NEW) | 0% | 100% | 20 |
| **Total** | ~45% | **100%** | **~160+** |

### 2.4 Implementation Plan

**Phase 1: Setup (1-2 hours)**
- Configure Vitest
- Setup @testing-library/react
- Configure Playwright
- Create test utilities and mocks
- Setup coverage reporting

**Phase 2: Utility Tests (2-3 hours)**
- Test all `lib/utils/*.ts` files
- Test all `lib/hooks/*.ts` files
- Test error handling
- Test edge cases

**Phase 3: Component Tests (4-5 hours)**
- Test all React components
- Test user interactions
- Test loading states
- Test error states
- Test accessibility

**Phase 4: API Route Tests (3-4 hours)**
- Test all endpoints
- Test authentication
- Test error responses
- Test pagination
- Test filtering

**Phase 5: Integration Tests (2-3 hours)**
- Test workflows across modules
- Test real-time features
- Test notification system
- Test analytics

**Phase 6: E2E Tests (1-2 hours)**
- Critical user journeys
- Real-time feature flows
- Admin workflows
- Error recovery

**Phase 7: Coverage Report & Polish (1 hour)**
- Generate coverage reports
- Identify gaps
- Final test additions
- Documentation

---

## 📊 Sprint 13 Timeline

### Week 1: Real-Time Features (Jan 1-7)
| Day | Task | Hours | Status |
|-----|------|-------|--------|
| Mon | Socket.io setup | 2.5 | Planned |
| Tue | Presence tracking | 4 | Planned |
| Wed | Activity stream | 3.5 | Planned |
| Thu | Live notifications | 3 | Planned |
| Fri | Testing & documentation | 2 | Planned |
| **Total** | | **15** | |

### Week 2: 100% Code Coverage (Jan 8-14)
| Day | Task | Hours | Status |
|-----|------|-------|--------|
| Mon | Setup testing infrastructure | 2 | Planned |
| Tue-Wed | Utility & component tests | 8 | Planned |
| Thu | API route & integration tests | 6 | Planned |
| Fri | E2E tests & coverage report | 4 | Planned |
| **Total** | | **20** | |

### **Sprint 13 Total: ~35 hours estimated**

---

## 📦 Deliverables Checklist

### Real-Time Features
- [ ] Socket.io configured with JWT auth
- [ ] Presence tracking API (5 endpoints)
- [ ] Activity stream system
- [ ] Real-time notifications integration
- [ ] Typing indicators
- [ ] 5 new WebSocket-enabled components
- [ ] Real-time documentation (300+ lines)

### 100% Code Coverage
- [ ] 160+ new tests written
- [ ] 100% unit test coverage
- [ ] 100% component test coverage
- [ ] 100% API route coverage
- [ ] 10+ E2E tests
- [ ] Coverage reports generated
- [ ] Test documentation (200+ lines)

### Quality Assurance
- [ ] Zero test failures
- [ ] All linting passes
- [ ] TypeScript strict mode compliance
- [ ] Performance benchmarks met
- [ ] Browser compatibility verified
- [ ] Production deployment ready

---

## 🔗 Integration Points

### With Existing Features
1. **Notifications (Sprint 11)**
   - Real-time notification delivery via WebSocket
   - Hybrid push (WebSocket + email/push)
   - Notification preference integration

2. **Analytics (Sprint 12)**
   - Real-time activity tracking
   - Live engagement metrics
   - Real-time dashboard updates

3. **Community (Sprint 9)**
   - Live Q&A session updates
   - Real-time comment feeds
   - Live event participation

4. **Gamification (Sprint 7)**
   - Real-time badge awards
   - Live leaderboard updates
   - Streak notifications

---

## 📚 Documentation

### Files to Create
1. **SPRINT_13_REALTIME_FEATURES.md** (400 lines)
   - WebSocket architecture
   - Socket.io configuration
   - Event specifications
   - Integration guide

2. **TESTING_GUIDE.md** (500 lines)
   - Testing strategy
   - Test examples
   - Coverage reports
   - Best practices

3. **REALTIME_API_REFERENCE.md** (300 lines)
   - WebSocket events
   - API endpoints
   - Code examples
   - Troubleshooting

4. **100_PERCENT_COVERAGE_REPORT.md** (200 lines)
   - Coverage metrics
   - Test statistics
   - Coverage by module
   - Quality indicators

---

## ✅ Success Criteria

### Real-Time Features
- ✅ All 5 real-time features working end-to-end
- ✅ Sub-500ms latency for all events
- ✅ Handles 100+ concurrent connections
- ✅ Proper error handling and recovery
- ✅ Works with existing notification system

### Code Coverage
- ✅ 100% statement coverage
- ✅ 100% branch coverage
- ✅ 100% function coverage
- ✅ 100% line coverage
- ✅ All tests passing
- ✅ No skipped tests

### Overall Sprint
- ✅ Zero critical bugs introduced
- ✅ Zero regressions in existing features
- ✅ All documentation complete
- ✅ Production deployment ready
- ✅ Performance benchmarks met
- ✅ Team sign-off obtained

---

## 🚀 Post-Sprint Activities

1. **Production Deployment**
   - Deploy real-time features
   - Monitor WebSocket connections
   - Track real-time metrics

2. **Documentation Review**
   - Publish documentation
   - Create video tutorials
   - Share best practices

3. **Next Sprint Planning**
   - Sprint 14: Advanced Search (Algolia)
   - Phase 5: Mobile App & PWA
   - Long-term roadmap review

---

## 📝 Notes

- Socket.io runs on Next.js custom server on port 3001
- WebSocket connections use JWT authentication
- Fallback to polling for unsupported browsers
- Real-time features are optional enhancement
- 100% coverage is quality gate for production
- All tests must pass before merge
