# Phase 3 Sprint 6 - Feature 3: Enhanced Reading Progress - Implementation Start Guide

**Status:** ⏳ Queued for Dec 27-28, 2025  
**Feature:** Enhanced Reading Progress (Session Logging, Stats, Heat Map)  
**Estimated Duration:** 8-10 hours  
**Target Completion:** Dec 27-28, 2025  

---

## 📋 QUICK START CHECKLIST

### Prerequisites ✅
- [x] Database migration created: `supabase/migrations/20251225_phase_3_enhanced_reading_progress.sql`
- [x] TypeScript types created: `types/phase3.ts` (ReadingSession, ReadingProgressExtended, etc.)
- [x] Zustand store created: `lib/stores/progress-store.ts`
- [x] Dependencies: All present (zustand already installed)

### Phase 2 Dependencies
- [x] Feature 1 (Custom Bookshelves) - Core infrastructure complete
- [x] Feature 2 (Reading Challenges) - Should be complete before starting this
- [x] API patterns established from both previous features
- [x] Component patterns established from both previous features

---

## 🎯 IMPLEMENTATION SEQUENCE (Recommended Order)

### STEP 1: Progress API Endpoints (90 minutes) ⏱️
**File:** `app/api/reading-sessions/` and `app/api/reading-progress/` folders  
**Priority:** HIGH - Required before components can function

#### 1.1 POST /api/reading-sessions - Create Session (20 min)
```typescript
// File: app/api/reading-sessions/route.ts
// Purpose: Log a reading session (one sitting with a book)
// Method: POST
// Body: { bookId, pages, duration, mood?, location?, notes? }
// RLS: user_id from session
// Returns: ReadingSession with calculated stats
```

**Key Implementation Details:**
- Extract book ID from body
- Get user from session (validate auth)
- Validate pages and duration are positive
- Insert into `reading_sessions` table with session_date = TODAY
- Trigger: auto-updates reading_calendar (heat map)
- Trigger: auto-updates reading_progress_extended (aggregated stats)
- Return created session with full details
- Error handling: invalid book, invalid inputs, database errors

**Database Interaction:**
```sql
INSERT INTO reading_sessions 
  (user_id, book_id, pages, duration, mood, location, session_date)
VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE);

-- Triggers: 
-- update_reading_progress_stats → updates totals
-- update_reading_calendar → updates heat map
-- update_reading_streaks → recalculates streaks
```

#### 1.2 GET /api/reading-sessions - List Sessions (20 min)
```typescript
// File: app/api/reading-sessions/route.ts (GET)
// Purpose: Fetch user's reading sessions with pagination
// Method: GET
// Query: ?bookId=xyz&skip=0&take=20&year=2025&month=12
// RLS: user_id from session
// Returns: PaginatedResponse<ReadingSession[]>
```

**Key Implementation Details:**
- Get user from session
- Query sessions from DB with optional filters
- Support bookId filter (reading progress for specific book)
- Support date range filters (month, year)
- Pagination with skip/take (default 20, max 100)
- Sort by session_date DESC (most recent first)
- Return with total count for pagination
- Error handling: invalid pagination params

#### 1.3 PATCH /api/reading-sessions/:id - Update Session (20 min)
```typescript
// File: app/api/reading-sessions/[id]/route.ts (PATCH)
// Purpose: Update reading session details
// Method: PATCH
// Body: { pages?, duration?, mood?, location?, notes? }
// RLS: user_id from session
// Returns: Updated ReadingSession
```

**Key Implementation Details:**
- Validate ownership (user_id matches)
- Update fields provided (partial update)
- Triggers automatically recalculate affected stats
- Return updated session
- Error handling: not found, not owner, invalid data

#### 1.4 DELETE /api/reading-sessions/:id - Delete Session (15 min)
```typescript
// File: app/api/reading-sessions/[id]/route.ts (DELETE)
// Purpose: Remove reading session
// Method: DELETE
// Body: None
// RLS: user_id from session
// Returns: { success: true }
```

**Key Implementation Details:**
- Validate ownership
- Delete from sessions table
- Triggers automatically recalculate stats
- Error handling: not found, not owner

#### 1.5 GET /api/reading-progress/:bookId - Book Progress (15 min)
```typescript
// File: app/api/reading-progress/[bookId]/route.ts
// Purpose: Get progress stats for a specific book
// Method: GET
// Query: None (bookId in path)
// RLS: user_id from session
// Returns: ReadingProgressExtended
```

**Key Implementation Details:**
- Get user from session
- Query from reading_progress_extended table for specific book
- Return: pages_read, time_spent, sessions_count, completion_percent, last_session
- Error handling: not found, no progress yet

