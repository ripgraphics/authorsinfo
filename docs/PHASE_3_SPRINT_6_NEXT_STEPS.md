# Phase 3 Sprint 6 - Next Steps Quick Guide

**Updated:** December 25, 2025  
**Current Phase:** Phase 3 Sprint 6 🚀 40% Complete  
**Next Task:** Reading Challenges Feature (Dec 26)

---

## 🎯 IMMEDIATE NEXT STEPS

### Task 1: Implement Reading Challenges APIs (90 minutes) ⚡

**Start Date:** December 26, 2025  
**Estimated Duration:** 90 minutes  
**Files to Create:** 1 new file  
**Files to Modify:** 1 existing file

#### Step 1.1: Create `app/api/challenges/[id]/route.ts`

This file handles individual challenge operations:

```typescript
// GET /api/challenges/:id - Get single challenge with progress
// PATCH /api/challenges/:id - Update challenge metadata
// DELETE /api/challenges/:id - Delete challenge
```

**Specifications:**
- Accept `id` as route parameter
- GET: Return challenge with tracking data (use challenge_tracking aggregation)
- PATCH: Validate with Zod, update only modified fields
- DELETE: Validate user ownership via RLS
- Use session validation on all endpoints
- Add proper error handling and logging

**Reference Pattern:** Use `app/api/shelves/[id]/route.ts` as your template

#### Step 1.2: Create `app/api/challenges/[id]/progress/route.ts`

This file handles challenge progress logging:

```typescript
// POST /api/challenges/:id/progress - Log progress toward challenge
```

**Specifications:**
- Accept challenge ID and user ID from session
- Body: { currentValue: number } - increment or set (based on goalType)
- Validate goalType (books, pages, minutes, authors)
- Trigger auto-completion if currentValue >= target
- Return updated challenge with new progress
- Database: Insert into challenge_tracking table
- The auto-calculation trigger will handle the rest

**Key Points:**
- Challenge progress is NOT manually calculated - triggers handle it
- Just log the user's action, let database do the math
- Return the updated challenge data from the RLS-protected view

#### Step 1.3: Create `app/api/challenges/leaderboard/route.ts`

This file returns the leaderboard for a year:

```typescript
// GET /api/challenges/leaderboard?year=2025
```

**Specifications:**
- Accept `year` query parameter (default: current year)
- Query the `reading_challenge_leaderboard` materialized view
- Return ranked list with position, user, score, challenge_count
- Support pagination: ?skip=0&take=20
- Leaderboard is PUBLIC (no authentication required for view)
- Add caching for performance (1 hour TTL)

**Database Query:**
```sql
SELECT * FROM reading_challenge_leaderboard 
WHERE EXTRACT(YEAR FROM completed_date) = :year
ORDER BY rank ASC
LIMIT :take OFFSET :skip
```

#### Step 1.4: Create `app/api/challenges/templates/route.ts`

This file returns challenge templates:

```typescript
// GET /api/challenges/templates
```

**Specifications:**
- Return array of challenge templates
- Each template: name, description, goalType, target, icon, difficulty
- Include predefined challenges (e.g., "Read 12 books", "1000 pages", "Daily reader")
- No database query needed - define as constants in code
- Cache in memory (never changes)

**Example Template:**
```typescript
{
  id: "read-12-books",
  name: "Classic Reader",
  description: "Read 12 books this year",
  goalType: "books",
  target: 12,
  difficulty: "medium"
}
```

### Task 2: Implement Reading Challenges Components (2-3 hours) 🎨

**After APIs are complete**, build these 5 components:

#### Component 1: `components/challenge-creator.tsx`
- Form to create a new challenge
- Input: name, description, goalType dropdown, target number
- Goal type options: books (0-1000), pages (0-50000), minutes (0-100000), authors (0-1000)
- Call POST /api/challenges
- Handle loading state and validation errors
- Modal or drawer interface

#### Component 2: `components/challenge-card.tsx`
- Display individual challenge summary
- Show: name, progress bar, goal, deadline, status badge
- Actions: view details, edit, delete, log progress
- Status colors: active (blue), completed (green), abandoned (gray)
- Compact card layout

#### Component 3: `components/challenge-progress-bar.tsx`
- Animated progress bar component
- Show: currentValue/target, percentage, label
- Color coding based on progress (red <25%, yellow 25-75%, green >75%)
- Display milestone markers if applicable
- Reusable across multiple features

#### Component 4: `components/challenge-leaderboard.tsx`
- Display top challenges and user rankings
- Table or card grid layout
- Columns: rank, user name, avatar, score, badges earned
- Support year filtering dropdown
- Pagination for large leaderboards
- Make it scrollable and responsive

#### Component 5: `components/yearly-challenge-dashboard.tsx`
- Container component combining all challenge features
- Sections:
  1. "Create Challenge" button/modal
  2. "My Challenges" list with filters
  3. "Leaderboard" section
  4. "Statistics" summary
- Use the challenge-store for data management
- Loading skeletons while fetching

---

## 📋 PATTERNS & CONVENTIONS

### API Endpoint Pattern
All challenge endpoints follow this pattern:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 1. Get session
const supabase = createServerClient(...)
const { data: { session }, error: sessionError } = await supabase.auth.getSession()

