'use client'

import React from 'react'
import type { EntityType } from '@/lib/engagement/config'
import EntityAvatar from '@/components/entity-avatar'
import EntityName from '@/components/entity-name'
import { TaggedTextRenderer } from '@/components/tags/tagged-text-renderer'
import { CommentActionButtons } from '@/components/enterprise/comment-action-buttons'

export type ReusableCommentLayoutPreset = 'modal' | 'preview'

export interface ReusableCommentUser {
  id?: string
  name?: string
  avatarUrl?: string | null
}

export interface ReusableCommentNode {
  id: string
  commentText: string
  createdAt: string
  replyCount?: number
  user?: ReusableCommentUser
  replies?: ReusableCommentNode[]
}

export interface ReusableCommentThreadClassNames {
  rootList?: string
  rootItem?: string
  rootRow?: string
  replyRow?: string
  rootBubble?: string
  replyBubble?: string
  rootHeader?: string
  replyHeader?: string
  rootText?: string
  replyText?: string
  rootActionsRow?: string
  replyActionsRow?: string
  repliesContainer?: string
}

export interface ReusableCommentThreadProps {
  comments: ReusableCommentNode[]
  layoutPreset?: ReusableCommentLayoutPreset
  actionEntityType?: EntityType
  maxRootItems?: number
  maxRepliesPerRoot?: number
  showHeaderTimestamp?: boolean
  timestampFormatter?: (comment: ReusableCommentNode, depth: number) => string | undefined
  headerTimestampFormatter?: (comment: ReusableCommentNode, depth: number) => string | undefined
  expandedReplies?: Record<string, boolean>
  isRepliesExpanded?: (rootComment: ReusableCommentNode, expandedReplies: Record<string, boolean>) => boolean
  showReplyToggle?: boolean
  getReplyToggleLabel?: (rootComment: ReusableCommentNode, isExpanded: boolean) => string
  onToggleReplies?: (rootComment: ReusableCommentNode) => void
  onReplyClick?: (comment: ReusableCommentNode, rootComment: ReusableCommentNode) => void
  renderRootTrailing?: (rootComment: ReusableCommentNode) => React.ReactNode
  renderReplyComposer?: (rootComment: ReusableCommentNode) => React.ReactNode
  renderReplyAfterActions?: (
    replyComment: ReusableCommentNode,
    rootComment: ReusableCommentNode
  ) => React.ReactNode
  renderCommentText?: (comment: ReusableCommentNode, depth: number) => React.ReactNode
  renderBubbleFooter?: (comment: ReusableCommentNode, depth: number) => React.ReactNode
  classNames?: ReusableCommentThreadClassNames
  rootActionOptions?: {
    showLike?: boolean
    showReply?: boolean
    showTimestamp?: boolean
    showReactionSummary?: boolean
    textSize?: string
    className?: string
  }
  replyActionOptions?: {
    showLike?: boolean
    showReply?: boolean
    showTimestamp?: boolean
    showReactionSummary?: boolean
    textSize?: string
    className?: string
  }
  avatarSizes?: {
    root?: 'xs' | 'sm' | 'md' | 'lg'
    reply?: 'xs' | 'sm' | 'md' | 'lg'
  }
}

const modalClassNames: Required<ReusableCommentThreadClassNames> = {
  rootList: 'space-y-6',
  rootItem: 'group',
  rootRow: 'flex items-start gap-3',
  replyRow: 'flex items-start gap-2',
  rootBubble: 'bg-gray-50 group-hover:bg-gray-100 transition-colors rounded-2xl px-4 py-3 inline-block max-w-full',
  replyBubble: 'bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full',
  rootHeader: 'flex items-center gap-2 mb-1',
  replyHeader: 'flex items-center gap-2 mb-1',
  rootText: 'text-sm text-gray-800 leading-relaxed',
  replyText: 'text-xs text-gray-800',
  rootActionsRow: 'flex items-center justify-between mt-2 ml-2',
  replyActionsRow: 'flex items-center mt-1 ml-2',
  repliesContainer: 'mt-4 ml-4 space-y-4 border-l-2 border-gray-100 pl-4',
}