#### 1.6 GET /api/reading-streak - Current Reading Streak (15 min)
```typescript
// File: app/api/reading-streak/route.ts
// Purpose: Get user's current reading streak
// Method: GET
// Query: None
// RLS: user_id from session
// Returns: ReadingStreak
```

**Key Implementation Details:**
- Get user from session
- Query from reading_streaks table (latest row)
- Return: current_streak_days, longest_streak_days, last_read_date
- Calculate streak from reading_calendar (consecutive days with sessions)
- Error handling: no data (new user)

#### 1.7 GET /api/reading-stats - Overall Statistics (15 min)
```typescript
// File: app/api/reading-stats/route.ts
// Purpose: Get overall reading statistics
// Method: GET
// Query: ?year=2025&month=12
// RLS: user_id from session
// Returns: { totalPages, totalMinutes, sessionsCount, booksRead, currentStreak, longestStreak }
```

**Key Implementation Details:**
- Get user from session
- Query reading_progress_extended for all books (or filtered by year/month)
- Aggregate: sum pages, sum minutes, count sessions, count distinct books
- Include streak data
- Optional filtering by year/month for specific timeframe
- Error handling: no data

#### 1.8 GET /api/reading-calendar - Monthly Heat Map Data (15 min)
```typescript
// File: app/api/reading-calendar/route.ts
// Purpose: Get daily reading data for heat map
// Method: GET
// Query: ?year=2025&month=12
// RLS: user_id from session
// Returns: ReadingCalendarDay[]
```

**Key Implementation Details:**
- Get user from session
- Query reading_calendar table for specified month/year
- Return array of { date, pages, minutes, sessions_count, activity_level }
- activity_level: calculated as (pages + minutes/10) to show intensity
- Used for GitHub-style contribution heat map
- Error handling: invalid year/month params

---

### STEP 2: Progress React Components (2.5-3 hours)

#### 2.1 SessionLogger.tsx (40 min)
```typescript
// File: components/session-logger.tsx
// Purpose: Modal/form to log a reading session
// Features:
//   - Book selector dropdown (search your library)
//   - Pages input
//   - Duration input (minutes)
//   - Mood selector (happy, focused, relaxed, tired, etc.)
//   - Location selector (home, cafe, park, commute, etc.)
//   - Optional notes field
//   - Quick log button (remember last inputs)
//   - Validation and error messages
// Props: { isOpen: boolean, onClose: () => void, onSubmit: (session) => void, bookId?: string }
```

**Implementation Pattern:** Follow `ShelfCreationModal.tsx`
- Use Shadcn Dialog for modal
- Form with Zod validation
- Book autocomplete
- Mood/location dropdowns
- Quick log with localStorage for last values
- Loading spinner on submit

#### 2.2 ReadingCalendarHeatmap.tsx (40 min)
```typescript
// File: components/reading-calendar-heatmap.tsx
// Purpose: GitHub-style heat map of reading activity
// Features:
//   - Display calendar grid (12 months × 31 days)
//   - Color intensity based on pages read
//   - Tooltip on hover showing pages/time
//   - Month/year navigation
//   - Legend showing intensity scale
//   - Responsive (adapts to mobile)
// Props: { year?: number, month?: number }
```

**Implementation Pattern:** Similar to chart components
- Use CSS Grid for calendar
- Color mapping: activity_level → color intensity
- SVG or canvas for better performance on large calendars
- Responsive design (single column on mobile)
- Fetch from progress-store

#### 2.3 StreakCounter.tsx (25 min)
```typescript
// File: components/streak-counter.tsx
// Purpose: Display current and longest reading streaks
// Features:
//   - Large current streak number with "days" label
//   - Longest streak badge
//   - Fire emoji or streak icon
//   - Motivational message based on streak
//   - Days until longest record
// Props: { streak: ReadingStreak }
```

**Implementation Pattern:** Simple display component
- Use large typography for streak numbers
- Icon/emoji for visual appeal
- Color coding (gold for new record)
- Mobile responsive

#### 2.4 StatsDashboard.tsx (35 min)
```typescript
// File: components/stats-dashboard.tsx
// Purpose: Overview of reading statistics
// Features:
//   - Total pages (this month, this year, all time)
//   - Total reading time
//   - Books completed (count)
//   - Average pages per session
//   - Average time per session
//   - Stats cards in grid
//   - Optional chart showing trends (line chart of pages over time)
//   - Summary text ("You've read X pages this year")
// Props: { year?: number, month?: number }
```

