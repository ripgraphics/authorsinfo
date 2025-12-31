'use client';

/**
 * CreateChallengeModal Component - Fully Reusable
 * Dialog for creating a new reading challenge with configurable options
 * 
 * @example Basic usage with callback
 * <CreateChallengeModal 
 *   isOpen={open} 
 *   onClose={() => setOpen(false)}
 *   onSubmit={async (data) => { await createChallenge(data); }}
 * />
 * 
 * @example With custom default values
 * <CreateChallengeModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   onSubmit={handleSubmit}
 *   defaultValues={{ goalType: 'pages', goalValue: 5000 }}
 * />
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Globe, Lock, BookOpen, FileText, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES - All exported for reusability
// ============================================================================

/** Goal type for reading challenges */
export type ChallengeGoalType = 'books' | 'pages' | 'minutes' | 'authors';

/** Form data for challenge creation */
export interface ChallengeFormData {
  title: string;
  description: string;
  goalType: ChallengeGoalType;
  goalValue: number;
  startDate: string;
  endDate: string;
  isPublic: boolean;
}

/** Data sent to submit handler */
export interface ChallengeSubmitData {
  title: string;
  description: string | null;
  goalType: ChallengeGoalType;
  goalValue: number;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
}

/** Default values for the form */
export interface ChallengeFormDefaults {
  title?: string;
  description?: string;
  goalType?: ChallengeGoalType;
  goalValue?: number;
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
}

/** Goal type option for custom options */
export interface GoalTypeOption {
  value: ChallengeGoalType;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

/** Props for CreateChallengeModal */
export interface CreateChallengeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when form is submitted - receives form data, should return Promise */
  onSubmit: (data: ChallengeSubmitData) => Promise<void>;
  /** External loading state (overrides internal) */
  loading?: boolean;
  /** Default form values */
  defaultValues?: ChallengeFormDefaults;
  /** Custom title for the modal */
  title?: string;
  /** Custom description for the modal */
  description?: string;
  /** Custom goal type options */
  goalTypeOptions?: GoalTypeOption[];
  /** Custom submit button text */
  submitText?: string;
  /** Custom cancel button text */
  cancelText?: string;
  /** Custom placeholder for title input */
  titlePlaceholder?: string;
  /** Custom placeholder for description input */
  descriptionPlaceholder?: string;
  /** Show description field */
  showDescription?: boolean;
  /** Show public/private toggle */
  showPublicToggle?: boolean;
  /** Custom validation function */
  validate?: (data: ChallengeFormData) => string | null;
  /** Additional class names */
  className?: string;
  /** Reset form on close */
  resetOnClose?: boolean;
  /** Success message to show */
  successMessage?: string;
}

// ============================================================================
// UTILITIES - All exported for external use
// ============================================================================

/** Default goal type options with icons */
export const DEFAULT_GOAL_TYPE_OPTIONS: GoalTypeOption[] = [
  { value: 'books', label: 'Books', icon: <BookOpen className="h-4 w-4" />, description: 'Number of books to read' },
  { value: 'pages', label: 'Pages', icon: <FileText className="h-4 w-4" />, description: 'Total pages to read' },
  { value: 'minutes', label: 'Minutes', icon: <Clock className="h-4 w-4" />, description: 'Reading time in minutes' },
  { value: 'authors', label: 'Authors', icon: <Users className="h-4 w-4" />, description: 'Unique authors to read' },
];

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get end of year date as YYYY-MM-DD string
 */
export function getEndOfYearString(): string {
  const year = new Date().getFullYear();
  return `${year}-12-31`;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): string | null {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) {
    return 'End date must be after start date';
  }
  return null;
}

/**
 * Get suggested goal value based on type
 */
