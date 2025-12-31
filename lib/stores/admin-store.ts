import { create } from 'zustand';

interface AuditLog {
  id: string;
  source: string;
  timestamp: string;
  user_id?: string;
  username?: string;
  avatar_url?: string;
  action?: string;
  operation?: string;
  table_name?: string;
  details?: any;
}

interface ModerationItem {
  id: string;
  content_type: string;
  content_id: string;
  priority: string;
  flag_count: number;
  status: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface PlatformStats {
  overview: {
    totalUsers: number;
    totalBooks: number;
    totalAuthors: number;
    totalGroups: number;
    totalReadingProgress: number;
    totalReviews: number;
    totalPosts: number;
    totalEvents: number;
  };
  activity: {
    newUsersThisMonth: number;
    userGrowthRate: string;
    activeReadingSessions: number;
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    dau_mau_ratio: string;
  };
  moderation: {
    pendingItems: number;
  };
  performance: {
    avgResponseTime: string;
    totalMetrics: number;
  };
}

interface UserGrowthData {
  totalUsers: number;
  activeUsers: number;
  activeUsersPercentage: string;
  chartData: Array<{ date: string; newUsers: number }>;
}

interface EngagementData {
  totalEngagement: number;
  uniqueEngagedUsers: number;
  avgDailyEngagement: number;
  actionBreakdown: Array<{ action: string; count: number }>;
  entityBreakdown: Array<{ entity: string; count: number }>;
  chartData: Array<{ date: string; engagements: number }>;
}

interface AdminStore {
  // Audit logs
  auditLogs: AuditLog[];
  auditLogsLoading: boolean;
  auditLogsPagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  } | null;

  // Moderation
  moderationQueue: ModerationItem[];
  moderationLoading: boolean;
  moderationStats: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  } | null;

  // Analytics
  platformStats: PlatformStats | null;
  userGrowth: UserGrowthData | null;
  engagement: EngagementData | null;
  analyticsLoading: boolean;

  // Actions
  fetchAuditLogs: (filters?: {
    source?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;

  fetchModerationQueue: (filters?: {
    status?: string;
    priority?: string;
    contentType?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;

  updateModerationItem: (
    id: string,
    updates: {
      status?: string;
      resolution_action?: string;
      resolution_notes?: string;
      assign_to?: string;
    }
  ) => Promise<void>;

  fetchPlatformStats: () => Promise<void>;
  fetchUserGrowth: (period?: string, days?: number) => Promise<void>;
  fetchEngagement: (days?: number) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  auditLogs: [],
  auditLogsLoading: false,
  auditLogsPagination: null,

  moderationQueue: [],
  moderationLoading: false,
  moderationStats: null,

  platformStats: null,
  userGrowth: null,
  engagement: null,
  analyticsLoading: false,

  // Actions
  fetchAuditLogs: async (filters = {}) => {
    set({ auditLogsLoading: true });

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      set({
        auditLogs: data.logs,
        auditLogsPagination: data.pagination,
        auditLogsLoading: false,
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      set({ auditLogsLoading: false });
    }
  },

  fetchModerationQueue: async (filters = {}) => {
    set({ moderationLoading: true });

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });

      const response = await fetch(`/api/admin/moderation?${params}`);
      if (!response.ok) throw new Error('Failed to fetch moderation queue');

      const data = await response.json();
      set({
        moderationQueue: data.items,
        moderationStats: data.statistics,
        moderationLoading: false,
      });
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      set({ moderationLoading: false });
    }
  },

  updateModerationItem: async (id, updates) => {
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) throw new Error('Failed to update moderation item');

      const data = await response.json();

      // Update local state
      set((state) => ({
        moderationQueue: state.moderationQueue.map((item) =>
          item.id === id ? { ...item, ...data.item } : item
        ),
      }));

      // Refetch queue to update stats
      get().fetchModerationQueue();
    } catch (error) {
      console.error('Error updating moderation item:', error);
      throw error;
    }
  },

  fetchPlatformStats: async () => {
    set({ analyticsLoading: true });

    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');

      const data = await response.json();
      set({
        platformStats: data,
        analyticsLoading: false,
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      set({ analyticsLoading: false });
    }
  },

  fetchUserGrowth: async (period = 'daily', days = 30) => {
    set({ analyticsLoading: true });

    try {
      const response = await fetch(
        `/api/admin/analytics/user-growth?period=${period}&days=${days}`
      );
      if (!response.ok) throw new Error('Failed to fetch user growth');

      const data = await response.json();
      set({
        userGrowth: data,
        analyticsLoading: false,
      });
    } catch (error) {
      console.error('Error fetching user growth:', error);
      set({ analyticsLoading: false });
    }
  },

  fetchEngagement: async (days = 30) => {
    set({ analyticsLoading: true });

    try {
      const response = await fetch(`/api/admin/analytics/engagement?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch engagement');

      const data = await response.json();
      set({
        engagement: data,
        analyticsLoading: false,
      });
    } catch (error) {
      console.error('Error fetching engagement:', error);
      set({ analyticsLoading: false });
    }
  },
}));
