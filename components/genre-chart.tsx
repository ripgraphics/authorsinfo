'use client';

/**
 * GenreChart Component
 * Displays reading distribution by genre with bar chart and details
 */

import React, { useMemo } from 'react';
import { GenreStats } from '@/types/phase3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Star, Clock, User, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenreChartProps {
  data: GenreStats[];
  loading?: boolean;
  showTopAuthors?: boolean;
  maxGenres?: number;
  className?: string;
}

// Color palette for genres
const GENRE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export function GenreChart({
  data,
  loading = false,
  showTopAuthors = false,
  maxGenres = 10,
  className,
}: GenreChartProps) {
  // Sort and limit genres
  const sortedGenres = useMemo(() => {
    return [...data]
      .sort((a, b) => b.booksRead - a.booksRead)
      .slice(0, maxGenres);
  }, [data, maxGenres]);

  // Calculate totals
  const totals = useMemo(() => {
    return data.reduce(
      (acc, genre) => ({
        books: acc.books + genre.booksRead,
        pages: acc.pages + genre.pagesRead,
        minutes: acc.minutes + genre.totalMinutes,
      }),
      { books: 0, pages: 0, minutes: 0 }
    );
  }, [data]);

  // Get max values for percentage calculations
  const maxBooks = Math.max(...sortedGenres.map(g => g.booksRead), 1);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Genre Data</h3>
          <p className="text-muted-foreground text-sm">
            Start reading to see your genre distribution!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('grid gap-4 lg:grid-cols-2', className)}>
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Genre Distribution
          </CardTitle>
          <CardDescription>
            Books read by genre ({data.length} genres total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {sortedGenres.map((genre, index) => {
                const percentage = (genre.booksRead / maxBooks) * 100;
                const colorClass = GENRE_COLORS[index % GENRE_COLORS.length];
                
                return (
                  <div key={genre.genre} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize truncate flex-1">
                        {genre.genre}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="secondary" className="text-xs">
                          {genre.booksRead} books
                        </Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            colorClass
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {genre.pagesRead.toLocaleString()} pages
                      </span>
                    </div>
                    {(genre.avgRating ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {(genre.avgRating ?? 0).toFixed(1)} avg rating
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Genre Details */}
      <div className="space-y-6">
        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Reading Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Books
              </span>
              <span className="font-bold text-lg">{totals.books}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Pages
              </span>
              <span className="font-bold text-lg">{totals.pages.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Reading Time
              </span>
              <span className="font-bold text-lg">{Math.round(totals.minutes / 60)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Genres Explored
              </span>
              <span className="font-bold text-lg">{data.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-48 h-48 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulativePercent = 0;
                  return sortedGenres.slice(0, 6).map((genre, index) => {
                    const percent = (genre.booksRead / totals.books) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -cumulativePercent;
                    cumulativePercent += percent;
                    
                    const colors = [
                      'stroke-blue-500',
                      'stroke-green-500',
                      'stroke-purple-500',
                      'stroke-orange-500',
                      'stroke-pink-500',
                      'stroke-cyan-500',
                    ];
                    
                    return (
                      <circle
                        key={genre.genre}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        strokeWidth="20"
                        className={colors[index]}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totals.books}</p>
                  <p className="text-xs text-muted-foreground">Books</p>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {sortedGenres.slice(0, 6).map((genre, index) => {
                const colorBg = GENRE_COLORS[index % GENRE_COLORS.length];
                
                return (
                  <div key={genre.genre} className="flex items-center gap-2 text-xs">
                    <div className={cn('w-3 h-3 rounded-full', colorBg)} />
                    <span className="truncate capitalize">{genre.genre}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Authors per Genre */}
        {showTopAuthors && sortedGenres.some(g => (g.favoriteAuthors ?? []).length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Top Authors by Genre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4">
                  {sortedGenres
                    .filter(g => (g.favoriteAuthors ?? []).length > 0)
                    .slice(0, 5)
                    .map((genre) => (
                      <div key={genre.genre}>
                        <h4 className="text-sm font-medium capitalize mb-2">
                          {genre.genre}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {(genre.favoriteAuthors ?? []).slice(0, 3).map((author: string) => (
                            <Badge key={author} variant="outline" className="text-xs">
                              {author}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
