# Phase 3 Sprint 6 - Feature 2: Reading Challenges - Implementation Start Guide

**Status:** 🚀 Starting Dec 26, 2025  
**Feature:** Reading Challenges (Goals, Progress Tracking, Leaderboard)  
**Estimated Duration:** 10-12 hours  
**Target Completion:** Dec 27-28, 2025  

---

## 📋 QUICK START CHECKLIST

### Prerequisites ✅
- [x] Database migration created: `supabase/migrations/20251225_phase_3_reading_challenges.sql`
- [x] TypeScript types created: `types/phase3.ts` (ReadingChallenge, ChallengeTracking, etc.)
- [x] Zustand store created: `lib/stores/challenge-store.ts`
- [x] Project dependencies: `npm install zustand` ✅

### Phase 2 Dependencies
- [x] Feature 1 (Custom Bookshelves) - Core infrastructure complete (85% ready)
- [x] API patterns established from shelf endpoints
- [x] Component patterns established from shelf components
- [x] Authentication & session handling verified

---

## 🎯 IMPLEMENTATION SEQUENCE (Recommended Order)

### STEP 1: Challenge API Endpoints (90 minutes) ⏱️
**File:** `app/api/challenges/` folder  
**Priority:** HIGH - Required before components can function

#### 1.1 POST /api/challenges/:id/progress - Log Progress (25 min)
```typescript
// File: app/api/challenges/[id]/progress/route.ts
// Purpose: Log user's progress toward challenge goal
// Method: POST
// Body: { pages?: number, books?: number, minutes?: number, date?: string }
// RLS: user_id from session
// Returns: Updated ChallengeTracking with auto-calculated progress
```

**Key Implementation Details:**
- Extract challenge ID from params
- Get user from session (validate auth)
- Insert into `challenge_tracking` table
- Trigger auto-calculation via PL/pgSQL function
- Return updated challenge with new progress value
- Handle validation: positive numbers, not exceeding goal
- Error handling: challenge not found, invalid user, goal exceeded

**Database Interaction:**
```sql
-- Inserts progress entry
INSERT INTO challenge_tracking (challenge_id, user_id, value, logged_at)
VALUES ($1, $2, $3, NOW())

-- Trigger: update_challenge_progress automatically calculates new total
```

#### 1.2 PATCH /api/challenges/:id - Update Challenge (20 min)
```typescript
// File: app/api/challenges/[id]/route.ts (PATCH)
// Purpose: Update challenge metadata (name, description, goal)
// Method: PATCH
// Body: { name?: string, description?: string, goal?: number }
// RLS: user_id from session
// Returns: Updated challenge
```

**Key Implementation Details:**
- Validate ownership (user_id matches)
- Only allow updates before completion
- Update custom_challenges table
- Return updated challenge with all fields
- Error handling: not found, not owner, already completed

#### 1.3 DELETE /api/challenges/:id - Delete Challenge (15 min)
```typescript
// File: app/api/challenges/[id]/route.ts (DELETE)
// Purpose: Remove challenge
// Method: DELETE
// Body: None
// RLS: user_id from session
// Returns: { success: true }
```

**Key Implementation Details:**
- Validate ownership
- Delete from challenges table (cascade deletes tracking)
- Error handling: not found, not owner

#### 1.4 GET /api/challenges/:id - Get Details (15 min)
```typescript
// File: app/api/challenges/[id]/route.ts (GET)
// Purpose: Fetch single challenge with tracking data
// Method: GET
// Query: None (all data in params/session)
// RLS: user_id from session
// Returns: ChallengeWithTracking (includes tracking entries)
```

**Key Implementation Details:**
- Fetch challenge from DB
- Calculate current progress
- Fetch recent tracking entries (last 10-20)
- Return with all context

#### 1.5 GET /api/challenges/leaderboard - Public Rankings (25 min)
```typescript
// File: app/api/challenges/leaderboard/route.ts
// Purpose: Fetch public leaderboard rankings
// Method: GET
// Query: ?challengeId=xyz&year=2025&limit=100
// RLS: Public (no auth required, but filters by visibility)
// Returns: LeaderboardEntry[]
```

**Key Implementation Details:**
- Query materialized view `reading_challenge_leaderboard`
- Filter by challenge ID if provided
- Filter by year
- Pagination with limit/offset
- Return top users by points/completion
- Error handling: challenge not found

**Database Note:** Uses materialized view for performance
```sql
-- View already created in migration
SELECT * FROM reading_challenge_leaderboard 
WHERE challenge_id = $1 
ORDER BY points DESC 
LIMIT 100
```

#### 1.6 GET /api/challenges/templates - Challenge Templates (15 min)
```typescript
// File: app/api/challenges/templates/route.ts
// Purpose: Fetch pre-defined challenge templates
// Method: GET
// Query: None
// RLS: Public
// Returns: ChallengeTemplate[]
```

