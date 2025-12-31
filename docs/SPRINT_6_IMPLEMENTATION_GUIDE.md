# Sprint 6 Implementation Guide: Advanced Book Management
**Status:** Ready to Begin  
**Priority:** High (Foundation for future features)  
**Expected Duration:** 26-32 hours (3-4 days)

---

## 📋 Sprint 6 Overview

This sprint implements three foundational features that enable book organization and reading tracking:

1. **Custom Bookshelves** - User-created book organization
2. **Reading Challenges** - Goal-based reading system
3. **Enhanced Reading Progress** - Detailed tracking and analytics

These features work together to provide a complete book management system.

---

## ✨ Feature 1: Custom Bookshelves (8-10 hours)

### What Users Will See
- Ability to create custom book shelves (e.g., "Summer Reads", "Wishlist")
- Default shelves: "Read", "Reading", "Want to Read"
- Drag-and-drop interface to move books between shelves
- Shelf settings (rename, reorder, description)
- Each shelf displays book grid with cover images

### Database Changes Required

```sql
-- 1. Create custom_shelves table
CREATE TABLE custom_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. Create shelf_books junction table
CREATE TABLE shelf_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id UUID NOT NULL REFERENCES custom_shelves(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  display_order INTEGER,
  UNIQUE(shelf_id, book_id)
);

-- 3. Create indexes for performance
CREATE INDEX idx_custom_shelves_user_id ON custom_shelves(user_id);
CREATE INDEX idx_custom_shelves_user_order ON custom_shelves(user_id, display_order);
CREATE INDEX idx_shelf_books_shelf_id ON shelf_books(shelf_id);
CREATE INDEX idx_shelf_books_book_id ON shelf_books(book_id);
```

### Backend API Endpoints

```typescript
// POST /api/shelves
// Create a new shelf
// Body: { name, description?, icon?, color? }
// Returns: { id, name, description, icon, color, books: [] }

// GET /api/shelves
// List all user's shelves with book counts
// Returns: [{ id, name, description, bookCount, isDefault, displayOrder }]

// GET /api/shelves/:id
// Get shelf details with all books
// Query params: ?skip=0&take=20 (pagination)
// Returns: { id, name, description, books: [...] }

// PATCH /api/shelves/:id
// Update shelf metadata
// Body: { name?, description?, icon?, color?, displayOrder? }
// Returns: updated shelf

// DELETE /api/shelves/:id
// Delete a shelf (soft delete or move books to default)
// Returns: { success: true }

// POST /api/shelves/:id/books
// Add book to shelf
// Body: { bookId, displayOrder? }
// Returns: { bookId, addedAt }

// DELETE /api/shelves/:id/books/:bookId
// Remove book from shelf
// Returns: { success: true }

// PATCH /api/shelves/:id/books/:bookId
// Update book position in shelf
// Body: { displayOrder }
// Returns: updated position

// PATCH /api/shelves/reorder
// Reorder multiple shelves
// Body: { shelves: [{ id, displayOrder }] }
// Returns: { success: true }
```

### React Components to Build

```typescript
// 1. ShelfManager.tsx
// Main component managing all shelves
// Props: { userId }
// Features:
// - List of all user's shelves
// - Create new shelf button/modal
// - Shelf settings dropdown
// - Active shelf selector

// 2. ShelfSelector.tsx
// Dropdown/popup for selecting shelf
// Props: { selectedShelfId, onShelfSelect }
// Features:
// - Alphabetical shelf list
// - Book count per shelf
// - Search/filter shelves

// 3. ShelfView.tsx
// Display books in a shelf with grid layout
// Props: { shelfId, editable? }
// Features:
// - Book grid/list view toggle
// - Pagination for many books
// - Loading skeleton
// - Empty state

// 4. ShelfReorder.tsx
// Drag-and-drop reordering interface
// Props: { shelfId }
// Features:
// - Drag books between shelves
// - Drop zones for each shelf
// - Optimistic updates
// - Undo functionality

// 5. ShelfSettings.tsx
// Edit shelf metadata
// Props: { shelfId, onClose }
// Features:
// - Edit name/description
// - Pick color and icon
// - Delete shelf confirmation
// - Set as default shelf

// 6. ShelfCard.tsx (reusable)
// Display single shelf preview
// Props: { shelf, onSelect, onSettings }

// 7. ShelfCreationModal.tsx
// Modal to create new shelf
// Props: { isOpen, onClose, onCreate }
// Features:
// - Name input (required)
// - Description textarea
// - Icon picker
// - Color picker
// - Validation

// 8. ShelfActionsMenu.tsx
// Context menu for shelf operations
// Props: { shelfId }
// Features:
// - Rename
// - Delete
// - Set as default
// - Share (future)
```

