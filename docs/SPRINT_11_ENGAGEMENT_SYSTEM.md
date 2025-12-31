# Sprint 11: Engagement System (In-App, Email, Push Notifications)

**Estimated Duration**: 10-12 hours  
**Priority**: High (Core Feature)  
**Status**: Planning Phase  
**Start Date**: Ready for implementation

---

## 📋 Executive Summary

Sprint 11 will implement a comprehensive **multi-channel notification system** supporting:
- **In-App Notifications** (Toast + Center panel)
- **Email Notifications** (Transactional + Digest)
- **Push Notifications** (Web + Mobile)

This enables user engagement tracking, real-time alerts, and personalized communication.

---

## 🎯 Core Objectives

1. **Build notification infrastructure** with multi-channel support
2. **Implement user preference management** (opt-in/out, frequency)
3. **Create notification triggers** for key platform events
4. **Develop notification UI components** for all channels
5. **Integrate with Supabase** for data persistence and real-time updates

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification System                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  In-App      │  │    Email     │  │    Push      │     │
│  │  Channel     │  │    Channel   │  │   Channel    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           ↓                                 │
│                ┌─────────────────────────┐                 │
│                │ Notification Service    │                 │
│                │ (API Routes)            │                 │
│                └───────────┬─────────────┘                 │
│                            │                               │
│         ┌──────────────────┼──────────────────┐            │
│         ↓                  ↓                  ↓            │
│    ┌────────┐         ┌────────┐        ┌────────┐        │
│    │Supabase│         │  Email │        │ Firebase│       │
│    │Database│         │ Service│        │Cloud    │       │
│    │        │         │(SendGrid)       │Messaging│       │
│    └────────┘         └────────┘        └────────┘        │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            ↓                                │
│              ┌──────────────────────────┐                  │
│              │  Real-time Updates       │                  │
│              │  (Supabase Realtime)     │                  │
│              └──────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### 1. Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  type VARCHAR(50) NOT NULL, -- 'friend_request', 'message', 'like', 'comment', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (user_id, post_id, etc.)
  
  -- Delivery channels
  channels TEXT[] DEFAULT '{}', -- ['in_app', 'email', 'push']
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'read', 'failed'
  read_at TIMESTAMP,
  
  -- Delivery metadata
  email_sent_at TIMESTAMP,
  push_sent_at TIMESTAMP,
  
  -- Metadata
  action_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  
  CONSTRAINT valid_type CHECK (type IN (
    'friend_request',
    'friend_accept',
    'message',
    'comment',
    'post_like',
    'follow',
    'mention',
    'event_reminder',
    'achievement_unlocked',
    'reading_challenge_update',
    'book_club_invite',
    'group_invite',
    'admin_alert',
    'digest'
  ))
);

CREATE INDEX idx_notifications_recipient_status ON notifications(recipient_id, status);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, read_at);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);
```

### 2. User Notification Preferences Table

```sql
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- General preferences
  notifications_enabled BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Channel preferences
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  
  -- Email frequency
  email_frequency VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'off'
  digest_frequency VARCHAR(50) DEFAULT 'weekly', -- 'weekly', 'daily', 'never'
  
  -- Notification type preferences (per-type opt-in/out)
  friend_requests BOOLEAN DEFAULT true,
  messages BOOLEAN DEFAULT true,
  engagement BOOLEAN DEFAULT true,
  follows BOOLEAN DEFAULT true,
  mentions BOOLEAN DEFAULT true,
  event_reminders BOOLEAN DEFAULT true,
  achievements BOOLEAN DEFAULT true,
  group_updates BOOLEAN DEFAULT true,
  admin_alerts BOOLEAN DEFAULT true,
  
  -- Created/updated
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_notification_preferences_user ON user_notification_preferences(user_id);
```

### 3. Email Log Table

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  
  -- Email details
  subject VARCHAR(255) NOT NULL,
  template VARCHAR(100) NOT NULL, -- 'friend_request', 'message', etc.
  
  -- Delivery status
  status VARCHAR(50), -- 'queued', 'sent', 'failed', 'bounced'
  error_message TEXT,
  
  -- Tracking
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('queued', 'sent', 'failed', 'bounced', 'complained'))
);

CREATE INDEX idx_email_logs_notification ON email_logs(notification_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
```

