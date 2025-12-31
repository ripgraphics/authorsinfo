'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Filter, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { QuestionVoting } from './question-voting';
import type { QAQuestion, QuestionStatus } from '@/types/phase3';

// ============================================================================
// TYPES - Fully exportable for reuse across the application
// ============================================================================

export interface LiveQAFeedProps {
  /** The Q&A session ID */
  sessionId: string;
  /** Callback to fetch questions */
  onFetchQuestions: (sessionId: string, options?: FetchQuestionsOptions) => Promise<QAQuestion[]>;
  /** Callback when a question is voted on */
  onVoteQuestion: (questionId: string) => Promise<void>;
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Whether to enable auto-refresh */
  autoRefresh?: boolean;
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
  /** Whether the feed is in loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Custom className */
  className?: string;
  /** Maximum height for the feed */
  maxHeight?: string;
  /** Whether to show filter tabs */
  showFilters?: boolean;
  /** Whether to show refresh button */
  showRefreshButton?: boolean;
  /** Initial sort order */
  defaultSort?: 'recent' | 'popular' | 'answered';
  /** Initial filter */
  defaultFilter?: QuestionStatus;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Callback when a question is clicked */
  onQuestionClick?: (question: QAQuestion) => void;
}

export interface FetchQuestionsOptions {
  status?: QuestionStatus;
  sort?: 'recent' | 'popular' | 'answered';
  limit?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function groupQuestionsByStatus(questions: QAQuestion[]): Record<QuestionStatus, QAQuestion[]> {
  return questions.reduce((acc, question) => {
    if (!acc[question.status]) {
      acc[question.status] = [];
    }
    acc[question.status].push(question);
    return acc;
  }, {} as Record<QuestionStatus, QAQuestion[]>);
}

export function getQuestionCountByStatus(questions: QAQuestion[], status: QuestionStatus): number {
  return questions.filter(q => q.status === status).length;
}

export function sortQuestions(
  questions: QAQuestion[],
  sortBy: 'recent' | 'popular' | 'answered'
): QAQuestion[] {
  const sorted = [...questions];
  
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'popular':
      return sorted.sort((a, b) => b.upvotes - a.upvotes);
    case 'answered':
      return sorted.sort((a, b) => {
        if (a.status === 'answered' && b.status !== 'answered') return -1;
        if (a.status !== 'answered' && b.status === 'answered') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    default:
      return sorted;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LiveQAFeed({
  sessionId,
  onFetchQuestions,
  onVoteQuestion,
  onRefresh,
  autoRefresh = false,
  autoRefreshInterval = 30000, // 30 seconds
  isLoading = false,
  error = null,
  className,
  maxHeight = '600px',
  showFilters = true,
  showRefreshButton = true,
  defaultSort = 'popular',
  defaultFilter,
  emptyMessage = 'No questions yet. Be the first to ask!',
  onQuestionClick,
}: LiveQAFeedProps) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [currentSort, setCurrentSort] = useState(defaultSort);
  const [currentFilter, setCurrentFilter] = useState<QuestionStatus | undefined>(defaultFilter);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [votingQuestionId, setVotingQuestionId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      setIsRefreshing(true);
      const fetchedQuestions = await onFetchQuestions(sessionId, {
        status: currentFilter,
        sort: currentSort,
        limit: 50,
      });
      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchQuestions();
  }, [sessionId, currentSort, currentFilter]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchQuestions();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval, sessionId, currentSort, currentFilter]);

  // Handle vote
  const handleVote = async (questionId: string) => {
    try {
      setVotingQuestionId(questionId);
      await onVoteQuestion(questionId);
      // Refresh questions to get updated vote counts
      await fetchQuestions();
    } catch (err) {
      console.error('Error voting on question:', err);
    } finally {
      setVotingQuestionId(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchQuestions();
    onRefresh?.();
  };

  // Handle sort change
  const handleSortChange = (sort: string) => {
    setCurrentSort(sort as 'recent' | 'popular' | 'answered');
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter === 'all' ? undefined : filter as QuestionStatus);
  };

  // Get filtered and sorted questions
  const displayQuestions = sortQuestions(questions, currentSort);

  // Question counts
  const allCount = questions.length;
  const featuredCount = getQuestionCountByStatus(questions, 'featured');
  const answeredCount = getQuestionCountByStatus(questions, 'answered');
  const pendingCount = getQuestionCountByStatus(questions, 'pending');

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Q&A Feed</CardTitle>
          <div className="flex items-center gap-2">
            {autoRefresh && (
              <Badge variant="secondary" className="text-xs">
                <div className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
            )}
            {showRefreshButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', (isRefreshing || isLoading) && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Tabs value={currentSort} onValueChange={handleSortChange} className="mt-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="popular">
                Popular
              </TabsTrigger>
              <TabsTrigger value="recent">
                Recent
              </TabsTrigger>
              <TabsTrigger value="answered">
                Answered
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Status filters */}
        {showFilters && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Button
              variant={currentFilter === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('all')}
              className="h-7 text-xs"
            >
              All ({allCount})
            </Button>
            {featuredCount > 0 && (
              <Button
                variant={currentFilter === 'featured' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('featured')}
                className="h-7 text-xs"
              >
                ⭐ Featured ({featuredCount})
              </Button>
            )}
            <Button
              variant={currentFilter === 'answered' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('answered')}
              className="h-7 text-xs"
            >
              Answered ({answeredCount})
            </Button>
            <Button
              variant={currentFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('pending')}
              className="h-7 text-xs"
            >
              Pending ({pendingCount})
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Error state */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Loading state */}
        {isLoading && questions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayQuestions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          /* Questions list */
          <ScrollArea ref={scrollAreaRef} style={{ maxHeight }} className="px-4">
            <div className="space-y-3 py-4">
              {displayQuestions.map((question) => (
                <QuestionVoting
                  key={question.id}
                  question={question}
                  onVote={handleVote}
                  onClick={onQuestionClick}
                  isVoting={votingQuestionId === question.id}
                  showAnswers={true}
                  showVoteButton={true}
                  showStatus={true}
                  variant="default"
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
