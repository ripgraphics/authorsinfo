/**
 * Tag Components Barrel Export
 */

export { TagInput, type TagInputProps, type TagSuggestion } from './tag-input'
export { TagInputEnhanced, type TagInputEnhancedProps } from './tag-input-enhanced'
export { TagDisplay, type TagDisplayProps, renderTagsInText } from './tag-display'
export { TagPreviewCard, type TagPreviewCardProps, type TagPreviewData } from './tag-preview-card'
export { TagDisambiguationDialog, type TagDisambiguationDialogProps } from './tag-disambiguation-dialog'
export { TagContentFeed } from './tag-content-feed'
export {
  TagEnabledTextarea,
  type TagEnabledTextareaProps,
  type TagEnabledTextareaRef,
  type ExtractedTag,
} from './tag-enabled-textarea'
export {
  TaggedTextRenderer,
  type TaggedTextRendererProps,
  useHasTags,
  extractTagsFromText,
} from './tagged-text-renderer'
