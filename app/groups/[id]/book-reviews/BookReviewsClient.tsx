'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';
import WriteReviewModal from './WriteReviewModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Star, 
  BookOpen, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Book {
  id: number;
  title: string;
  author: string;
  cover_image_id: string | null;
  average_rating: number;
  review_count: number;
  isbn?: string;
  publication_year?: number;
  publisher?: string;
}

interface User {
  id: string;
  name: string;
  avatar_url?: string;
  role?: 'admin' | 'moderator' | 'member';
}

interface Group {
  id: string;
  name: string;
  settings?: {
    allow_anonymous_reviews?: boolean;
    require_moderation?: boolean;
    max_reviews_per_user?: number;
  };
}

interface BookReview {
  id: string;
  group_id: string | null;
  book_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at?: string;
  visibility: 'public' | 'private' | 'group_only';
  contains_spoilers?: boolean;
  books: Book;
  users: User;
  groups: Group | null;
  _analytics?: {
    helpful_votes: number;
    total_votes: number;
    report_count: number;
  };
}

interface Props {
  initialBookReviews: BookReview[];
  groupId: string;
  currentUser?: User;
  groupSettings?: Group['settings'];
}

// Loading skeleton component
const ReviewSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-16 h-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0 space-y-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-5 h-5 rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </CardContent>
  </Card>
);