**Implementation Pattern:** Grid of stat cards
- Use Shadcn Card components
- Grid layout (2-4 columns)
- Number formatting (K for thousands, M for millions)
- Optional chart with Recharts
- Responsive (1 column on mobile)

#### 2.5 ProgressTimeline.tsx (30 min)
```typescript
// File: components/progress-timeline.tsx
// Purpose: Timeline showing recent reading sessions
// Features:
//   - Vertical timeline of sessions (newest first)
//   - Book cover thumbnail
//   - Session details (pages, time, mood, location)
//   - Relative time ("2 hours ago", "yesterday")
//   - Session count per day grouping
//   - Edit/delete buttons for each session
//   - Load more pagination
// Props: { limit?: number, bookId?: string }
```

**Implementation Pattern:** Scrollable list
- Use Shadcn Card for each session entry
- Relative time calculation
- Group by date
- Pagination with load more button
- Mobile responsive

---

## 📊 DATA FLOW DIAGRAM

```
User Reading Session → SessionLogger → Progress Store → API POST → Database → RLS → Triggers
         ↓                 ↓                  ↓              ↓         ↓        ↓      ↓
Log 50 pages     Form validation     dispatch         INSERT    reading_   user_   Updates:
in 45 mins       + submission      createSession()   sessions  sessions   id      1. stats
                                                      table     checks     2. calendar
                                                                           3. streaks
                                                     
View Stats       StatsDashboard   → fetch     GET    Query      Sums pages/time
                 + Heatmap          stats()   /stats all sessions per month

View Streak      StreakCounter    → fetch     GET    Query      Calculates
                                    streak()  /streak consecutive days

View Timeline    ProgressTimeline → fetch     GET    Query      Most recent
                                    sessions()  /sessions 20 entries
```

---

## 🔗 DATABASE REFERENCES

### Already Created Tables:
1. `reading_sessions` - Individual reading sessions
   - Fields: id, user_id, book_id, pages, duration, mood, location, session_date, created_at
   - RLS: user_id protection

2. `reading_progress_extended` - Aggregated stats per book
   - Fields: id, user_id, book_id, total_pages, total_minutes, session_count, completed_at
   - RLS: user_id protection

3. `reading_streaks` - Streak tracking
   - Fields: id, user_id, current_streak_days, longest_streak_days, last_read_date
   - RLS: user_id protection

4. `reading_calendar` - Daily heat map data
   - Fields: id, user_id, calendar_date, pages_read, minutes_spent, session_count
   - RLS: user_id protection

### Key Triggers:
```sql
FUNCTION: update_reading_progress_stats()
-- Called on INSERT/UPDATE reading_sessions
-- Aggregates: SUM(pages), SUM(duration), COUNT(sessions) by book
-- Updates reading_progress_extended table

FUNCTION: update_reading_calendar()
-- Called on INSERT reading_sessions
-- Creates/updates reading_calendar entry for that day
-- Stores: date, pages, minutes, session count

FUNCTION: update_reading_streaks()
-- Called on INSERT reading_sessions
-- Calculates consecutive reading days
-- Updates current_streak_days in reading_streaks
-- Updates longest_streak_days if new record
```

---

## 🎮 TESTING CHECKLIST

### API Testing (Postman/Manual)
- [ ] POST /api/reading-sessions - Log session with all fields
- [ ] GET /api/reading-sessions - List sessions, test pagination
- [ ] PATCH /api/reading-sessions/:id - Update pages/mood
- [ ] DELETE /api/reading-sessions/:id - Remove session
- [ ] GET /api/reading-progress/:bookId - Check aggregated stats
- [ ] GET /api/reading-streak - Verify streak calculation
- [ ] GET /api/reading-stats - Get overall statistics
- [ ] GET /api/reading-calendar - Get heat map data
- [ ] Error cases: no auth, invalid book, invalid data

### Component Testing (Manual)
- [ ] SessionLogger - Log session, verify in timeline
- [ ] Heatmap - Display calendar, tooltips work, colors change
- [ ] StreakCounter - Shows correct numbers, updates after logging
- [ ] StatsDashboard - Stats match API data
- [ ] Timeline - Displays sessions, pagination works, edit/delete work
- [ ] Mobile responsive - All components work on mobile

### Integration Testing
- [ ] Log session → See in timeline
- [ ] Log session → Streak updates
- [ ] Log session → Heat map shows activity
- [ ] Log session → Stats update
- [ ] Delete session → All UI updates
- [ ] Store persists across navigation

---

## 📝 CODE PATTERNS TO FOLLOW

