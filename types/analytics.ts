/**
 * Sprint 12: Advanced Analytics Types
 * Cohort Analysis, Retention Metrics, Churn Prediction, User Segmentation, Engagement Trends
 */

// ====================================
// ENUMS
// ====================================

export enum CohortType {
  SIGNUP_DATE = 'signup_date',
  FEATURE_ADOPTION = 'feature_adoption',
  CUSTOM = 'custom'
}

export enum CohortPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum ActivityType {
  READING = 'reading',
  SOCIAL = 'social',
  DISCUSSION = 'discussion',
  ADMIN = 'admin'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum InterventionType {
  EMAIL = 'email',
  IN_APP_MESSAGE = 'in_app_message',
  SPECIAL_OFFER = 'special_offer',
  PERSONAL_OUTREACH = 'personal_outreach'
}

export enum InterventionStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  ENGAGED = 'engaged'
}

export enum EngagementStatus {
  NO_RESPONSE = 'no_response',
  OPENED = 'opened',
  CLICKED = 'clicked',
  CONVERTED = 'converted'
}

export enum SegmentType {
  BEHAVIORAL = 'behavioral',
  DEMOGRAPHIC = 'demographic',
  ENGAGEMENT = 'engagement',
  ACTIVITY = 'activity'
}

export enum SegmentStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}

export enum SegmentEventType {
  ADDED = 'added',
  REMOVED = 'removed',
  CRITERIA_UPDATE = 'criteria_update'
}

export enum TrendDirection {
  RISING = 'rising',
  FALLING = 'falling',
  STABLE = 'stable'
}

export enum TrendingTopicType {
  BOOK = 'book',
  AUTHOR = 'author',
  GENRE = 'genre',
  HASHTAG = 'hashtag'
}

// ====================================
// COHORT ANALYSIS TYPES
// ====================================

