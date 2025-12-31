/**
 * Reading Progress Store - Zustand State Management
 * Manages all reading session and progress tracking state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  ReadingSession,
  ReadingProgressExtended,
  ReadingStreak,
  ReadingStats,
  CreateSessionInput,
  UpdateSessionInput,
  MonthlyReadingData,
} from '@/types/phase3';
import { UUID } from 'crypto';

interface ProgressStore {
  // State
  sessions: ReadingSession[];
  progressData: Record<UUID, ReadingProgressExtended>;
  readingStreak: ReadingStreak | null;
  stats: ReadingStats | null;
  monthlyData: MonthlyReadingData | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSessions: (bookId?: UUID, limit?: number) => Promise<void>;
  fetchProgressByBook: (bookId: UUID) => Promise<ReadingProgressExtended | null>;
  fetchReadingStreak: () => Promise<ReadingStreak | null>;
  fetchStats: () => Promise<ReadingStats | null>;
  fetchMonthlyData: (year: number, month: number) => Promise<MonthlyReadingData | null>;
  createSession: (input: CreateSessionInput) => Promise<ReadingSession | null>;
  updateSession: (id: UUID, input: UpdateSessionInput) => Promise<void>;
  deleteSession: (id: UUID) => Promise<void>;
  clearError: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sessions: [],
        progressData: {},
        readingStreak: null,
        stats: null,
        monthlyData: null,
        loading: false,
        error: null,

        // Fetch reading sessions
        fetchSessions: async (bookId?: UUID, limit = 50) => {
          set({ loading: true, error: null });
          try {
            const params = new URLSearchParams({
              limit: limit.toString(),
            });
            if (bookId) params.append('bookId', bookId);

            const response = await fetch(`/api/reading-sessions?${params}`);
            if (!response.ok) {
              throw new Error('Failed to fetch sessions');
            }
            const data = await response.json();
            set({ sessions: data.data, loading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
          }
        },

        // Fetch progress by book
        fetchProgressByBook: async (bookId: UUID) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/reading-progress/${bookId}`);
            if (!response.ok) {
              throw new Error('Failed to fetch progress');
            }
            const data = await response.json();
            set((state: any) => ({
              progressData: {
                ...state.progressData,
                [bookId]: data.data,
              },
            }));
            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
            return null;
          }
        },

        // Fetch reading streak
        fetchReadingStreak: async () => {
          set({ error: null });
          try {
            const response = await fetch('/api/reading-streak');
            if (!response.ok) {
              throw new Error('Failed to fetch streak');
            }
            const data = await response.json();
            set({ readingStreak: data.data });
            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
            return null;
          }
        },

        // Fetch reading statistics
        fetchStats: async () => {
          set({ error: null });
          try {
            const response = await fetch('/api/reading-stats');
            if (!response.ok) {
              throw new Error('Failed to fetch stats');
            }
            const data = await response.json();
            set({ stats: data.data });
            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
            return null;
          }
        },

        // Fetch monthly data for calendar heatmap
        fetchMonthlyData: async (year: number, month: number) => {
          set({ error: null });
          try {
            const response = await fetch(
              `/api/reading-calendar?year=${year}&month=${month}`
            );
            if (!response.ok) {
              throw new Error('Failed to fetch monthly data');
            }
            const data = await response.json();
            set({ monthlyData: data.data });
            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
            return null;
          }
        },

        // Create new reading session
        createSession: async (input: CreateSessionInput) => {
          set({ error: null });
          try {
            const response = await fetch('/api/reading-sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to create session');
            }

            const data = await response.json();
            set((state: any) => ({
              sessions: [data.data, ...state.sessions],
            }));

            // Invalidate related caches
            set((state: any) => {
              const newData = { ...state.progressData };
              delete newData[input.bookId];
              return { progressData: newData };
            });

            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
            return null;
          }
        },

        // Update session
        updateSession: async (id: UUID, input: UpdateSessionInput) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/reading-sessions/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to update session');
            }

            const data = await response.json();
            set((state: any) => ({
              sessions: state.sessions.map((s: any) =>
                s.id === id ? data.data : s
              ),
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Delete session
        deleteSession: async (id: UUID) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/reading-sessions/${id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              throw new Error('Failed to delete session');
            }

            set((state: any) => ({
              sessions: state.sessions.filter((s: any) => s.id !== id),
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'progress-store',
        partialize: (state: any) => ({
          sessions: state.sessions,
          readingStreak: state.readingStreak,
          stats: state.stats,
        }),
      }
    )
  )
);
