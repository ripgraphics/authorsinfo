import { useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AnalyticsEvent {
  type: 'view' | 'click' | 'share' | 'download' | 'like';
  albumId: string;
  imageId?: number;
  metadata?: Record<string, any>;
}

export function usePhotoGalleryAnalytics(albumId: string) {
  const supabase = createClientComponentClient();

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      const { error } = await supabase
        .from('album_analytics')
        .insert({
          album_id: albumId,
          event_type: event.type,
          image_id: event.imageId,
          metadata: event.metadata,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }, [albumId, supabase]);

  const trackView = useCallback(async () => {
    await trackEvent({
      type: 'view',
      albumId,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      },
    });
  }, [albumId, trackEvent]);

  const trackImageClick = useCallback(async (imageId: number) => {
    await trackEvent({
      type: 'click',
      albumId,
      imageId,
    });
  }, [albumId, trackEvent]);

  const trackShare = useCallback(async (platform: string) => {
    await trackEvent({
      type: 'share',
      albumId,
      metadata: { platform },
    });
  }, [albumId, trackEvent]);

  const trackDownload = useCallback(async (imageId: number) => {
    await trackEvent({
      type: 'download',
      albumId,
      imageId,
    });
  }, [albumId, trackEvent]);

  const trackLike = useCallback(async (imageId: number) => {
    await trackEvent({
      type: 'like',
      albumId,
      imageId,
    });
  }, [albumId, trackEvent]);

  return {
    trackView,
    trackImageClick,
    trackShare,
    trackDownload,
    trackLike,
  };
} 