### 4. Push Subscription Table (for Web Push)

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription details
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_secret TEXT NOT NULL,
  
  -- Device info
  device_type VARCHAR(50), -- 'web', 'ios', 'android'
  user_agent TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Created/updated
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active);
```

---

## 📡 API Routes

### 1. Notification CRUD

```typescript
// GET /api/notifications
// Return paginated notifications for current user
// Query: ?limit=20&offset=0&unread_only=true

// POST /api/notifications
// Create notification (admin only)
// Body: { recipient_id, type, title, message, channels, data }

// PATCH /api/notifications/:id
// Mark as read, update status
// Body: { status, read_at }

// DELETE /api/notifications/:id
// Delete notification

// POST /api/notifications/:id/mark-as-read
// Mark single notification as read
```

### 2. User Preferences

```typescript
// GET /api/user/notification-preferences
// Get user's notification preferences

// PATCH /api/user/notification-preferences
// Update notification preferences
// Body: {
//   notifications_enabled, quiet_hours_enabled, quiet_hours_start,
//   in_app_enabled, email_enabled, push_enabled,
//   email_frequency, digest_frequency,
//   friend_requests, messages, engagement, follows, ...
// }

// POST /api/user/notification-preferences/reset
// Reset to default preferences
```

### 3. Email Management

```typescript
// POST /api/notifications/send-email
// Send email notification
// Body: { notification_id, template, recipient_email, data }

// POST /api/notifications/send-digest
// Send email digest
// Body: { user_id, frequency }

// GET /api/email-logs/:id
// Get email delivery status
```

### 4. Push Notifications

```typescript
// POST /api/push-subscriptions
// Subscribe to push notifications
// Body: { endpoint, p256dh, auth_secret, device_type }

// DELETE /api/push-subscriptions/:id
// Unsubscribe from push

// POST /api/notifications/send-push
// Send push notification
// Body: { user_id, title, message, data }

// POST /api/notifications/broadcast-push
// Send push to multiple users
// Body: { user_ids, title, message, data }
```

---

## 🎨 Frontend Components

### 1. Notification Center

```tsx
// components/notification-center.tsx
export function NotificationCenter() {
  // Display all notifications
  // Tabs: All, Unread, Mentions
  // Infinite scroll pagination
  // Mark as read on interaction
  // Delete capability
}
```

### 2. Toast Notifications

```tsx
// components/notification-toast.tsx
export function NotificationToast({ 
  notification,
  onDismiss,
  onAction,
}) {
  // Real-time toast for new notifications
  // Auto-dismiss after 5 seconds
  // Action buttons (accept/decline)
}
```

### 3. Notification Preferences UI

```tsx
// app/settings/notifications/page.tsx
export function NotificationSettings() {
  // Channel toggles (in-app, email, push)
  // Email frequency selector
  // Quiet hours configuration
  // Per-type notification toggles
  // Save preferences
}
```

### 4. Notification Badge

```tsx
// components/notification-badge.tsx
export function NotificationBadge() {
  // Show unread count
  // Animate on new notification
  // Link to notification center
}
```

---

## 🔄 Notification Triggers

### Event-Based Triggers

```typescript
// Friend Request
trigger('friend_request', {
  recipient_id: userId,
  type: 'friend_request',
  title: `${senderName} sent you a friend request`,
  message: `Accept their friendship to connect`,
  data: { sender_id: senderId, request_id: requestId },
  action_url: `/friend-requests`,
  channels: ['in_app', 'email'],
});

// Message Received
trigger('message', {
  recipient_id: userId,
  type: 'message',
  title: `New message from ${senderName}`,
  message: messagePreview,
  data: { sender_id: senderId, conversation_id: convId },
  action_url: `/messages/${senderId}`,
  channels: ['in_app', 'email', 'push'],
});

// Post Comment
trigger('comment', {
  recipient_id: userId,
  type: 'comment',
  title: `${commenterName} commented on your post`,
  message: commentPreview,
  data: { commenter_id: commenterId, post_id: postId },
  action_url: `/posts/${postId}`,
  channels: ['in_app', 'push'],
});