export function getSuggestedGoalValue(type: ChallengeGoalType): number {
  const suggestions: Record<ChallengeGoalType, number> = {
    books: 12,
    pages: 5000,
    minutes: 6000,
    authors: 10,
  };
  return suggestions[type] || 12;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  loading: externalLoading,
  defaultValues,
  title = 'Create Reading Challenge',
  description = 'Set a reading goal for the year and track your progress.',
  goalTypeOptions = DEFAULT_GOAL_TYPE_OPTIONS,
  submitText = 'Create Challenge',
  cancelText = 'Cancel',
  titlePlaceholder = 'e.g. 2025 Reading Goal',
  descriptionPlaceholder = 'What do you want to achieve?',
  showDescription = true,
  showPublicToggle = true,
  validate,
  className,
  resetOnClose = true,
  successMessage = 'Challenge created successfully!',
}: CreateChallengeModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;
  
  // Form state
  const [formTitle, setFormTitle] = useState(defaultValues?.title || '');
  const [formDescription, setFormDescription] = useState(defaultValues?.description || '');
  const [goalType, setGoalType] = useState<ChallengeGoalType>(defaultValues?.goalType || 'books');
  const [goalValue, setGoalValue] = useState(String(defaultValues?.goalValue || getSuggestedGoalValue('books')));
  const [isPublic, setIsPublic] = useState(defaultValues?.isPublic ?? true);
  const [startDate, setStartDate] = useState(
    defaultValues?.startDate?.toISOString().split('T')[0] || getTodayString()
  );
  const [endDate, setEndDate] = useState(
    defaultValues?.endDate?.toISOString().split('T')[0] || getEndOfYearString()
  );

  // Reset form when defaults change
  useEffect(() => {
    if (defaultValues) {
      if (defaultValues.title !== undefined) setFormTitle(defaultValues.title);
      if (defaultValues.description !== undefined) setFormDescription(defaultValues.description);
      if (defaultValues.goalType !== undefined) setGoalType(defaultValues.goalType);
      if (defaultValues.goalValue !== undefined) setGoalValue(String(defaultValues.goalValue));
      if (defaultValues.isPublic !== undefined) setIsPublic(defaultValues.isPublic);
      if (defaultValues.startDate) setStartDate(defaultValues.startDate.toISOString().split('T')[0]);
      if (defaultValues.endDate) setEndDate(defaultValues.endDate.toISOString().split('T')[0]);
    }
  }, [defaultValues]);

  // Update goal value suggestion when type changes
  const handleGoalTypeChange = (type: ChallengeGoalType) => {
    setGoalType(type);
    setGoalValue(String(getSuggestedGoalValue(type)));
  };

  const resetForm = () => {
    setFormTitle(defaultValues?.title || '');
    setFormDescription(defaultValues?.description || '');
    setGoalType(defaultValues?.goalType || 'books');
    setGoalValue(String(defaultValues?.goalValue || getSuggestedGoalValue('books')));
    setIsPublic(defaultValues?.isPublic ?? true);
    setStartDate(defaultValues?.startDate?.toISOString().split('T')[0] || getTodayString());
    setEndDate(defaultValues?.endDate?.toISOString().split('T')[0] || getEndOfYearString());
  };

  const handleClose = () => {
    if (resetOnClose) {
      resetForm();
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const value = parseInt(goalValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid goal value');
      return;
    }

    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      toast.error(dateError);
      return;
    }

    // Custom validation
    if (validate) {
      const validationError = validate({
        title: formTitle,
        description: formDescription,
        goalType,
        goalValue: value,
        startDate,
        endDate,
        isPublic,
      });
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    setInternalLoading(true);
    try {
      await onSubmit({
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        goalType,
        goalValue: value,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPublic,
      });
      
      toast.success(successMessage);
      handleClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-[500px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title</Label>
            <Input
              id="title"
              placeholder={titlePlaceholder}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {showDescription && (
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder={descriptionPlaceholder}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                disabled={loading}
                className="resize-none h-20"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select
                value={goalType}
                onValueChange={(value) => handleGoalTypeChange(value as ChallengeGoalType)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {goalTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalValue">Goal Value</Label>
              <Input
                id="goalValue"
                type="number"
                min="1"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {showPublicToggle && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Public Challenge</Label>
                <p className="text-sm text-muted-foreground">
                  Allow friends to see your progress
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating...' : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
