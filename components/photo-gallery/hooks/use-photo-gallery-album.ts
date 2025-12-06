import { useCallback, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { AlbumImage } from '../types';

interface Album {
  id: string;
  name: string;
  description?: string;
  cover_image_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    total_images?: number;
    total_size?: number;
    last_modified?: string;
  };
}

interface AlbumState {
  isLoading: boolean;
  error: string | null;
  album: Album | null;
  images: AlbumImage[];
}

interface AlbumOptions {
  autoUpdateMetadata?: boolean;
  maxImages?: number;
}

export function usePhotoGalleryAlbum(options: AlbumOptions = {}) {
  const {
    autoUpdateMetadata = true,
    maxImages,
  } = options;

  const [albumState, setAlbumState] = useState<AlbumState>({
    isLoading: false,
    error: null,
    album: null,
    images: [],
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Create new album
  const createAlbum = useCallback(async (
    name: string,
    description?: string,
    coverImageId?: string
  ): Promise<Album> => {
    setAlbumState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { data, error } = await supabase
        .from('albums')
        .insert({
          name,
          description,
          cover_image_id: coverImageId,
          metadata: {
            total_images: 0,
            total_size: 0,
            last_modified: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        album: data,
      }));

      return data;
    } catch (error) {
      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create album',
      }));
      throw error;
    }
  }, [supabase]);

  // Get album by ID
  const getAlbum = useCallback(async (albumId: string): Promise<Album> => {
    setAlbumState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .single();

      if (error) throw error;

      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        album: data,
      }));

      return data;
    } catch (error) {
      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get album',
      }));
      throw error;
    }
  }, [supabase]);

  // Update album
  const updateAlbum = useCallback(async (
    albumId: string,
    updates: Partial<Album>
  ): Promise<Album> => {
    setAlbumState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { data, error } = await supabase
        .from('albums')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', albumId)
        .select()
        .single();

      if (error) throw error;

      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        album: data,
      }));

      return data;
    } catch (error) {
      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update album',
      }));
      throw error;
    }
  }, [supabase]);

  // Delete album
  const deleteAlbum = useCallback(async (albumId: string): Promise<void> => {
    setAlbumState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Delete album images
      const { error: albumImagesError } = await supabase
        .from('album_images')
        .delete()
        .eq('album_id', albumId);

      if (albumImagesError) throw albumImagesError;

      // Delete album
      const { error: albumError } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (albumError) throw albumError;

      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        album: null,
        images: [],
      }));
    } catch (error) {
      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete album',
      }));
      throw error;
    }
  }, [supabase]);

  // Get album images
  const getAlbumImages = useCallback(async (
    albumId: string,
    page = 1,
    pageSize = 20
  ): Promise<AlbumImage[]> => {
    setAlbumState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { data, error } = await supabase
        .from('album_images')
        .select(`
          *,
          images (
            id,
            url,
            filename,
            file_path,
            size,
            type,
            metadata
          )
        `)
        .eq('album_id', albumId)
        .order('display_order', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      const images = data.map((item) => ({
        ...item.images,
        albumId,
        displayOrder: item.display_order,
      }));

      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        images,
      }));

      return images;
    } catch (error) {
      setAlbumState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get album images',
      }));
      throw error;
    }
  }, [supabase]);

  // Add image to album
  const addImageToAlbum = useCallback(async (
    albumId: string,
    imageId: string,
    displayOrder?: number
  ): Promise<void> => {
    try {
      // Get current max display order
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('album_images')
        .select('display_order')
        .eq('album_id', albumId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      if (maxOrderError && maxOrderError.code !== 'PGRST116') throw maxOrderError;

      const newDisplayOrder = displayOrder ?? (maxOrderData?.display_order ?? 0) + 1;

      // Add image to album
      const { error: addError } = await supabase
        .from('album_images')
        .insert({
          album_id: albumId,
          image_id: imageId,
          display_order: newDisplayOrder,
        });

      if (addError) throw addError;

      // Update album metadata if autoUpdateMetadata is enabled
      if (autoUpdateMetadata) {
        await updateAlbumMetadata(albumId);
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add image to album');
    }
  }, [supabase, autoUpdateMetadata]);

  // Remove image from album
  const removeImageFromAlbum = useCallback(async (
    albumId: string,
    imageId: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('album_images')
        .delete()
        .eq('album_id', albumId)
        .eq('image_id', imageId);

      if (error) throw error;

      // Update album metadata if autoUpdateMetadata is enabled
      if (autoUpdateMetadata) {
        await updateAlbumMetadata(albumId);
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove image from album');
    }
  }, [supabase, autoUpdateMetadata]);

  // Reorder images in album
  const reorderImages = useCallback(async (
    albumId: string,
    imageIds: string[]
  ): Promise<void> => {
    try {
      // Update display order for each image
      const updates = imageIds.map((imageId, index) => ({
        album_id: albumId,
        image_id: imageId,
        display_order: index,
      }));

      const { error } = await supabase
        .from('album_images')
        .upsert(updates);

      if (error) throw error;

      // Update album metadata if autoUpdateMetadata is enabled
      if (autoUpdateMetadata) {
        await updateAlbumMetadata(albumId);
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reorder images');
    }
  }, [supabase, autoUpdateMetadata]);

  // Update album metadata
  const updateAlbumMetadata = useCallback(async (albumId: string): Promise<void> => {
    try {
      // Get album images
      const { data: images, error: imagesError } = await supabase
        .from('album_images')
        .select(`
          images (
            size,
            metadata
          )
        `)
        .eq('album_id', albumId);

      if (imagesError) throw imagesError;

      // Calculate metadata
      const totalImages = images.length;
      const totalSize = images.reduce((sum, item) => sum + (item.images?.size ?? 0), 0);
      const lastModified = new Date().toISOString();

      // Update album metadata
      const { error: updateError } = await supabase
        .from('albums')
        .update({
          metadata: {
            total_images: totalImages,
            total_size: totalSize,
            last_modified: lastModified,
          },
        })
        .eq('id', albumId);

      if (updateError) throw updateError;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update album metadata');
    }
  }, [supabase]);

  return {
    albumState,
    createAlbum,
    getAlbum,
    updateAlbum,
    deleteAlbum,
    getAlbumImages,
    addImageToAlbum,
    removeImageFromAlbum,
    reorderImages,
    updateAlbumMetadata,
  };
} 