const previewClassNames: Required<ReusableCommentThreadClassNames> = {
  rootList: 'space-y-3',
  rootItem: '',
  rootRow: 'flex items-start gap-3',
  replyRow: 'ml-4 flex items-start gap-2',
  rootBubble: 'bg-gray-100 rounded-2xl px-4 py-3 inline-block max-w-full',
  replyBubble: 'bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full',
  rootHeader: 'flex items-center gap-2 mb-1',
  replyHeader: 'flex items-center gap-2 mb-0.5',
  rootText: 'text-sm text-gray-800 leading-relaxed',
  replyText: 'text-xs text-gray-800 leading-relaxed',
  rootActionsRow: 'flex items-center justify-between mt-1 ml-2',
  replyActionsRow: 'mt-0',
  repliesContainer: 'space-y-0',
}

function resolvePresetClassNames(preset: ReusableCommentLayoutPreset): Required<ReusableCommentThreadClassNames> {
  return preset === 'preview' ? previewClassNames : modalClassNames
}

function defaultReplyToggleLabel(rootComment: ReusableCommentNode, isExpanded: boolean) {
  const count = rootComment.replyCount || rootComment.replies?.length || 0
  return isExpanded ? 'Hide' : `Show ${count} replies`
}

function defaultTextRenderer(comment: ReusableCommentNode, depth: number) {
  return (
    <TaggedTextRenderer
      text={comment.commentText || ''}
      showPreviews={true}
      renderMediaUrls={true}
      textClassName={
        depth === 0
          ? 'text-sm text-gray-800 leading-relaxed'
          : 'text-xs text-gray-800 leading-relaxed'
      }
    />
  )
}

