/**
 * Phase 3 Feature Types
 * Custom Bookshelves, Reading Challenges, and Enhanced Progress Tracking
 */

import { UUID } from 'crypto';

// =====================================================
// Custom Bookshelves Types
// =====================================================

export interface CustomShelf {
  id: UUID;
  userId: UUID;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  isDefault: boolean;
  isPublic: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShelfBook {
  id: UUID;
  shelfId: UUID;
  bookId: UUID;
  addedAt: Date;
  displayOrder: number;
}

export interface ShelfWithBooks extends CustomShelf {
  books: any[]; // Book objects
  bookCount: number;
}

export interface CreateShelfInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
}

export interface UpdateShelfInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
  displayOrder?: number;
}

export interface ShelfReorderInput {
  shelves: Array<{
    id: UUID;
    displayOrder: number;
  }>;
}

export interface AddBookToShelfInput {
  bookId: UUID;
  displayOrder?: number;
}

// =====================================================
// Reading Challenges Types
// =====================================================

export type GoalType = 'books' | 'pages' | 'minutes' | 'authors';
export type ChallengeStatus = 'active' | 'completed' | 'abandoned';

export interface ReadingChallenge {
  id: UUID;
  userId: UUID;
  title: string;
  description?: string;
  goalType: GoalType;
  goalValue: number;
  currentValue: number;
  challengeYear: number;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  isPublic: boolean;
  completedAt?: Date;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeTracking {
  id: UUID;
  challengeId: UUID;
  bookId?: UUID;
  pagesRead?: number;
  minutesRead?: number;
  dateAdded: Date;
  createdAt: Date;
}

export interface ChallengeWithTracking extends ReadingChallenge {
  tracking: ChallengeTracking[];
  progressPercentage: number;
  daysRemaining: number;
  estimatedCompletionDate?: Date;
}

export interface ChallengeTemplate {
  id: UUID;
  title: string;
  description: string;
  goalType: GoalType;
  goalValue: number;
  durationDays: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedCompletionRate: number; // percentage
}

export interface LeaderboardEntry {
  id: UUID;
  userId: UUID;
  username: string;
  avatarUrl?: string;
  title: string;
  goalType: GoalType;
  goalValue: number;
  currentValue: number;
  progressPercentage: number;
  startDate: Date;
  endDate: Date;
  booksLogged: number;
  rank: number;
  createdAt: Date;
}

export interface CreateChallengeInput {
  title: string;
  description?: string;
  goalType: GoalType;
  goalValue: number;
  startDate: Date;
  endDate: Date;
  isPublic?: boolean;
}

export interface UpdateChallengeInput {
  title?: string;
  description?: string;
  goalValue?: number;
  status?: ChallengeStatus;
  isPublic?: boolean;
}

export interface LogProgressInput {
  bookId?: UUID;
  pagesRead?: number;
  minutesRead?: number;
  date?: Date;
}

export interface LeaderboardQuery {
  metric: 'completion' | 'users' | 'latest';
  goalType?: GoalType;
  limit?: number;
  offset?: number;
}

// =====================================================
// Enhanced Reading Progress Types
// =====================================================

export type ReadingMood = 'excited' | 'relaxed' | 'focused' | 'distracted' | 'tired';
export type ReadingLocation = 'home' | 'commute' | 'library' | 'cafe' | 'other';
export type ProgressStatus = 'reading' | 'completed' | 'abandoned';

export interface ReadingSession {
  id: UUID;
  userId: UUID;
  bookId: UUID;
  sessionDate: Date;
  pagesStartedAt: number;
  pagesEndedAt: number;
  pagesRead: number;
  durationMinutes?: number;
  readingSpeedPpm?: number;
  mood?: ReadingMood;
  notes?: string;
  location?: ReadingLocation;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingProgressExtended {
  id: UUID;
  userId: UUID;
  bookId: UUID;
  totalPagesRead: number;
  totalSessions: number;
  totalDurationMinutes: number;
  averageSessionDuration?: number;
  averageReadingSpeed?: number;
  firstSessionDate?: Date;
  lastSessionDate?: Date;
  completionPercentage: number;
  status: ProgressStatus;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingStreak {
  id: UUID;
  userId: UUID;
  currentStreak: number;
  longestStreak: number;
  longestStreakStartDate?: Date;
  longestStreakEndDate?: Date;
  lastReadingDate?: Date;
  streakUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingCalendarDay {
  id: UUID;
  userId: UUID;
  date: Date;
  sessionsCount: number;
  pagesRead: number;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingStats {
  totalBooksRead: number;
  totalPagesRead: number;
  totalReadingTime: number;
  averageReadingSpeed: number;
  averageSessionDuration: number;
  longestStreak: number;
  currentStreak: number;
  favoriteReadingTime: ReadingMood;
  favoriteLocation: ReadingLocation;
  thisYearStats: {
    booksRead: number;
    pagesRead: number;
    readingTime: number;
  };
  thisMonthStats: {
    booksRead: number;
    pagesRead: number;
    readingTime: number;
  };
}

export interface CreateSessionInput {
  bookId: UUID;
  sessionDate: Date;
  pagesStartedAt: number;
  pagesEndedAt: number;
  durationMinutes?: number;
  mood?: ReadingMood;
  notes?: string;
  location?: ReadingLocation;
}

export interface UpdateSessionInput {
  pagesStartedAt?: number;
  pagesEndedAt?: number;
  durationMinutes?: number;
  mood?: ReadingMood;
  notes?: string;
  location?: ReadingLocation;
}

export interface CalendarHeatmapData {
  date: Date;
  value: number; // pages read
  intensity: 'low' | 'medium' | 'high' | 'very-high';
  sessionsCount: number;
}

export interface MonthlyReadingData {
  month: number;
  year: number;
  booksRead: number;
  pagesRead: number;
  durationMinutes: number;
  averageReadingSpeed: number;
  days: CalendarHeatmapData[];
}

// =====================================================
// Aggregate Types
// =====================================================

export interface UserPhase3Profile {
  shelves: CustomShelf[];
  activeChallenges: ReadingChallenge[];
  completedChallenges: ReadingChallenge[];
  readingProgress: ReadingProgressExtended[];
  readingStreak: ReadingStreak;
  stats: ReadingStats;
}

export interface Phase3Dashboard {
  shelves: ShelfWithBooks[];
  activeChallenges: ChallengeWithTracking[];
  recentSessions: ReadingSession[];
  readingStreak: ReadingStreak;
  monthlyData: MonthlyReadingData;
  quickStats: {
    thisWeek: number; // pages read
    thisMonth: number; // pages read
    currentStreak: number;
    activeBooks: number;
  };
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}

// =====================================================
// Gamification Types (Sprint 7)
// =====================================================

export type BadgeCategory = 'reading' | 'social' | 'challenge' | 'streak' | 'milestone' | 'special';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type RequirementType = 
  | 'books_read' 
  | 'pages_read' 
  | 'streak_days' 
  | 'challenges_completed' 
  | 'friends_count' 
  | 'reviews_written' 
  | 'shelves_created' 
  | 'manual';

export interface Badge {
  id: UUID;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  points: number;
  requirementType: RequirementType;
  requirementValue: number;
  isSecret: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBadge {
  id: UUID;
  userId: UUID;
  badgeId: UUID;
  earnedAt: Date;
  isFeatured: boolean;
  progressValue: number;
  notified: boolean;
  badge?: Badge;
}

export interface Achievement {
  id: UUID;
  userId: UUID;
  achievementType: string;
  achievedAt: Date;
  metadata: Record<string, any>;
}

export interface LeaderboardEntry {
  userId: UUID;
  username: string;
  avatarUrl?: string;
  fullName?: string;
  booksRead: number;
  pagesRead: number;
  badgesEarned: number;
  totalPoints: number;
  challengesCompleted: number;
  currentStreak: number;
  overallRank: number;
  booksRank: number;
  streakRank: number;
}

export interface BadgeProgress {
  badge: Badge;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  isEarned: boolean;
  earnedAt?: Date;
}

export interface UserGamificationProfile {
  badges: UserBadge[];
  featuredBadges: UserBadge[];
  achievements: Achievement[];
  totalPoints: number;
  rank: number;
  nextBadges: BadgeProgress[];
}

// =====================================================
// Reading Analytics Types (Sprint 8)
// =====================================================

export type ReadingFormat = 'physical' | 'ebook' | 'audiobook';
export type AnalyticsSessionMood = 'focused' | 'relaxed' | 'distracted' | 'tired' | 'motivated';
export type GoalMetric = 'pages' | 'minutes' | 'sessions' | 'books';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';

export interface AnalyticsSession {
  id: UUID;
  userId: UUID;
  bookId: UUID | null;
  book?: {
    id: UUID;
    title: string;
    author: string;
    coverUrl?: string;
  };
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  pagesRead: number;
  startPage?: number;
  endPage?: number;
  percentageRead?: number;
  readingLocation?: string;
  readingFormat: ReadingFormat;
  notes?: string;
  sessionMood?: AnalyticsSessionMood;
  pagesPerMinute?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnalyticsSessionInput {
  bookId?: UUID;
  startedAt?: Date;
  endedAt?: Date;
  durationMinutes?: number;
  pagesRead: number;
  startPage?: number;
  endPage?: number;
  readingLocation?: string;
  readingFormat?: ReadingFormat;
  notes?: string;
  sessionMood?: AnalyticsSessionMood;
}

export interface UpdateAnalyticsSessionInput {
  endedAt?: Date;
  durationMinutes?: number;
  pagesRead?: number;
  endPage?: number;
  notes?: string;
  sessionMood?: AnalyticsSessionMood;
}

export interface ReadingStatsCache {
  id: UUID;
  userId: UUID;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  totalSessions: number;
  totalMinutes: number;
  totalPages: number;
  totalBooksStarted: number;
  totalBooksCompleted: number;
  avgSessionMinutes: number;
  avgPagesPerSession: number;
  avgPagesPerMinute: number;
  currentStreak: number;
  longestStreak: number;
  mostActiveHour: number;
  mostActiveDay: number;
  readingSpeedWpm?: number;
  lastCalculatedAt: Date;
}

export interface GenreStats {
  id: UUID;
  userId: UUID;
  genre: string;
  booksRead: number;
  pagesRead: number;
  totalMinutes: number;
  avgRating?: number;
  favoriteAuthors: string[];
  firstReadAt?: Date;
  lastReadAt?: Date;
}

export interface ReadingGoal {
  id: UUID;
  userId: UUID;
  goalType: 'daily' | 'weekly' | 'monthly';
  metric: GoalMetric;
  targetValue: number;
  currentValue: number;
  periodStart: Date;
  periodEnd: Date;
  isActive: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarDay {
  date: string;
  totalPages: number;
  totalMinutes: number;
  sessionCount: number;
  intensityLevel: number; // 0-4 for heatmap
}

export interface ReadingAnalytics {
  // Overview stats
  totalBooksRead: number;
  totalPagesRead: number;
  totalMinutesRead: number;
  totalSessionsLogged: number;
  
  // Speed stats
  avgPagesPerSession: number;
  avgMinutesPerSession: number;
  avgPagesPerMinute: number;
  estimatedWordsPerMinute: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: Date;
  
  // Patterns
  mostActiveHour: number;
  mostActiveDayOfWeek: number;
  preferredFormat: ReadingFormat;
  preferredLocation?: string;
  
  // Goals
  dailyGoalProgress?: number;
  weeklyGoalProgress?: number;
  monthlyGoalProgress?: number;
}

export interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
  totalPages: number;
  totalMinutes: number;
  avgRating?: number;
  color: string;
}

export interface TimeDistribution {
  hour: number;
  sessionCount: number;
  totalPages: number;
  percentage: number;
}

export interface DayDistribution {
  day: number; // 0-6
  dayName: string;
  sessionCount: number;
  totalPages: number;
  percentage: number;
}

// =====================================================
// Sprint 8: Community & Events Types
// =====================================================

// Virtual Events
export type EventType = 'discussion' | 'book_club_meeting' | 'author_qa' | 'reading_session' | 'virtual_meetup';
export type EventStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
export type RSVPStatus = 'pending' | 'attending' | 'maybe' | 'declined';
export type ParticipantRole = 'host' | 'co-host' | 'speaker' | 'moderator' | 'attendee';

export interface Event {
  id: string;
  hostId: string;
  groupId?: string;
  title: string;
  description?: string;
  eventType: EventType;
  coverImageUrl?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  isVirtual: boolean;
  location?: string;
  maxParticipants?: number;
  isPublic: boolean;
  requiresRsvp: boolean;
  status: EventStatus;
  meetingUrl?: string;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  host?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  participantCount?: number;
}

export interface EventSession {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  sessionOrder: number;
  startTime: Date;
  endTime: Date;
  speakerIds: string[];
  status: EventStatus;
  createdAt: Date;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  rsvpStatus: RSVPStatus;
  attended: boolean;
  joinedAt?: Date;
  leftAt?: Date;
  role: ParticipantRole;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface EventComment {
  id: string;
  eventId: string;
  sessionId?: string;
  userId: string;
  content: string;
  isPinned: boolean;
  isAnnouncement: boolean;
  createdAt: Date;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  eventType: EventType;
  coverImageUrl?: string;
  startTime: Date;
  endTime: Date;
  timezone?: string;
  isVirtual?: boolean;
  location?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  requiresRsvp?: boolean;
  meetingUrl?: string;
  groupId?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
  recordingUrl?: string;
}

// Book Clubs
export type ReadingPace = 'slow' | 'moderate' | 'fast' | 'intense';
export type MeetingFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type ClubMemberRole = 'owner' | 'admin' | 'moderator' | 'member';
export type ClubMemberStatus = 'pending' | 'active' | 'inactive' | 'banned';
export type ClubStatus = 'active' | 'paused' | 'archived';
export type DiscussionType = 'general' | 'chapter' | 'book_review' | 'poll' | 'announcement';

export interface BookClub {
  id: string;
  groupId?: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  ownerId: string;
  readingPace: ReadingPace;
  meetingFrequency: MeetingFrequency;
  preferredGenres: string[];
  maxMembers: number;
  isPublic: boolean;
  requiresApproval: boolean;
  currentBookId?: string;
  status: ClubStatus;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  memberCount?: number;
  currentBook?: {
    id: string;
    title: string;
    cover_url?: string;
  };
}

export interface BookClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: ClubMemberRole;
  status: ClubMemberStatus;
  joinedAt: Date;
  lastActiveAt: Date;
  booksCompleted: number;
  discussionsParticipated: number;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface ClubReadingSchedule {
  id: string;
  clubId: string;
  bookId: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'current' | 'completed';
  discussionDate?: Date;
  milestones: Array<{
    chapter: number;
    dueDate: Date;
    discussionPoints: string[];
  }>;
  createdAt: Date;
  book?: {
    id: string;
    title: string;
    cover_url?: string;
    page_count?: number;
  };
}

export interface ClubDiscussion {
  id: string;
  clubId: string;
  scheduleId?: string;
  userId: string;
  title: string;
  content?: string;
  discussionType: DiscussionType;
  isPinned: boolean;
  isSpoiler: boolean;
  spoilerChapter?: number;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateBookClubInput {
  name: string;
  description?: string;
  coverImageUrl?: string;
  readingPace?: ReadingPace;
  meetingFrequency?: MeetingFrequency;
  preferredGenres?: string[];
  maxMembers?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
  groupId?: string;
}

export interface UpdateBookClubInput extends Partial<CreateBookClubInput> {
  currentBookId?: string;
  status?: ClubStatus;
}

// Q&A Sessions
export type QASessionType = 'ama' | 'book_launch' | 'interview' | 'live_reading';
export type QASessionStatus = 'scheduled' | 'accepting_questions' | 'live' | 'completed' | 'cancelled';
export type QuestionStatus = 'pending' | 'approved' | 'answered' | 'rejected' | 'featured';

export interface QASession {
  id: string;
  hostId: string;
  authorId?: string;
  bookId?: string;
  title: string;
  description?: string;
  sessionType: QASessionType;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: QASessionStatus;
  maxQuestions: number;
  isPublic: boolean;
  requiresApproval: boolean;
  allowAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  host?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  author?: {
    id: string;
    name: string;
    author_image?: {
      id: string;
      url: string;
      alt_text?: string;
    } | null;
  };
  book?: {
    id: string;
    title: string;
    cover_url?: string;
  };
  questionCount?: number;
}

export interface QAQuestion {
  id: string;
  sessionId: string;
  userId?: string;
  questionText: string;
  isAnonymous: boolean;
  status: QuestionStatus;
  upvotes: number;
  isFeatured: boolean;
  answeredAt?: Date;
  createdAt: Date;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  answers?: QAAnswer[];
  hasUpvoted?: boolean;
}

export interface QAAnswer {
  id: string;
  questionId: string;
  responderId: string;
  answerText: string;
  isOfficial: boolean;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  responder?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateQASessionInput {
  title: string;
  description?: string;
  sessionType: QASessionType;
  scheduledStart: Date;
  scheduledEnd: Date;
  authorId?: string;
  bookId?: string;
  maxQuestions?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
  allowAnonymous?: boolean;
}

export interface UpdateQASessionInput extends Partial<CreateQASessionInput> {
  status?: QASessionStatus;
  actualStart?: Date;
  actualEnd?: Date;
}

export interface SubmitQuestionInput {
  questionText: string;
  isAnonymous?: boolean;
}

export interface SubmitAnswerInput {
  answerText: string;
  isOfficial?: boolean;
}

// =====================================================
// Phase 4: Recommendation Engine Types
// =====================================================

export type RecommendationType = 
  | 'personalized' 
  | 'similar' 
  | 'trending' 
  | 'friends' 
  | 'genre' 
  | 'author' 
  | 'new_release';

export type RecommendationReasonType = 
  | 'genre_match' 
  | 'author_match' 
  | 'similar_to' 
  | 'trending' 
  | 'friends_read'
  | 'highly_rated'
  | 'new_release'
  | 'because_you_read';

export type FeedbackType = 
  | 'like' 
  | 'dislike' 
  | 'not_interested' 
  | 'already_read' 
  | 'want_more_like_this';

export type TrendPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

// Genre preference with score
export interface GenrePreference {
  genre: string;
  score: number; // 0-100 percentage
}

// Author preference with score
export interface AuthorPreference {
  author_id: string;
  name: string;
  score: number; // 0-100 percentage
}

// User's reading preferences (computed from history)
export interface UserReadingPreferences {
  id: string;
  userId: string;
  preferredGenres: GenrePreference[];
  preferredAuthors: AuthorPreference[];
  minPageCount: number;
  maxPageCount: number;
  minPubYear: number;
  maxPubYear: number;
  readingPace: number; // books per month
  avgUserRating: number;
  preferredFormats: string[];
  topicInterests: string[];
  preferredLanguages: string[];
  lastCalculatedAt: Date;
  calculationVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

// Book similarity data
export interface BookSimilarity {
  id: string;
  bookId: string;
  similarBookId: string;
  overallScore: number;
  genreScore: number;
  authorScore: number;
  contentScore: number;
  ratingScore: number;
  algorithmVersion: string;
  calculatedAt: Date;
}

// Similar book with full details
export interface SimilarBook {
  bookId: string;
  similarityScore: number;
  genreMatch: number;
  authorMatch: number;
  book?: {
    id: string;
    title: string;
    author?: string;
    author_id?: string;
    cover_image_url?: string;
    cover_image?: {
      url: string;
      alt_text?: string;
    };
    genre?: string;
    average_rating?: number;
    pages?: number;
  };
}

// Cached recommendation
export interface RecommendationCacheEntry {
  id: string;
  userId: string;
  recommendationType: RecommendationType;
  bookId: string;
  score: number;
  reason?: string;
  reasonType?: RecommendationReasonType;
  sourceBookId?: string;
  rank: number;
  wasViewed: boolean;
  wasClicked: boolean;
  wasDismissed: boolean;
  interactionAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

// Recommendation with book details
export interface Recommendation {
  id: string;
  bookId: string;
  score: number;
  reason: string;
  reasonType: RecommendationReasonType;
  sourceBookId?: string;
  sourceBook?: {
    id: string;
    title: string;
    cover_image_url?: string;
  };
  rank: number;
  book: {
    id: string;
    title: string;
    author?: string;
    author_id?: string;
    cover_image_url?: string;
    cover_image?: {
      url: string;
      alt_text?: string;
    };
    genre?: string;
    average_rating?: number;
    review_count?: number;
    pages?: number;
    synopsis?: string;
  };
}

// Recommendation with interaction state (for UI)
export interface RecommendationWithState extends Recommendation {
  wasViewed: boolean;
  wasClicked: boolean;
  wasDismissed: boolean;
  interactionAt?: Date;
}

// User feedback on recommendation
export interface RecommendationFeedback {
  id: string;
  userId: string;
  bookId: string;
  recommendationId?: string;
  feedbackType: FeedbackType;
  reason?: string;
  createdAt: Date;
}

// Trending book entry
export interface TrendingBook {
  id: string;
  bookId: string;
  period: TrendPeriod;
  viewsCount: number;
  addsCount: number;
  readsStarted: number;
  readsCompleted: number;
  reviewsCount: number;
  avgRating: number;
  discussionsCount: number;
  trendScore: number;
  rank: number;
  previousRank?: number;
  rankChange: number;
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
  book?: {
    id: string;
    title: string;
    author?: string;
    cover_image_url?: string;
    cover_image?: {
      url: string;
      alt_text?: string;
    };
    genre?: string;
    average_rating?: number;
  };
}

// API Response types
export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  generatedAt: Date;
  expiresAt: Date;
}

export interface SimilarBooksResponse {
  bookId: string;
  similarBooks: SimilarBook[];
  total: number;
}

export interface TrendingBooksResponse {
  period: TrendPeriod;
  books: TrendingBook[];
  periodStart: Date;
  periodEnd: Date;
  total: number;
}

// Input types for API calls
export interface GetRecommendationsInput {
  type?: RecommendationType;
  limit?: number;
  cursor?: string;
  excludeIds?: string[];
  genres?: string[];
  minRating?: number;
}

export interface GetSimilarBooksInput {
  bookId: string;
  limit?: number;
  minScore?: number;
}

export interface GetTrendingBooksInput {
  period?: TrendPeriod;
  limit?: number;
  genre?: string;
}

export interface SubmitFeedbackInput {
  bookId: string;
  recommendationId?: string;
  feedbackType: FeedbackType;
  reason?: string;
}

// Component props types (for reusability)
export interface RecommendationCardProps {
  recommendation: Recommendation;
  variant?: 'default' | 'compact' | 'detailed';
  showReason?: boolean;
  showScore?: boolean;
  onDismiss?: (id: string) => void;
  onFeedback?: (bookId: string, feedback: FeedbackType) => void;
  onClick?: (recommendation: Recommendation) => void;
  className?: string;
}

export interface RecommendationCarouselProps {
  title: string;
  subtitle?: string;
  recommendations: Recommendation[];
  loading?: boolean;
  emptyMessage?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  onViewAll?: () => void;
  onItemClick?: (recommendation: Recommendation) => void;
  onFeedback?: (bookId: string, feedback: FeedbackType) => void;
  className?: string;
}

export interface SimilarBooksSectionProps {
  bookId: string;
  currentBookTitle?: string;
  limit?: number;
  showHeader?: boolean;
  onBookClick?: (bookId: string) => void;
  className?: string;
}

export interface TrendingBookCardProps {
  book: TrendingBook;
  showRank?: boolean;
  showRankChange?: boolean;
  showMetrics?: boolean;
  onClick?: (book: TrendingBook) => void;
  className?: string;
}

export interface TrendingSectionProps {
  period?: TrendPeriod;
  limit?: number;
  showPeriodSelector?: boolean;
  onPeriodChange?: (period: TrendPeriod) => void;
  onBookClick?: (book: TrendingBook) => void;
  className?: string;
}

// Store state type
export interface RecommendationStoreState {
  // Data
  recommendations: Recommendation[];
  similarBooks: Record<string, SimilarBook[]>; // bookId -> similar books
  trendingBooks: TrendingBook[];
  userPreferences: UserReadingPreferences | null;
  
  // Loading states
  isLoadingRecommendations: boolean;
  isLoadingSimilar: boolean;
  isLoadingTrending: boolean;
  isLoadingPreferences: boolean;
  
  // Error states
  recommendationsError: string | null;
  similarError: string | null;
  trendingError: string | null;
  
  // Metadata
  lastFetchedAt: Date | null;
  currentPeriod: TrendPeriod;
  
  // Actions
  fetchRecommendations: (input?: GetRecommendationsInput) => Promise<void>;
  fetchSimilarBooks: (input: GetSimilarBooksInput) => Promise<void>;
  fetchTrendingBooks: (input?: GetTrendingBooksInput) => Promise<void>;
  fetchUserPreferences: () => Promise<void>;
  submitFeedback: (input: SubmitFeedbackInput) => Promise<void>;
  dismissRecommendation: (recommendationId: string) => void;
  markAsViewed: (recommendationId: string) => void;
  markAsClicked: (recommendationId: string) => void;
  setCurrentPeriod: (period: TrendPeriod) => void;
  clearRecommendations: () => void;
  clearErrors: () => void;
}

// =====================================================
// Sprint 13: WebSocket Real-Time Types
// =====================================================

// User Presence Types
export type UserPresenceStatus = 'online' | 'away' | 'offline';
export type DeviceType = 'web' | 'mobile' | 'tablet' | 'desktop';

export interface UserPresence {
  id: UUID;
  userId: UUID;
  status: UserPresenceStatus;
  isTyping: boolean;
  typingLocation?: string;
  deviceType: DeviceType;
  ipAddress?: string;
  userAgent?: string;
  lastActivityAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePresenceInput {
  status?: UserPresenceStatus;
  isTyping?: boolean;
  typingLocation?: string;
  deviceType?: DeviceType;
  lastActivityAt?: Date;
}

// Activity Stream Types
export type ActivityType =
  | 'book_read'
  | 'book_reviewed'
  | 'challenge_created'
  | 'challenge_progress'
  | 'reading_session_logged'
  | 'post_created'
  | 'comment_added'
  | 'user_followed'
  | 'book_added_to_shelf'
  | 'achievement_unlocked'
  | 'group_joined'
  | 'event_rsvp'
  | 'qa_question_asked'
  | 'qa_answer_provided'
  | 'recommendation_liked';

export type EntityType =
  | 'book'
  | 'challenge'
  | 'reading_session'
  | 'post'
  | 'comment'
  | 'user'
  | 'shelf'
  | 'achievement'
  | 'group'
  | 'event'
  | 'qa_session';

export type Visibility = 'public' | 'friends' | 'private';

export interface ActivityStreamEntry {
  id: UUID;
  userId: UUID;
  activityType: ActivityType;
  entityType: EntityType;
  entityId: UUID;
  relatedUserId?: UUID;
  metadata?: Record<string, any>;
  isPublic: boolean;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActivityInput {
  activityType: ActivityType;
  entityType: EntityType;
  entityId: UUID;
  relatedUserId?: UUID;
  metadata?: Record<string, any>;
  visibility?: Visibility;
}

// Collaboration Session Types
export interface CollaborationSession {
  id: UUID;
  roomName: string;
  entityType: EntityType;
  entityId: UUID;
  createdBy: UUID;
  maxParticipants: number;
  isActive: boolean;
  startedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionParticipant {
  id: UUID;
  sessionId: UUID;
  userId: UUID;
  socketId: string;
  cursorPosition?: { line: number; column: number };
  selectionRange?: { start: number; end: number };
  isActive: boolean;
  deviceInfo?: Record<string, any>;
  joinedAt: Date;
  leftAt?: Date;
  createdAt: Date;
}

export interface CreateCollaborationSessionInput {
  roomName: string;
  entityType: EntityType;
  entityId: UUID;
  maxParticipants?: number;
  expiresAt?: Date;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
  userId: UUID;
}

export interface PresenceUpdateEvent extends WebSocketEvent {
  type: 'presence:update';
  payload: {
    userId: UUID;
    status: UserPresenceStatus;
    isTyping: boolean;
    typingLocation?: string;
  };
}

export interface ActivityStreamEvent extends WebSocketEvent {
  type: 'activity:new';
  payload: {
    activity: ActivityStreamEntry;
  };
}

export interface TypingIndicatorEvent extends WebSocketEvent {
  type: 'typing:indicator';
  payload: {
    userId: UUID;
    isTyping: boolean;
    location: string;
  };
}

export interface LiveNotificationEvent extends WebSocketEvent {
  type: 'notification:live';
  payload: {
    notificationId: UUID;
    title: string;
    message: string;
    actionUrl?: string;
  };
}

export interface CollaborativeEditEvent extends WebSocketEvent {
  type: 'collab:edit';
  payload: {
    sessionId: UUID;
    userId: UUID;
    operation: {
      type: 'insert' | 'delete' | 'replace';
      position: number;
      content: string;
    };
    cursorPosition?: { line: number; column: number };
  };
}

// WebSocket Store State
export interface WebSocketStoreState {
  isConnected: boolean;
  connectionError?: string;
  currentPresence?: UserPresence;
  onlineUsers: UserPresence[];
  activityFeed: ActivityStreamEntry[];
  activeSessions: Map<string, CollaborationSession>;
  sessionParticipants: Map<string, SessionParticipant[]>;
  typingUsers: Map<string, { location: string; expiresAt: Date }>;
  unreadNotifications: number;
  lastHeartbeat?: Date;
}

export interface WebSocketStoreActions {
  // Connection management
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;

  // Presence management
  updatePresence: (status: UserPresenceStatus) => Promise<void>;
  setTyping: (isTyping: boolean, location: string) => Promise<void>;
  fetchOnlineUsers: () => Promise<void>;

  // Activity stream
  addActivity: (activity: CreateActivityInput) => Promise<void>;
  fetchActivityFeed: (limit?: number, offset?: number) => Promise<void>;
  clearActivityFeed: () => void;

  // Collaboration
  joinSession: (roomName: string) => Promise<string>;
  leaveSession: (sessionId: UUID) => Promise<void>;
  sendEdit: (sessionId: UUID, operation: any) => Promise<void>;

  // Notifications
  incrementUnreadCount: () => void;
  clearUnreadNotifications: () => void;

  // Event handlers
  handlePresenceUpdate: (event: PresenceUpdateEvent) => void;
  handleActivityStream: (event: ActivityStreamEvent) => void;
  handleTypingIndicator: (event: TypingIndicatorEvent) => void;
  handleNotification: (event: LiveNotificationEvent) => void;
  handleCollaborativeEdit: (event: CollaborativeEditEvent) => void;

  // Cleanup
  reset: () => void;
}
