import { useCallback, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { AlbumImageLegacy } from '../types';

interface ShareLink {
  id: string;
  token: string;
  image_id: string;
  expires_at: string;
  max_views?: number;
  password?: string;
  created_at: string;
  created_by: string;
}

interface ShareState {
  isLoading: boolean;
  error: string | null;
  shareLink: ShareLink | null;
}

interface ShareOptions {
  expiresIn?: number; // in seconds
  maxViews?: number;
  password?: string;
}

export function usePhotoGallerySharing(options: ShareOptions = {}) {
  const {
    expiresIn = 7 * 24 * 60 * 60, // 7 days default
    maxViews,
    password,
  } = options;

  const [shareState, setShareState] = useState<ShareState>({
    isLoading: false,
    error: null,
    shareLink: null,
  });

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Generate share link
  const generateShareLink = useCallback(async (
    imageId: string,
    customOptions?: ShareOptions
  ): Promise<ShareLink> => {
    setShareState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Generate unique token
      const token = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // Calculate expiration
      const expiresAt = new Date(Date.now() + (customOptions?.expiresIn ?? expiresIn) * 1000);

      // Create share link
      const { data, error } = await supabase
        .from('share_links')
        .insert({
          image_id: imageId,
          token,
          expires_at: expiresAt.toISOString(),
          max_views: customOptions?.maxViews ?? maxViews,
          password: customOptions?.password ?? password,
        })
        .select()
        .single();

      if (error) throw error;

      setShareState((prev) => ({
        ...prev,
        isLoading: false,
        shareLink: data,
      }));

      return data;
    } catch (error) {
      setShareState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate share link',
      }));
      throw error;
    }
  }, [expiresIn, maxViews, password, supabase]);

  // Get share link
  const getShareLink = useCallback(async (token: string): Promise<ShareLink> => {
    setShareState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .single();

      if (error) throw error;

      // Check if link is expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('Share link has expired');
      }

      // Check if max views reached
      if (data.max_views && data.views >= data.max_views) {
        throw new Error('Maximum views reached');
      }

      setShareState((prev) => ({
        ...prev,
        isLoading: false,
        shareLink: data,
      }));

      return data;
    } catch (error) {
      setShareState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get share link',
      }));
      throw error;
    }
  }, [supabase]);

  // Increment view count
  const incrementViewCount = useCallback(async (token: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('share_links')
        .update({
          views: supabase.rpc('increment'),
          last_viewed_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (error) throw error;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to increment view count');
    }
  }, [supabase]);

  // Delete share link
  const deleteShareLink = useCallback(async (token: string): Promise<void> => {
    setShareState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('token', token);

      if (error) throw error;

      setShareState((prev) => ({
        ...prev,
        isLoading: false,
        shareLink: null,
      }));
    } catch (error) {
      setShareState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete share link',
      }));
      throw error;
    }
  }, [supabase]);

  // Get shared image
  const getSharedImage = useCallback(async (token: string): Promise<AlbumImageLegacy> => {
    try {
      // Get share link
      const shareLink = await getShareLink(token);

      // Get image
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', shareLink.image_id)
        .single();

      if (error) throw error;

      // Increment view count
      await incrementViewCount(token);

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get shared image');
    }
  }, [getShareLink, incrementViewCount, supabase]);

  // Verify share link password
  const verifyShareLinkPassword = useCallback(async (
    token: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('password')
        .eq('token', token)
        .single();

      if (error) throw error;

      return data.password === password;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to verify password');
    }
  }, [supabase]);

  return {
    shareState,
    generateShareLink,
    getShareLink,
    deleteShareLink,
    getSharedImage,
    verifyShareLinkPassword,
  };
} 