### State Management

```typescript
// Zustand store for shelves
interface ShelfStore {
  shelves: CustomShelf[];
  selectedShelfId: UUID | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchShelves: () => Promise<void>;
  createShelf: (name: string, description?: string) => Promise<CustomShelf>;
  updateShelf: (id: UUID, updates: Partial<CustomShelf>) => Promise<void>;
  deleteShelf: (id: UUID) => Promise<void>;
  selectShelf: (id: UUID) => void;
  addBookToShelf: (shelfId: UUID, bookId: UUID) => Promise<void>;
  removeBookFromShelf: (shelfId: UUID, bookId: UUID) => Promise<void>;
  reorderShelves: (shelves: ShelfOrder[]) => Promise<void>;
}
```

### Testing Checklist

- [ ] Create shelf with various names (short, long, special chars)
- [ ] Update shelf name and description
- [ ] Delete shelf (handle book placement)
- [ ] Add book to shelf
- [ ] Remove book from shelf
- [ ] Reorder books in shelf (drag-drop)
- [ ] View shelf with 0, 1, 100+ books
- [ ] Pagination works correctly
- [ ] Mobile responsive design
- [ ] Proper error messages

---

## 🎯 Feature 2: Reading Challenges (10-12 hours)

### What Users Will See
- Create reading goals (e.g., "Read 12 books this year")
- Progress bar showing goal completion
- Challenge templates to choose from
- Public leaderboards to compare with friends
- Challenge history and stats

### Database Changes Required

```sql
-- 1. Create reading_challenges table
CREATE TABLE reading_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL,
  -- goal_type: 'books', 'pages', 'minutes', 'authors'
  goal_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  challenge_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  -- status: 'active', 'completed', 'abandoned'
  is_public BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, challenge_year, title)
);

-- 2. Create challenge_tracking table
CREATE TABLE challenge_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES reading_challenges(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  pages_read INTEGER,
  date_added DATE DEFAULT TODAY(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_reading_challenges_user_id ON reading_challenges(user_id);
CREATE INDEX idx_reading_challenges_year ON reading_challenges(challenge_year);
CREATE INDEX idx_challenge_tracking_challenge_id ON challenge_tracking(challenge_id);
```

### Backend API Endpoints

```typescript
// POST /api/challenges
// Create new challenge
// Body: { title, description?, goalType, goalValue, startDate, endDate, isPublic? }
// Returns: created challenge with id

// GET /api/challenges
// List user's challenges (current year by default)
// Query params: ?year=2025&status=active
// Returns: [{ id, title, goalType, goalValue, currentValue, progress%, ... }]

// GET /api/challenges/:id
// Get challenge details with tracking history
// Returns: { ...challenge, tracking: [...] }

// PATCH /api/challenges/:id
// Update challenge (title, description, goal, status)
// Body: { title?, description?, goalValue?, status?, isPublic? }
// Returns: updated challenge

// DELETE /api/challenges/:id
// Delete challenge
// Returns: { success: true }

// POST /api/challenges/:id/progress
// Log progress toward challenge
// Body: { bookId, pagesRead?, date? }
// Returns: updated challenge with new progress

// GET /api/challenges/leaderboard
// Get public challenges leaderboard
// Query params: ?metric=completion&limit=100
// Returns: [{ rank, userId, userName, progress, challenge, ... }]

// GET /api/challenges/templates
// Get predefined challenge templates
// Returns: [{ id, title, description, goalType, goalValue, ... }]

// POST /api/challenges/from-template
// Create challenge from template
// Body: { templateId, startDate, endDate }
// Returns: created challenge
```

