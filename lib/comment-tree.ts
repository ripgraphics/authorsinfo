export interface CommentTreeItem {
  id: string
  parent_comment_id?: string | null
  replies?: CommentTreeItem[]
  reply_count?: number
}

/**
 * Groups a flat comment response by top-level comment for feed-style threads.
 * Each reply keeps its direct parent ID, while all descendants render under the root.
 */
export function buildCommentTree<T extends CommentTreeItem>(comments: T[]): T[] {
  const commentById = new Map(comments.map((comment) => [comment.id, comment]))
  const childrenByRootId = new Map<string, T[]>()
  const roots: T[] = []

  const findRootId = (comment: T): string => {
    const visited = new Set<string>()
    let current = comment

    while (current.parent_comment_id) {
      if (visited.has(current.id)) return comment.id
      visited.add(current.id)

      const parent = commentById.get(current.parent_comment_id)
      if (!parent) return comment.id
      current = parent
    }

    return current.id
  }

  for (const comment of comments) {
    const rootId = findRootId(comment)
    if (rootId === comment.id) {
      roots.push({ ...comment, replies: [] })
      continue
    }

    const rootReplies = childrenByRootId.get(rootId) || []
    rootReplies.push({ ...comment, replies: [] })
    childrenByRootId.set(rootId, rootReplies)
  }

  return roots.map((root) => {
    const replies = childrenByRootId.get(root.id) || []
    return {
      ...root,
      replies,
      reply_count: replies.length,
    }
  })
}
