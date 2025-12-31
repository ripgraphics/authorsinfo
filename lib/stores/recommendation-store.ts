/**
 * Recommendation Store
 * Zustand store for managing recommendation state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Recommendation,
  SimilarBook,
  TrendingBook,
  UserReadingPreferences,
  TrendPeriod,
  FeedbackType,
  GetRecommendationsInput,
  GetSimilarBooksInput,
  GetTrendingBooksInput,
  SubmitFeedbackInput,
  RecommendationStoreState
} from '@/types/phase3';

// Separate interface for actions to avoid circular reference
interface RecommendationStoreActions {
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

interface RecommendationStore extends RecommendationStoreActions {
  // Data
  recommendations: Recommendation[];
  similarBooks: Record<string, SimilarBook[]>;
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
}

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      recommendations: [],
      similarBooks: {},
      trendingBooks: [],
      userPreferences: null,
      isLoadingRecommendations: false,
      isLoadingSimilar: false,
      isLoadingTrending: false,
      isLoadingPreferences: false,
      recommendationsError: null,
      similarError: null,
      trendingError: null,
      lastFetchedAt: null,
      currentPeriod: 'weekly',

      // Fetch personalized recommendations
      fetchRecommendations: async (input?: GetRecommendationsInput) => {
        set({ isLoadingRecommendations: true, recommendationsError: null });
        
        try {
          const params = new URLSearchParams();
          if (input?.type) params.set('type', input.type);
          if (input?.limit) params.set('limit', input.limit.toString());
          if (input?.cursor) params.set('cursor', input.cursor);
          if (input?.excludeIds?.length) params.set('excludeIds', input.excludeIds.join(','));
          if (input?.genres?.length) params.set('genres', input.genres.join(','));
          if (input?.minRating) params.set('minRating', input.minRating.toString());

          const response = await fetch(`/api/recommendations?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch recommendations');
          }

          const data = await response.json();
          
          set({
            recommendations: data.recommendations || [],
            isLoadingRecommendations: false,
            lastFetchedAt: new Date()
          });
        } catch (error) {
          console.error('Error fetching recommendations:', error);
          set({
            isLoadingRecommendations: false,
            recommendationsError: error instanceof Error ? error.message : 'Failed to fetch recommendations'
          });
        }
      },

      // Fetch similar books for a specific book
      fetchSimilarBooks: async (input: GetSimilarBooksInput) => {
        set({ isLoadingSimilar: true, similarError: null });
        
        try {
          const params = new URLSearchParams();
          if (input.limit) params.set('limit', input.limit.toString());
          if (input.minScore) params.set('minScore', input.minScore.toString());

          const response = await fetch(`/api/similar-books/${input.bookId}?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch similar books');
          }

          const data = await response.json();
          
          set(state => ({
            similarBooks: {
              ...state.similarBooks,
              [input.bookId]: data.similarBooks || []
            },
            isLoadingSimilar: false
          }));
        } catch (error) {
          console.error('Error fetching similar books:', error);
          set({
            isLoadingSimilar: false,
            similarError: error instanceof Error ? error.message : 'Failed to fetch similar books'
          });
        }
      },

      // Fetch trending books
      fetchTrendingBooks: async (input?: GetTrendingBooksInput) => {
        set({ isLoadingTrending: true, trendingError: null });
        
        try {
          const params = new URLSearchParams();
          const period = input?.period || get().currentPeriod;
          params.set('period', period);
          if (input?.limit) params.set('limit', input.limit.toString());
          if (input?.genre) params.set('genre', input.genre);

          const response = await fetch(`/api/recommendations/trending?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch trending books');
          }

          const data = await response.json();
          
          set({
            trendingBooks: data.books || [],
            currentPeriod: period,
            isLoadingTrending: false
          });
        } catch (error) {
          console.error('Error fetching trending books:', error);
          set({
            isLoadingTrending: false,
            trendingError: error instanceof Error ? error.message : 'Failed to fetch trending books'
          });
        }
      },

      // Fetch user preferences
      fetchUserPreferences: async () => {
        set({ isLoadingPreferences: true });
        
        try {
          const response = await fetch('/api/recommendations/preferences');
          
          if (!response.ok) {
            throw new Error('Failed to fetch preferences');
          }

          const data = await response.json();
          
          set({
            userPreferences: data.preferences,
            isLoadingPreferences: false
          });
        } catch (error) {
          console.error('Error fetching preferences:', error);
          set({ isLoadingPreferences: false });
        }
      },

      // Submit feedback on a recommendation
      submitFeedback: async (input: SubmitFeedbackInput) => {
        try {
          const response = await fetch('/api/recommendations/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
          });

          if (!response.ok) {
            throw new Error('Failed to submit feedback');
          }

          // If negative feedback, remove from recommendations list
          if (input.feedbackType === 'not_interested' || input.feedbackType === 'dislike') {
            set(state => ({
              recommendations: state.recommendations.filter(r => r.bookId !== input.bookId)
            }));
          }
        } catch (error) {
          console.error('Error submitting feedback:', error);
          throw error;
        }
      },

      // Dismiss a recommendation (remove from list and mark as dismissed)
      dismissRecommendation: (recommendationId: string) => {
        set(state => ({
          recommendations: state.recommendations.filter(r => r.id !== recommendationId)
        }));

        // Also update server
        fetch(`/api/recommendations/feedback?id=${recommendationId}`, {
          method: 'DELETE'
        }).catch(console.error);
      },

      // Mark recommendation as viewed
      markAsViewed: (recommendationId: string) => {
        fetch('/api/recommendations/feedback', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendationId, action: 'view' })
        }).catch(console.error);
      },

      // Mark recommendation as clicked
      markAsClicked: (recommendationId: string) => {
        fetch('/api/recommendations/feedback', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendationId, action: 'click' })
        }).catch(console.error);
      },

      // Set current period for trending
      setCurrentPeriod: (period: TrendPeriod) => {
        set({ currentPeriod: period });
      },

      // Clear all recommendations
      clearRecommendations: () => {
        set({
          recommendations: [],
          similarBooks: {},
          trendingBooks: [],
          lastFetchedAt: null
        });
      },

      // Clear all errors
      clearErrors: () => {
        set({
          recommendationsError: null,
          similarError: null,
          trendingError: null
        });
      }
    }),
    {
      name: 'recommendation-store',
      partialize: (state) => ({
        recommendations: state.recommendations,
        trendingBooks: state.trendingBooks,
        currentPeriod: state.currentPeriod,
        lastFetchedAt: state.lastFetchedAt
      })
    }
  )
);

// Selector hooks for common use cases
export const useRecommendations = () => useRecommendationStore(state => state.recommendations);
export const useTrendingBooks = () => useRecommendationStore(state => state.trendingBooks);
export const useSimilarBooks = (bookId: string) => 
  useRecommendationStore(state => state.similarBooks[bookId] || []);
export const useRecommendationLoading = () => 
  useRecommendationStore(state => ({
    isLoadingRecommendations: state.isLoadingRecommendations,
    isLoadingSimilar: state.isLoadingSimilar,
    isLoadingTrending: state.isLoadingTrending
  }));
export const useRecommendationErrors = () =>
  useRecommendationStore(state => ({
    recommendationsError: state.recommendationsError,
    similarError: state.similarError,
    trendingError: state.trendingError
  }));
