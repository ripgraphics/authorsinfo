import { useCallback, useEffect, useRef, useState } from 'react';
import { AlbumImage } from '../types';

interface AccessibilityState {
  focusedIndex: number;
  isNavigating: boolean;
  isFullscreen: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface AccessibilityOptions {
  onImageSelect?: (image: AlbumImage) => void;
  onImageDelete?: (image: AlbumImage) => void;
  onImageEdit?: (image: AlbumImage) => void;
  onImageShare?: (image: AlbumImage) => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
}

export function usePhotoGalleryAccessibility(
  images: AlbumImage[],
  options: AccessibilityOptions = {}
) {
  const {
    onImageSelect,
    onImageDelete,
    onImageEdit,
    onImageShare,
    onFullscreenToggle,
  } = options;

  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    focusedIndex: -1,
    isNavigating: false,
    isFullscreen: false,
    highContrast: false,
    reducedMotion: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;

    const { focusedIndex } = accessibilityState;
    let newIndex = focusedIndex;

    switch (event.key) {
      case 'ArrowRight':
        newIndex = Math.min(focusedIndex + 1, images.length - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(focusedIndex - 1, 0);
        break;
      case 'ArrowUp':
        newIndex = Math.max(focusedIndex - 3, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(focusedIndex + 3, images.length - 1);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = images.length - 1;
        break;
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0) {
          onImageSelect?.(images[focusedIndex]);
        }
        break;
      case 'Delete':
        if (focusedIndex >= 0) {
          onImageDelete?.(images[focusedIndex]);
        }
        break;
      case 'e':
        if (focusedIndex >= 0) {
          onImageEdit?.(images[focusedIndex]);
        }
        break;
      case 's':
        if (focusedIndex >= 0) {
          onImageShare?.(images[focusedIndex]);
        }
        break;
      case 'f':
        setAccessibilityState((prev) => {
          const newState = { ...prev, isFullscreen: !prev.isFullscreen };
          onFullscreenToggle?.(newState.isFullscreen);
          return newState;
        });
        break;
      default:
        return;
    }

    if (newIndex !== focusedIndex) {
      event.preventDefault();
      setAccessibilityState((prev) => ({
        ...prev,
        focusedIndex: newIndex,
        isNavigating: true,
      }));

      // Focus the new image
      const imageElement = imageRefs.current.get(images[newIndex].id);
      if (imageElement) {
        imageElement.focus();
        imageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [accessibilityState.focusedIndex, images, onImageSelect, onImageDelete, onImageEdit, onImageShare, onFullscreenToggle]);

  // Handle focus management
  const handleFocus = useCallback((imageId: string) => {
    const index = images.findIndex((img) => img.id === imageId);
    if (index !== -1) {
      setAccessibilityState((prev) => ({
        ...prev,
        focusedIndex: index,
        isNavigating: false,
      }));
    }
  }, [images]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setAccessibilityState((prev) => ({
      ...prev,
      focusedIndex: -1,
      isNavigating: false,
    }));
  }, []);

  // Initialize keyboard event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Initialize media query listeners for accessibility preferences
  useEffect(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setAccessibilityState((prev) => ({
        ...prev,
        highContrast: e.matches,
      }));
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setAccessibilityState((prev) => ({
        ...prev,
        reducedMotion: e.matches,
      }));
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Set initial values
    setAccessibilityState((prev) => ({
      ...prev,
      highContrast: highContrastQuery.matches,
      reducedMotion: reducedMotionQuery.matches,
    }));

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Register image ref
  const registerImageRef = useCallback((imageId: string, element: HTMLDivElement | null) => {
    if (element) {
      imageRefs.current.set(imageId, element);
    } else {
      imageRefs.current.delete(imageId);
    }
  }, []);

  // Get ARIA attributes for an image
  const getImageAriaAttributes = useCallback((image: AlbumImage, index: number) => {
    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': image.altText || `Image ${index + 1}`,
      'aria-description': image.caption || '',
      'aria-selected': index === accessibilityState.focusedIndex,
      'aria-posinset': index + 1,
      'aria-setsize': images.length,
    };
  }, [accessibilityState.focusedIndex, images.length]);

  // Get container ARIA attributes
  const getContainerAriaAttributes = useCallback(() => {
    return {
      role: 'grid',
      'aria-label': 'Photo Gallery',
      'aria-orientation': 'horizontal',
      'aria-multiselectable': false,
    };
  }, []);

  return {
    containerRef,
    accessibilityState,
    registerImageRef,
    handleFocus,
    handleBlur,
    getImageAriaAttributes,
    getContainerAriaAttributes,
  };
} 