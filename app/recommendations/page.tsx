'use client';

/**
 * Recommendations Page
 * Personalized book recommendations dashboard
 * 
 * Features:
 * - Personalized recommendations based on reading history
 * - Trending books section
 * - Genre-based recommendations
 * - Refresh recommendations action
 * - Responsive grid layout
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Flame,
  TrendingUp,
  Filter,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecommendationCard } from '@/components/recommendation-card';
import { RecommendationCarousel } from '@/components/recommendation-carousel';
import { TrendingSection } from '@/components/trending-section';
import { useRecommendationStore } from '@/lib/stores/recommendation-store';
import type { Recommendation, FeedbackType, TrendingBook } from '@/types/phase3';

export default function RecommendationsPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const recommendations = useRecommendationStore(state => state.recommendations);
  const isLoading = useRecommendationStore(state => state.isLoadingRecommendations);
  const error = useRecommendationStore(state => state.recommendationsError);
  const fetchRecommendations = useRecommendationStore(state => state.fetchRecommendations);
  const submitFeedback = useRecommendationStore(state => state.submitFeedback);
  const dismissRecommendation = useRecommendationStore(state => state.dismissRecommendation);

  useEffect(() => {
    fetchRecommendations({ limit: 30 });
  }, [fetchRecommendations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/recommendations', { method: 'POST' });
      await fetchRecommendations({ limit: 30 });
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFeedback = async (bookId: string, feedbackType: FeedbackType) => {
    try {
      await submitFeedback({ bookId, feedbackType });
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const handleDismiss = (recommendationId: string) => {
    dismissRecommendation(recommendationId);
  };

  const handleRecommendationClick = (rec: Recommendation) => {
    router.push(`/books/${rec.bookId}`);
  };

  const handleTrendingClick = (book: TrendingBook) => {
    router.push(`/books/${book.bookId}`);
  };

  // Group recommendations by reason type
  const genreRecommendations = recommendations.filter(r => r.reasonType === 'genre_match');
  const authorRecommendations = recommendations.filter(r => r.reasonType === 'author_match');
  const highlyRatedRecommendations = recommendations.filter(r => r.reasonType === 'highly_rated');

  // Get unique genres from recommendations
  const uniqueGenres = [...new Set(
    recommendations
      .map(r => r.book.genre)
      .filter(Boolean)
  )].slice(0, 5);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Recommendations
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalized book suggestions based on your reading history
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Recommendations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="gap-1">
                <BookOpen className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="genres" className="gap-1">
                <Filter className="h-4 w-4" />
                By Genre
              </TabsTrigger>
              <TabsTrigger value="authors" className="gap-1">
                <Heart className="h-4 w-4" />
                By Author
              </TabsTrigger>
              <TabsTrigger value="rated" className="gap-1">
                <Star className="h-4 w-4" />
                Top Rated
              </TabsTrigger>
            </TabsList>

            {/* All recommendations */}
            <TabsContent value="all" className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                      <Skeleton className="h-4 w-full mt-2" />
                      <Skeleton className="h-3 w-3/4 mt-1" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={handleRefresh} className="mt-4">
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : recommendations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Start reading and rating books to get personalized recommendations!
                    </p>
                    <Button 
                      variant="default" 
                      onClick={() => router.push('/books')}
                      className="mt-4"
                    >
                      Browse Books
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      variant="default"
                      showReason
                      onClick={handleRecommendationClick}
                      onFeedback={handleFeedback}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Genre recommendations */}
            <TabsContent value="genres" className="space-y-6">
              {uniqueGenres.map((genre) => {
                const genreRecs = recommendations.filter(r => r.book.genre === genre);
                if (genreRecs.length === 0) return null;
                
                return (
                  <RecommendationCarousel
                    key={genre}
                    title={genre as string}
                    recommendations={genreRecs}
                    onItemClick={handleRecommendationClick}
                    onFeedback={handleFeedback}
                  />
                );
              })}
              
              {genreRecommendations.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Read more books to get genre-based recommendations
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Author recommendations */}
            <TabsContent value="authors" className="space-y-6">
              {authorRecommendations.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    More books from authors you&apos;ve enjoyed
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {authorRecommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        variant="default"
                        showReason
                        onClick={handleRecommendationClick}
                        onFeedback={handleFeedback}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Read more books to discover similar authors
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Top rated recommendations */}
            <TabsContent value="rated" className="space-y-6">
              {highlyRatedRecommendations.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Highly rated books the community loves
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {highlyRatedRecommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        variant="default"
                        showReason
                        showScore
                        onClick={handleRecommendationClick}
                        onFeedback={handleFeedback}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No top-rated recommendations at the moment
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Trending & Stats */}
        <div className="space-y-6">
          {/* Trending books */}
          <TrendingSection
            period="weekly"
            limit={10}
            showPeriodSelector
            onBookClick={handleTrendingClick}
          />

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Your Reading Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {recommendations.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recommendations
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">
                    {uniqueGenres.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Genres Matched
                  </div>
                </div>
              </div>

              {/* Top genres */}
              {uniqueGenres.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Your top genres:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueGenres.slice(0, 3).map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Improve Your Recommendations
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Rate books you&apos;ve read to refine suggestions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use the feedback buttons on recommendations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Add more books to your reading list
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
