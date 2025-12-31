'use client';

/**
 * LogProgressModal Component - Fully Reusable
 * Modal for logging reading progress on a challenge
 * 
 * @example Basic usage with challenge data
 * <LogProgressModal 
 *   isOpen={open} 
 *   onClose={() => setOpen(false)}
 *   challenge={challengeData}
 *   onSubmit={async (data) => { await logProgress(data); }}
 * />
 * 
 * @example Without challenge (manual goal type)
 * <LogProgressModal 
 *   isOpen={open} 
 *   onClose={() => setOpen(false)}
 *   goalType="pages"
 *   onSubmit={handleSubmit}
 * />
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, BookOpen, FileText, Clock, Star, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES - All exported for reusability
// ============================================================================

/** Goal type for logging progress */
export type ProgressGoalType = 'books' | 'pages' | 'minutes' | 'authors';

/** Minimal challenge data needed for progress logging */
export interface ProgressChallengeData {
  id: string;
  title?: string;
  goalType: ProgressGoalType;
  currentValue?: number;
  goalValue?: number;
}

/** Data submitted when logging progress */
export interface ProgressLogData {
  challengeId: string;
  value: number;
  notes?: string;
  date?: Date;
  goalType: ProgressGoalType;
  /** Mapped fields for API compatibility */
  booksCompleted?: number;
  pagesRead?: number;
  minutesRead?: number;
  authorsRead?: number;
}

/** Props for LogProgressModal */
export interface LogProgressModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Challenge to log progress for (optional if goalType is provided) */
  challenge?: ProgressChallengeData;
  /** Goal type if no challenge provided */
  goalType?: ProgressGoalType;
  /** Callback when progress is submitted */
  onSubmit: (data: ProgressLogData) => Promise<void>;
  /** External loading state */
  loading?: boolean;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Show notes field */
  showNotes?: boolean;
  /** Show date picker */
  showDatePicker?: boolean;
  /** Default date for progress */
  defaultDate?: Date;
  /** Custom placeholder for value input */
  valuePlaceholder?: string;
  /** Custom placeholder for notes input */
  notesPlaceholder?: string;
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Success message */
  successMessage?: string;
  /** Max value allowed */
  maxValue?: number;
  /** Min value allowed */
  minValue?: number;
  /** Additional class name */
  className?: string;
  /** Reset form on close */
  resetOnClose?: boolean;
  /** Show current progress */
  showCurrentProgress?: boolean;
}

// ============================================================================
// UTILITIES - All exported for external use
// ============================================================================

/**
 * Get label for goal type
 */
export function getProgressLabel(type: ProgressGoalType): string {
  const labels: Record<ProgressGoalType, string> = {
    books: 'Books Completed',
    pages: 'Pages Read',
    minutes: 'Minutes Read',
    authors: 'Authors Read',
  };
  return labels[type] || 'Value';
}

/**
 * Get icon for goal type
 */
export function getProgressIcon(type: ProgressGoalType): React.ReactNode {
  const icons: Record<ProgressGoalType, React.ReactNode> = {
    books: <BookOpen className="h-4 w-4" />,
    pages: <FileText className="h-4 w-4" />,
    minutes: <Clock className="h-4 w-4" />,
    authors: <Star className="h-4 w-4" />,
  };
  return icons[type] || <BookOpen className="h-4 w-4" />;
}

/**
 * Get placeholder text for goal type
 */
export function getProgressPlaceholder(type: ProgressGoalType): string {
  const placeholders: Record<ProgressGoalType, string> = {
    books: 'Enter number of books',
    pages: 'Enter number of pages',
    minutes: 'Enter minutes spent reading',
    authors: 'Enter number of authors',
  };
  return placeholders[type] || 'Enter value';
}

/**
 * Map value to API field based on goal type
 */
export function mapProgressToApiFields(value: number, type: ProgressGoalType): Partial<ProgressLogData> {
  const mapping: Record<ProgressGoalType, Partial<ProgressLogData>> = {
    books: { booksCompleted: value },
    pages: { pagesRead: value },
    minutes: { minutesRead: value },
    authors: { authorsRead: value },
  };
  return mapping[type] || {};
}

/**
 * Get today's date as ISO string (date only)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LogProgressModal({
  isOpen,
  onClose,
  challenge,
  goalType: propGoalType,
  onSubmit,
  loading: externalLoading,
  title = 'Log Progress',
  description,
  showNotes = true,
  showDatePicker = false,
  defaultDate,
  valuePlaceholder,
  notesPlaceholder = 'What did you read? (Optional)',
  submitText = 'Log Progress',
  cancelText = 'Cancel',
  successMessage = 'Progress logged successfully!',
  maxValue,
  minValue = 1,
  className,
  resetOnClose = true,
  showCurrentProgress = true,
}: LogProgressModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;
  
  const [value, setValue] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(defaultDate?.toISOString().split('T')[0] || getTodayISO());

  const effectiveGoalType = challenge?.goalType || propGoalType || 'books';
  const effectiveChallenge = challenge || { id: '', goalType: effectiveGoalType };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen && resetOnClose) {
      setValue('');
      setNotes('');
      setDate(defaultDate?.toISOString().split('T')[0] || getTodayISO());
    }
  }, [isOpen, resetOnClose, defaultDate]);

  const handleClose = () => {
    if (resetOnClose) {
      setValue('');
      setNotes('');
      setDate(defaultDate?.toISOString().split('T')[0] || getTodayISO());
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numValue = Number(value);
    if (!value || isNaN(numValue)) {
      toast.error('Please enter a valid number');
      return;
    }

    if (numValue < (minValue || 1)) {
      toast.error(`Value must be at least ${minValue}`);
      return;
    }

    if (maxValue && numValue > maxValue) {
      toast.error(`Value cannot exceed ${maxValue}`);
      return;
    }

    setInternalLoading(true);
    try {
      const progressData: ProgressLogData = {
        challengeId: effectiveChallenge.id,
        value: numValue,
        goalType: effectiveGoalType,
        notes: notes.trim() || undefined,
        date: showDatePicker ? new Date(date) : new Date(),
        ...mapProgressToApiFields(numValue, effectiveGoalType),
      };

      await onSubmit(progressData);
      toast.success(successMessage);
      handleClose();
    } catch (error) {
      console.error('Error logging progress:', error);
      toast.error('Failed to log progress');
    } finally {
      setInternalLoading(false);
    }
  };

  const label = getProgressLabel(effectiveGoalType);
  const icon = getProgressIcon(effectiveGoalType);
  const placeholder = valuePlaceholder || getProgressPlaceholder(effectiveGoalType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          {(description || challenge?.title) && (
            <DialogDescription>
              {description || `Log progress for "${challenge?.title}"`}
            </DialogDescription>
          )}
        </DialogHeader>

        {showCurrentProgress && challenge?.currentValue !== undefined && challenge?.goalValue !== undefined && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current progress:</span>
              <span className="font-semibold">
                {challenge.currentValue} / {challenge.goalValue} {effectiveGoalType}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="value">{label}</Label>
            <Input
              id="value"
              type="number"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={minValue}
              max={maxValue}
              disabled={loading}
              required
            />
          </div>

          {showDatePicker && (
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                max={getTodayISO()}
              />
            </div>
          )}

          {showNotes && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder={notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                className="resize-none h-20"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
