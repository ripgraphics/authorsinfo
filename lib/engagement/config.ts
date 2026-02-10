/**
 * Engagement system config — single source of truth for entity types,
 * engagement types (Like, Comment, Share, Bookmark, etc.), and like-reaction subtypes.
 * Like is one engagement type; its subtypes are the seven emoji types in the likes table.
 */

// ============================================================================
// ENTITY TYPES (content types that can be engaged with)
// ============================================================================

export const ENGAGEMENT_ENTITY_TYPES = [
  'user',
  'book',
  'author',
  'publisher',
  'group',
  'activity',
  'event',
  'photo',
  'album',
  'review',
  'comment',
] as const

export type EntityType = (typeof ENGAGEMENT_ENTITY_TYPES)[number]

export function isValidEntityType(s: string): s is EntityType {
  return ENGAGEMENT_ENTITY_TYPES.includes(s as EntityType)
}

/** Engagement entity type for timeline posts (posts table rows). Use in likes lookup for feed/timeline. */
export const ENGAGEMENT_ENTITY_TYPE_POST = 'activity' as const

// ============================================================================
// LIKE REACTION SUBTYPES (the seven emoji types stored in likes.like_type)
// ============================================================================

export const LIKE_REACTION_TYPES = [
  'like',
  'love',
  'care',
  'haha',
  'wow',
  'sad',
  'angry',
] as const

export type ReactionType = (typeof LIKE_REACTION_TYPES)[number]

export function isValidLikeReactionType(s: string): s is ReactionType {
  return LIKE_REACTION_TYPES.includes(s as ReactionType)
}

/** Metadata for like-reaction subtypes (labels, emoji, styles). Used by reaction popup to build options. */
export const REACTION_OPTIONS_METADATA: ReadonlyArray<{
  type: ReactionType
  label: string
  emoji: string
  description: string
  popularity: number
  color: string
  hoverColor: string
  bgColor: string
  hoverBgColor: string
}> = [
  { type: 'like', label: 'Like', emoji: '👍', description: 'Show appreciation', popularity: 85, color: 'text-blue-600', hoverColor: 'text-blue-700', bgColor: 'bg-blue-50', hoverBgColor: 'hover:bg-blue-100' },
  { type: 'love', label: 'Love', emoji: '❤️', description: 'Express love and affection', popularity: 78, color: 'text-red-500', hoverColor: 'text-red-600', bgColor: 'bg-red-50', hoverBgColor: 'hover:bg-red-100' },
  { type: 'care', label: 'Care', emoji: '🤗', description: 'Show care and support', popularity: 65, color: 'text-yellow-500', hoverColor: 'text-yellow-600', bgColor: 'bg-yellow-50', hoverBgColor: 'hover:bg-yellow-100' },
  { type: 'haha', label: 'Haha', emoji: '😂', description: 'Find it funny', popularity: 72, color: 'text-yellow-500', hoverColor: 'text-yellow-600', bgColor: 'bg-yellow-50', hoverBgColor: 'hover:bg-yellow-100' },
  { type: 'wow', label: 'Wow', emoji: '😮', description: 'Be amazed', popularity: 58, color: 'text-purple-500', hoverColor: 'text-purple-600', bgColor: 'bg-purple-50', hoverBgColor: 'hover:bg-purple-100' },
  { type: 'sad', label: 'Sad', emoji: '😢', description: 'Feel sad about it', popularity: 45, color: 'text-blue-500', hoverColor: 'text-blue-600', bgColor: 'bg-blue-50', hoverBgColor: 'hover:bg-blue-100' },
  { type: 'angry', label: 'Angry', emoji: '😠', description: 'Feel angry about it', popularity: 32, color: 'text-red-600', hoverColor: 'text-red-700', bgColor: 'bg-red-50', hoverBgColor: 'hover:bg-red-100' },
]

// ============================================================================
// ENGAGEMENT TYPES (Like, Comment, Share, Bookmark, View, Follow)
// ============================================================================

export const ENGAGEMENT_TYPES = [
  'like',
  'comment',
  'share',
  'bookmark',
  'view',
  'follow',
] as const

export type EngagementTypeName = (typeof ENGAGEMENT_TYPES)[number]

export function isValidEngagementType(s: string): s is EngagementTypeName {
  return ENGAGEMENT_TYPES.includes(s as EngagementTypeName)
}

// ============================================================================
// COUNT STORAGE (denormalized like_count per entity type)
// ============================================================================

export interface LikeCountSource {
  table: string
  column: string
}

/**
 * Returns where to store/update denormalized like count for an entity type.
 * For 'activity' (timeline posts) we use posts.like_count; others can be extended later.
 */
export function getLikeCountSource(entityType: string): LikeCountSource | null {
  if (entityType === 'activity') {
    return { table: 'posts', column: 'like_count' }
  }
  return null
}
