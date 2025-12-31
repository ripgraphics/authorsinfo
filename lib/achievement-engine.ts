/**
 * Achievement Engine
 * Automatically awards badges based on user activity
 */

import { createServerActionClientAsync } from '@/lib/supabase/client-helper';
import { supabaseAdmin } from '@/lib/supabase/server';

export type AchievementTrigger = 
  | 'book_completed'
  | 'pages_logged'
  | 'challenge_completed'
  | 'streak_updated'
  | 'friend_added'
  | 'review_written'
  | 'shelf_created';

interface BadgeCheckResult {
  badgeId: string;
  badgeName: string;
  awarded: boolean;
}

/**
 * Check and award badges for a user based on a trigger event
 */
export async function checkAndAwardBadges(
  userId: string,
  trigger: AchievementTrigger,
  context?: Record<string, any>
): Promise<BadgeCheckResult[]> {
  const results: BadgeCheckResult[] = [];

  try {
    // Get all active badges that match the trigger
    const requirementTypeMap: Record<AchievementTrigger, string> = {
      book_completed: 'books_read',
      pages_logged: 'pages_read',
      challenge_completed: 'challenges_completed',
      streak_updated: 'streak_days',
      friend_added: 'friends_count',
      review_written: 'reviews_written',
      shelf_created: 'shelves_created',
    };

    const requirementType = requirementTypeMap[trigger];

    // Get badges for this requirement type
    const { data: badges, error: badgesError } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('requirement_type', requirementType)
      .eq('is_active', true);

    if (badgesError || !badges) {
      console.error('Error fetching badges:', badgesError);
      return results;
    }

    // Get user's already earned badges
    const { data: earnedBadges } = await supabaseAdmin
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedBadgeIds = new Set(earnedBadges?.map(eb => eb.badge_id) || []);

    // Get current value for the requirement type
    const currentValue = await getCurrentValue(userId, requirementType, context);

    // Check each badge
    for (const badge of badges) {
      // Skip if already earned
      if (earnedBadgeIds.has(badge.id)) {
        continue;
      }

      // Check if requirement is met
      if (currentValue >= badge.requirement_value) {
        // Award the badge
        const { error: awardError } = await supabaseAdmin
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            progress_value: currentValue,
          });

        if (!awardError) {
          results.push({
            badgeId: badge.id,
            badgeName: badge.name,
            awarded: true,
          });

          // Log achievement
          await supabaseAdmin
            .from('achievements')
            .insert({
              user_id: userId,
              achievement_type: `badge_earned_${badge.name.toLowerCase().replace(/\s+/g, '_')}`,
              metadata: {
                badge_id: badge.id,
                badge_name: badge.name,
                badge_tier: badge.tier,
                badge_points: badge.points,
                current_value: currentValue,
              },
            });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error in checkAndAwardBadges:', error);
    return results;
  }
}

/**
 * Get the current value for a requirement type
 */
async function getCurrentValue(
  userId: string,
  requirementType: string,
  context?: Record<string, any>
): Promise<number> {
  switch (requirementType) {
    case 'books_read': {
      const { count } = await supabaseAdmin
        .from('reading_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      return count || 0;
    }

    case 'pages_read': {
      const { data } = await supabaseAdmin
        .from('reading_progress')
        .select('current_page')
        .eq('user_id', userId);
      return data?.reduce((sum, p) => sum + (p.current_page || 0), 0) || 0;
    }

    case 'challenges_completed': {
      const { count } = await supabaseAdmin
        .from('reading_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      return count || 0;
    }

    case 'streak_days': {
      // Use context if provided, otherwise calculate
      if (context?.streak) {
        return context.streak;
      }
      // Calculate streak from challenge_tracking
      const { data } = await supabaseAdmin
        .from('challenge_tracking')
        .select('date_added')
        .eq('user_id', userId)
        .order('date_added', { ascending: false });
      
      if (!data || data.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const uniqueDates = Array.from(new Set(data.map(d => {
        const date = new Date(d.date_added);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }))).sort((a, b) => b - a);
      
      const lastDate = new Date(uniqueDates[0]);
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = uniqueDates[i];
          const next = uniqueDates[i + 1];
          if ((current - next) === (1000 * 60 * 60 * 24)) {
            streak++;
          } else {
            break;
          }
        }
      }
      return streak;
    }

    case 'friends_count': {
      const { count } = await supabaseAdmin
        .from('user_friends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'accepted');
      return count || 0;
    }

    case 'reviews_written': {
      const { count } = await supabaseAdmin
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count || 0;
    }

    case 'shelves_created': {
      const { count } = await supabaseAdmin
        .from('custom_shelves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_default', false);
      return count || 0;
    }

    default:
      return 0;
  }
}

/**
 * Get user's badge progress for all badge types
 */
export async function getUserBadgeProgress(userId: string) {
  const progress: Record<string, { current: number; badges: any[] }> = {};

  // Get all badges grouped by requirement type
  const { data: badges } = await supabaseAdmin
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('requirement_value');

  if (!badges) return progress;

  // Get earned badges
  const { data: earnedBadges } = await supabaseAdmin
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set(earnedBadges?.map(eb => eb.badge_id) || []);

  // Group badges by requirement type
  const badgesByType: Record<string, any[]> = {};
  for (const badge of badges) {
    if (!badgesByType[badge.requirement_type]) {
      badgesByType[badge.requirement_type] = [];
    }
    badgesByType[badge.requirement_type].push({
      ...badge,
      isEarned: earnedBadgeIds.has(badge.id),
    });
  }

  // Get current values for each type
  for (const [type, typeBadges] of Object.entries(badgesByType)) {
    const currentValue = await getCurrentValue(userId, type);
    progress[type] = {
      current: currentValue,
      badges: typeBadges.map(b => ({
        ...b,
        progressPercent: Math.min(Math.round((currentValue / b.requirement_value) * 100), 100),
      })),
    };
  }

  return progress;
}
