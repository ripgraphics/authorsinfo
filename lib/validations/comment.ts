import { z } from 'zod'

export const createCommentSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  user_id: z.string().uuid('Invalid user ID'),
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment content is too long'),
  entity_type: z.enum([
    'user',
    'group',
    'author',
    'book',
    'post',
    'event',
    'photo',
    'activity',
    'book_club_discussion',
    'discussion',
  ]),
  entity_id: z.string().uuid('Invalid entity ID'),
  parent_comment_id: z.string().uuid('Invalid parent comment ID').optional().nullable(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
