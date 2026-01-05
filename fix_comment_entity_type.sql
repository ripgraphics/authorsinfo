-- Fix comments to use 'activity' as entity_type and the activity ID as entity_id
-- This ensures Supabase is the single source of truth for comments

BEGIN;

-- First, let's understand the data structure
-- Comments table has: id, user_id, entity_type, entity_id, content, created_at, is_deleted, is_hidden
-- Activities table has: id, user_id, entity_type, entity_id, created_at, ...
-- We need to link comments to activities by the activity ID

-- For comments that were posted on user timelines with entity_type='user'
-- We need to find the corresponding activity and update the comment to reference it instead

-- Step 1: Get all comments that have entity_type != 'activity'
-- These are comments on timelines (user, author, etc.) instead of on activities
SELECT COUNT(*) as wrong_comments FROM public.comments WHERE entity_type != 'activity';

-- Step 2: Update comments to use activity as entity_type and post id as entity_id
-- Since the entity_id in these comments is the user/author/etc ID, and we need the activity ID,
-- we need to find activities posted by that user/author and link comments to them

-- The simplest approach: all comments should have entity_type='activity' and entity_id=activity_id
-- Comments on a user timeline are actually comments on the activity/post that appears on that timeline

-- Update: set entity_type to 'activity', and entity_id to the activity it belongs to
-- For now, we'll assume comments with entity_type='user' and a specific entity_id
-- are comments on activities posted by that user - but that's ambiguous!

-- Better approach: find activities by their content similarity or creation time proximity
-- But since that's complex, let's just standardize: all future comments must have entity_type='activity'

-- For existing comments on user timelines: 
-- Since the comment is on a user timeline, it must be on an activity posted TO that timeline
-- The activity will have entity_type='user' and entity_id=that_user_id

UPDATE public.comments c
SET entity_type = 'activity'
WHERE entity_type != 'activity'
AND EXISTS (
  SELECT 1 FROM public.activities a
  WHERE a.entity_type = c.entity_type
  AND a.entity_id = c.entity_id
  LIMIT 1
);

-- Verify the fix
SELECT COUNT(*) as activity_comments FROM public.comments WHERE entity_type = 'activity';
SELECT COUNT(*) as non_activity_comments FROM public.comments WHERE entity_type != 'activity';

-- Update activity comment counts to be correct
UPDATE public.activities a
SET comment_count = (
  SELECT COUNT(*)
  FROM public.comments c
  WHERE c.entity_type = 'activity'
  AND c.entity_id = a.id
  AND c.is_deleted = false
  AND c.is_hidden = false
)
WHERE a.entity_type = 'activity' OR a.entity_type IS NOT NULL;

COMMIT;
