'use client';

import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface QuestionData {
  questionText: string;
  isAnonymous: boolean;
}

export interface QuestionSubmissionProps {
  /** Callback when question is submitted */
  onSubmit: (data: QuestionData) => void | Promise<void>;
  /** Whether submission is in progress */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether anonymous questions are allowed */
  allowAnonymous?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Placeholder text for textarea */
  placeholder?: string;
  /** Submit button text */
  submitButtonText?: string;
  /** Custom className */
  className?: string;
  /** Whether to auto-focus the textarea */
  autoFocus?: boolean;
  /** Whether to show character count */
  showCharacterCount?: boolean;
  /** Callback when form is cleared */
  onClear?: () => void;
  /** Whether to clear form after submission */
  clearOnSubmit?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function validateQuestion(text: string, maxLength: number = 500): string | null {
  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return 'Please enter a question';
  }
  
  if (trimmed.length < 10) {
    return 'Question must be at least 10 characters long';
  }
  
  if (trimmed.length > maxLength) {
    return `Question must be less than ${maxLength} characters`;
  }
  
  return null;
}

export function getCharacterCountColor(current: number, max: number): string {
  const percentage = (current / max) * 100;
  
  if (percentage >= 95) {
    return 'text-red-600 font-semibold';
  } else if (percentage >= 80) {
    return 'text-orange-600';
  } else {
    return 'text-muted-foreground';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuestionSubmission({
  onSubmit,
  isLoading = false,
  error = null,
  allowAnonymous = false,
  maxLength = 500,
  placeholder = 'Ask your question here...',
  submitButtonText = 'Submit Question',
  className,
  autoFocus = false,
  showCharacterCount = true,
  onClear,
  clearOnSubmit = true,
}: QuestionSubmissionProps) {
  const [questionText, setQuestionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const characterCount = questionText.length;
  const isOverLimit = characterCount > maxLength;
  const characterCountColor = getCharacterCountColor(characterCount, maxLength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const error = validateQuestion(questionText, maxLength);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError(null);
    
    // Submit
    await onSubmit({
      questionText: questionText.trim(),
      isAnonymous,
    });
    
    // Clear form if requested
    if (clearOnSubmit) {
      handleClear();
    }
  };

  const handleClear = () => {
    setQuestionText('');
    setIsAnonymous(false);
    setValidationError(null);
    onClear?.();
  };

  const displayError = error || validationError;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Question textarea */}
      <div className="space-y-2">
        <Label htmlFor="question-text">Your Question</Label>
        <Textarea
          id="question-text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          autoFocus={autoFocus}
          rows={4}
          className={cn(
            'resize-none',
            isOverLimit && 'border-red-500 focus-visible:ring-red-500'
          )}
          maxLength={maxLength + 50} // Allow typing a bit over to show error
        />
        
        {/* Character count */}
        {showCharacterCount && (
          <div className="flex items-center justify-between text-xs">
            <span className={characterCountColor}>
              {characterCount} / {maxLength} characters
            </span>
            {isOverLimit && (
              <span className="text-red-600 font-medium">
                {characterCount - maxLength} characters over limit
              </span>
            )}
          </div>
        )}
      </div>

      {/* Anonymous option */}
      {allowAnonymous && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            disabled={isLoading}
          />
          <Label
            htmlFor="anonymous"
            className="text-sm font-normal cursor-pointer"
          >
            Submit anonymously
          </Label>
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={isLoading || isOverLimit || questionText.trim().length === 0}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {submitButtonText}
            </>
          )}
        </Button>
        
        {questionText.length > 0 && !isLoading && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {isAnonymous
          ? 'Your question will be submitted anonymously. Your identity will not be visible to others.'
          : 'Your name will be shown with your question.'}
      </p>
    </form>
  );
}
