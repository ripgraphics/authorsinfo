'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function PhotoGalleryImageSkeleton() {
  return (
    <div className="photo-gallery__image-skeleton aspect-square overflow-hidden rounded-lg bg-muted">
      <Skeleton className="h-full w-full" />
    </div>
  );
} 