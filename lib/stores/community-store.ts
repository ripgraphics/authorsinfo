/**
 * Community Store - Zustand State Management
 * Manages book clubs, discussions, events, and Q&A sessions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Event, QASession } from '@/types/phase3';

// Types for community features
interface BookClub {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_public: boolean;
  max_members?: number;
  rules?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  book_club_members?: { count: number }[];
  profiles?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface BookClubMember {
  id: string;
  book_club_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
  };
}

interface Discussion {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  group_id?: string;
  category_id?: number;
  book_id?: string;
  permalink?: string;
  profiles?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  books?: {
    id: string;
    title: string;
    cover_image_url?: string;
  };
  comments?: { count: number }[];
}

interface CommunityState {
  // Book Clubs
  bookClubs: BookClub[];
  currentClub: BookClub | null;
  clubMembers: BookClubMember[];
  myClubs: BookClub[];
  
  // Discussions
  discussions: Discussion[];
  currentDiscussion: Discussion | null;
  
  // Events (Phase 3 Sprint 9)
  events: Event[];
  currentEvent: Event | null;
  myEvents: Event[];
  
  // Q&A Sessions (Phase 3 Sprint 9)
  qaSessions: QASession[];
  currentQASession: QASession | null;
  myQASessions: QASession[];
  
  // Pagination
  clubsPage: number;
  clubsTotalPages: number;
  discussionsPage: number;
  discussionsTotalPages: number;
  eventsPage: number;
  eventsTotalPages: number;
  qaSessionsPage: number;
  qaSessionsTotalPages: number;
  
  // Loading states
  loading: boolean;
  clubLoading: boolean;
  discussionLoading: boolean;
  eventLoading: boolean;
  qaSessionLoading: boolean;
  error: string | null;
}

interface CommunityActions {
  // Book Club Actions
  fetchBookClubs: (page?: number, search?: string, isPublic?: boolean) => Promise<void>;
  fetchMyClubs: () => Promise<void>;
  fetchClub: (id: string) => Promise<void>;
  createClub: (data: Partial<BookClub>) => Promise<BookClub | null>;
  updateClub: (id: string, data: Partial<BookClub>) => Promise<void>;
  deleteClub: (id: string) => Promise<void>;
  joinClub: (id: string) => Promise<void>;
  leaveClub: (id: string) => Promise<void>;
  fetchClubMembers: (clubId: string) => Promise<void>;
  
  // Discussion Actions
  fetchDiscussions: (params?: {
    page?: number;
    search?: string;
    bookId?: string;
    groupId?: string;
    userId?: string;
  }) => Promise<void>;
  fetchDiscussion: (id: string) => Promise<void>;
  createDiscussion: (data: Partial<Discussion>) => Promise<Discussion | null>;
  updateDiscussion: (id: string, data: Partial<Discussion>) => Promise<void>;
  deleteDiscussion: (id: string) => Promise<void>;
  
  // Event Actions (Phase 3 Sprint 9)
  fetchEvents: (params?: {
    page?: number;
    type?: string;
    status?: string;
    isVirtual?: boolean;
  }) => Promise<void>;
  fetchEvent: (id: string) => Promise<void>;
  fetchMyEvents: () => Promise<void>;
  createEvent: (data: Partial<Event>) => Promise<Event | null>;
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  rsvpEvent: (id: string, status: string) => Promise<void>;
  
  // Q&A Session Actions (Phase 3 Sprint 9)
  fetchQASessions: (params?: {
    page?: number;
    status?: string;
    sessionType?: string;
    authorId?: string;
    bookId?: string;
  }) => Promise<void>;
  fetchQASession: (id: string) => Promise<void>;
  fetchMyQASessions: () => Promise<void>;
  createQASession: (data: Partial<QASession>) => Promise<QASession | null>;
  updateQASession: (id: string, data: Partial<QASession>) => Promise<void>;
  deleteQASession: (id: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  clearCurrentClub: () => void;
  clearCurrentDiscussion: () => void;
  clearCurrentEvent: () => void;
  clearCurrentQASession: () => void;
}

type CommunityStore = CommunityState & CommunityActions;

export const useCommunityStore = create<CommunityStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      bookClubs: [],
      currentClub: null,
      clubMembers: [],
      myClubs: [],
      discussions: [],
      currentDiscussion: null,
      events: [],
      currentEvent: null,
      myEvents: [],
      qaSessions: [],
      currentQASession: null,
      myQASessions: [],
      clubsPage: 1,
      clubsTotalPages: 1,
      discussionsPage: 1,
      discussionsTotalPages: 1,
      eventsPage: 1,
      eventsTotalPages: 1,
      qaSessionsPage: 1,
      qaSessionsTotalPages: 1,
      loading: false,
      clubLoading: false,
      discussionLoading: false,
      eventLoading: false,
      qaSessionLoading: false,
      error: null,

      // Book Club Actions
      fetchBookClubs: async (page = 1, search = '', isPublic) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams({ page: page.toString(), limit: '12' });
          if (search) params.append('search', search);
          if (isPublic !== undefined) params.append('public', isPublic.toString());

          const res = await fetch(`/api/book-clubs?${params}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch clubs');

          set({
            bookClubs: json.data,
            clubsPage: json.page,
            clubsTotalPages: json.totalPages,
            loading: false,
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchMyClubs: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/book-clubs?user_id=me');
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch my clubs');

          set({ myClubs: json.data, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchClub: async (id: string) => {
        set({ clubLoading: true, error: null });
        try {
          const res = await fetch(`/api/book-clubs/${id}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch club');

          set({ currentClub: json.data, clubLoading: false });
        } catch (error: any) {
          set({ error: error.message, clubLoading: false });
        }
      },

      createClub: async (data: Partial<BookClub>) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/book-clubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to create club');

          set((state) => ({
            bookClubs: [json.data, ...state.bookClubs],
            myClubs: [json.data, ...state.myClubs],
            loading: false,
          }));

          return json.data;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return null;
        }
      },

      updateClub: async (id: string, data: Partial<BookClub>) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`/api/book-clubs/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to update club');

          set((state) => ({
            bookClubs: state.bookClubs.map((c) => (c.id === id ? json.data : c)),
            currentClub: state.currentClub?.id === id ? json.data : state.currentClub,
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      deleteClub: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`/api/book-clubs/${id}`, { method: 'DELETE' });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to delete club');

          set((state) => ({
            bookClubs: state.bookClubs.filter((c) => c.id !== id),
            myClubs: state.myClubs.filter((c) => c.id !== id),
            currentClub: state.currentClub?.id === id ? null : state.currentClub,
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      joinClub: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`/api/book-clubs/${id}/members`, { method: 'POST' });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to join club');

          // Refresh the club data
          await get().fetchClub(id);
          await get().fetchMyClubs();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      leaveClub: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`/api/book-clubs/${id}/members`, { method: 'DELETE' });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to leave club');

          set((state) => ({
            myClubs: state.myClubs.filter((c) => c.id !== id),
            loading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchClubMembers: async (clubId: string) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`/api/book-clubs/${clubId}/members`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch members');

          set({ clubMembers: json.data, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      // Discussion Actions
      fetchDiscussions: async (params = {}) => {
        set({ discussionLoading: true, error: null });
        try {
          const searchParams = new URLSearchParams();
          if (params.page) searchParams.append('page', params.page.toString());
          if (params.search) searchParams.append('search', params.search);
          if (params.bookId) searchParams.append('book_id', params.bookId);
          if (params.groupId) searchParams.append('group_id', params.groupId);
          if (params.userId) searchParams.append('user_id', params.userId);

          const res = await fetch(`/api/discussions?${searchParams}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch discussions');

          set({
            discussions: json.data,
            discussionsPage: json.page,
            discussionsTotalPages: json.totalPages,
            discussionLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, discussionLoading: false });
        }
      },

      fetchDiscussion: async (id: string) => {
        set({ discussionLoading: true, error: null });
        try {
          const res = await fetch(`/api/discussions/${id}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch discussion');

          set({ currentDiscussion: json.data, discussionLoading: false });
        } catch (error: any) {
          set({ error: error.message, discussionLoading: false });
        }
      },

      createDiscussion: async (data: Partial<Discussion>) => {
        set({ discussionLoading: true, error: null });
        try {
          const res = await fetch('/api/discussions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to create discussion');

          set((state) => ({
            discussions: [json.data, ...state.discussions],
            discussionLoading: false,
          }));

          return json.data;
        } catch (error: any) {
          set({ error: error.message, discussionLoading: false });
          return null;
        }
      },

      updateDiscussion: async (id: string, data: Partial<Discussion>) => {
        set({ discussionLoading: true, error: null });
        try {
          const res = await fetch(`/api/discussions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to update discussion');

          set((state) => ({
            discussions: state.discussions.map((d) => (d.id === id ? json.data : d)),
            currentDiscussion: state.currentDiscussion?.id === id ? json.data : state.currentDiscussion,
            discussionLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, discussionLoading: false });
        }
      },

      deleteDiscussion: async (id: string) => {
        set({ discussionLoading: true, error: null });
        try {
          const res = await fetch(`/api/discussions/${id}`, { method: 'DELETE' });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to delete discussion');

          set((state) => ({
            discussions: state.discussions.filter((d) => d.id !== id),
            currentDiscussion: state.currentDiscussion?.id === id ? null : state.currentDiscussion,
            discussionLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, discussionLoading: false });
        }
      },

      // Event Actions (Phase 3 Sprint 9)
      fetchEvents: async (params = {}) => {
        set({ eventLoading: true, error: null });
        try {
          const searchParams = new URLSearchParams();
          if (params.page) searchParams.append('page', params.page.toString());
          if (params.type) searchParams.append('type', params.type);
          if (params.status) searchParams.append('status', params.status);
          if (params.isVirtual !== undefined) searchParams.append('is_virtual', String(params.isVirtual));

          const res = await fetch(`/api/events?${searchParams}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch events');

          set({
            events: json.data || json.events || [],
            eventsPage: json.page || 1,
            eventsTotalPages: json.totalPages || 1,
            eventLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, eventLoading: false });
        }
      },

      fetchEvent: async (id: string) => {
        set({ eventLoading: true, error: null });
        try {
          const res = await fetch(`/api/events/${id}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch event');

          set({ currentEvent: json.data || json.event, eventLoading: false });
        } catch (error: any) {
          set({ error: error.message, eventLoading: false });
        }
      },

      fetchMyEvents: async () => {
        set({ eventLoading: true, error: null });
        try {
          const res = await fetch('/api/events?my_events=true');
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch my events');

          set({ myEvents: json.data || json.events || [], eventLoading: false });
        } catch (error: any) {
          set({ error: error.message, eventLoading: false });
        }
      },

      createEvent: async (data: Partial<Event>) => {
        set({ eventLoading: true, error: null });
        try {
          const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to create event');

          set((state) => ({
            events: [json.data || json.event, ...state.events],
            myEvents: [json.data || json.event, ...state.myEvents],
            eventLoading: false,
          }));

          return json.data || json.event;
        } catch (error: any) {
          set({ error: error.message, eventLoading: false });
          return null;
        }
      },

      updateEvent: async (id: string, data: Partial<Event>) => {
        set({ eventLoading: true, error: null });
        try {
          const res = await fetch(`/api/events/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to update event');

          set((state) => ({
            events: state.events.map((e) => (e.id === id ? json.data || json.event : e)),
            currentEvent: state.currentEvent?.id === id ? json.data || json.event : state.currentEvent,
            eventLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, eventLoading: false });
        }
      },

      deleteEvent: async (id: string) => {
        set({ eventLoading: true, error: null });
        try {
          const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to delete event');

          set((state) => ({
            events: state.events.filter((e) => e.id !== id),
            myEvents: state.myEvents.filter((e) => e.id !== id),
            currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
            eventLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, eventLoading: false });
        }
      },

      rsvpEvent: async (id: string, status: string) => {
        set({ eventLoading: true, error: null });
        try {
          const res = await fetch(`/api/events/${id}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rsvp_status: status }),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to RSVP to event');

          // Refresh the event data
          await get().fetchEvent(id);
          await get().fetchMyEvents();
          set({ eventLoading: false });
        } catch (error: any) {
          set({ error: error.message, eventLoading: false });
        }
      },

      // Q&A Session Actions (Phase 3 Sprint 9)
      fetchQASessions: async (params = {}) => {
        set({ qaSessionLoading: true, error: null });
        try {
          const searchParams = new URLSearchParams();
          if (params.page) searchParams.append('page', params.page.toString());
          if (params.status) searchParams.append('status', params.status);
          if (params.sessionType) searchParams.append('session_type', params.sessionType);
          if (params.authorId) searchParams.append('author_id', params.authorId);
          if (params.bookId) searchParams.append('book_id', params.bookId);

          const res = await fetch(`/api/qa-sessions?${searchParams}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch Q&A sessions');

          set({
            qaSessions: json.data || json.sessions || [],
            qaSessionsPage: json.page || 1,
            qaSessionsTotalPages: json.totalPages || 1,
            qaSessionLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, qaSessionLoading: false });
        }
      },

      fetchQASession: async (id: string) => {
        set({ qaSessionLoading: true, error: null });
        try {
          const res = await fetch(`/api/qa-sessions/${id}`);
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch Q&A session');

          set({ currentQASession: json.data || json.session, qaSessionLoading: false });
        } catch (error: any) {
          set({ error: error.message, qaSessionLoading: false });
        }
      },

      fetchMyQASessions: async () => {
        set({ qaSessionLoading: true, error: null });
        try {
          const res = await fetch('/api/qa-sessions?my_sessions=true');
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to fetch my Q&A sessions');

          set({ myQASessions: json.data || json.sessions || [], qaSessionLoading: false });
        } catch (error: any) {
          set({ error: error.message, qaSessionLoading: false });
        }
      },

      createQASession: async (data: Partial<QASession>) => {
        set({ qaSessionLoading: true, error: null });
        try {
          const res = await fetch('/api/qa-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to create Q&A session');

          set((state) => ({
            qaSessions: [json.data || json.session, ...state.qaSessions],
            myQASessions: [json.data || json.session, ...state.myQASessions],
            qaSessionLoading: false,
          }));

          return json.data || json.session;
        } catch (error: any) {
          set({ error: error.message, qaSessionLoading: false });
          return null;
        }
      },

      updateQASession: async (id: string, data: Partial<QASession>) => {
        set({ qaSessionLoading: true, error: null });
        try {
          const res = await fetch(`/api/qa-sessions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to update Q&A session');

          set((state) => ({
            qaSessions: state.qaSessions.map((s) => (s.id === id ? json.data || json.session : s)),
            currentQASession: state.currentQASession?.id === id ? json.data || json.session : state.currentQASession,
            qaSessionLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, qaSessionLoading: false });
        }
      },

      deleteQASession: async (id: string) => {
        set({ qaSessionLoading: true, error: null });
        try {
          const res = await fetch(`/api/qa-sessions/${id}`, { method: 'DELETE' });
          const json = await res.json();

          if (!res.ok) throw new Error(json.error || 'Failed to delete Q&A session');

          set((state) => ({
            qaSessions: state.qaSessions.filter((s) => s.id !== id),
            myQASessions: state.myQASessions.filter((s) => s.id !== id),
            currentQASession: state.currentQASession?.id === id ? null : state.currentQASession,
            qaSessionLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, qaSessionLoading: false });
        }
      },

      // Utility
      clearError: () => set({ error: null }),
      clearCurrentClub: () => set({ currentClub: null, clubMembers: [] }),
      clearCurrentDiscussion: () => set({ currentDiscussion: null }),
      clearCurrentEvent: () => set({ currentEvent: null }),
      clearCurrentQASession: () => set({ currentQASession: null }),
    }),
    { name: 'community-store' }
  )
);
