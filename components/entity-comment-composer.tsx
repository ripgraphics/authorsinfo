'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Smile } from 'lucide-react'
import EntityAvatar from '@/components/entity-avatar'
import PostButton from '@/components/ui/post-button'
import { useToast } from '@/hooks/use-toast'

interface EntityCommentComposerProps {
  entityId: string
  entityType: string
  currentUserId?: string
  currentUserName: string
  currentUserAvatar?: string | null
  focusControl?: number
  onSubmitted?: () => void
  parentCommentId?: string
  placeholder?: string
  // Optional className hooks to match host layouts
  rootClassName?: string
  containerClassName?: string
  rowClassName?: string
  avatarClassName?: string
  triggerClassName?: string
  triggerIconsClassName?: string
  expandedClassName?: string
  textareaClassName?: string
  actionsClassName?: string
  quickActionsClassName?: string
  iconButtonClassName?: string
  cancelButtonClassName?: string
  submitButtonClassName?: string
  maxChars?: number
  maxLines?: number
}

export default function EntityCommentComposer({
  entityId,
  entityType,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  focusControl,
  onSubmitted,
  parentCommentId,
  placeholder,
  rootClassName,
  containerClassName,
  rowClassName,
  avatarClassName,
  triggerClassName,
  triggerIconsClassName,
  expandedClassName,
  textareaClassName,
  actionsClassName,
  quickActionsClassName,
  iconButtonClassName,
  cancelButtonClassName,
  submitButtonClassName,
  maxChars = 25000,
  maxLines = 9,
}: EntityCommentComposerProps) {
  const [isActive, setIsActive] = useState(false)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const focusComposer = useCallback(() => {
    setIsActive(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [])

  // Only activate when focusControl changes to a new positive value
  const lastFocusTickRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (
      typeof focusControl === 'number' &&
      focusControl > 0 &&
      focusControl !== lastFocusTickRef.current
    ) {
      lastFocusTickRef.current = focusControl
      focusComposer()
    }
  }, [focusControl, focusComposer])

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20') || 20
    const maxHeight = lineHeight * maxLines
    const newHeight = Math.min(el.scrollHeight, Math.ceil(maxHeight))
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [maxLines])

  useEffect(() => {
    if (isActive) resize()
  }, [text, isActive, resize])

  const submit = async () => {
    const content = text.trim()
    if (!content) {
      return
    }
    if (content.length > maxChars) {
      toast({
        title: 'Too long',
        description: `Max ${maxChars} characters`,
        variant: 'destructive',
      })
      return
    }
    try {
      setIsSubmitting(true)
      const resp = await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entityId,
          entity_type: entityType || 'activity',
          engagement_type: 'comment',
          content,
          parent_id: parentCommentId || undefined,
        }),
      })
      if (!resp.ok) {
        let message = `Failed to post comment (${resp.status})`
        try {
          const data = await resp.json()
          if (data?.error) message = data.error
        } catch {}
        toast({ title: 'Error', description: message, variant: 'destructive' })
        return
      }
      setText('')
      setIsActive(false)
      toast({
        title: 'Comment posted',
        description: parentCommentId ? 'Your reply has been added' : 'Your comment has been added',
      })
      onSubmitted?.()
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={rootClassName || ''}>
      <div className={containerClassName || ''}>
        <div className={rowClassName || 'flex items-center gap-3'}>
          <EntityAvatar
            type="user"
            id={currentUserId || 'current-user'}
            name={currentUserName || 'You'}
            src={currentUserAvatar || undefined}
            size="sm"
            className={avatarClassName}
          />
          {!isActive ? (
            <button
              onClick={focusComposer}
              className={
                triggerClassName ||
                'flex-1 flex items-center justify-between rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm text-gray-600 cursor-text'
              }
              style={{ transition: 'none' }}
              data-no-secondary-hover
            >
              <span className="truncate opacity-80">Comment as {currentUserName || 'You'}</span>
              <div
                className={triggerIconsClassName || 'flex items-center gap-2 ml-3 text-gray-400'}
              >
                <ImageIcon className="h-4 w-4" />
                <Smile className="h-4 w-4" />
                <span className="text-[10px] font-semibold">GIF</span>
              </div>
            </button>
          ) : (
            <div className="flex-1">
              <div
                className={
                  expandedClassName || 'bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2'
                }
              >
                <Textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, maxChars))}
                  placeholder={`Comment as ${currentUserName || 'You'}`}
                  className={
                    textareaClassName ||
                    'border-0 resize-none focus:ring-0 focus:outline-none min-h-[48px] text-sm bg-transparent'
                  }
                  rows={2}
                  onInput={resize}
                />
                <div className={actionsClassName || 'flex items-center justify-between mt-2'}>
                  <div className={quickActionsClassName || 'flex items-center gap-2 text-gray-500'}>
                    <button
                      className={
                        iconButtonClassName ||
                        'p-2 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100'
                      }
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      className={
                        iconButtonClassName ||
                        'p-2 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100'
                      }
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                    <span className="text-[10px] font-semibold ml-1">GIF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cancelButtonClassName || 'h-8 px-3 text-xs'}
                      onClick={() => {
                        setIsActive(false)
                        setText('')
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <PostButton
                      onClick={submit}
                      disabled={!text.trim() || isSubmitting}
                      loading={isSubmitting}
                      className={submitButtonClassName || ''}
                      sizeClassName="h-8 px-4 text-xs"
                      label="Post"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
