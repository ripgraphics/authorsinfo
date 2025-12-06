import { useCallback, useState } from 'react';
import { AlbumImage } from '../types';

export type SortOption = 'newest' | 'oldest' | 'name' | 'size' | 'dimensions';
export type FilterOption = 'all' | 'featured' | 'tagged' | 'untagged';

interface FilterState {
  sortBy: SortOption;
  filterBy: FilterOption;
  searchQuery: string;
  selectedTags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export function usePhotoGalleryFilters(initialImages: AlbumImage[] = []) {
  const [filterState, setFilterState] = useState<FilterState>({
    sortBy: 'newest',
    filterBy: 'all',
    searchQuery: '',
    selectedTags: [],
    dateRange: {
      start: null,
      end: null,
    },
  });

  const [filteredImages, setFilteredImages] = useState<AlbumImage[]>(initialImages);

  const applyFilters = useCallback((images: AlbumImage[]) => {
    let result = [...images];

    // Apply search filter
    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase();
      result = result.filter(
        (image) =>
          (image as any).altText?.toLowerCase().includes(query) ||
          (image as any).alt_text?.toLowerCase().includes(query) ||
          (image as any).caption?.toLowerCase().includes(query) ||
          (image as any).description?.toLowerCase().includes(query) ||
          (image as any).tags?.some((tag: any) => tag.name?.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (filterState.selectedTags.length > 0) {
      result = result.filter((image) =>
        (image as any).tags?.some((tag: any) => filterState.selectedTags.includes(tag.id))
      );
    }

    // Apply date range filter
    if (filterState.dateRange.start || filterState.dateRange.end) {
      result = result.filter((image) => {
        const imageDate = new Date((image as any).createdAt || image.created_at);
        if (filterState.dateRange.start && imageDate < filterState.dateRange.start) {
          return false;
        }
        if (filterState.dateRange.end && imageDate > filterState.dateRange.end) {
          return false;
        }
        return true;
      });
    }

    // Apply featured filter
    if (filterState.filterBy === 'featured') {
      result = result.filter((image) => image.isFeatured);
    }

    // Apply tagged/untagged filter
    if (filterState.filterBy === 'tagged') {
      result = result.filter((image) => (image as any).tags && (image as any).tags.length > 0);
    } else if (filterState.filterBy === 'untagged') {
      result = result.filter((image) => !(image as any).tags || (image as any).tags.length === 0);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filterState.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return (a.altText || '').localeCompare(b.altText || '');
        case 'size':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'dimensions':
          return (b.width * b.height) - (a.width * a.height);
        default:
          return 0;
      }
    });

    setFilteredImages(result);
  }, [filterState]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilterState((prev) => {
      const newState = { ...prev, ...updates };
      return newState;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState({
      sortBy: 'newest',
      filterBy: 'all',
      searchQuery: '',
      selectedTags: [],
      dateRange: {
        start: null,
        end: null,
      },
    });
  }, []);

  const getAvailableTags = useCallback((images: AlbumImage[]) => {
    const tags = new Map<string, { id: string; name: string; count: number }>();
    
    images.forEach((image) => {
      (image as any).tags?.forEach((tag: any) => {
        if (!tags.has(tag.id)) {
          tags.set(tag.id, { ...tag, count: 1 });
        } else {
          const existingTag = tags.get(tag.id)!;
          existingTag.count += 1;
          tags.set(tag.id, existingTag);
        }
      });
    });

    return Array.from(tags.values());
  }, []);

  return {
    filterState,
    filteredImages,
    applyFilters,
    updateFilters,
    resetFilters,
    getAvailableTags,
  };
} 