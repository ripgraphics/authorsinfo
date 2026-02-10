/**
 * Unit tests for lib/engagement/config.ts
 */
import {
  ENGAGEMENT_ENTITY_TYPES,
  LIKE_REACTION_TYPES,
  ENGAGEMENT_TYPES,
  isValidEntityType,
  isValidLikeReactionType,
  isValidEngagementType,
  getLikeCountSource,
} from '@/lib/engagement/config'

describe('lib/engagement/config', () => {
  describe('isValidEntityType', () => {
    it('returns true for all ENGAGEMENT_ENTITY_TYPES', () => {
      ENGAGEMENT_ENTITY_TYPES.forEach((t) => {
        expect(isValidEntityType(t)).toBe(true)
      })
    })

    it('returns false for invalid entity types', () => {
      expect(isValidEntityType('')).toBe(false)
      expect(isValidEntityType('invalid')).toBe(false)
      expect(isValidEntityType('post')).toBe(false)
      expect(isValidEntityType('ACTIVITY')).toBe(false)
    })
  })

  describe('isValidLikeReactionType', () => {
    it('returns true for all 7 like reaction types', () => {
      LIKE_REACTION_TYPES.forEach((t) => {
        expect(isValidLikeReactionType(t)).toBe(true)
      })
      expect(LIKE_REACTION_TYPES).toHaveLength(7)
    })

    it('returns false for invalid reaction types', () => {
      expect(isValidLikeReactionType('')).toBe(false)
      expect(isValidLikeReactionType('invalid')).toBe(false)
      expect(isValidLikeReactionType('comment')).toBe(false)
      expect(isValidLikeReactionType('Like')).toBe(false)
    })
  })

  describe('isValidEngagementType', () => {
    it('returns true for all ENGAGEMENT_TYPES', () => {
      ENGAGEMENT_TYPES.forEach((t) => {
        expect(isValidEngagementType(t)).toBe(true)
      })
    })

    it('returns false for invalid engagement types', () => {
      expect(isValidEngagementType('')).toBe(false)
      expect(isValidEngagementType('reaction')).toBe(false)
    })
  })

  describe('getLikeCountSource', () => {
    it('returns posts.like_count for activity', () => {
      const source = getLikeCountSource('activity')
      expect(source).not.toBeNull()
      expect(source).toEqual({ table: 'posts', column: 'like_count' })
    })

    it('returns null for other entity types', () => {
      expect(getLikeCountSource('book')).toBeNull()
      expect(getLikeCountSource('author')).toBeNull()
      expect(getLikeCountSource('user')).toBeNull()
      expect(getLikeCountSource('')).toBeNull()
      expect(getLikeCountSource('invalid')).toBeNull()
    })
  })
})
