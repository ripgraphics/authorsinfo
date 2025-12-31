# Sprint 12: Advanced Analytics (Cohort Analysis, Retention, Churn)

**Estimated Duration**: 12-14 hours  
**Priority**: High (Strategic Insights)  
**Status**: Planning Phase  
**Start Date**: Ready for implementation after Sprint 11

---

## 📋 Executive Summary

Sprint 12 will implement **advanced analytics capabilities** including:
- **Cohort Analysis** (track user groups over time)
- **Retention Analytics** (30-day, 90-day, annual retention curves)
- **Churn Prediction** (identify at-risk users)
- **Engagement Trends** (trending topics, popular content)
- **User Segmentation** (behavioral, demographic, geographic)

This enables data-driven decisions about product improvements and user retention strategies.

---

## 🎯 Core Objectives

1. **Build cohort analysis infrastructure** to track user groups
2. **Calculate retention metrics** across multiple time periods
3. **Predict churn risk** using ML algorithms
4. **Create retention dashboards** with actionable insights
5. **Implement user segmentation** for targeted campaigns
6. **Visualize trends** with advanced Recharts components

---

## 📊 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│              Advanced Analytics System                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │        Data Collection & Aggregation                    │ │
│  │  (User Events, Activity Logs, Engagement Metrics)       │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                         │
│  ┌──────────────────▼──────────────────────────────────────┐ │
│  │    Analytics Processing Layer                           │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Cohort Analysis    │  Retention Calculation    │  │ │
│  │  │  User Segmentation  │  Churn Prediction         │  │ │
│  │  │  Trend Analysis     │  Engagement Metrics       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                         │
│  ┌──────────────────▼──────────────────────────────────────┐ │
│  │    Analytics API Layer                                  │ │
│  │  /api/analytics/cohorts                                 │ │
│  │  /api/analytics/retention                               │ │
│  │  /api/analytics/churn                                   │ │
│  │  /api/analytics/segments                                │ │
│  │  /api/analytics/trends                                  │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                         │
│  ┌──────────────────▼──────────────────────────────────────┐ │
│  │    Dashboard Layer (Visualization)                      │ │
│  │  ┌─────────────────┬─────────────────────────────────┐ │ │
│  │  │ Cohort Table    │ Retention Heatmap               │ │ │
│  │  │ Churn Risk List │ Segmentation Pie Chart          │ │ │
│  │  │ Trends Timeline │ Predictive Alerts               │ │ │
│  │  └─────────────────┴─────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema & Materialized Views

### 1. Cohort Analysis Tables

```sql
-- Daily active user snapshots (for cohort calculations)
CREATE TABLE daily_active_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID NOT NULL,
  
  -- Activity markers
  is_new_user BOOLEAN, -- If this is user's first day
  had_activity BOOLEAN,
  
  -- Engagement metrics
  posts_created INT DEFAULT 0,
  comments_made INT DEFAULT 0,
  likes_given INT DEFAULT 0,
  messages_sent INT DEFAULT 0,
  login_count INT DEFAULT 1,
  session_duration_seconds INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_user_day UNIQUE (date, user_id)
);

CREATE INDEX idx_daily_active_users_date ON daily_active_users(date DESC);
CREATE INDEX idx_daily_active_users_new_user ON daily_active_users(is_new_user, date);

-- Cohort definitions
CREATE TABLE user_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cohort properties
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cohort_date DATE NOT NULL, -- When cohort was created (signup date, first activity, etc.)
  cohort_type VARCHAR(50) NOT NULL, -- 'signup_date', 'first_activity', 'feature_adoption'
  
  -- Cohort criteria
  criteria JSONB, -- {source: 'email', signup_country: 'US', etc.}
  user_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_cohorts_cohort_date ON user_cohorts(cohort_date);
CREATE INDEX idx_user_cohorts_type ON user_cohorts(cohort_type);

-- Cohort membership
CREATE TABLE cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES user_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_cohort_membership UNIQUE (cohort_id, user_id)
);

CREATE INDEX idx_cohort_members_user ON cohort_members(user_id);
CREATE INDEX idx_cohort_members_cohort ON cohort_members(cohort_id);

-- Cohort retention snapshots
CREATE TABLE cohort_retention_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES user_cohorts(id) ON DELETE CASCADE,
  
  -- Time period
  day_number INT NOT NULL, -- 0 = cohort date, 1 = next day, 7 = week 1, 30 = month 1, etc.
  snapshot_date DATE NOT NULL,
  
  -- Metrics
  users_active INT DEFAULT 0,
  retention_rate DECIMAL(5, 2), -- Percentage
  
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_cohort_snapshot UNIQUE (cohort_id, day_number, snapshot_date)
);

CREATE INDEX idx_cohort_retention_cohort ON cohort_retention_snapshots(cohort_id);
CREATE INDEX idx_cohort_retention_day ON cohort_retention_snapshots(day_number);
```

