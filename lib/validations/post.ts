import { z } from 'zod'

export const createPostSchema = z
  .object({
    content: z.object({
      text: z.string().min(1, 'Post content is required').max(5000, 'Post content is too long'),
      images: z.array(z.string().url()).optional(),
    }),
    entity_type: z.enum(['user', 'group', 'author', 'book']).optional().default('user'),
    entity_id: z.string().uuid().optional(),
    visibility: z.enum(['public', 'private', 'followers']).optional().default('public'),
  })
  .superRefine((data, ctx) => {
    const entityType = data.entity_type ?? 'user'
    if (entityType !== 'user' && !data.entity_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'entity_id is required when entity_type is not user',
        path: ['entity_id'],
      })
    }
  })

export type CreatePostInput = z.infer<typeof createPostSchema>
