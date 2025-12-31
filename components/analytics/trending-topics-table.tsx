'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface TrendingTopic {
  id: string;
  topic: string;
  category: string | null;
  trending_score: number;
  post_count: number;
  engagement_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  book: 'bg-blue-100 text-blue-900',
  author: 'bg-purple-100 text-purple-900',
  genre: 'bg-green-100 text-green-900',
  hashtag: 'bg-orange-100 text-orange-900',
  event: 'bg-red-100 text-red-900',
};

export default function TrendingTopicsTable() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrendingTopics() {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/trending-topics?limit=15');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch trending topics');
        }
        const data = await response.json();
        setTopics(data.trending_topics || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingTopics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading trending topics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (topics.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No trending topics have been recorded yet.</AlertDescription>
      </Alert>
    );
  }

  // Calculate trend direction for each topic
  const topicsWithTrend = topics.map((topic) => {
    const trendScore = topic.trending_score || 0;
    const engagementRate = topic.post_count > 0 
      ? (topic.engagement_count / topic.post_count) * 100 
      : 0;
    
    const trendDirection =
      trendScore > 50 ? 'up' : trendScore < 30 ? 'down' : 'stable';

    return {
      ...topic,
      trendDirection,
      engagementRate: Math.round(engagementRate),
    };
  });

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Trending Topics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Topic</th>
              <th className="px-6 py-3 text-left font-medium">Category</th>
              <th className="px-6 py-3 text-right font-medium">Trending Score</th>
              <th className="px-6 py-3 text-right font-medium">Posts</th>
              <th className="px-6 py-3 text-right font-medium">Engagement</th>
              <th className="px-6 py-3 text-center font-medium">Trend</th>
              <th className="px-6 py-3 text-left font-medium">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {topicsWithTrend.map((topic, index) => (
              <tr key={topic.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-5">#{index + 1}</span>
                    {topic.topic}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {topic.category ? (
                    <Badge className={CATEGORY_COLORS[topic.category] || 'bg-gray-100 text-gray-900'}>
                      {topic.category}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-lg">{topic.trending_score.toFixed(1)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  {topic.post_count.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{topic.engagement_count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">
                      ({topic.engagementRate}%)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {topic.trendDirection === 'up' ? (
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-semibold">Up</span>
                    </div>
                  ) : topic.trendDirection === 'down' ? (
                    <div className="flex items-center justify-center gap-1 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-xs font-semibold">Down</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Stable</span>
                  )}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(topic.last_activity_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