export function ReusableCommentThread({
  comments,
  layoutPreset = 'modal',
  actionEntityType = 'comment' as EntityType,
  maxRootItems,
  maxRepliesPerRoot,
  showHeaderTimestamp = true,
  timestampFormatter,
  headerTimestampFormatter,
  expandedReplies = {},
  isRepliesExpanded,
  showReplyToggle = false,
  getReplyToggleLabel = defaultReplyToggleLabel,
  onToggleReplies,
  onReplyClick,
  renderRootTrailing,
  renderReplyComposer,
  renderReplyAfterActions,
  renderCommentText = defaultTextRenderer,
  renderBubbleFooter,
  classNames,
  rootActionOptions,
  replyActionOptions,
  avatarSizes,
}: ReusableCommentThreadProps) {
  const ui = { ...resolvePresetClassNames(layoutPreset), ...classNames }
  const rootSize = avatarSizes?.root || 'sm'
  const replySize = avatarSizes?.reply || 'xs'
  const visibleRoots =
    typeof maxRootItems === 'number' ? comments.slice(0, maxRootItems) : comments

  const formatHeaderTime = (comment: ReusableCommentNode, depth: number) => {
    if (!showHeaderTimestamp) return undefined
    if (headerTimestampFormatter) return headerTimestampFormatter(comment, depth)
    return undefined
  }

  const isExpanded = (rootComment: ReusableCommentNode) =>
    isRepliesExpanded
      ? isRepliesExpanded(rootComment, expandedReplies)
      : !!expandedReplies[rootComment.id]

  return (
    <div className={ui.rootList}>
      {visibleRoots.map((rootComment) => {
        const expanded = isExpanded(rootComment)
        const replyNodes =
          typeof maxRepliesPerRoot === 'number'
            ? (rootComment.replies || []).slice(0, maxRepliesPerRoot)
            : rootComment.replies || []

        return (
          <div key={rootComment.id} className={ui.rootItem}>
            <div className={ui.rootRow}>
              <EntityAvatar
                type="user"
                id={rootComment.user?.id || 'unknown-user'}
                name={rootComment.user?.name || 'User'}
                src={rootComment.user?.avatarUrl}
                size={rootSize}
              />
              <div className="flex-1 min-w-0">
                <div className={ui.rootBubble}>
                  <div className={ui.rootHeader}>
                    <EntityName
                      type="user"
                      id={rootComment.user?.id || 'unknown-user'}
                      name={rootComment.user?.name || 'Unknown User'}
                      avatar_url={rootComment.user?.avatarUrl}
                      className="text-sm font-semibold text-gray-900"
                    />
                    {formatHeaderTime(rootComment, 0) && (
                      <span className="text-xs text-gray-400">{formatHeaderTime(rootComment, 0)}</span>
                    )}
                  </div>
                  <div className={ui.rootText}>{renderCommentText(rootComment, 0)}</div>
                  {renderBubbleFooter?.(rootComment, 0)}
                </div>

                <div className={ui.rootActionsRow}>
                  <div className="flex items-center gap-4">
                    <CommentActionButtons
                      entityId={rootComment.id}
                      entityType={actionEntityType}
                      timestamp={timestampFormatter?.(rootComment, 0)}
                      onReplyClick={() => onReplyClick?.(rootComment, rootComment)}
                      className={rootActionOptions?.className}
                      textSize={rootActionOptions?.textSize}
                      showLike={rootActionOptions?.showLike}
                      showReply={rootActionOptions?.showReply}
                      showTimestamp={rootActionOptions?.showTimestamp}
                      showReactionSummary={rootActionOptions?.showReactionSummary}
                    />
                    {showReplyToggle && (rootComment.replyCount || 0) > 0 && (
                      <button
                        className="text-xs font-medium text-gray-500 hover-app-theme action-small-pad"
                        onClick={() => onToggleReplies?.(rootComment)}
                      >
                        {getReplyToggleLabel(rootComment, expanded)}
                      </button>
                    )}
                  </div>
                  {renderRootTrailing?.(rootComment)}
                </div>

                {expanded && (replyNodes.length > 0 || renderReplyComposer) && (
                  <div className={ui.repliesContainer}>
                    {replyNodes.map((replyComment) => (
                      <div key={replyComment.id} className={ui.replyRow}>
                        <EntityAvatar
                          type="user"
                          id={replyComment.user?.id || 'unknown-user'}
                          name={replyComment.user?.name || 'User'}
                          src={replyComment.user?.avatarUrl}
                          size={replySize}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={ui.replyBubble}>
                            <div className={ui.replyHeader}>
                              <EntityName
                                type="user"
                                id={replyComment.user?.id || 'unknown-user'}
                                name={replyComment.user?.name || 'Unknown User'}
                                avatar_url={replyComment.user?.avatarUrl}
                                className="text-xs font-semibold text-gray-900"
                              />
                              {formatHeaderTime(replyComment, 1) && (
                                <span className="text-xs text-gray-400">{formatHeaderTime(replyComment, 1)}</span>
                              )}
                            </div>
                            <div className={ui.replyText}>{renderCommentText(replyComment, 1)}</div>
                            {renderBubbleFooter?.(replyComment, 1)}
                          </div>

                          <div className={ui.replyActionsRow}>
                            <CommentActionButtons
                              entityId={replyComment.id}
                              entityType={actionEntityType}
                              timestamp={timestampFormatter?.(replyComment, 1)}
                              onReplyClick={() => onReplyClick?.(replyComment, rootComment)}
                              className={replyActionOptions?.className}
                              textSize={replyActionOptions?.textSize}
                              showLike={replyActionOptions?.showLike}
                              showReply={replyActionOptions?.showReply}
                              showTimestamp={replyActionOptions?.showTimestamp}
                              showReactionSummary={replyActionOptions?.showReactionSummary}
                            />
                          </div>
                          {renderReplyAfterActions?.(replyComment, rootComment)}
                        </div>
                      </div>
                    ))}
                    {renderReplyComposer?.(rootComment)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ReusableCommentThread