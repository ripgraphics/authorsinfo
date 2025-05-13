'use client';

import { PhotoGalleryLoadingProps } from './types';
import { Skeleton } from '@/components/ui/skeleton';

export function PhotoGalleryLoading({ gridCols = 3 }: PhotoGalleryLoadingProps) {
  // Generate an array of skeleton items based on gridCols
  const skeletonItems = Array.from({ length: gridCols * 2 }, (_, i) => i);

  return (
    <div className="photo-gallery__loading">
      <div className="photo-gallery__loading-header flex items-center justify-between gap-4 p-4">
        <div className="photo-gallery__loading-title">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="photo-gallery__loading-actions flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div
        className={`photo-gallery__loading-grid grid gap-4 p-4 ${
          gridCols === 1
            ? 'grid-cols-1'
            : gridCols === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : gridCols === 3
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {skeletonItems.map((index) => (
          <div
            key={index}
            className="photo-gallery__loading-item aspect-square overflow-hidden rounded-lg"
          >
            <Skeleton className="h-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
} 