// 2. Validate input (if POST/PATCH)
const schema = z.object({ /* fields */ })
const data = schema.parse(req.json())

// 3. Execute query (RLS handles authorization)
const { data: result, error } = await supabase
  .from('table_name')
  .operation(...)

// 4. Return response
return NextResponse.json(result, { status: 200 })
```

### Component Pattern
All components follow this pattern:

```typescript
'use client'
import { useEffect } from 'react'
import { useChallengeStore } from '@/lib/stores/challenge-store'

export function ChallengeComponent() {
  const { challenges, loading } = useChallengeStore()
  
  useEffect(() => {
    // Load data on mount
  }, [])
  
  if (loading) return <Skeleton />
  if (!challenges) return <EmptyState />
  
  return (
    // JSX
  )
}
```

### Database Interaction Pattern
Use the challenge-store Zustand store for all data:

```typescript
const { 
  challenges,           // array of challenges
  currentChallenge,     // selected challenge details
  leaderboard,          // leaderboard rankings
  loading,
  leaderboardLoading,
  error
} = useChallengeStore()

// Actions available:
fetchChallenges(year?, status?)
createChallenge(input)
logProgress(challengeId, currentValue)
fetchLeaderboard(year?)
selectChallenge(id)
clearError()
```

---

## 🔗 INTEGRATION WITH EXISTING CODE

### Use Existing Store Methods
The `lib/stores/challenge-store.ts` is already created with all needed actions:

```typescript
// Store is ready to use - just implement the API endpoints
// Store methods will call your new API routes
// Example: store.createChallenge() → POST /api/challenges → database
```

### Reference Shelf Implementation
Your shelf implementation provides the exact pattern:

1. **Database migration** (already done) → `supabase/migrations/20251225_phase_3_reading_challenges.sql`
2. **Types** (already done) → `types/phase3.ts` - has all Challenge types
3. **Zustand store** (already done) → `lib/stores/challenge-store.ts`
4. **API routes** (WHAT YOU'RE BUILDING NOW) → `app/api/challenges/*`
5. **React components** (AFTER APIs) → `components/challenge-*.tsx`

---

## ✅ COMPLETION CHECKLIST

### APIs Complete When:
- [ ] All 6 endpoints created and tested
- [ ] Challenge POST validates input with Zod
- [ ] Progress endpoint correctly increments values
- [ ] Leaderboard returns sorted, ranked results
- [ ] Templates endpoint returns predefined challenges
- [ ] All endpoints return correct status codes (200, 201, 400, 404)
- [ ] Error messages are descriptive
- [ ] No TypeScript errors in `tsc --noEmit`

### Components Complete When:
- [ ] All 5 components created and exported
- [ ] Components use challenge-store for data
- [ ] Loading states and error handling implemented
- [ ] Forms validate input before submission
- [ ] All components compile without errors
- [ ] Mobile responsive layout tested
- [ ] Accessibility features included (alt text, labels)

### Feature Complete When:
- [ ] All APIs deployed to staging
- [ ] All components integrated into dashboard
- [ ] User can create challenges
- [ ] User can log progress
- [ ] Leaderboard displays correctly
- [ ] E2E tests passing
- [ ] No console errors or warnings

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Create API route files
touch app/api/challenges/[id]/route.ts
touch app/api/challenges/[id]/progress/route.ts
touch app/api/challenges/leaderboard/route.ts
touch app/api/challenges/templates/route.ts

# 2. Create component files
touch components/challenge-creator.tsx
touch components/challenge-card.tsx
touch components/challenge-progress-bar.tsx
touch components/challenge-leaderboard.tsx
touch components/yearly-challenge-dashboard.tsx

# 3. Check for TypeScript errors
npm run type-check

# 4. Run local development server
npm run dev
```

---

## 📊 TIME BREAKDOWN

- **Reading Challenges APIs:** 90 minutes (6 endpoints)
- **Reading Challenges Components:** 2-3 hours (5 components)
- **Total:** 4-4.5 hours to complete Feature 2

**Then proceed to:**
- **Enhanced Progress APIs:** 90 minutes (8 endpoints)
- **Enhanced Progress Components:** 2-3 hours (5 components)
- **Total:** 4-4.5 hours to complete Feature 3

**Final steps:**
- **Integration & Testing:** 2-3 hours
- **Polish & Optimization:** 1-2 hours

**Expected Phase 3 Sprint 6 Completion:** December 31, 2025 ✅

---

## 📚 REFERENCE FILES

Review these files for context and patterns:

1. **Database Schema:** `supabase/migrations/20251225_phase_3_reading_challenges.sql`
   - Challenge tables, triggers, RLS policies

2. **Type Definitions:** `types/phase3.ts`
   - ReadingChallenge, ChallengeTracking, LeaderboardEntry types

3. **Zustand Store:** `lib/stores/challenge-store.ts`
   - Challenge state management and actions

4. **Shelf API Reference:** `app/api/shelves/route.ts`
   - Use this as template for POST/GET pattern

5. **Shelf Component Reference:** `components/shelf-manager.tsx`
   - Use this as template for component structure

---

**You're ready to go! Start with the APIs (90 min), then components (2-3 hrs). 🚀**
