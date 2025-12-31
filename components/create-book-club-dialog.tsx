'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface BookClubFormData {
  name: string;
  description: string;
  is_public: boolean;
  max_members: string;
  rules: string;
  cover_image_url?: string;
}

export interface BookClubSubmitData {
  name: string;
  description?: string;
  is_public: boolean;
  max_members?: number;
  rules?: string;
  cover_image_url?: string;
}

export interface CreateBookClubResult {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CreateBookClubDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when form is submitted - should return the created club or null on error */
  onSubmit?: (data: BookClubSubmitData) => Promise<CreateBookClubResult | null>;
  /** Callback after successful creation */
  onSuccess?: (club: CreateBookClubResult) => void;
  /** External loading state */
  isLoading?: boolean;
  /** External error message */
  error?: string | null;
  /** Callback to clear error */
  onClearError?: () => void;
  /** Initial form values */
  initialValues?: Partial<BookClubFormData>;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Submit button text */
  submitButtonText?: string;
  /** Cancel button text */
  cancelButtonText?: string;
  /** Loading button text */
  loadingButtonText?: string;
  /** Whether to show the public/private toggle */
  showPublicToggle?: boolean;
  /** Whether to show the max members field */
  showMaxMembers?: boolean;
  /** Whether to show the rules field */
  showRules?: boolean;
  /** Custom className for the dialog content */
  className?: string;
  /** Minimum members value */
  minMembers?: number;
  /** Maximum members value */
  maxMembersLimit?: number;
  /** Placeholder texts */
  placeholders?: {
    name?: string;
    description?: string;
    maxMembers?: string;
    rules?: string;
  };
  /** Label texts */
  labels?: {
    name?: string;
    description?: string;
    isPublic?: string;
    isPublicDescription?: string;
    maxMembers?: string;
    rules?: string;
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_FORM_DATA: BookClubFormData = {
  name: '',
  description: '',
  is_public: true,
  max_members: '',
  rules: '',
};

const DEFAULT_PLACEHOLDERS = {
  name: 'Enter club name',
  description: 'What is your club about?',
  maxMembers: 'Leave empty for unlimited',
  rules: 'Set guidelines for your members',
};

const DEFAULT_LABELS = {
  name: 'Club Name',
  description: 'Description',
  isPublic: 'Public Club',
  isPublicDescription: 'Anyone can find and join public clubs',
  maxMembers: 'Maximum Members (optional)',
  rules: 'Club Rules (optional)',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateBookClubDialog({
  open,
  onOpenChange,
  onSubmit,
  onSuccess,
  isLoading: externalLoading,
  error: externalError,
  onClearError,
  initialValues,
  title = 'Create a Book Club',
  description = 'Start a new book club to connect with other readers and discuss your favorite books.',
  submitButtonText = 'Create Club',
  cancelButtonText = 'Cancel',
  loadingButtonText = 'Creating...',
  showPublicToggle = true,
  showMaxMembers = true,
  showRules = true,
  className,
  minMembers = 2,
  maxMembersLimit,
  placeholders = DEFAULT_PLACEHOLDERS,
  labels = DEFAULT_LABELS,
}: CreateBookClubDialogProps) {
  const [formData, setFormData] = useState<BookClubFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialValues,
  });
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const loading = externalLoading ?? internalLoading;
  const error = externalError ?? internalError;

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

  const updateField = useCallback(<K extends keyof BookClubFormData>(
    field: K,
    value: BookClubFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!formData.name.trim()) {
      setInternalError('Club name is required');
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      is_public: formData.is_public,
      max_members: formData.max_members ? parseInt(formData.max_members) : undefined,
      rules: formData.rules.trim() || undefined,
      cover_image_url: formData.cover_image_url,
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
        setInternalError(err.message || 'Failed to create club');
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

  const isSubmitDisabled = loading || !formData.name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-[500px]', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name field - always shown */}
            <div className="space-y-2">
              <Label htmlFor="club-name">{labels.name} *</Label>
              <Input
                id="club-name"
                placeholder={placeholders.name}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Description field - always shown */}
            <div className="space-y-2">
              <Label htmlFor="club-description">{labels.description}</Label>
              <Textarea
                id="club-description"
                placeholder={placeholders.description}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Public toggle - optional */}
            {showPublicToggle && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="club-is-public">{labels.isPublic}</Label>
                  <p className="text-sm text-muted-foreground">
                    {labels.isPublicDescription}
                  </p>
                </div>
                <Switch
                  id="club-is-public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => updateField('is_public', checked)}
                  disabled={loading}
                />
              </div>
            )}

            {/* Max members field - optional */}
            {showMaxMembers && (
              <div className="space-y-2">
                <Label htmlFor="club-max-members">{labels.maxMembers}</Label>
                <Input
                  id="club-max-members"
                  type="number"
                  placeholder={placeholders.maxMembers}
                  value={formData.max_members}
                  onChange={(e) => updateField('max_members', e.target.value)}
                  min={minMembers}
                  max={maxMembersLimit}
                  disabled={loading}
                />
              </div>
            )}

            {/* Rules field - optional */}
            {showRules && (
              <div className="space-y-2">
                <Label htmlFor="club-rules">{labels.rules}</Label>
                <Textarea
                  id="club-rules"
                  placeholder={placeholders.rules}
                  value={formData.rules}
                  onChange={(e) => updateField('rules', e.target.value)}
                  rows={3}
                  disabled={loading}
                />
              </div>
            )}

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