### React Components to Build

```typescript
// 1. ChallengeCreator.tsx
// Interface to create new challenge
// Props: { onCreated }
// Features:
// - Challenge template selection
// - Custom goal input
// - Date range picker
// - Public/private toggle

// 2. ChallengeProgressBar.tsx
// Visual progress indicator
// Props: { challenge }
// Features:
// - Animated progress bar
// - Percentage display
// - Days remaining
// - Completion date estimate

// 3. ChallengeCard.tsx
// Display single challenge
// Props: { challenge, onSelect, onProgress }
// Features:
// - Progress visualization
// - Goal summary
// - Quick progress log button

// 4. ChallengeLeaderboard.tsx
// Display public challenge rankings
// Props: {}
// Features:
// - Sort by completion/users/latest
// - Pagination
// - Filter by goal type
// - Search challenges

// 5. ChallengeHistory.tsx
// Show past completed challenges
// Props: { userId }
// Features:
// - Timeline of challenges
// - Stats per challenge
// - Compare year-over-year

// 6. YearlyChallengeDashboard.tsx
// Overview of current year's challenges
// Props: {}
// Features:
// - Multiple active challenges
// - Overall progress widget
// - Quick add button
// - Performance stats

// 7. ProgressLogger.tsx
// Quick interface to log reading progress
// Props: { challengeId, onLogged }
// Features:
// - Book selector
// - Pages read input
// - Date picker
// - Quick submission

// 8. ChallengeTemplates.tsx
// Browse and select templates
// Props: { onSelect }
```

### State Management

```typescript
interface ChallengeStore {
  challenges: ReadingChallenge[];
  currentChallenge: ReadingChallenge | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  
  // Actions
  fetchChallenges: (year?: number) => Promise<void>;
  createChallenge: (data: CreateChallengeInput) => Promise<ReadingChallenge>;
  updateProgress: (challengeId: UUID, bookId: UUID) => Promise<void>;
  fetchLeaderboard: (metric: string) => Promise<void>;
  completeChallenge: (challengeId: UUID) => Promise<void>;
}
```

### Testing Checklist

- [ ] Create challenge from template
- [ ] Create custom challenge with custom goal
- [ ] Log progress toward challenge
- [ ] Challenge completes when goal reached
- [ ] Leaderboard shows correct rankings
- [ ] Year filtering works
- [ ] Privacy toggle works (public/private)
- [ ] Multiple active challenges
- [ ] Challenge notifications on completion
- [ ] Mobile responsive

---

## 📈 Feature 3: Enhanced Reading Progress (8-10 hours)

### What Users Will See
- Detailed reading session logging (date, pages, time)
- Visual progress timeline
- Reading statistics (pages/day, estimated completion)
- Activity calendar heat map
- Reading mood/rating per session
- Estimated completion date

### Database Changes Required

```sql
-- 1. Extend reading_progress table
ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS (
  pages_read INTEGER DEFAULT 0,
  total_pages INTEGER,
  reading_rate_pages_per_day DECIMAL(5,2),
  estimated_completion_date DATE,
  reading_time_minutes INTEGER DEFAULT 0,
  date_started DATE,
  date_completed DATE
);

-- 2. Create reading_sessions table
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_progress_id UUID NOT NULL REFERENCES reading_progress(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  pages_read INTEGER NOT NULL,
  time_spent_minutes INTEGER,
  notes TEXT,
  mood VARCHAR(50),
  -- mood: 'loved', 'liked', 'okay', 'dnf' (did not finish)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create reading_statistics view
CREATE VIEW reading_statistics AS
SELECT 
  rp.user_id,
  rp.book_id,
  COUNT(rs.id) as session_count,
  SUM(rs.pages_read) as total_pages_read,
  SUM(rs.time_spent_minutes) as total_time_minutes,
  AVG(rs.pages_read) as avg_pages_per_session,
  MAX(rs.session_date) as last_reading_date,
  MIN(rs.session_date) as first_reading_date
FROM reading_progress rp
LEFT JOIN reading_sessions rs ON rp.id = rs.reading_progress_id
GROUP BY rp.user_id, rp.book_id;

-- 4. Create indexes
CREATE INDEX idx_reading_sessions_progress_id ON reading_sessions(reading_progress_id);
CREATE INDEX idx_reading_sessions_date ON reading_sessions(session_date);
```

