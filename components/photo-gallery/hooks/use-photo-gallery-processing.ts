import { useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AlbumImage } from '../types';

interface ImageVariant {
  url: string;
  width: number;
  height: number;
  size: number;
}

interface ProcessedImage {
  original: ImageVariant;
  thumbnail: ImageVariant;
  medium: ImageVariant;
  large: ImageVariant;
  metadata: Record<string, any>;
}

export function usePhotoGalleryProcessing() {
  const supabase = createClientComponentClient();

  const processImage = useCallback(async (file: File): Promise<ProcessedImage> => {
    try {
      // Create image element to get dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      // Calculate dimensions for different sizes
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      const thumbnailSize = { width: 300, height: 300 };
      const mediumSize = { width: 800, height: 800 };
      const largeSize = { width: 1200, height: 1200 };

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Generate variants
      const variants = {
        thumbnail: await resizeImage(file, thumbnailSize.width, thumbnailSize.height),
        medium: await resizeImage(file, mediumSize.width, mediumSize.height),
        large: await resizeImage(file, largeSize.width, largeSize.height),
      };

      // Extract EXIF data if available
      const metadata = await extractExifData(file);

      // Clean up
      URL.revokeObjectURL(objectUrl);

      return {
        original: {
          url: objectUrl,
          width: originalWidth,
          height: originalHeight,
          size: file.size,
        },
        ...variants,
        metadata,
      };
    } catch (error) {
      console.error('Failed to process image:', error);
      throw error;
    }
  }, []);

  const resizeImage = async (
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<ImageVariant> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            const url = URL.createObjectURL(blob);
            resolve({
              url,
              width,
              height,
              size: blob.size,
            });

            URL.revokeObjectURL(objectUrl);
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    });
  };

  const extractExifData = async (file: File): Promise<Record<string, any>> => {
    // This is a placeholder for EXIF extraction
    // You would typically use a library like exif-js
    return {
      filename: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    };
  };

  const generateImageVariants = useCallback(async (imageId: number) => {
    try {
      const { data: image, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Fetch the original image
      const response = await fetch(image.url);
      const blob = await response.blob();
      const file = new File([blob], image.original_filename, { type: blob.type });

      // Process the image
      const processed = await processImage(file);

      // Update the image record with new variants
      const { error: updateError } = await supabase
        .from('images')
        .update({
          thumbnail_url: processed.thumbnail.url,
          medium_url: processed.medium.url,
          large_url: processed.large.url,
          metadata: processed.metadata,
          is_processed: true,
          processing_status: 'completed',
        })
        .eq('id', imageId);

      if (updateError) throw updateError;

      return processed;
    } catch (error) {
      console.error('Failed to generate image variants:', error);
      throw error;
    }
  }, [processImage, supabase]);

  return {
    processImage,
    generateImageVariants,
  };
} 