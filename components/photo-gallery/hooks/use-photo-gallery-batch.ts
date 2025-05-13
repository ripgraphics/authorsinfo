import { useCallback, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AlbumImage } from '../types';

interface BatchOperation {
  type: 'delete' | 'tag' | 'feature' | 'reorder';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export function usePhotoGalleryBatch(albumId: string) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BatchOperation | null>(null);
  const supabase = createClientComponentClient();

  const toggleImageSelection = useCallback((imageId: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((images: AlbumImage[]) => {
    setSelectedImages(new Set(images.map((img) => img.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelecting((prev) => !prev);
    if (isSelecting) {
      clearSelection();
    }
  }, [isSelecting, clearSelection]);

  const batchDelete = useCallback(async () => {
    if (selectedImages.size === 0) return;

    setCurrentOperation({ type: 'delete', status: 'processing' });

    try {
      // Delete album_images entries
      const { error: deleteAlbumImagesError } = await supabase
        .from('album_images')
        .delete()
        .in('image_id', Array.from(selectedImages))
        .eq('album_id', albumId);

      if (deleteAlbumImagesError) throw deleteAlbumImagesError;

      // Check if images are used in other albums
      for (const imageId of selectedImages) {
        const { data: imageUsage, error: usageError } = await supabase
          .from('album_images')
          .select('id')
          .eq('image_id', imageId)
          .neq('album_id', albumId);

        if (usageError) throw usageError;

        // If the image is not used in any other album, delete it
        if (!imageUsage || imageUsage.length === 0) {
          const { error: deleteImageError } = await supabase
            .from('images')
            .delete()
            .eq('id', imageId);

          if (deleteImageError) throw deleteImageError;
        }
      }

      setCurrentOperation({ type: 'delete', status: 'completed' });
      clearSelection();
    } catch (error) {
      setCurrentOperation({
        type: 'delete',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to delete images',
      });
    }
  }, [selectedImages, albumId, supabase, clearSelection]);

  const batchTag = useCallback(async (tags: string[]) => {
    if (selectedImages.size === 0 || tags.length === 0) return;

    setCurrentOperation({ type: 'tag', status: 'processing' });

    try {
      // First, remove existing tags for selected images
      const { error: deleteTagsError } = await supabase
        .from('image_tags')
        .delete()
        .in('image_id', Array.from(selectedImages));

      if (deleteTagsError) throw deleteTagsError;

      // Then, add new tags
      const tagEntries = Array.from(selectedImages).flatMap((imageId) =>
        tags.map((tagId) => ({
          image_id: imageId,
          tag_id: tagId,
        }))
      );

      const { error: insertTagsError } = await supabase
        .from('image_tags')
        .insert(tagEntries);

      if (insertTagsError) throw insertTagsError;

      setCurrentOperation({ type: 'tag', status: 'completed' });
      clearSelection();
    } catch (error) {
      setCurrentOperation({
        type: 'tag',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to tag images',
      });
    }
  }, [selectedImages, supabase, clearSelection]);

  const batchFeature = useCallback(async (featured: boolean) => {
    if (selectedImages.size === 0) return;

    setCurrentOperation({ type: 'feature', status: 'processing' });

    try {
      const { error: updateError } = await supabase
        .from('album_images')
        .update({ is_featured: featured })
        .in('image_id', Array.from(selectedImages))
        .eq('album_id', albumId);

      if (updateError) throw updateError;

      setCurrentOperation({ type: 'feature', status: 'completed' });
      clearSelection();
    } catch (error) {
      setCurrentOperation({
        type: 'feature',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to update featured status',
      });
    }
  }, [selectedImages, albumId, supabase, clearSelection]);

  const batchReorder = useCallback(async (newOrder: { id: string; displayOrder: number }[]) => {
    if (newOrder.length === 0) return;

    setCurrentOperation({ type: 'reorder', status: 'processing' });

    try {
      const { error: updateError } = await supabase
        .from('album_images')
        .upsert(
          newOrder.map(({ id, displayOrder }) => ({
            image_id: id,
            album_id: albumId,
            display_order: displayOrder,
          }))
        );

      if (updateError) throw updateError;

      setCurrentOperation({ type: 'reorder', status: 'completed' });
    } catch (error) {
      setCurrentOperation({
        type: 'reorder',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to reorder images',
      });
    }
  }, [albumId, supabase]);

  return {
    selectedImages,
    isSelecting,
    currentOperation,
    toggleImageSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    batchDelete,
    batchTag,
    batchFeature,
    batchReorder,
  };
} 