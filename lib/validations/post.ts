import { z } from 'zod'

export const createPostSchema = z.object({
  content: z.object({
    text: z.string().min(1, 'Post content is required').max(5000, 'Post content is too long'),
    images: z.array(z.string().url()).optional(),
  }),
  entity_type: z.enum(['user', 'group', 'author', 'book']).optional().default('user'),
  entity_id: z.string().uuid().optional(),
  visibility: z.enum(['public', 'private', 'followers']).optional().default('public'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