export interface DailyActiveUser {
  id: number;
  day: string; // ISO date
  user_id: string;
  activity_type: ActivityType;
  action_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserCohort {
  id: number;
  name: string;
  description?: string;
  cohort_type: CohortType;
  cohort_period?: CohortPeriod;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CohortMember {
  id: number;
  cohort_id: number;
  user_id: string;
  joined_at: string;
  left_at?: string;
  is_active: boolean;
}

export interface CohortRetentionSnapshot {
  id: number;
  cohort_id: number;
  snapshot_date: string;
  day_1_retention?: number;
  day_7_retention?: number;
  day_30_retention?: number;
  day_90_retention?: number;
  year_1_retention?: number;
  cohort_size?: number;
  created_at: string;
}

export interface UserRetentionMilestone {
  id: number;
  user_id: string;
  milestone_type: 'day_1' | 'day_7' | 'day_30' | 'day_90' | 'year_1';
  milestone_date: string;
  days_since_signup: number;
  created_at: string;
}

// ====================================
// CHURN PREDICTION TYPES
// ====================================

export interface UserChurnRisk {
  id: number;
  user_id: string;
  risk_score: number; // 0-100
  risk_level: RiskLevel;
  activity_trend?: number; // percentage
  engagement_trend?: number; // percentage
  feature_adoption_trend?: number; // percentage
  last_active_date?: string;
  days_since_last_activity?: number;
  predicted_churn_date?: string;
  confidence_score?: number; // 0-100
  contributing_factors?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChurnIntervention {
  id: number;
  user_id: string;
  intervention_type: InterventionType;
  intervention_name?: string;
  intervention_date: string;
  status: InterventionStatus;
  engagement_status?: EngagementStatus;
  created_at: string;
  updated_at: string;
}

export interface InterventionEffectiveness {
  id: number;
  intervention_id: number;
  user_id: string;
  pre_churn_risk_score?: number;
  post_churn_risk_score?: number;
  risk_reduction?: number; // percentage
  user_retention: boolean;
  created_at: string;
}

// ====================================
// USER SEGMENTATION TYPES
// ====================================

export interface UserSegment {
  id: number;
  name: string;
  description?: string;
  segment_type: SegmentType;
  criteria: Record<string, any>;
  status: SegmentStatus;
  member_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentMember {
  id: number;
  segment_id: number;
  user_id: string;
  joined_at: string;
  metadata?: Record<string, any>;
}

export interface SegmentEvent {
  id: number;
  segment_id: number;
  user_id: string;
  event_type: SegmentEventType;
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  created_at: string;
}

export interface SegmentStatistics {
  segment_id: number;
  name: string;
  segment_type: SegmentType;
  status: SegmentStatus;
  current_member_count: number;
  users_added_this_month: number;
  avg_member_count_30d: number;
  last_updated: string;
}

export interface CreateSegmentPayload {
  name: string;
  description?: string;
  segment_type: SegmentType;
  criteria: Record<string, any>;
}

export interface UpdateSegmentPayload {
  name?: string;
  description?: string;
  criteria?: Record<string, any>;
  status?: SegmentStatus;
}

export interface AddSegmentMemberPayload {
  user_id: string;
  metadata?: Record<string, any>;
}

// ====================================
// ENGAGEMENT TRENDS TYPES
// ====================================

export interface DailyEngagementMetric {
  id: number;
  day: string;
  total_actions: number;
  unique_users: number;
  reading_actions: number;
  social_actions: number;
  discussion_actions: number;
  admin_actions: number;
  avg_session_duration_minutes?: number;
  bounce_rate?: number;
  created_at: string;
}

export interface TrendingTopic {
  id: number;
  topic_name: string;
  topic_type: TrendingTopicType;
  trend_score: number;
  mention_count: number;
  unique_users: number;
  trend_direction?: TrendDirection;
  trend_date: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EngagementHeatmap {
  id: number;
  day_of_week: number; // 0-6
  hour_of_day: number; // 0-23
  engagement_score: number;
  action_count: number;
  unique_users: number;
  trend_data?: Record<string, any>;
  last_updated: string;
}

// ====================================
// MATERIALIZED VIEW TYPES
// ====================================

export interface CohortRetentionView {
  cohort_id: number;
  cohort_name: string;
  snapshot_date: string;
  cohort_size?: number;
  day_1_retention?: number;
  day_7_retention?: number;
  day_30_retention?: number;
  day_90_retention?: number;
  year_1_retention?: number;
  retention_d1: number;
  retention_d7: number;
  retention_d30: number;
  retention_d90: number;
  retention_y1: number;
}

export interface EngagementTrendView {
  day: string;
  total_actions: number;
  unique_users: number;
  reading_actions: number;
  social_actions: number;
  discussion_actions: number;
  admin_actions: number;
  avg_actions_per_user: number;
  avg_session_mins: number;
  bounce_pct: number;
  prev_day_actions?: number;
  daily_change_pct?: number;
}

// ====================================
// API REQUEST/RESPONSE TYPES
// ====================================

// Cohort API Types
export interface CreateCohortPayload {
  name: string;
  description?: string;
  cohort_type: CohortType;
  cohort_period?: CohortPeriod;
  start_date?: string;
  end_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCohortPayload {
  name?: string;
  description?: string;
  cohort_period?: CohortPeriod;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface CohortResponse {
  success: boolean;
  data?: UserCohort;
  error?: string;
}

export interface CohortsListResponse {
  success: boolean;
  data?: UserCohort[];
  total?: number;
  error?: string;
}

// Churn API Types
export interface ChurnRiskQueryParams {
  risk_level?: RiskLevel;
  min_score?: number;
  max_score?: number;
  limit?: number;
  offset?: number;
}

export interface ChurnRiskResponse {
  success: boolean;
  data?: UserChurnRisk[];
  total?: number;
  error?: string;
}

export interface CreateInterventionPayload {
  user_id: string;
  intervention_type: InterventionType;
  intervention_name?: string;
}

export interface UpdateInterventionPayload {
  status?: InterventionStatus;
  engagement_status?: EngagementStatus;
}

export interface InterventionResponse {
  success: boolean;
  data?: ChurnIntervention;
  error?: string;
}

// Segmentation API Types
export interface CreateSegmentPayload {
  name: string;
  description?: string;
  segment_type: SegmentType;
  criteria: Record<string, any>;
}

export interface UpdateSegmentPayload {
  name?: string;
  description?: string;
  criteria?: Record<string, any>;
  is_active?: boolean;
}

export interface SegmentResponse {
  success: boolean;
  data?: UserSegment;
  error?: string;
}

export interface SegmentsListResponse {
  success: boolean;
  data?: UserSegment[];
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  error?: string;
}

export interface SegmentMembersResponse {
  success: boolean;
  data?: SegmentMember[];
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  error?: string;
}

// Engagement API Types
export interface EngagementTrendsResponse {
  success: boolean;
  data?: EngagementTrendView[];
  error?: string;
}

export interface HeatmapResponse {
  success: boolean;
  data?: EngagementHeatmap[];
  error?: string;
}

export interface TrendingTopicsResponse {
  success: boolean;
  data?: TrendingTopic[];
  limit?: number;
  error?: string;
}

// ====================================
// FILTER & QUERY TYPES
// ====================================

export interface CohortFilterOptions {
  cohort_type?: CohortType;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface SegmentFilterOptions {
  segment_type?: SegmentType;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface EngagementFilterOptions {
  start_date?: string;
  end_date?: string;
  activity_type?: ActivityType;
}

// ====================================
// DASHBOARD TYPES
// ====================================

export interface RetentionCurveData {
  day: number;
  retention_percentage: number;
  users_retained: number;
  cohort_name: string;
}

export interface ChurnRiskSummary {
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_at_risk: number;
  avg_risk_score: number;
}

export interface SegmentationStats {
  total_segments: number;
  total_members: number;
  active_segments: number;
  largest_segment?: UserSegment;
  segment_distribution: Record<SegmentType, number>;
}

export interface EngagementStats {
  total_actions_today: number;
  unique_users_today: number;
  daily_change_percent: number;
  peak_hour: number;
  trending_count: number;
}

// ====================================
// CONTEXT & STATE TYPES
// ====================================

export interface AnalyticsContextState {
  // Cohorts
  cohorts: UserCohort[];
  selectedCohort?: UserCohort;
  cohortRetention?: CohortRetentionView[];
  cohortMembers?: CohortMember[];

  // Churn
  churnRisks: UserChurnRisk[];
  churnSummary?: ChurnRiskSummary;
  interventions: ChurnIntervention[];

  // Segmentation
  segments: UserSegment[];
  selectedSegment?: UserSegment;
  segmentMembers?: SegmentMember[];

  // Engagement
  engagementTrends?: EngagementTrendView[];
  heatmapData?: EngagementHeatmap[];
  trendingTopics: TrendingTopic[];
  engagementStats?: EngagementStats;

  // UI State
  isLoading: boolean;
  error?: string;
  dateRange?: { start: string; end: string };
  selectedMetric?: string;
}

// ====================================
// UTILITY TYPES
// ====================================

export type CohortRetentionRate = {
  day_1: number;
  day_7: number;
  day_30: number;
  day_90: number;
  year_1: number;
};

export type RiskScoreBreakdown = {
  activity_trend_score: number;
  engagement_trend_score: number;
  feature_adoption_score: number;
  final_risk_score: number;
};



export type SegmentCriteria = {
  engagement_level?: 'high' | 'medium' | 'low';
  user_type?: string[];
  signup_period?: { start: string; end: string };
  feature_adoption?: string[];
  activity_threshold?: number;
};

export type TrendAnalysis = {
  metric: string;
  current_value: number;
  previous_value?: number;
  change_percent: number;
  trend_direction: TrendDirection;
};

// ====================================
// CHURN INTERVENTION & EFFECTIVENESS TYPES
// ====================================

export interface ChurnIntervention {
  id: number;
  user_id: string;
  risk_score_at_intervention: number;
  intervention_type: InterventionType;
  status: InterventionStatus;
  message: string | null;
  sent_at: string;
  engaged_at: string | null;
  effectiveness_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface InterventionEffectiveness {
  id: number;
  intervention_id: number;
  user_id: string;
  risk_score_before: number;
  risk_score_after: number;
  risk_reduction?: number;
  engagement_increase: number;
  retention_days: number | null;
  user_engagement_days_after: number | null;
  conversion_to_paying: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChurnRiskSummary {
  risk_date: string;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_at_risk: number;
  avg_risk_score: number;
  max_risk_score: number;
  min_risk_score: number;
  total_interventions_sent: number;
  interventions_engaged: number;
  avg_effectiveness: number;
}

export interface CreateChurnInterventionPayload {
  user_id: string;
  intervention_type: InterventionType;
  message?: string;
}

export interface UpdateChurnRiskPayload {
  risk_score?: number;
  activity_trend?: number;
  engagement_trend?: number;
  feature_adoption_trend?: number;
  intervention_sent_at?: string;
  intervention_response_at?: string;
}
