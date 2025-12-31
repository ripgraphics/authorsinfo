import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AnalyticsContextState,
  UserCohort,
  CohortRetentionView,
  CohortMember,
  UserChurnRisk,
  ChurnIntervention,
  UserSegment,
  SegmentMember,
  EngagementTrendView,
  EngagementHeatmap,
  TrendingTopic,
  ChurnRiskSummary,
  SegmentationStats,
  EngagementStats,
} from '@/types/analytics';

interface AnalyticsStore extends AnalyticsContextState {
  // Cohort actions
  fetchCohorts: (options?: Record<string, any>) => Promise<void>;
  fetchCohortRetention: (cohortId: number) => Promise<void>;
  fetchCohortMembers: (cohortId: number) => Promise<void>;
  createCohort: (payload: any) => Promise<void>;
  updateCohort: (id: number, payload: any) => Promise<void>;
  deleteCohort: (id: number) => Promise<void>;
  setSelectedCohort: (cohort: UserCohort | undefined) => void;

  // Churn actions
  fetchChurnRisks: (options?: Record<string, any>) => Promise<void>;
  fetchInterventions: (options?: Record<string, any>) => Promise<void>;
  createIntervention: (payload: any) => Promise<void>;
  updateIntervention: (id: number, payload: any) => Promise<void>;
  calculateChurnSummary: () => void;

  // Segment actions
  fetchSegments: (options?: Record<string, any>) => Promise<void>;
  fetchSegmentMembers: (segmentId: number) => Promise<void>;
  createSegment: (payload: any) => Promise<void>;
  updateSegment: (id: number, payload: any) => Promise<void>;
  deleteSegment: (id: number) => Promise<void>;
  addSegmentMember: (segmentId: number, userId: string) => Promise<void>;
  removeSegmentMember: (segmentId: number, memberId: string) => Promise<void>;
  setSelectedSegment: (segment: UserSegment | undefined) => void;
  calculateSegmentationStats: () => void;

  // Engagement actions
  fetchEngagementTrends: (options?: Record<string, any>) => Promise<void>;
  fetchHeatmapData: () => Promise<void>;
  fetchTrendingTopics: (options?: Record<string, any>) => Promise<void>;
  calculateEngagementStats: () => void;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  setDateRange: (start: string, end: string) => void;
  setSelectedMetric: (metric: string | undefined) => void;
  reset: () => void;
}

const initialState: AnalyticsContextState = {
  cohorts: [],
  churnRisks: [],
  interventions: [],
  segments: [],
  trendingTopics: [],
  isLoading: false,
};

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('supabase.auth.token');
};