**Key Implementation Details:**
- Return static array of templates:
  - "Read 12 books in a year" (books goal type, 12)
  - "Read 3000 pages" (pages goal type, 3000)
  - "Read every day for a year" (minutes goal type, 365 × 30 = 10,950)
  - "Read from 5 new authors" (authors goal type, 5)
  - "Complete a genre challenge" (genre goal type, varies)
- Each includes: name, description, goalType, targetValue, category
- No database query needed

---

### STEP 2: Challenge React Components (2.5-3 hours)

#### 2.1 ChallengeCreator.tsx (40 min)
```typescript
// File: components/challenge-creator.tsx
// Purpose: Form to create new challenge or select template
// Features:
//   - Template selection buttons (5 templates)
//   - Custom challenge form
//   - Goal type selector (books, pages, minutes, authors)
//   - Target value input
//   - Name & description fields
//   - Validation messages
//   - Loading states
// Props: { isOpen: boolean, onClose: () => void, onCreate: (challenge) => void }
```

**Implementation Pattern:** Follow `ShelfCreationModal.tsx` pattern
- Use Shadcn Dialog for modal
- Form with Zod validation
- Real-time form validation
- Error messages
- Loading spinner on submit

#### 2.2 ChallengeCard.tsx (30 min)
```typescript
// File: components/challenge-card.tsx
// Purpose: Display challenge card with progress
// Features:
//   - Challenge title & description
//   - Progress bar (current/goal)
//   - Time remaining (if deadline-based)
//   - Status badge (active, completed, abandoned)
//   - Action buttons (log progress, view leaderboard)
//   - Stats (current value, goal, percentage)
// Props: { challenge: ChallengeWithTracking, onSelect?: (id) => void, onLogProgress?: () => void }
```

**Implementation Pattern:** Follow `ShelfCard.tsx` pattern
- Use Shadcn Card component
- Progress bar component
- Badge for status
- Hover effects
- Mobile responsive

#### 2.3 ChallengeProgressBar.tsx (25 min)
```typescript
// File: components/challenge-progress-bar.tsx
// Purpose: Reusable progress bar component
// Features:
//   - Shows current/goal
//   - Percentage calculation
//   - Color coding (green when approaching goal)
//   - Labels with values
//   - Optional milestone markers
// Props: { current: number, goal: number, label?: string, showPercentage?: boolean }
```

**Implementation Pattern:** Simple, composable component
- Use Shadcn Progress component
- Show text overlay
- Responsive design

#### 2.4 ChallengeLeaderboard.tsx (40 min)
```typescript
// File: components/challenge-leaderboard.tsx
// Purpose: Display public leaderboard rankings
// Features:
//   - Sorted list of top users
//   - Rank badges (gold, silver, bronze)
//   - User avatars
//   - Points/completion percentage
//   - Current user highlighted
//   - Pagination (20 per page)
//   - Loading skeleton
// Props: { challengeId: string, year?: number, limit?: number }
```

**Implementation Pattern:** Follow pagination from ShelfView
- Use Shadcn Table for layout
- Fetch from challenge-store
- useEffect to load leaderboard
- Pagination controls
- Loading states

#### 2.5 YearlyChallengeDashboard.tsx (40 min)
```typescript
// File: components/yearly-challenge-dashboard.tsx
// Purpose: Main dashboard showing all challenges for the year
// Features:
//   - Grid/list view toggle
//   - Filter by status (active, completed, abandoned)
//   - Create challenge button
//   - Challenge cards in grid
//   - Stats summary (total, completed, abandoned)
//   - Quick actions (log progress, view leaderboard)
// Props: { year?: number, editable?: boolean }
```

**Implementation Pattern:** Follow ShelfManager pattern
- Tabs for status filtering
- Grid layout
- Create challenge modal
- Stats section at top
- Error handling

---

## 📊 DATA FLOW DIAGRAM

```
User Action → Component → Zustand Store → API Route → Database → RLS Policy → SQL Trigger
    ↓                        ↓                ↓           ↓          ↓            ↓
Create         ChallengeCreator → dispatch    POST       INSERT    user_id      Created
Challenge                          createChallenge()     challenges checks       challenge
                                                         table

Log Progress   ChallengeCard   → dispatch    POST       INSERT    Validates    Recalculates
                  + ProgressBar  logProgress()          challenge_tracking     current value

View           ChallengeLeaderboard → fetch   GET       Query     Public       Returns
Leaderboard                           leaderboard()     view      (no auth)    top users
```

---

## 🔗 DATABASE REFERENCES

### Already Created Tables:
1. `reading_challenges` - Challenge definitions
   - Fields: id, user_id, name, description, goal_type, goal_value, status, created_at
   - RLS: user_id protection (users see only their own)

2. `challenge_tracking` - Progress entries
   - Fields: id, challenge_id, user_id, value, logged_at
   - RLS: user_id protection

3. `reading_challenge_leaderboard` - Materialized view
   - Pre-calculated rankings for performance
   - Refresh triggers automatically on inserts

### Key Trigger:
```sql
FUNCTION: update_challenge_progress()
-- Automatically recalculates SUM(value) and updates goal_achieved
-- Triggers on INSERT into challenge_tracking
-- Updates challenge.current_progress and status if goal reached
```

