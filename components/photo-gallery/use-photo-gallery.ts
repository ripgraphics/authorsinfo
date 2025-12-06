import { useState, useCallback, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { UsePhotoGalleryProps, UsePhotoGalleryReturn, AlbumImageLegacy } from './types';

export function usePhotoGallery({
  albumId,
  entityType,
  entityId,
  maxImages,
}: UsePhotoGalleryProps): UsePhotoGalleryReturn {
  const [images, setImages] = useState<AlbumImageLegacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchImages = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('album_images')
        .select(`
          id,
          display_order,
          is_cover,
          is_featured,
          images (
            id,
            url,
            thumbnail_url,
            medium_url,
            large_url,
            alt_text,
            caption,
            width,
            height,
            format,
            mime_type,
            file_size,
            metadata,
            created_at,
            updated_at
          ),
          image_tag_mappings (
            image_tags (
              id,
              name,
              slug
            )
          )
        `)
        .order('display_order', { ascending: true })
        .range((pageNum - 1) * maxImages, pageNum * maxImages - 1);

      if (albumId) {
        query = query.eq('album_id', albumId);
      } else {
        query = query
          .eq('entity_type', entityType)
          .eq('entity_id', entityId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedImages: AlbumImageLegacy[] = data.map((item: any) => ({
        id: item.images.id,
        url: item.images.url,
        filename: item.images.original_filename || item.images.url.split('/').pop() || '',
        filePath: item.images.storage_path || item.images.url,
        size: item.images.file_size || 0,
        type: item.images.mime_type || 'image/jpeg',
        metadata: {
          width: item.images.width || 0,
          height: item.images.height || 0,
          uploaded_at: item.images.created_at || new Date().toISOString(),
          ...(item.images.metadata || {})
        },
        albumId: item.album_id,
        entityType: entityType,
        entityId: entityId,
        altText: item.images.alt_text,
        caption: item.images.caption,
        tags: item.image_tag_mappings?.map((mapping: any) => ({
          id: mapping.image_tags?.id || '',
          name: mapping.image_tags?.name || ''
        })) || [],
        isFeatured: item.is_featured,
        displayOrder: item.display_order,
        createdAt: item.images.created_at,
        updatedAt: item.images.updated_at,
      }));

      setImages(prev => pageNum === 1 ? formattedImages : [...prev, ...formattedImages]);
      setHasMore(formattedImages.length === maxImages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch images'));
    } finally {
      setIsLoading(false);
    }
  }, [albumId, entityType, entityId, maxImages, supabase]);

  useEffect(() => {
    fetchImages(1);
  }, [fetchImages]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchImages(nextPage);
  }, [hasMore, isLoading, page, fetchImages]);

  const handleImageUpload = useCallback(async (files: File[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const uploadPromises = files.map(async (file) => {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${entityType}/${entityId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        // Create image record
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert({
            url: publicUrl,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: filePath,
            storage_provider: 'supabase',
          })
          .select()
          .single();

        if (imageError) throw imageError;

        // Create album image record
        const { data: albumImageData, error: albumImageError } = await supabase
          .from('album_images')
          .insert({
            album_id: albumId,
            image_id: imageData.id,
            display_order: images.length + 1,
            entity_type: entityType,
            entity_id: entityId,
          })
          .select()
          .single();

        if (albumImageError) throw albumImageError;

        return {
          ...imageData,
          displayOrder: albumImageData.display_order,
          isCover: albumImageData.is_cover,
          isFeatured: albumImageData.is_featured,
          tags: [],
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload images'));
    } finally {
      setIsLoading(false);
    }
  }, [albumId, entityType, entityId, images.length, supabase]);

  const handleImageDelete = useCallback(async (imageId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('album_images')
        .delete()
        .eq('image_id', imageId);

      if (deleteError) throw deleteError;

      setImages(prev => prev.filter(img => Number(img.id) !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete image'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const handleImageReorder = useCallback(async (imageId: number, newOrder: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('album_images')
        .update({ display_order: newOrder })
        .eq('image_id', imageId);

      if (updateError) throw updateError;

      setImages(prev => {
        const newImages = [...prev];
        const imageIndex = newImages.findIndex(img => Number(img.id) === imageId);
        if (imageIndex === -1) return prev;

        const [movedImage] = newImages.splice(imageIndex, 1);
        newImages.splice(newOrder - 1, 0, movedImage);

        return newImages.map((img, index) => ({
          ...img,
          displayOrder: index + 1,
        }));
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reorder image'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const handleImageTag = useCallback(async (imageId: number, tags: string[]) => {
    try {
      setIsLoading(true);
      setError(null);

      // Delete existing tags
      const { error: deleteError } = await supabase
        .from('image_tag_mappings')
        .delete()
        .eq('image_id', imageId);

      if (deleteError) throw deleteError;

      // Create new tags and mappings
      const tagPromises = tags.map(async (tagName) => {
        // Create or get tag
        const { data: tagData, error: tagError } = await supabase
          .from('image_tags')
          .upsert({
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
          })
          .select()
          .single();

        if (tagError) throw tagError;

        // Create mapping
        const { error: mappingError } = await supabase
          .from('image_tag_mappings')
          .insert({
            image_id: imageId,
            tag_id: tagData.id,
          });

        if (mappingError) throw mappingError;

        return tagData;
      });

      const newTags = await Promise.all(tagPromises);

      setImages(prev => prev.map(img =>
        Number(img.id) === imageId
          ? { ...img, tags: newTags }
          : img
      ));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update image tags'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return {
    images,
    isLoading,
    error,
    hasMore,
    loadMore,
    handleImageUpload,
    handleImageDelete,
    handleImageReorder,
    handleImageTag,
  };
} 