### API Route Pattern (from previous features)
```typescript
import { getServerSession } from "next-auth";
import { Zod validation schema }
import { progress-store actions }

export async function POST(request: Request) {
  // 1. Auth check
  const session = await getServerSession();
  if (!session?.user?.id) return Response { status: 401 }
  
  // 2. Parse & validate
  const body = await request.json();
  const validated = schema.parse(body);
  
  // 3. Database operation (RLS handles user isolation)
  const result = await db
    .from('reading_sessions')
    .insert({ ...validated, user_id: session.user.id });
  
  // 4. Handle errors
  if (result.error) return Response { status: 400, error }
  
  // 5. Return result
  return Response.json(result.data);
}
```

### Component Pattern (from previous features)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useProgressStore } from '@/lib/stores/progress-store';

export function ProgressComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const stats = useProgressStore(s => s.stats);
  const fetchStats = useProgressStore(s => s.fetchStats);
  
  useEffect(() => {
    fetchStats()
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [fetchStats]);
  
  if (isLoading) return <LoadingSkeleton />;
  if (!stats) return <div>No data yet</div>;
  
  return (
    <div>
      {/* component JSX */}
    </div>
  );
}
```

---

## ⚡ PERFORMANCE CONSIDERATIONS

### Query Optimization
- Use `progress-store` caching to avoid repeated fetches
- Calendar query: only fetch one month at a time
- Sessions list: pagination (default 20, max 50)
- Stats: cache for 5 minutes (user won't log multiple sessions quickly)

### Component Optimization
- Lazy load heat map (don't render until tab clicked)
- Memoize session cards in timeline
- Use React.memo for stat cards
- Defer non-critical calculations

### Database
- All RLS policies in place (enforced by migration)
- Indexes on: user_id, book_id, session_date
- Triggers handle automatic calculations (no client-side aggregation)
- Calendar query uses indexed date range

---

## 🚨 COMMON PITFALLS TO AVOID

1. **Streak Calculation Bugs** - Ensure consecutive day detection works (test gaps)
2. **Time Zone Issues** - Use CURRENT_DATE for session_date (not UTC timestamp)
3. **N+1 Queries** - Don't query each day separately for calendar, fetch month at once
4. **Duplicate Sessions** - Check for duplicate submissions within 5 minutes
5. **Missing RLS** - All queries must respect user_id isolation
6. **Heat Map Performance** - Don't render 365 days if only showing 30-day month
7. **Forgot Update Cascades** - When deleting session, stats must update via trigger

---

## 📚 REFERENCE FILES

- **Store:** `lib/stores/progress-store.ts` - Zustand actions ready to use
- **Types:** `types/phase3.ts` - All TypeScript interfaces
- **Patterns:** 
  - API: `app/api/shelves/route.ts` - Follow POST/GET pattern
  - Component: `components/shelf-card.tsx` - Follow display pattern
  - Modal: `components/shelf-creation-modal.tsx` - Follow form pattern
- **Database:** `supabase/migrations/20251225_phase_3_enhanced_reading_progress.sql` - Schema reference

---

## 🎯 SUCCESS CRITERIA

✅ **When Feature 3 is complete, you should have:**
1. All 8 API endpoints created and working
2. All 5 React components built and integrated
3. Session logging, stats tracking, and heat map functional
4. Streak calculation working correctly
5. Zero TypeScript errors
6. Store properly managing progress state
7. Tests passing for core flows

**Time Estimate:** 8-10 hours  
**Actual Time Tracking:** [To be filled in as work progresses]

---

## 🔄 NEXT STEPS AFTER COMPLETION

1. Test all endpoints in isolation (especially streak calculation)
2. Test full user flow: log session → see in timeline → check streak
3. Test calendar with various date ranges
4. Test mobile responsiveness
5. **Feature 1 Completion:** Finish Custom Bookshelves testing (if needed)
6. Integration Testing (all 3 features together)
7. Target: Sprint 6 complete by Dec 31

---

## 💡 ADVANCED ENHANCEMENTS (After MVP)

### Phase 2 Improvements:
- Streak notifications ("You're on a 7-day streak!")
- Reading goals with milestones
- Automatic book completion detection (pages_read == book.page_count)
- Time-of-day analytics (when do you read most?)
- Reading pace calculator (pages/hour)
- Book completion predictions
- Reading speed tracking

### Phase 3 Integration:
- Link reading sessions to challenges (auto-progress challenges)
- Reading badges (read 1000 pages, 50-book club, etc.)
- Monthly leaderboard (by pages read)
- Friends' reading activity (see what friends are reading)

---

**Good luck! You've got this! 🚀**

*Feature 2 (Reading Challenges) should be complete before starting this feature.*  
*Expected start: Dec 27, 2025 after Feature 2 completion.*