export default function BookReviewsClient({ 
  initialBookReviews, 
  groupId, 
  currentUser,
  groupSettings 
}: Props) {
  const [bookReviews, setBookReviews] = useState<BookReview[]>(initialBookReviews);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReview, setSelectedReview] = useState<BookReview | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private' | 'group_only'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const supabase = supabaseClient;

  // Memoized filtered and sorted reviews
  const filteredReviews = useMemo(() => {
    let filtered = bookReviews;
    
    // Filter by visibility
    if (filterVisibility !== 'all') {
      filtered = filtered.filter(review => review.visibility === filterVisibility);
    }
    
    // Filter spoilers if user doesn't want to see them
    if (!showSpoilers) {
      filtered = filtered.filter(review => !review.contains_spoilers);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(review => 
        review.books.title.toLowerCase().includes(query) ||
        review.books.author.toLowerCase().includes(query) ||
        review.review_text.toLowerCase().includes(query) ||
        review.users.name.toLowerCase().includes(query)
      );
    }
    
    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return (b._analytics?.helpful_votes || 0) - (a._analytics?.helpful_votes || 0);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return filtered;
  }, [bookReviews, filterVisibility, searchQuery, sortBy, showSpoilers]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const total = bookReviews.length;
    const publicReviews = bookReviews.filter(r => r.visibility === 'public').length;
    const privateReviews = bookReviews.filter(r => r.visibility === 'private').length;
    const groupReviews = bookReviews.filter(r => r.visibility === 'group_only').length;
    const spoilerReviews = bookReviews.filter(r => r.contains_spoilers).length;
    const averageRating = total > 0 
      ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / total 
      : 0;
    
    return { 
      total, 
      public: publicReviews, 
      private: privateReviews, 
      group: groupReviews, 
      spoilers: spoilerReviews,
      averageRating 
    };
  }, [bookReviews]);

  // User permissions
  const userPermissions = useMemo(() => {
    if (!currentUser) return { canWrite: false, canModerate: false, canDelete: false };
    
    const isAdmin = currentUser.role === 'admin';
    const isModerator = currentUser.role === 'moderator';
    const isGroupMember = bookReviews.some(r => r.user_id === currentUser.id);
    
    return {
      canWrite: isAdmin || isModerator || isGroupMember,
      canModerate: isAdmin || isModerator,
      canDelete: isAdmin || isModerator,
      canFlag: true,
      canEditOwn: true
    };
  }, [currentUser, bookReviews]);

  // Load more reviews
  const loadMoreReviews = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('book_reviews')
        .select(`
          *,
          books (*),
          users (*),
          groups (*)
        `)
        .eq('group_id', groupId)
        .range((page - 1) * 20, page * 20 - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setBookReviews(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
        setHasMore(data.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
      setError('Failed to load more reviews');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, page, isLoading, hasMore]);

  // Refresh reviews
  const refreshReviews = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('book_reviews')
        .select(`
          *,
          books (*),
          users (*),
          groups (*)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setBookReviews(data || []);
      setPage(1);
      setHasMore((data?.length || 0) === 20);
    } catch (error) {
      console.error('Error refreshing reviews:', error);
      setError('Failed to refresh reviews');
    } finally {
      setIsRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('book_reviews_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_reviews',
          filter: `group_id=eq.${groupId}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setBookReviews(prev => [payload.new as BookReview, ...prev]);
            toast.success('New book review added!');
          } else if (payload.eventType === 'DELETE') {
            setBookReviews(prev => prev.filter(review => review.id !== payload.old.id));
            toast.success('Book review removed');
          } else if (payload.eventType === 'UPDATE') {
            setBookReviews(prev => 
              prev.map(review => 
                review.id === payload.new.id ? payload.new as BookReview : review
              )
            );
            toast.success('Book review updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const handleDeleteReview = useCallback(async (reviewId: string) => {
    if (!userPermissions.canDelete) {
      toast.error('You do not have permission to delete reviews');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('book_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setIsLoading(false);
    }
  }, [userPermissions.canDelete]);

  const handleVoteHelpful = useCallback(async (reviewId: string, isHelpful: boolean) => {
    // Implementation for helpful votes
    toast.success(`Marked review as ${isHelpful ? 'helpful' : 'not helpful'}`);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1" role="img" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">{rating} out of 5 stars</span>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <Card className="p-6">
        <CardContent className="text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign in to view book reviews</h3>
          <p className="text-gray-600">Please sign in to access the book reviews for this group.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <CardContent className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Reviews</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshReviews} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Analytics Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Review Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.total}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.public}</div>
                <div className="text-sm text-gray-600">Public</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{analytics.private}</div>
                <div className="text-sm text-gray-600">Private</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analytics.group}</div>
                <div className="text-sm text-gray-600">Group Only</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analytics.spoilers}</div>
                <div className="text-sm text-gray-600">Spoilers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analytics.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWriteModalOpen(true)}
              disabled={!userPermissions.canWrite}
            >
              Write Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshReviews}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="group_only">Group Only</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="date">Date</option>
              <option value="rating">Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Spoiler Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSpoilers(!showSpoilers)}
            className="flex items-center gap-2"
          >
            {showSpoilers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSpoilers ? 'Hide Spoilers' : 'Show Spoilers'}
          </Button>
          {analytics.spoilers > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {analytics.spoilers} reviews contain spoilers
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search reviews, books, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Reviews Grid/List */}
        <Suspense fallback={
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ReviewSkeleton key={i} />
            ))}
          </div>
        }>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredReviews.map((review) => (
              <Card key={review.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {review.books.cover_image_id && (
                        <img
                          src={`/api/images/${review.books.cover_image_id}`}
                          alt={`Cover of ${review.books.title}`}
                          className="w-16 h-20 object-cover rounded-lg shadow-xs"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate" title={review.books.title}>
                          {review.books.title}
                        </h3>
                        <p className="text-gray-600 text-sm truncate" title={review.books.author}>
                          by {review.books.author}
                        </p>
                        {review.books.publication_year && (
                          <p className="text-gray-500 text-xs">{review.books.publication_year}</p>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {userPermissions.canEditOwn && review.user_id === currentUser?.id && (
                          <DropdownMenuItem onClick={() => setSelectedReview(review)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        
                        {userPermissions.canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this review? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Rating and Visibility */}
                    <div className="flex items-center justify-between">
                      {renderStars(review.rating)}
                      <div className="flex gap-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {review.visibility}
                        </Badge>
                        {review.contains_spoilers && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Spoilers
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Review Content */}
                    <div className="space-y-2">
                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                        {review.review_text}
                      </p>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>by {review.users.name}</span>
                      </div>
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                    
                    {/* Helpful Votes */}
                    {review._analytics && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoteHelpful(review.id, true)}
                          className="h-6 px-2 text-xs"
                        >
                          👍 Helpful ({review._analytics.helpful_votes || 0})
                        </Button>
                        <span className="text-xs text-gray-500">
                          {review._analytics.total_votes || 0} votes
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Suspense>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <Button
              onClick={loadMoreReviews}
              disabled={isLoading}
              variant="outline"
              className="w-full max-w-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Reviews'
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredReviews.length === 0 && !isLoading && (
          <Card className="p-12">
            <CardContent className="text-center">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No reviews match "${searchQuery}"`
                  : 'Be the first to write a review for this group!'
                }
              </p>
              {userPermissions.canWrite && (
                <Button onClick={() => setIsWriteModalOpen(true)}>
                  Write First Review
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Write Review Modal */}
        <WriteReviewModal
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
          groupId={groupId}
        />
      </div>
    </TooltipProvider>
  );
} 