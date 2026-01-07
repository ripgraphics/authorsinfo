/**
 * Shelf Store - Zustand State Management
 * Manages all custom shelf operations and state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CustomShelf, ShelfWithBooks, CreateShelfInput, UpdateShelfInput } from '@/types/phase3';
import { UUID } from 'crypto';

interface ShelfStore {
  // State
  shelves: CustomShelf[];
  selectedShelfId: UUID | null;
  shelvesByIdLoading: Record<UUID, boolean>;
  shelvesByIdData: Record<UUID, ShelfWithBooks>;
  loading: boolean;
  error: string | null;

  // Actions
  fetchShelves: () => Promise<void>;
  fetchShelfById: (id: UUID) => Promise<ShelfWithBooks | null>;
  createShelf: (input: CreateShelfInput) => Promise<CustomShelf | null>;
  updateShelf: (id: UUID, input: UpdateShelfInput) => Promise<void>;
  deleteShelf: (id: UUID) => Promise<void>;
  selectShelf: (id: UUID | null) => void;
  addBookToShelf: (shelfId: UUID, bookId: UUID, displayOrder?: number, readingStatus?: string, currentPage?: number) => Promise<void>;
  removeBookFromShelf: (shelfId: UUID, bookId: UUID) => Promise<void>;
  updateBookPosition: (shelfId: UUID, bookId: UUID, displayOrder: number) => Promise<void>;
  reorderShelves: (shelves: Array<{ id: UUID; displayOrder: number }>) => Promise<void>;
  clearError: () => void;
}

export const useShelfStore = create<ShelfStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        shelves: [],
        selectedShelfId: null,
        shelvesByIdLoading: {},
        shelvesByIdData: {},
        loading: false,
        error: null,

        // Fetch all user's shelves
        fetchShelves: async () => {
          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/shelves');
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to fetch shelves');
            }
            const data = await response.json();
            set({ shelves: data.data, loading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
          }
        },

        // Fetch shelf by ID with books
        fetchShelfById: async (id: UUID) => {
          set((state) => ({
            shelvesByIdLoading: { ...state.shelvesByIdLoading, [id]: true },
          }));
          try {
            const response = await fetch(`/api/shelves/${id}`);
            if (!response.ok) {
              throw new Error('Failed to fetch shelf');
            }
            const data = await response.json();
            set((state) => ({
              shelvesByIdData: {
                ...state.shelvesByIdData,
                [id]: data.data,
              },
              shelvesByIdLoading: {
                ...state.shelvesByIdLoading,
                [id]: false,
              },
            }));
            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set((state) => ({
              shelvesByIdLoading: {
                ...state.shelvesByIdLoading,
                [id]: false,
              },
              error: message,
            }));
            return null;
          }
        },

        // Create new shelf
        createShelf: async (input: CreateShelfInput) => {
          set({ error: null });
          try {
            const response = await fetch('/api/shelves', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to create shelf');
            }

            const data = await response.json();
            set((state) => ({
              shelves: [...state.shelves, data.data],
            }));
            return data.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
            return null;
          }
        },

        // Update shelf metadata
        updateShelf: async (id: UUID, input: UpdateShelfInput) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/shelves/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to update shelf');
            }

            const data = await response.json();
            set((state) => ({
              shelves: state.shelves.map((s) =>
                s.id === id ? data.data : s
              ),
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Delete shelf
        deleteShelf: async (id: UUID) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/shelves/${id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to delete shelf');
            }

            set((state) => ({
              shelves: state.shelves.filter((s) => s.id !== id),
              selectedShelfId:
                state.selectedShelfId === id ? null : state.selectedShelfId,
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Select shelf
        selectShelf: (id: UUID | null) => {
          set({ selectedShelfId: id });
        },

        // Add book to shelf
        addBookToShelf: async (shelfId: UUID, bookId: UUID, displayOrder?: number, readingStatus?: string, currentPage?: number) => {
          set({ error: null });
          try {
            const response = await fetch(`/api/shelves/${shelfId}/books`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookId, displayOrder, readingStatus, currentPage }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to add book to shelf');
            }

            // Invalidate shelf data cache
            set((state) => {
              const newData = { ...state.shelvesByIdData };
              delete newData[shelfId];
              return { shelvesByIdData: newData };
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Remove book from shelf
        removeBookFromShelf: async (shelfId: UUID, bookId: UUID) => {
          set({ error: null });
          try {
            const response = await fetch(
              `/api/shelves/${shelfId}/books/${bookId}`,
              { method: 'DELETE' }
            );

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to remove book');
            }

            // Invalidate shelf data cache
            set((state) => {
              const newData = { ...state.shelvesByIdData };
              delete newData[shelfId];
              return { shelvesByIdData: newData };
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Update book position in shelf
        updateBookPosition: async (
          shelfId: UUID,
          bookId: UUID,
          displayOrder: number
        ) => {
          set({ error: null });
          try {
            const response = await fetch(
              `/api/shelves/${shelfId}/books/${bookId}`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayOrder }),
              }
            );

            if (!response.ok) {
              throw new Error('Failed to update book position');
            }

            // Invalidate shelf data cache
            set((state) => {
              const newData = { ...state.shelvesByIdData };
              delete newData[shelfId];
              return { shelvesByIdData: newData };
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Reorder shelves
        reorderShelves: async (
          shelves: Array<{ id: UUID; displayOrder: number }>
        ) => {
          set({ error: null });
          try {
            const response = await fetch('/api/shelves/reorder', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shelves }),
            });

            if (!response.ok) {
              throw new Error('Failed to reorder shelves');
            }

            // Update local shelf order
            set((state) => ({
              shelves: state.shelves
                .map((shelf) => {
                  const order = shelves.find((s) => s.id === shelf.id);
                  return order
                    ? { ...shelf, displayOrder: order.displayOrder }
                    : shelf;
                })
                .sort((a, b) => a.displayOrder - b.displayOrder),
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message });
          }
        },

        // Clear error message
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'shelf-store',
        partialize: (state) => ({
          shelves: state.shelves,
          selectedShelfId: state.selectedShelfId,
        }),
      }
    )
  )
);
