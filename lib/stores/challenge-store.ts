/**
 * Challenge Store - Zustand State Management
 * Manages all reading challenge operations and state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  ReadingChallenge,
  CreateChallengeInput,
  UpdateChallengeInput,
  LogProgressInput,
  LeaderboardEntry,
  ChallengeStatus,
} from '@/types/phase3';
import { UUID } from 'crypto';

interface ChallengeStore {
  // State
  challenges: ReadingChallenge[];
  friendsChallenges: ReadingChallenge[];
  challengeDetails: Record<string, ReadingChallenge>;
  loading: boolean;
  error: string | null;
  stats: any | null;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;

  // Actions
  fetchChallenges: (year?: number, status?: ChallengeStatus) => Promise<void>;
  fetchFriendsChallenges: () => Promise<void>;
  fetchChallengeById: (id: UUID) => Promise<void>;
  createChallenge: (input: CreateChallengeInput) => Promise<ReadingChallenge | null>;
  updateChallenge: (id: UUID, input: UpdateChallengeInput) => Promise<void>;
  deleteChallenge: (id: UUID) => Promise<void>;
  logProgress: (challengeId: UUID, input: LogProgressInput) => Promise<void>;
  fetchLeaderboard: (metric?: string, limit?: number) => Promise<void>;
  clearError: () => void;
  fetchStats: () => Promise<void>; // Added fetchStats action
}

export const useChallengeStore = create<ChallengeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        challenges: [],
        friendsChallenges: [],
        challengeDetails: {},
        loading: false,
        error: null,
        stats: null,
        leaderboard: [],
        leaderboardLoading: false,

        // Fetch all user's challenges
        fetchChallenges: async (year?: number, status?: ChallengeStatus) => {
          set({ loading: true, error: null });
          try {
            const params = new URLSearchParams();
            if (year) params.append('year', year.toString());
            if (status) params.append('status', status);

            const response = await fetch(`/api/challenges?${params}`);
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to fetch challenges');
            }
            const data = await response.json();
            set({ challenges: data.data, loading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
          }
        },

        // Fetch friends' challenges
        fetchFriendsChallenges: async () => {
          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/challenges/friends');
            if (!response.ok) throw new Error('Failed to fetch friends challenges');
            const data = await response.json();
            set({ friendsChallenges: data, loading: false });
          } catch (error: any) {
            set({ error: error.message, loading: false });
          }
        },

        // Fetch single challenge
        fetchChallengeById: async (id: UUID) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/challenges/${id}`);
            if (!response.ok) {
              throw new Error('Failed to fetch challenge');
            }
            const data = await response.json();
            set((state) => ({
              challengeDetails: {
                ...state.challengeDetails,
                [id]: data.data,
              },
              loading: false,
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
          }
        },

        // Create new challenge
        createChallenge: async (input: CreateChallengeInput) => {
          set({ error: null });
          try {
            const response = await fetch('/api/challenges', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to create challenge');
            }

            const data = await response.json();
            set((state) => ({
              challenges: [...state.challenges, data.data],
            }));
            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
            return null;
          }
        },

        // Update challenge
        updateChallenge: async (id: UUID, input: UpdateChallengeInput) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/challenges/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to update challenge');
            }

            const data = await response.json();
            set((state) => ({
              challenges: state.challenges.map((c) =>
                c.id === id ? data.data : c
              ),
              challengeDetails: {
                ...state.challengeDetails,
                [id]: data.data,
              },
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Delete challenge
        deleteChallenge: async (id: UUID) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/challenges/${id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to delete challenge');
            }

            set((state) => {
              const newDetails = { ...state.challengeDetails };
              delete newDetails[id];
              return {
                challenges: state.challenges.filter((c) => c.id !== id),
                challengeDetails: newDetails,
              };
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Log progress
        logProgress: async (challengeId: UUID, input: LogProgressInput) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/challenges/${challengeId}/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to log progress');
            }

            const data = await response.json();
            set((state) => ({
              challenges: state.challenges.map((c) =>
                c.id === challengeId ? data.data : c
              ),
              challengeDetails: {
                ...state.challengeDetails,
                [challengeId]: data.data,
              },
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Fetch public leaderboard
        fetchLeaderboard: async (metric = 'completion', limit = 100) => {
          set({ leaderboardLoading: true, error: null });
          try {
            const params = new URLSearchParams({
              metric,
              limit: limit.toString(),
            });

            const response = await fetch(`/api/challenges/leaderboard?${params}`);
            if (!response.ok) {
              throw new Error('Failed to fetch leaderboard');
            }
            const data = await response.json();
            set({
              leaderboard: data.data,
              leaderboardLoading: false,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, leaderboardLoading: false });
          }
        },

        clearError: () => set({ error: null }),

        // Fetch stats
        fetchStats: async () => {
          try {
            const response = await fetch('/api/challenges/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            set({ stats: data });
          } catch (error: any) {
            console.error('Error fetching stats:', error);
          }
        },
      }),
      {
        name: 'challenge-store',
        partialize: (state) => ({
          challenges: state.challenges,
        }),
      }
    )
  )
);