### 2. Retention Analysis

```sql
-- User retention milestones
CREATE TABLE user_retention_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Signup date (baseline)
  signup_date DATE NOT NULL,
  
  -- Retention milestones
  retained_day_1 BOOLEAN,
  retained_day_7 BOOLEAN,
  retained_day_30 BOOLEAN,
  retained_day_90 BOOLEAN,
  retained_year_1 BOOLEAN,
  
  -- Calculated fields
  days_active INT, -- Days with any activity
  last_active_date DATE,
  churn_date DATE, -- When user became inactive
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_retention_user ON user_retention_milestones(user_id);
CREATE INDEX idx_user_retention_signup ON user_retention_milestones(signup_date);
CREATE INDEX idx_user_retention_churn ON user_retention_milestones(churn_date);
```

### 3. Churn Prediction

```sql
-- User churn risk scores
CREATE TABLE user_churn_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Risk metrics
  risk_score DECIMAL(5, 2), -- 0-100 scale
  risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  
  -- Contributing factors
  days_since_last_activity INT,
  activity_decline_rate DECIMAL(5, 2), -- % decline in last 7 days
  engagement_score DECIMAL(5, 2), -- 0-100
  feature_adoption_rate DECIMAL(5, 2), -- % of features used
  
  -- Prediction metadata
  prediction_date DATE,
  predicted_churn_probability DECIMAL(5, 3), -- 0-1.0
  
  -- Intervention flags
  needs_intervention BOOLEAN,
  last_intervention_date TIMESTAMP,
  intervention_type VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_churn_risk_score ON user_churn_risk(risk_score DESC);
CREATE INDEX idx_user_churn_risk_level ON user_churn_risk(risk_level);
CREATE INDEX idx_user_churn_needs_intervention ON user_churn_risk(needs_intervention);
```

### 4. User Segmentation

```sql
-- User segments for targeted campaigns
CREATE TABLE user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Segment definition
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  
  -- Segment rules (JSON for flexibility)
  criteria JSONB, -- {
                  --   age_range: [18, 35],
                  --   country: 'US',
                  --   signup_days: [0, 30],
                  --   activity_level: 'high',
                  --   feature_used: 'reading_lists'
                  -- }
  
  -- Metadata
  user_count INT DEFAULT 0,
  created_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Segment membership
CREATE TABLE segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES user_segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_segment_membership UNIQUE (segment_id, user_id)
);

CREATE INDEX idx_segment_members_user ON segment_members(user_id);
CREATE INDEX idx_segment_members_segment ON segment_members(segment_id);
```

### 5. Engagement Trends

```sql
-- Daily engagement metrics aggregation
CREATE TABLE daily_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  
  -- User activity
  daily_active_users INT,
  monthly_active_users INT,
  new_users INT,
  
  -- Content activity
  posts_created INT,
  comments_made INT,
  likes_given INT,
  
  -- Social activity
  friend_requests_sent INT,
  messages_sent INT,
  
  -- Engagement ratio
  avg_session_duration_seconds INT,
  pages_per_session DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_daily_engagement_date ON daily_engagement_metrics(date DESC);
```

### 6. Materialized Views

```sql
-- Cohort retention matrix (for quick dashboard loading)
CREATE MATERIALIZED VIEW cohort_retention_matrix AS
SELECT 
  uc.id as cohort_id,
  uc.name as cohort_name,
  uc.cohort_date,
  crs.day_number,
  crs.users_active,
  crs.retention_rate,
  ROW_NUMBER() OVER (PARTITION BY uc.id ORDER BY crs.day_number) as period_rank
FROM user_cohorts uc
LEFT JOIN cohort_retention_snapshots crs ON uc.id = crs.cohort_id
ORDER BY uc.cohort_date DESC, crs.day_number ASC;

CREATE INDEX idx_cohort_retention_matrix_cohort ON cohort_retention_matrix(cohort_id);

-- Rolling cohort metrics (updated daily)
CREATE MATERIALIZED VIEW rolling_cohort_metrics AS
SELECT 
  DATE_TRUNC('week', uc.cohort_date)::DATE as week_started,
  COUNT(DISTINCT cm.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN urm.retained_day_1 THEN cm.user_id END)::DECIMAL / 
    COUNT(DISTINCT cm.user_id) * 100 as day_1_retention,
  COUNT(DISTINCT CASE WHEN urm.retained_day_7 THEN cm.user_id END)::DECIMAL / 
    COUNT(DISTINCT cm.user_id) * 100 as day_7_retention,
  COUNT(DISTINCT CASE WHEN urm.retained_day_30 THEN cm.user_id END)::DECIMAL / 
    COUNT(DISTINCT cm.user_id) * 100 as day_30_retention,
  COUNT(DISTINCT CASE WHEN urm.retained_day_90 THEN cm.user_id END)::DECIMAL / 
    COUNT(DISTINCT cm.user_id) * 100 as day_90_retention
FROM user_cohorts uc
LEFT JOIN cohort_members cm ON uc.id = cm.cohort_id
LEFT JOIN user_retention_milestones urm ON cm.user_id = urm.user_id
GROUP BY DATE_TRUNC('week', uc.cohort_date)
ORDER BY week_started DESC;

REFRESH MATERIALIZED VIEW CONCURRENTLY cohort_retention_matrix;
REFRESH MATERIALIZED VIEW CONCURRENTLY rolling_cohort_metrics;
```

