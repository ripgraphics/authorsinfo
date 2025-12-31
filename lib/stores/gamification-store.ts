/**
 * Gamification Store - Zustand State Management
 * Manages badges, achievements, and leaderboard state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Badge, UserBadge, LeaderboardEntry, BadgeProgress } from '@/types/phase3';

interface GamificationStore {
  // State
  badges: Badge[];
  userBadges: UserBadge[];
  featuredBadges: UserBadge[];
  badgeProgress: BadgeProgress[];
  totalPoints: number;
  leaderboard: LeaderboardEntry[];
  friendsLeaderboard: any[];
  userRank: number | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchBadges: (category?: string, tier?: string) => Promise<void>;
  fetchUserBadges: () => Promise<void>;
  toggleFeaturedBadge: (badgeId: string, isFeatured: boolean) => Promise<void>;
  fetchLeaderboard: (metric?: string, limit?: number) => Promise<void>;
  fetchFriendsLeaderboard: (metric?: string) => Promise<void>;
  clearError: () => void;
}

export const useGamificationStore = create<GamificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      badges: [],
      userBadges: [],
      featuredBadges: [],
      badgeProgress: [],
      totalPoints: 0,
      leaderboard: [],
      friendsLeaderboard: [],
      userRank: null,
      loading: false,
      error: null,

      // Fetch all available badges
      fetchBadges: async (category?: string, tier?: string) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams();
          if (category) params.append('category', category);
          if (tier) params.append('tier', tier);

          const response = await fetch(`/api/badges?${params}`);
          if (!response.ok) throw new Error('Failed to fetch badges');
          
          const data = await response.json();
          set({ badges: data.data, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      // Fetch current user's badges
      fetchUserBadges: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/badges/user');
          if (!response.ok) throw new Error('Failed to fetch user badges');
          
          const data = await response.json();
          set({
            userBadges: data.data.badges,
            featuredBadges: data.data.featuredBadges,
            badgeProgress: data.data.badgeProgress,
            totalPoints: data.data.totalPoints,
            loading: false,
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      // Toggle featured badge
      toggleFeaturedBadge: async (badgeId: string, isFeatured: boolean) => {
        set({ error: null });
        try {
          const response = await fetch('/api/badges/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ badgeId, isFeatured }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update badge');
          }

          // Refresh user badges
          await get().fetchUserBadges();
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      // Fetch global leaderboard
      fetchLeaderboard: async (metric = 'points', limit = 50) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams({
            metric,
            limit: limit.toString(),
          });

          const response = await fetch(`/api/leaderboard?${params}`);
          if (!response.ok) throw new Error('Failed to fetch leaderboard');
          
          const data = await response.json();
          set({ leaderboard: data.data, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      // Fetch friends leaderboard
      fetchFriendsLeaderboard: async (metric = 'points') => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/leaderboard/friends?metric=${metric}`);
          if (!response.ok) throw new Error('Failed to fetch friends leaderboard');
          
          const data = await response.json();
          set({ friendsLeaderboard: data.data, loading: false });

          // Find current user's rank
          const currentUser = data.data.find((entry: any) => entry.isCurrentUser);
          if (currentUser) {
            set({ userRank: currentUser.rank });
          }
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'gamification-store' }
  )
);
