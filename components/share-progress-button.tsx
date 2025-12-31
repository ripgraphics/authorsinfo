'use client';

/**
 * ShareProgressButton Component - Fully Reusable
 * Button for sharing reading challenge progress to feed
 * 
 * @example Basic usage
 * <ShareProgressButton challenge={challengeData} />
 * 
 * @example With custom handler
 * <ShareProgressButton 
 *   challenge={challengeData}
 *   onShare={async (content) => { await customShare(content); }}
 * />
 * 
 * @example Custom appearance
 * <ShareProgressButton 
 *   challenge={challengeData}
 *   variant="default"
 *   size="lg"
 *   showText={true}
 * />
 */

import React, { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Share2, Loader2, Check, Copy, Twitter, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// TYPES - All exported for reusability
// ============================================================================

/** Minimal challenge data needed for sharing */
export interface ShareableChallengeData {
  id: string;
  title: string;
  currentValue: number;
  goalValue: number;
  goalType: string;
}

/** Share destination type */
export type ShareDestination = 'feed' | 'clipboard' | 'twitter' | 'facebook';

/** Shared content data */
export interface ShareContent {
  text: string;
  progress: number;
  challengeId: string;
  url?: string;
}

/** Props for ShareProgressButton */
export interface ShareProgressButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Challenge data to share */
  challenge: ShareableChallengeData;
  /** Custom share handler (overrides default) */
  onShare?: (content: ShareContent, destination: ShareDestination) => Promise<void>;
  /** Show text next to icon */
  showText?: boolean;
  /** Button text */
  text?: string;
  /** Show dropdown for multiple share options */
  showDropdown?: boolean;
  /** Available share destinations */
  destinations?: ShareDestination[];
  /** Custom hashtags for social sharing */
  hashtags?: string[];
  /** Custom content formatter */
  formatContent?: (challenge: ShareableChallengeData, progress: number) => string;
  /** API endpoint for posting to feed */
  feedEndpoint?: string;
  /** Success message */
  successMessage?: string;
  /** Show success checkmark briefly after sharing */
  showSuccessIndicator?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// UTILITIES - All exported for external use
// ============================================================================

/**
 * Calculate progress percentage
 */
export function calculateShareProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

/**
 * Generate default share content
 */
export function generateShareContent(
  challenge: ShareableChallengeData,
  hashtags: string[] = ['ReadingChallenge', 'Bookworm']
): string {
  const progress = calculateShareProgress(challenge.currentValue, challenge.goalValue);
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
  
  return `I've reached ${progress}% of my "${challenge.title}" reading challenge! 📚 ${challenge.currentValue}/${challenge.goalValue} ${challenge.goalType} completed. ${hashtagString}`;
}

/**
 * Get Twitter share URL
 */
export function getTwitterShareUrl(text: string, url?: string): string {
  const params = new URLSearchParams({ text });
  if (url) params.append('url', url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Get Facebook share URL
 */
export function getFacebookShareUrl(url: string): string {
  const params = new URLSearchParams({ u: url });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Get icon for share destination
 */
export function getShareIcon(destination: ShareDestination): React.ReactNode {
  const icons: Record<ShareDestination, React.ReactNode> = {
    feed: <Share2 className="h-4 w-4" />,
    clipboard: <Copy className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
  };
  return icons[destination] || <Share2 className="h-4 w-4" />;
}

/**
 * Get label for share destination
 */
export function getShareLabel(destination: ShareDestination): string {
  const labels: Record<ShareDestination, string> = {
    feed: 'Share to Feed',
    clipboard: 'Copy to Clipboard',
    twitter: 'Share on Twitter',
    facebook: 'Share on Facebook',
  };
  return labels[destination] || 'Share';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ShareProgressButton({
  challenge,
  onShare,
  showText = true,
  text = 'Share Progress',
  showDropdown = false,
  destinations = ['feed'],
  hashtags = ['ReadingChallenge', 'Bookworm'],
  formatContent,
  feedEndpoint = '/api/posts/create',
  successMessage = 'Progress shared!',
  showSuccessIndicator = true,
  className,
  variant = 'outline',
  size = 'sm',
  ...buttonProps
}: ShareProgressButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const progress = calculateShareProgress(challenge.currentValue, challenge.goalValue);
  
  const content = formatContent 
    ? formatContent(challenge, progress)
    : generateShareContent(challenge, hashtags);

  const shareContent: ShareContent = {
    text: content,
    progress,
    challengeId: challenge.id,
    url: typeof window !== 'undefined' ? `${window.location.origin}/reading-challenge/${challenge.id}` : undefined,
  };

  const handleShare = async (destination: ShareDestination = 'feed') => {
    setLoading(true);
    
    try {
      if (onShare) {
        await onShare(shareContent, destination);
      } else {
        // Default share handlers
        switch (destination) {
          case 'feed':
            const response = await fetch(feedEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content,
                type: 'status_update',
                visibility: 'public',
              }),
            });
            if (!response.ok) throw new Error('Failed to share to feed');
            break;
            
          case 'clipboard':
            const copied = await copyToClipboard(content);
            if (!copied) throw new Error('Failed to copy to clipboard');
            break;
            
          case 'twitter':
            window.open(getTwitterShareUrl(content, shareContent.url), '_blank', 'noopener,noreferrer');
            break;
            
          case 'facebook':
            if (shareContent.url) {
              window.open(getFacebookShareUrl(shareContent.url), '_blank', 'noopener,noreferrer');
            }
            break;
        }
      }

      if (showSuccessIndicator) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
      
      toast.success(successMessage);
    } catch (error) {
      console.error('Error sharing progress:', error);
      toast.error('Failed to share progress');
    } finally {
      setLoading(false);
    }
  };

  const buttonContent = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : success ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {showText && <span className="ml-2">{text}</span>}
    </>
  );

  // Simple button without dropdown
  if (!showDropdown || destinations.length === 1) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("gap-0", className)}
        onClick={() => handleShare(destinations[0])}
        disabled={loading}
        {...buttonProps}
      >
        {buttonContent}
      </Button>
    );
  }

  // Button with dropdown for multiple destinations
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-0", className)}
          disabled={loading}
          {...buttonProps}
        >
          {buttonContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {destinations.map((destination) => (
          <DropdownMenuItem
            key={destination}
            onClick={() => handleShare(destination)}
            className="flex items-center gap-2"
          >
            {getShareIcon(destination)}
            {getShareLabel(destination)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
