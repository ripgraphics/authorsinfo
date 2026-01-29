'use client';

/**
 * AchievementNotification Component
 * Toast notification for newly earned badges
 */

import React, { useEffect, useState } from 'react';
import { Badge } from '@/types/phase3';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReusableModal } from '@/components/ui/reusable-modal';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Optional confetti effect - degrades gracefully
const triggerConfettiEffect = async (tier: string) => {
  try {
    // @ts-ignore - canvas-confetti is optional
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default;
    
    const colors: Record<string, string[]> = {
      gold: ['#FFD700', '#FFA500', '#FFFF00'],
      platinum: ['#67E8F9', '#0EA5E9', '#22D3EE'],
      diamond: ['#A855F7', '#EC4899', '#8B5CF6'],
    };

    confetti({
      particleCount: tier === 'diamond' ? 150 : 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors[tier] || ['#FFD700'],
    });
  } catch {
    // canvas-confetti not installed, skip effect
  }
};

interface AchievementNotificationProps {
  badge: Badge | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const tierColors: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-cyan-500',
  diamond: 'from-purple-400 to-pink-500',
};

const tierGlow: Record<string, string> = {
  bronze: 'shadow-amber-500/20',
  silver: 'shadow-gray-400/20',
  gold: 'shadow-yellow-500/30',
  platinum: 'shadow-cyan-400/30',
  diamond: 'shadow-purple-500/40',
};

export function AchievementNotification({
  badge,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
}: AchievementNotificationProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (badge) {
      setShowCelebration(true);
      
      // Trigger confetti for gold+ badges
      if (['gold', 'platinum', 'diamond'].includes(badge.tier)) {
        triggerConfettiEffect(badge.tier);
      }

      if (autoClose) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [badge, autoClose, autoCloseDelay, onClose]);

  if (!badge) return null;

  return (
    <ReusableModal
      open={!!badge}
      onOpenChange={(open) => !open && onClose()}
      title="Achievement Unlocked!"
      description={badge.name}
      footer={
        <Button onClick={onClose} className="px-8">
          Awesome!
        </Button>
      }
    >
      <div className="flex flex-col items-center space-y-4">
        <p className="text-muted-foreground text-center">{badge.description}</p>
        <div className="relative">
          <Sparkles className="absolute -top-2 -left-2 h-6 w-6 text-yellow-500 animate-pulse" />
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-pulse delay-100" />
          <div
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center',
              'bg-gradient-to-br shadow-lg',
              tierColors[badge.tier],
              tierGlow[badge.tier]
            )}
          >
            <span className="text-4xl">{badge.icon}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium capitalize',
              'bg-gradient-to-r text-white',
              tierColors[badge.tier]
            )}
          >
            {badge.tier}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-muted capitalize">
            {badge.category}
          </span>
        </div>
        {badge.requirementValue > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {badge.requirementType.replace(/_/g, ' ')}: {badge.requirementValue}
          </p>
        )}
      </div>
    </ReusableModal>
  );
}

/**
 * Toast-style achievement notification for less intrusive alerts
 */
interface AchievementToastProps {
  badge: Badge | null;
  onClose: () => void;
  onViewAll?: () => void;
}

export function AchievementToast({ badge, onClose, onViewAll }: AchievementToastProps) {
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  if (!badge) return null;

  return (
    <Card
      className={cn(
        'fixed bottom-4 right-4 z-50 w-80',
        'animate-in slide-in-from-right-full duration-300',
        'shadow-lg border-2',
        tierGlow[badge.tier]
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
              'bg-gradient-to-br',
              tierColors[badge.tier]
            )}
          >
            <span className="text-xl">{badge.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-primary">Achievement Unlocked</p>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="font-semibold truncate">{badge.name}</p>
            <p className="text-xs text-muted-foreground truncate">{badge.description}</p>

            {onViewAll && (
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto text-xs"
                onClick={onViewAll}
              >
                View all badges →
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Provider component to manage achievement notifications
 */
interface AchievementNotificationProviderProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  showAchievement: (badge: Badge) => void;
  showAchievementToast: (badge: Badge) => void;
}

export const AchievementNotificationContext =
  React.createContext<NotificationContextType | null>(null);

export function AchievementNotificationProvider({
  children,
}: AchievementNotificationProviderProps) {
  const [modalBadge, setModalBadge] = useState<Badge | null>(null);
  const [toastBadge, setToastBadge] = useState<Badge | null>(null);

  const showAchievement = (badge: Badge) => {
    setModalBadge(badge);
  };

  const showAchievementToast = (badge: Badge) => {
    setToastBadge(badge);
  };

  return (
    <AchievementNotificationContext.Provider
      value={{ showAchievement, showAchievementToast }}
    >
      {children}
      
      <AchievementNotification
        badge={modalBadge}
        onClose={() => setModalBadge(null)}
      />
      
      <AchievementToast
        badge={toastBadge}
        onClose={() => setToastBadge(null)}
      />
    </AchievementNotificationContext.Provider>
  );
}

export function useAchievementNotification() {
  const context = React.useContext(AchievementNotificationContext);
  if (!context) {
    throw new Error(
      'useAchievementNotification must be used within AchievementNotificationProvider'
    );
  }
  return context;
}