---

## 📡 API Routes

### 1. Cohort Analysis

```typescript
// GET /api/analytics/cohorts
// List all cohorts
// Query: ?limit=20&offset=0&sort_by=cohort_date

// POST /api/analytics/cohorts
// Create new cohort
// Body: {
//   name: string,
//   description: string,
//   cohort_type: 'signup_date' | 'first_activity' | 'feature_adoption',
//   cohort_date: date,
//   criteria: object
// }

// GET /api/analytics/cohorts/:id
// Get cohort details with retention data

// GET /api/analytics/cohorts/:id/retention
// Get detailed retention curve for cohort
// Query: ?metric=day_1|day_7|day_30|day_90

// POST /api/analytics/cohorts/:id/calculate
// Trigger cohort retention calculation
```

### 2. Retention Analytics

```typescript
// GET /api/analytics/retention
// Get platform-wide retention metrics
// Query: ?period=daily|weekly|monthly

// GET /api/analytics/retention/:user_id
// Get individual user retention status

// POST /api/analytics/retention/calculate
// Calculate all retention metrics (runs daily)

// GET /api/analytics/retention/export
// Export retention data as CSV
```

### 3. Churn Prediction

```typescript
// GET /api/analytics/churn/at-risk
// Get list of at-risk users
// Query: ?risk_level=low|medium|high|critical&limit=50

// POST /api/analytics/churn/predict
// Run churn prediction algorithm on all users

// GET /api/analytics/churn/:user_id
// Get churn risk score for specific user

// POST /api/analytics/churn/:user_id/intervention
// Log intervention attempt for user
// Body: { intervention_type: string, notes: string }
```

### 4. User Segmentation

```typescript
// GET /api/analytics/segments
// List all user segments

// POST /api/analytics/segments
// Create new segment
// Body: {
//   name: string,
//   description: string,
//   criteria: object
// }

// GET /api/analytics/segments/:id/members
// Get segment members (paginated)
// Query: ?limit=100&offset=0

// POST /api/analytics/segments/:id/calculate
// Recalculate segment membership
```

### 5. Engagement Trends

```typescript
// GET /api/analytics/trends
// Get engagement trends over time
// Query: ?period=daily&days=30

// GET /api/analytics/trends/trending-topics
// Get trending content
// Query: ?period=24h|7d|30d

// GET /api/analytics/trends/user-behavior
// Get user behavior trends
// Query: ?metric=session_duration|pages_per_session|etc
```

---

## 🎨 Dashboard Components

### 1. Cohort Retention Table

```tsx
// components/analytics/cohort-retention-table.tsx
// Display cohort retention matrix
// Show day 1, 7, 30, 90, year 1 retention rates
// Color-coded cells (green = high, red = low)
// Sortable, filterable
```

### 2. Retention Curves

```tsx
// components/analytics/retention-curves.tsx
// Line chart showing retention trends
// Multiple cohorts overlaid
// Compare across time periods
```

### 3. Churn Risk Dashboard

```tsx
// components/analytics/churn-risk-dashboard.tsx
// List of at-risk users
// Risk score distribution (pie chart)
// Intervention tracking
// Segmented by risk level
```

### 4. User Segmentation

```tsx
// components/analytics/user-segmentation.tsx
// Pie/donut chart of segment sizes
// Segment list with member count
// Create/edit segment modal
// Segment comparison
```

### 5. Engagement Heatmap

```tsx
// components/analytics/engagement-heatmap.tsx
// Day of week vs hour of day heatmap
// Show engagement intensity
// Interactive drill-down
```

### 6. Trend Timeline

