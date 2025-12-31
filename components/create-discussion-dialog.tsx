'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface DiscussionFormData {
  title: string;
  content: string;
  book_id?: string;
  group_id?: string;
  category_id?: number;
}

export interface CreateDiscussionResult {
  id: string;
  title: string;
  permalink?: string;
  [key: string]: any;
}

export interface CreateDiscussionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when form is submitted - should return the created discussion or null on error */
  onSubmit?: (data: DiscussionFormData) => Promise<CreateDiscussionResult | null>;
  /** Callback after successful creation */
  onSuccess?: (discussion: CreateDiscussionResult) => void;
  /** External loading state */
  isLoading?: boolean;
  /** External error message */
  error?: string | null;
  /** Callback to clear error */
  onClearError?: () => void;
  /** Associated book ID */
  bookId?: string;
  /** Associated group ID */
  groupId?: string;
  /** Associated category ID */
  categoryId?: number;
  /** Book title for display in description */
  bookTitle?: string;
  /** Group name for display in description */
  groupName?: string;
  /** Initial form values */
  initialValues?: Partial<DiscussionFormData>;
  /** Dialog title */
  title?: string;
  /** Dialog description (overrides default) */
  description?: string;
  /** Submit button text */
  submitButtonText?: string;
  /** Cancel button text */
  cancelButtonText?: string;
  /** Loading button text */
  loadingButtonText?: string;
  /** Custom className for the dialog content */
  className?: string;
  /** Minimum content length */
  minContentLength?: number;
  /** Maximum content length */
  maxContentLength?: number;
  /** Minimum title length */
  minTitleLength?: number;
  /** Maximum title length */
  maxTitleLength?: number;
  /** Number of rows for content textarea */
  contentRows?: number;
  /** Whether to show character count */
  showCharacterCount?: boolean;
  /** Helper text below content */
  helperText?: string;
  /** Placeholder texts */
  placeholders?: {
    title?: string;
    content?: string;
  };
  /** Label texts */
  labels?: {
    title?: string;
    content?: string;
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_FORM_DATA: DiscussionFormData = {
  title: '',
  content: '',
};

const DEFAULT_PLACEHOLDERS = {
  title: 'What do you want to discuss?',
  content: 'Share your thoughts, questions, or insights...',
};

const DEFAULT_LABELS = {
  title: 'Title',
  content: 'Content',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateDiscussionDialog({
  open,
  onOpenChange,
  onSubmit,
  onSuccess,
  isLoading: externalLoading,
  error: externalError,
  onClearError,
  bookId,
  groupId,
  categoryId,
  bookTitle,
  groupName,
  initialValues,
  title = 'Start a Discussion',
  description: customDescription,
  submitButtonText = 'Post Discussion',
  cancelButtonText = 'Cancel',
  loadingButtonText = 'Posting...',
  className,
  minContentLength = 1,
  maxContentLength,
  minTitleLength = 1,
  maxTitleLength = 200,
  contentRows = 6,
  showCharacterCount = false,
  helperText = 'Be respectful and follow community guidelines.',
  placeholders = DEFAULT_PLACEHOLDERS,
  labels = DEFAULT_LABELS,
}: CreateDiscussionDialogProps) {
  const [formData, setFormData] = useState<DiscussionFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialValues,
  });
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const loading = externalLoading ?? internalLoading;
  const error = externalError ?? internalError;

  // Generate description
  const getDescription = () => {
    if (customDescription) return customDescription;
    if (bookTitle) return `Start a discussion about "${bookTitle}"`;
    if (groupName) return `Start a discussion in ${groupName}`;
    return 'Share your thoughts and start a conversation with other readers.';
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({ ...DEFAULT_FORM_DATA, ...initialValues });
      setInternalError(null);
    }
  }, [open, initialValues]);

  const clearError = useCallback(() => {
    setInternalError(null);
    onClearError?.();
  }, [onClearError]);

  const updateField = useCallback(<K extends keyof DiscussionFormData>(
    field: K,
    value: DiscussionFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
  }, [clearError]);

  const validateForm = (): string | null => {
    const trimmedTitle = formData.title.trim();
    const trimmedContent = formData.content.trim();

    if (trimmedTitle.length < minTitleLength) {
      return `Title must be at least ${minTitleLength} character(s)`;
    }
    if (maxTitleLength && trimmedTitle.length > maxTitleLength) {
      return `Title must be less than ${maxTitleLength} characters`;
    }
    if (trimmedContent.length < minContentLength) {
      return `Content must be at least ${minContentLength} character(s)`;
    }
    if (maxContentLength && trimmedContent.length > maxContentLength) {
      return `Content must be less than ${maxContentLength} characters`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const validationError = validateForm();
    if (validationError) {
      setInternalError(validationError);
      return;
    }

    const submitData: DiscussionFormData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      book_id: bookId,
      group_id: groupId,
      category_id: categoryId,
    };

    if (onSubmit) {
      setInternalLoading(true);
      try {
        const result = await onSubmit(submitData);
        if (result) {
          onOpenChange(false);
          setFormData(DEFAULT_FORM_DATA);
          onSuccess?.(result);
        }
      } catch (err: any) {
        setInternalError(err.message || 'Failed to create discussion');
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData(DEFAULT_FORM_DATA);
    clearError();
  };

  const isSubmitDisabled = 
    loading || 
    formData.title.trim().length < minTitleLength || 
    formData.content.trim().length < minContentLength;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-[600px]', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Title field */}
            <div className="space-y-2">
              <Label htmlFor="discussion-title">{labels.title} *</Label>
              <Input
                id="discussion-title"
                placeholder={placeholders.title}
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
                disabled={loading}
                autoFocus
                maxLength={maxTitleLength}
              />
              {showCharacterCount && maxTitleLength && (
                <p className="text-xs text-muted-foreground text-right">
                  {formData.title.length} / {maxTitleLength}
                </p>
              )}
            </div>

            {/* Content field */}
            <div className="space-y-2">
              <Label htmlFor="discussion-content">{labels.content} *</Label>
              <Textarea
                id="discussion-content"
                placeholder={placeholders.content}
                value={formData.content}
                onChange={(e) => updateField('content', e.target.value)}
                rows={contentRows}
                required
                disabled={loading}
                maxLength={maxContentLength}
              />
              <div className="flex items-center justify-between">
                {helperText && (
                  <p className="text-xs text-muted-foreground">{helperText}</p>
                )}
                {showCharacterCount && maxContentLength && (
                  <p className="text-xs text-muted-foreground">
                    {formData.content.length} / {maxContentLength}
                  </p>
                )}
              </div>
            </div>

            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelButtonText}
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {loading ? loadingButtonText : submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
