import { useCallback, useEffect, useRef, useState } from 'react';
import { AlbumImage } from '../types';

interface ImageCache {
  [key: string]: {
    url: string;
    timestamp: number;
    size: number;
  };
}

interface OptimizationOptions {
  maxCacheSize?: number; // in bytes
  maxCacheAge?: number; // in milliseconds
  quality?: number; // 0-100
  format?: 'jpeg' | 'webp' | 'avif';
}

interface OptimizedImage {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export function usePhotoGalleryOptimization(options: OptimizationOptions = {}) {
  const {
    maxCacheSize = 50 * 1024 * 1024, // 50MB default
    maxCacheAge = 24 * 60 * 60 * 1000, // 24 hours default
    quality = 80,
    format = 'webp',
  } = options;

  const [cache, setCache] = useState<ImageCache>({});
  const cacheSizeRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker for image processing
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      workerRef.current = new Worker(new URL('../workers/image-processor.worker.ts', import.meta.url));
    }
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Clean up expired cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    setCache((prevCache) => {
      const newCache: ImageCache = {};
      let newSize = 0;

      Object.entries(prevCache).forEach(([key, value]) => {
        if (now - value.timestamp < maxCacheAge) {
          newCache[key] = value;
          newSize += value.size;
        }
      });

      cacheSizeRef.current = newSize;
      return newCache;
    });
  }, [maxCacheAge]);

  // Optimize image using Web Worker
  const optimizeImage = useCallback(async (
    imageUrl: string,
    width: number,
    height: number
  ): Promise<OptimizedImage> => {
    if (!workerRef.current) {
      throw new Error('Web Worker not available');
    }

    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36).substring(7);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          workerRef.current?.removeEventListener('message', handleMessage);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      if (!workerRef.current) return;
      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({
        id: messageId,
        type: 'optimize',
        imageUrl,
        width,
        height,
        quality,
        format,
      });
    });
  }, [quality, format]);

  // Get optimized image URL
  const getOptimizedImageUrl = useCallback(async (
    image: AlbumImage,
    width: number,
    height: number
  ): Promise<string> => {
    const cacheKey = `${image.id}-${width}-${height}-${quality}-${format}`;
    const cachedImage = cache[cacheKey];

    if (cachedImage && Date.now() - cachedImage.timestamp < maxCacheAge) {
      return cachedImage.url;
    }

    try {
      const optimized = await optimizeImage((image as any).url || '', width, height);
      
      // Update cache
      setCache((prevCache) => {
        const newCache = { ...prevCache };
        const oldSize = newCache[cacheKey]?.size || 0;
        const newSize = optimized.size;

        // Remove old entry if it exists
        if (newCache[cacheKey]) {
          cacheSizeRef.current -= oldSize;
          delete newCache[cacheKey];
        }

        // Check if we need to make space
        while (cacheSizeRef.current + newSize > maxCacheSize) {
          const oldestKey = Object.entries(newCache)
            .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
          
          if (oldestKey) {
            cacheSizeRef.current -= newCache[oldestKey].size;
            delete newCache[oldestKey];
          } else {
            break;
          }
        }

        // Add new entry
        newCache[cacheKey] = {
          url: optimized.url,
          timestamp: Date.now(),
          size: optimized.size,
        };
        cacheSizeRef.current += optimized.size;

        return newCache;
      });

      return optimized.url;
    } catch (error) {
      console.error('Failed to optimize image:', error);
      return image.url; // Fallback to original URL
    }
  }, [cache, maxCacheAge, maxCacheSize, optimizeImage]);

  // Preload images
  const preloadImages = useCallback(async (
    images: AlbumImage[],
    width: number,
    height: number
  ) => {
    const preloadPromises = images.map((image) =>
      getOptimizedImageUrl(image, width, height)
    );
    await Promise.all(preloadPromises);
  }, [getOptimizedImageUrl]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
    cacheSizeRef.current = 0;
  }, []);

  // Clean up cache periodically
  useEffect(() => {
    const interval = setInterval(cleanupCache, 60 * 60 * 1000); // Clean up every hour
    return () => clearInterval(interval);
  }, [cleanupCache]);

  return {
    getOptimizedImageUrl,
    preloadImages,
    clearCache,
    cacheSize: cacheSizeRef.current,
  };
} 