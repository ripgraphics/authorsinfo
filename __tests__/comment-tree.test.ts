import { buildCommentTree } from '@/lib/comment-tree'
import type { CommentTreeItem } from '@/lib/comment-tree'

describe('buildCommentTree', () => {
  it('keeps replies under their root comment', () => {
    const comments: CommentTreeItem[] = [
      { id: 'reply-1', parent_comment_id: 'root-1' },
      { id: 'root-1', parent_comment_id: null },
      { id: 'root-2', parent_comment_id: null },
    ]
    const tree = buildCommentTree(comments)

    expect(tree.map((comment) => comment.id)).toEqual(['root-1', 'root-2'])
    expect(tree[0].replies?.map((comment) => comment.id)).toEqual(['reply-1'])
    expect(tree[0].reply_count).toBe(1)
    expect(tree[0].replies?.[0].parent_comment_id).toBe('root-1')
  })

  it('keeps nested replies in the root thread while preserving direct parent IDs', () => {
    const comments: CommentTreeItem[] = [
      { id: 'root-1', parent_comment_id: null },
      { id: 'reply-1', parent_comment_id: 'root-1' },
      { id: 'reply-2', parent_comment_id: 'reply-1' },
    ]
    const tree = buildCommentTree(comments)

    expect(tree).toHaveLength(1)
    expect(tree[0].replies?.map((comment) => comment.id)).toEqual(['reply-1', 'reply-2'])
    expect(tree[0].replies?.[1].parent_comment_id).toBe('reply-1')
    expect(tree[0].reply_count).toBe(2)
  })

  it('keeps orphaned replies visible instead of dropping them', () => {
    const comments: CommentTreeItem[] = [{ id: 'orphan', parent_comment_id: 'missing-parent' }]
    const tree = buildCommentTree(comments)

    expect(tree.map((comment) => comment.id)).toEqual(['orphan'])
    expect(tree[0].parent_comment_id).toBe('missing-parent')
  })
})