// Achievement Unlocked
trigger('achievement', {
  recipient_id: userId,
  type: 'achievement_unlocked',
  title: `🏆 Achievement Unlocked!`,
  message: `You've earned the "${achievementName}" badge`,
  data: { achievement_id: achievementId },
  action_url: `/profile/${userId}/achievements`,
  channels: ['in_app'],
});
```

---

## 🚀 Implementation Phases

### Phase 1: Database & API (3-4 hours)
- [ ] Create Supabase tables (4 tables, ~300 lines SQL)
- [ ] Implement API routes (5 routes, ~800 lines)
- [ ] Add authentication & authorization checks
- [ ] Set up error handling & logging

### Phase 2: Services & Logic (2-3 hours)
- [ ] Create notification service
- [ ] Implement email sending (SendGrid integration)
- [ ] Implement push notifications (Firebase Cloud Messaging)
- [ ] Add notification triggers to events

### Phase 3: Frontend Components (2-3 hours)
- [ ] Create notification center UI
- [ ] Add toast notifications
- [ ] Build preference settings page
- [ ] Add notification badge to header

### Phase 4: Real-time Updates (1-2 hours)
- [ ] Set up Supabase real-time subscription
- [ ] Implement live notification updates
- [ ] Add sound/badge notifications
- [ ] Test cross-browser compatibility

### Phase 5: Testing & Polish (2 hours)
- [ ] Unit tests for notification service
- [ ] Integration tests for triggers
- [ ] E2E tests for user flows
- [ ] Performance optimization

---

## 📚 Key Files to Create

```
app/
├── api/
│   └── notifications/
│       ├── route.ts (CRUD operations)
│       ├── send-email/route.ts
│       ├── send-push/route.ts
│       └── send-digest/route.ts
├── settings/
│   └── notifications/
│       └── page.tsx (Preferences UI)
└── notifications/
    └── page.tsx (Notification Center)

components/
├── notification-center.tsx
├── notification-toast.tsx
├── notification-badge.tsx
├── notification-preferences.tsx
└── notification-card.tsx

lib/
├── services/
│   ├── notification-service.ts
│   ├── email-service.ts
│   └── push-service.ts
├── stores/
│   └── notification-store.ts (Zustand)
└── utils/
    └── notification-triggers.ts

types/
└── notifications.ts
```

---

## 🔗 Integration Points

### With Existing Systems

1. **User Profile** → Send welcome notification
2. **Friend Requests** → Trigger friend_request notification
3. **Messaging** → Trigger message notification + push
4. **Comments** → Trigger comment notification
5. **Posts** → Trigger engagement notifications
6. **Events** → Send event reminder notifications
7. **Admin Dashboard** → Log all notifications sent
8. **Analytics** → Track notification engagement

---

## 🎓 Learning Outcomes

After Sprint 11, the platform will have:
- ✅ Multi-channel notification system
- ✅ User preference management
- ✅ Real-time notification updates
- ✅ Email template system
- ✅ Push notification capability
- ✅ Notification analytics
- ✅ Scalable event-driven architecture

---

## 📈 Engagement Metrics to Track

```typescript
interface NotificationMetrics {
  // Delivery
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  delivery_rate: number; // %
  
  // Engagement
  open_rate: number; // % of emails opened
  click_rate: number; // % of emails clicked
  action_rate: number; // % of notifications acted on
  
  // User Behavior
  unsubscribe_rate: number; // % of users opting out
  preference_changes: number;
  quiet_hours_usage: number; // % of users using
  
  // Performance
  delivery_latency_p50: number; // milliseconds
  delivery_latency_p95: number;
}
```

---

## ✅ Success Criteria

- [x] Database schema designed and optimized
- [ ] All API routes implemented and tested
- [ ] Notification service fully functional
- [ ] Email delivery working (SendGrid)
- [ ] Push notifications working (FCM)
- [ ] All UI components built and styled
- [ ] Real-time updates working
- [ ] User preferences functional
- [ ] > 85% test coverage
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## 🔮 Future Enhancements (Sprint 12+)

1. **SMS Notifications** - Add SMS channel via Twilio
2. **Slack Integration** - Send notifications to Slack
3. **Notification Scheduling** - Schedule notifications for specific times
4. **Smart Digest** - AI-powered digest personalization
5. **Notification Analytics Dashboard** - Detailed engagement metrics
6. **A/B Testing** - Test different notification messages
7. **Notification Templates** - User-customizable templates
8. **Webhook Support** - Third-party integrations

---

**Status**: Ready for implementation  
**Next Step**: Begin Phase 1 - Database & API Routes