### Backend API Endpoints

```typescript
// POST /api/reading/:progressId/sessions
// Log a reading session
// Body: { sessionDate, pagesRead, timeSpentMinutes?, notes?, mood? }
// Returns: created session

// GET /api/reading/:progressId/sessions
// Get all sessions for a book
// Query params: ?skip=0&take=50
// Returns: [sessions with calculated stats]

// PATCH /api/reading/:progressId/sessions/:sessionId
// Update reading session
// Body: { pagesRead?, timeSpentMinutes?, notes?, mood? }
// Returns: updated session

// DELETE /api/reading/:progressId/sessions/:sessionId
// Delete a reading session
// Returns: { success: true }

// GET /api/reading/:progressId/stats
// Get reading statistics and analytics
// Returns: { 
//   totalPages, 
//   totalTime, 
//   pagesPerDay, 
//   estimatedCompletionDate,
//   sessionCount,
//   currentStreak,
//   lastReadDate
// }

// GET /api/reading/:progressId/timeline
// Get timeline data for visualization
// Returns: [{ date, pagesRead, cumulativePages, ... }]

// GET /api/users/:userId/reading-calendar
// Get user's reading activity for calendar heat map
// Query params: ?year=2025&month=12
// Returns: { calendar: { date: pagesRead, ... } }

// PATCH /api/reading/:progressId
// Update reading progress (status, pages, etc.)
// Body: { status?, pagesRead?, totalPages? }
// Returns: updated progress with calculated fields
```

### React Components to Build

```typescript
// 1. ReadingSessionLogger.tsx
// Interface to log reading session
// Props: { readingProgressId, bookTitle, onLogged }
// Features:
// - Date picker
// - Pages read input
// - Time spent input
// - Mood selector
// - Notes textarea
// - Smart defaults

// 2. ProgressTimeline.tsx
// Visual timeline of reading progress
// Props: { readingProgressId }
// Features:
// - Timeline graph showing pages read over time
// - Milestone markers
// - Hover tooltips with session details
// - Zoom/pan capabilities

// 3. ReadingStats.tsx
// Statistics and metrics display
// Props: { readingProgressId }
// Features:
// - Pages read summary
// - Reading rate
// - Estimated completion date
// - Session count
// - Average pages per session
// - Time spent

// 4. ReadingCalendar.tsx
// Heat map calendar of reading activity
// Props: { userId }
// Features:
// - GitHub-style activity calendar
// - Color intensity based on pages read
// - Month/year navigation
// - Day click to show session details

// 5. CompletionPredictor.tsx
// Shows estimated completion date
// Props: { readingProgressId }
// Features:
// - Calculated estimate
// - Confidence level
// - Pace comparison
// - Adjustment tips

// 6. SessionCard.tsx
// Display single reading session
// Props: { session, onEdit, onDelete }
// Features:
// - Session details
// - Mood indicator
// - Notes preview
// - Edit/delete actions

// 7. ReadingRateChart.tsx
// Visualization of reading rate
// Props: { readingProgressId }
// Features:
// - Line chart of pages/day
// - Average line
// - Trend analysis

// 8. QuickSessionLogger.tsx
// Minimal interface for quick logging
// Props: { readingProgressId, onLogged }
// Features:
// - Pages input only
// - Auto-date
// - Single button submit
```

### State Management