```tsx
// components/analytics/trend-timeline.tsx
// Line chart of engagement metrics over time
// Showing: DAU, MAU, new users, engagement rate
// Compare periods (YoY, MoM)
```

---

## 📊 Key Calculations

### Retention Rate

```typescript
function calculateRetentionRate(
  cohortSize: number,
  activeOnDay: number
): number {
  return (activeOnDay / cohortSize) * 100;
}

// Example: Cohort of 100 users
// Day 1: 85 active = 85% retention
// Day 7: 60 active = 60% retention
// Day 30: 35 active = 35% retention
```

### Churn Risk Score

```typescript
function calculateChurnRisk(user: User): number {
  let score = 0;
  
  // Days since last activity (0-30 points)
  const daysSinceActivity = getDaysSinceLastActivity(user.id);
  score += Math.min(daysSinceActivity / 90 * 30, 30);
  
  // Activity decline (0-25 points)
  const declineRate = getActivityDeclineRate(user.id);
  score += declineRate * 25;
  
  // Feature adoption (0-20 points)
  const adoptionRate = getFeatureAdoptionRate(user.id);
  score += (1 - adoptionRate) * 20;
  
  // Engagement score (0-25 points)
  const engagement = getEngagementScore(user.id);
  score += (1 - engagement / 100) * 25;
  
  return Math.round(score);
}

// 0-20: Low risk (green)
// 21-50: Medium risk (yellow)
// 51-80: High risk (orange)
// 81-100: Critical risk (red)
```

### Engagement Score

```typescript
function calculateEngagementScore(userId: string): number {
  const metricsWeight = {
    posts: 0.25,
    comments: 0.20,
    likes: 0.15,
    messages: 0.15,
    logins: 0.15,
    sessionDuration: 0.10,
  };
  
  const metrics = getUserMetrics(userId);
  
  const normalizedMetrics = {
    posts: Math.min(metrics.postsWeekly / 10, 1),
    comments: Math.min(metrics.commentsWeekly / 20, 1),
    likes: Math.min(metrics.likesWeekly / 50, 1),
    messages: Math.min(metrics.messagesWeekly / 10, 1),
    logins: Math.min(metrics.loginsWeekly / 7, 1),
    sessionDuration: Math.min(metrics.avgSessionMinutes / 30, 1),
  };
  
  let score = 0;
  for (const [metric, weight] of Object.entries(metricsWeight)) {
    score += normalizedMetrics[metric] * weight * 100;
  }
  
  return Math.round(score);
}

// 0-20: Inactive
// 21-40: Low
// 41-60: Moderate
// 61-80: High
// 81-100: Very High
```

---

## 🚀 Implementation Phases

### Phase 1: Database & Calculations (4-5 hours)
- [ ] Create all tables and materialized views
- [ ] Implement daily aggregation jobs
- [ ] Build cohort calculation engine
- [ ] Implement retention calculation
- [ ] Set up churn prediction algorithm

### Phase 2: API Routes (3-4 hours)
- [ ] Implement cohort CRUD routes
- [ ] Build retention analytics routes
- [ ] Add churn prediction routes
- [ ] Create segmentation routes
- [ ] Add trends routes

### Phase 3: Dashboard Components (3-4 hours)
- [ ] Build cohort retention table
- [ ] Create retention curves chart
- [ ] Build churn risk dashboard
- [ ] Create segmentation visualization
- [ ] Add trend timeline

### Phase 4: Integrations & Testing (2 hours)
- [ ] Connect analytics to admin dashboard
- [ ] Implement automated calculations (cron jobs)
- [ ] Add unit tests for calculations
- [ ] E2E testing

---

## 📈 Success Metrics

### Technical
- [ ] All calculations accurate and validated
- [ ] Dashboard loads in < 2 seconds
- [ ] Materialized views refresh daily
- [ ] Zero data loss or corruption
- [ ] > 90% test coverage

### Business
- [ ] Identify at-risk users effectively
- [ ] Retention metrics tracked accurately
- [ ] Churn prediction accuracy > 75%
- [ ] Segments useful for targeting
- [ ] Actionable insights generated daily

---

## 🔮 Post-Sprint Enhancements

1. **Machine Learning** - Use TensorFlow.js for advanced churn prediction
2. **Predictive Alerts** - Automated alerts when users approach churn
3. **Cohort Recommendations** - Suggest which cohorts to focus on
4. **Custom Metrics** - Allow admins to define custom metrics
5. **Data Export** - CSV/Excel export of all analytics
6. **Comparative Analysis** - Compare segments and cohorts
7. **Automated Reports** - Daily/weekly analytics reports via email

---

**Status**: Ready for implementation  
**Timeline**: 12-14 hours total  
**Start Date**: After Sprint 11 completion