const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Cohort actions
      fetchCohorts: async (options = {}) => {
        set({ isLoading: true, error: undefined });
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const params = new URLSearchParams({
            limit: options.limit?.toString() || '50',
            offset: options.offset?.toString() || '0',
            ...options,
          });

          const response = await fetch(`/api/analytics/cohorts?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch cohorts');

          const data = await response.json();
          set({ cohorts: data.data || [], isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      fetchCohortRetention: async (cohortId: number) => {
        set({ isLoading: true, error: undefined });
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(
            `/api/analytics/cohorts/retention-curves?cohort_id=${cohortId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!response.ok) throw new Error('Failed to fetch retention data');

          const data = await response.json();
          set({ cohortRetention: data.data || [], isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      fetchCohortMembers: async (cohortId: number) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(
            `/api/analytics/cohorts/${cohortId}/members`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!response.ok) throw new Error('Failed to fetch cohort members');

          const data = await response.json();
          set({ cohortMembers: data.data || [] });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      createCohort: async (payload: any) => {
        set({ isLoading: true, error: undefined });
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch('/api/analytics/cohorts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error('Failed to create cohort');

          const data = await response.json();
          const current = get().cohorts;
          set({
            cohorts: [data.data, ...current],
            isLoading: false,
          });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      updateCohort: async (id: number, payload: any) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/cohorts/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error('Failed to update cohort');

          const data = await response.json();
          const cohorts = get().cohorts.map(c => c.id === id ? data.data : c);
          set({ cohorts });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      deleteCohort: async (id: number) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/cohorts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to delete cohort');

          const cohorts = get().cohorts.filter(c => c.id !== id);
          set({ cohorts });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      setSelectedCohort: (cohort: UserCohort | undefined) => {
        set({ selectedCohort: cohort });
      },

      // Churn actions
      fetchChurnRisks: async (options = {}) => {
        set({ isLoading: true, error: undefined });
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const params = new URLSearchParams({
            limit: options.limit?.toString() || '50',
            offset: options.offset?.toString() || '0',
            ...options,
          });

          const response = await fetch(`/api/analytics/churn/at-risk-users?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch churn risks');

          const data = await response.json();
          set({
            churnRisks: data.data || [],
            isLoading: false,
          });
          get().calculateChurnSummary();
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      fetchInterventions: async (options = {}) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const params = new URLSearchParams({
            limit: options.limit?.toString() || '50',
            offset: options.offset?.toString() || '0',
            ...options,
          });

          const response = await fetch(`/api/analytics/churn/interventions?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch interventions');

          const data = await response.json();
          set({ interventions: data.data || [] });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      createIntervention: async (payload: any) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch('/api/analytics/churn/interventions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error('Failed to create intervention');

          const data = await response.json();
          const current = get().interventions;
          set({ interventions: [data.data, ...current] });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      updateIntervention: async (id: number, payload: any) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/churn/interventions/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error('Failed to update intervention');

          const data = await response.json();
          const interventions = get().interventions.map(i => i.id === id ? data.data : i);
          set({ interventions });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      calculateChurnSummary: () => {
        const churnRisks = get().churnRisks;
        const summary: ChurnRiskSummary = {
          critical_count: churnRisks.filter(r => r.risk_level === 'critical').length,
          high_count: churnRisks.filter(r => r.risk_level === 'high').length,
          medium_count: churnRisks.filter(r => r.risk_level === 'medium').length,
          low_count: churnRisks.filter(r => r.risk_level === 'low').length,
          total_at_risk: churnRisks.filter(r => r.risk_level !== 'low').length,
          avg_risk_score: churnRisks.length > 0
            ? churnRisks.reduce((sum, r) => sum + r.risk_score, 0) / churnRisks.length
            : 0,
        };
        set({ churnSummary: summary });
      },

      // Segment actions
      fetchSegments: async (options = {}) => {
        set({ isLoading: true, error: undefined });
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const params = new URLSearchParams({
            limit: options.limit?.toString() || '50',
            offset: options.offset?.toString() || '0',
            ...options,
          });

          const response = await fetch(`/api/analytics/segments?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch segments');

          const data = await response.json();
          set({
            segments: data.data || [],
            isLoading: false,
          });
          get().calculateSegmentationStats();
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      fetchSegmentMembers: async (segmentId: number) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/segments/${segmentId}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch segment members');

          const data = await response.json();
          set({ segmentMembers: data.data || [] });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      createSegment: async (payload: any) => {
        set({ isLoading: true, error: undefined });
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch('/api/analytics/segments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error('Failed to create segment');

          const data = await response.json();
          const current = get().segments;
          set({
            segments: [data.data, ...current],
            isLoading: false,
          });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      updateSegment: async (id: number, payload: any) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/segments/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error('Failed to update segment');

          const data = await response.json();
          const segments = get().segments.map(s => s.id === id ? data.data : s);
          set({ segments });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      deleteSegment: async (id: number) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/segments/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to delete segment');

          const segments = get().segments.filter(s => s.id !== id);
          set({ segments });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      addSegmentMember: async (segmentId: number, userId: string) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/segments/${segmentId}/members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: userId }),
          });

          if (!response.ok) throw new Error('Failed to add member');

          const data = await response.json();
          const current = get().segmentMembers || [];
          set({ segmentMembers: [...current, data.data?.[0]].filter(Boolean) });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      removeSegmentMember: async (segmentId: number, memberId: string) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch(`/api/analytics/segments/${segmentId}/members/${memberId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to remove member');

          const current = get().segmentMembers || [];
          set({ segmentMembers: current.filter(m => m.user_id !== memberId) });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      setSelectedSegment: (segment: UserSegment | undefined) => {
        set({ selectedSegment: segment });
      },

      calculateSegmentationStats: () => {
        const segments = get().segments;
        const stats: SegmentationStats = {
          total_segments: segments.length,
          total_members: segments.reduce((sum, s) => sum + (s.segment_size || 0), 0),
          active_segments: segments.filter(s => s.is_active).length,
          largest_segment: segments.reduce((max, s) => (s.segment_size || 0) > (max?.segment_size || 0) ? s : max),
          segment_distribution: segments.reduce((acc, s) => ({
            ...acc,
            [s.segment_type]: (acc[s.segment_type as any] || 0) + 1,
          }), {} as Record<any, number>),
        };
      },

      // Engagement actions
      fetchEngagementTrends: async (options = {}) => {
        set({ isLoading: true, error: undefined });
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const params = new URLSearchParams({
            limit: options.limit?.toString() || '100',
            offset: options.offset?.toString() || '0',
            ...options,
          });

          const response = await fetch(`/api/analytics/engagement/trends?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch trends');

          const data = await response.json();
          set({
            engagementTrends: data.data || [],
            isLoading: false,
          });
          get().calculateEngagementStats();
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      fetchHeatmapData: async () => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const response = await fetch('/api/analytics/engagement/heatmap', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch heatmap');

          const data = await response.json();
          set({ heatmapData: data.data || [] });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      fetchTrendingTopics: async (options = {}) => {
        try {
          const token = getAuthToken();
          if (!token) throw new Error('No auth token');

          const params = new URLSearchParams({
            limit: options.limit?.toString() || '20',
            ...options,
          });

          const response = await fetch(`/api/analytics/trending-topics?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch trending topics');

          const data = await response.json();
          set({ trendingTopics: data.data || [] });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      calculateEngagementStats: () => {
        const trends = get().engagementTrends || [];
        if (trends.length === 0) return;

        const today = trends[0];
        const yesterday = trends[1];
        const dailyChange = yesterday
          ? ((today.total_actions - yesterday.total_actions) / yesterday.total_actions * 100)
          : 0;

        const heatmapData = get().heatmapData || [];
        const peakHour = heatmapData.length > 0
          ? heatmapData.reduce((max, h) => (h.engagement_score > max.engagement_score ? h : max)).hour_of_day
          : 0;

        const stats: EngagementStats = {
          total_actions_today: today.total_actions,
          unique_users_today: today.unique_users,
          daily_change_percent: dailyChange,
          peak_hour: peakHour,
          trending_count: get().trendingTopics.length,
        };
        set({ engagementStats: stats });
      },

      // State management
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | undefined) => set({ error }),
      setDateRange: (start: string, end: string) => set({ dateRange: { start, end } }),
      setSelectedMetric: (metric: string | undefined) => set({ selectedMetric: metric }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'analytics-store',
      partialize: (state) => ({
        cohorts: state.cohorts,
        segments: state.segments,
        trendingTopics: state.trendingTopics,
        dateRange: state.dateRange,
      }),
    }
  )
);

export default useAnalyticsStore;
