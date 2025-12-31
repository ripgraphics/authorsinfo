import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  is_private: z.boolean().optional().default(false),
  cover_image_url: z.string().url().optional().nullable(),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