```typescript
interface ReadingProgressStore {
  progressItems: ReadingProgress[];
  currentProgress: ReadingProgress | null;
  sessions: ReadingSession[];
  stats: ReadingStatistics | null;
  loading: boolean;
  
  // Actions
  fetchProgress: (bookId: UUID) => Promise<void>;
  fetchSessions: (progressId: UUID) => Promise<void>;
  logSession: (progressId: UUID, session: SessionInput) => Promise<void>;
  updateProgress: (progressId: UUID, updates: Partial<ReadingProgress>) => Promise<void>;
  getStatistics: (progressId: UUID) => Promise<ReadingStatistics>;
}
```

### Testing Checklist

- [ ] Create reading session with all fields
- [ ] Create session with minimum fields (pages, date)
- [ ] Edit existing session
- [ ] Delete session
- [ ] Pages read updates progress
- [ ] Estimated completion date calculates correctly
- [ ] Calendar heat map displays correctly
- [ ] Stats update after logging session
- [ ] Timeline graph renders correctly
- [ ] Mobile responsive interface
- [ ] Keyboard shortcuts for quick logging

---

## 🚀 Implementation Order

### Week 1: Custom Bookshelves (8-10 hours)

**Day 1-2:**
- [ ] Create database tables and migrations
- [ ] Create API endpoints (CRUD operations)
- [ ] Build ShelfManager and ShelfView components
- [ ] Implement shelf selection in book pages

**Day 2-3:**
- [ ] Build ShelfReorder (drag-and-drop)
- [ ] Implement ShelfSettings
- [ ] Add shelf creation modal
- [ ] Polish UI and mobile responsiveness
- [ ] Write tests

### Week 1: Reading Challenges (10-12 hours)

**Day 3-4:**
- [ ] Create database tables
- [ ] Build API endpoints
- [ ] Create ChallengeCreator and templates
- [ ] Build progress tracking logic

**Day 4-5:**
- [ ] Implement leaderboard
- [ ] Build ChallengeProgressBar component
- [ ] Add challenge history
- [ ] Write tests

### Week 2: Enhanced Reading Progress (8-10 hours)

**Day 5-6:**
- [ ] Extend database schema
- [ ] Create API endpoints
- [ ] Build ReadingSessionLogger
- [ ] Implement stats calculation

**Day 6-7:**
- [ ] Build timeline and calendar components
- [ ] Add statistics display
- [ ] Polish visualizations
- [ ] Write tests and validate

---

## 📊 Deliverables Checklist

### Code Deliverables
- [ ] Database migrations
- [ ] API routes and logic
- [ ] React components (all 23 components)
- [ ] Zustand stores
- [ ] Utility functions
- [ ] Type definitions (TypeScript)
- [ ] Tests (Jest + React Testing Library)

### Documentation Deliverables
- [ ] API endpoint documentation
- [ ] Component prop documentation
- [ ] Database schema diagram
- [ ] Setup instructions
- [ ] Usage examples

### Quality Assurance
- [ ] Zero TypeScript errors
- [ ] 90%+ test coverage for logic
- [ ] Mobile responsive (320px - 1920px)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance (Lighthouse > 90)
- [ ] Cross-browser tested

---

## 🎯 Success Criteria

✅ **Feature Completion:**
- All 3 features fully implemented
- All 23 components built and tested
- All 15+ API endpoints working
- Database migrations applied

✅ **Quality:**
- Zero TypeScript errors
- 90%+ test coverage
- Mobile responsive
- Accessibility compliant

✅ **Performance:**
- API responses < 200ms
- Component render < 100ms
- Pagination for large data sets
- Optimistic updates where appropriate

---

## 📞 Questions to Answer

Before starting implementation, clarify:

1. **Shelf Features:**
   - Should shelves be shareable with friends/groups?
   - Should there be a default "Want to Read" shelf?
   - Max shelf count per user?

2. **Challenges:**
   - Should challenges have monthly view in addition to yearly?
   - Auto-create yearly challenges for previous completers?
   - Badge rewards for challenge completion?

3. **Reading Progress:**
   - Should reading sessions be editable/deletable?
   - Track reading location (chapter/percentage)?
   - Export reading data as CSV?

---

*Sprint 6 Implementation Guide - Ready to Begin*

**Recommended Next Step:** Confirm database schema and start Day 1 implementation
