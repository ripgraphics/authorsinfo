import { useCallback, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { AlbumImage } from '../types';

type SharePlatform = 'facebook' | 'twitter' | 'pinterest' | 'linkedin' | 'whatsapp' | 'email';

interface ShareOptions {
  platform: SharePlatform;
  title?: string;
  description?: string;
  hashtags?: string[];
}

interface ShareState {
  isSharing: boolean;
  error: string | null;
  shareUrl: string | null;
}

export function usePhotoGalleryShare() {
  const [shareState, setShareState] = useState<ShareState>({
    isSharing: false,
    error: null,
    shareUrl: null,
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const generateShareUrl = useCallback((image: AlbumImage, options: ShareOptions) => {
    const baseUrl = window.location.origin;
    const imageUrl = encodeURIComponent((image as any).url || '');
    const title = encodeURIComponent(options.title || (image as any).altText || (image as any).alt_text || '');
    const description = encodeURIComponent(options.description || (image as any).caption || (image as any).description || '');
    const hashtags = options.hashtags?.map(tag => `%23${tag}`).join('') || '';

    switch (options.platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${imageUrl}&quote=${title}%20${description}${hashtags}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${imageUrl}&text=${title}%20${description}${hashtags}`;
      case 'pinterest':
        return `https://pinterest.com/pin/create/button/?url=${baseUrl}&media=${imageUrl}&description=${title}%20${description}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${imageUrl}`;
      case 'whatsapp':
        return `https://wa.me/?text=${title}%20${description}%20${imageUrl}`;
      case 'email':
        return `mailto:?subject=${title}&body=${description}%0A%0A${imageUrl}`;
      default:
        return imageUrl;
    }
  }, []);

  const shareImage = useCallback(async (image: AlbumImage, options: ShareOptions) => {
    setShareState({
      isSharing: true,
      error: null,
      shareUrl: null,
    });

    try {
      // Generate share URL
      const shareUrl = generateShareUrl(image, options);

      // Track share event
      const { error: trackError } = await (supabase
        .from('image_shares') as any)
        .insert({
          image_id: image.id,
          platform: options.platform,
          share_url: shareUrl,
          metadata: {
            title: options.title,
            description: options.description,
            hashtags: options.hashtags,
          },
        });

      if (trackError) throw trackError;

      // Open share dialog
      if (options.platform === 'email') {
        window.location.href = shareUrl;
      } else {
        const width = 600;
        const height = 400;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        window.open(
          shareUrl,
          'share',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }

      setShareState({
        isSharing: false,
        error: null,
        shareUrl,
      });
    } catch (error) {
      setShareState({
        isSharing: false,
        error: error instanceof Error ? error.message : 'Failed to share image',
        shareUrl: null,
      });
    }
  }, [generateShareUrl, supabase]);

  const copyShareLink = useCallback(async (image: AlbumImage) => {
    try {
      const shareUrl = generateShareUrl(image, { platform: 'facebook' });
      await navigator.clipboard.writeText(shareUrl);

      // Track copy event
      const { error: trackError } = await (supabase
        .from('image_shares') as any)
        .insert({
          image_id: image.id,
          platform: 'copy',
          share_url: shareUrl,
        });

      if (trackError) throw trackError;

      setShareState({
        isSharing: false,
        error: null,
        shareUrl,
      });
    } catch (error) {
      setShareState({
        isSharing: false,
        error: error instanceof Error ? error.message : 'Failed to copy share link',
        shareUrl: null,
      });
    }
  }, [generateShareUrl, supabase]);

  const getShareStats = useCallback(async (imageId: string) => {
    try {
      const { data, error } = await supabase
        .from('image_shares')
        .select('platform')
        .eq('image_id', imageId);

      if (error) throw error;

      // Group by platform and count manually
      const grouped = (data || []).reduce((acc: Record<string, number>, item: any) => {
        const platform = item.platform || 'unknown';
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([platform, count]) => ({ platform, count }));
    } catch (error) {
      setShareState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get share stats',
      }));
      return null;
    }
  }, [supabase]);

  return {
    shareState,
    shareImage,
    copyShareLink,
    getShareStats,
  };
} 