---

## 🎮 TESTING CHECKLIST

### API Testing (Postman/Manual)
- [ ] POST /api/challenges/:id/progress - Log 100 pages
- [ ] GET /api/challenges/:id - Verify progress calculated
- [ ] PATCH /api/challenges/:id - Update goal to 5000
- [ ] GET /api/challenges/leaderboard - View top users
- [ ] GET /api/challenges/templates - Verify all 5 templates
- [ ] DELETE /api/challenges/:id - Verify deletion
- [ ] Error cases: no auth, challenge not found, invalid data

### Component Testing (Manual)
- [ ] ChallengeCreator - Create with template, verify saves
- [ ] ChallengeCard - Display shows correct progress
- [ ] ProgressBar - Percentage calculation correct
- [ ] Leaderboard - Rankings display, pagination works
- [ ] Dashboard - Filter by status, create new, see updates
- [ ] Mobile responsive - All components work on mobile

### Integration Testing
- [ ] Create challenge → Log progress → Progress updates
- [ ] Create challenge → View on leaderboard
- [ ] Edit challenge → See updated in dashboard
- [ ] Delete challenge → Removed from dashboard
- [ ] Store persists data across page navigation

---

## 📝 CODE PATTERNS TO FOLLOW

### API Route Pattern (from shelves)
```typescript
import { getServerSession } from "next-auth";
import { Zod validation schema }
import { challenge-store actions }

export async function POST(request: Request, { params }) {
  // 1. Auth check
  const session = await getServerSession();
  if (!session?.user?.id) return Response { status: 401 }
  
  // 2. Parse & validate
  const body = await request.json();
  const validated = schema.parse(body);
  
  // 3. Database operation (RLS handles user isolation)
  const result = await db
    .from('table_name')
    .insert({ ...validated, user_id: session.user.id });
  
  // 4. Handle errors
  if (result.error) return Response { status: 400, error }
  
  // 5. Return result
  return Response.json(result.data);
}
```

### Component Pattern (from shelves)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useChallengeStore } from '@/lib/stores/challenge-store';

export function ChallengeComponent({ challengeId }) {
  const [isLoading, setIsLoading] = useState(true);
  const challenges = useChallengeStore(s => s.challenges);
  const fetchChallenge = useChallengeStore(s => s.fetchChallenge);
  
  useEffect(() => {
    fetchChallenge(challengeId)
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [challengeId, fetchChallenge]);
  
  if (isLoading) return <LoadingSkeleton />;
  if (!challenge) return <div>Not found</div>;
  
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
- Use `challenge-store` caching to avoid repeated fetches
- Leaderboard uses materialized view (refreshes on trigger)
- Pagination on large leaderboards (limit 100)

### Component Optimization
- Lazy load leaderboard (don't fetch until clicked)
- Memoize progress calculations
- Use React.memo for challenge cards in grid

### Database
- All RLS policies already in place (enforced by migration)
- Indexes already created on user_id, challenge_id
- Triggers handle automatic calculations

---

## 🚨 COMMON PITFALLS TO AVOID

1. **Forgetting Auth Check** - Every API needs session validation
2. **Not Using RLS** - Don't add manual user_id checks if RLS handles it
3. **N+1 Queries** - Batch progress fetches, don't query per entry
4. **Hardcoding User ID** - Always get from session
5. **Missing Error Handling** - Validate all inputs with Zod
6. **Not Using Store** - Centralize state in Zustand, not component state
7. **Forgetting Timestamps** - Database triggers handle this, don't set manually

---

## 📚 REFERENCE FILES

- **Store:** `lib/stores/challenge-store.ts` - Zustand actions ready to use
- **Types:** `types/phase3.ts` - All TypeScript interfaces
- **Patterns:** 
  - API: `app/api/shelves/route.ts` - Follow this POST/GET pattern
  - Component: `components/shelf-card.tsx` - Follow this display pattern
  - Modal: `components/shelf-creation-modal.tsx` - Follow this form pattern
- **Database:** `supabase/migrations/20251225_phase_3_reading_challenges.sql` - Schema reference

---

## 🎯 SUCCESS CRITERIA

✅ **When Feature 2 is complete, you should have:**
1. All 6 API endpoints created and working
2. All 5 React components built and integrated
3. Challenge creation, logging, and leaderboard functional
4. Zero TypeScript errors
5. Store properly managing challenge state
6. Tests passing for core flows

**Time Estimate:** 10-12 hours  
**Actual Time Tracking:** [To be filled in as work progresses]

---

## 🔄 NEXT STEPS AFTER COMPLETION

1. Test all endpoints in isolation
2. Test full user flow: create → log → view leaderboard
3. Test mobile responsiveness
4. Move on to Feature 3: Enhanced Progress Tracking (Dec 27-28)
5. After both features complete: Integration & Testing (Dec 28-30)
6. Target: Sprint 6 complete by Dec 31

---

**Good luck! You've got this! 🚀**
