import React, { useEffect, useState } from 'react'
import { EntityHoverCard } from './entity-hover-cards'
import { useBulkUserData } from '../hooks/useBulkUserData'

// Example feed component that efficiently fetches all user data upfront
export function FeedExample() {
  const [feedItems, setFeedItems] = useState<any[]>([])
  
  // Extract all user IDs from feed items (comments, posts, etc.)
  const userIds = feedItems.map(item => item.userId).filter(Boolean)
  
  // Use the bulk data hook to fetch all user data at once
  const { getUserStats, isUserDataLoaded } = useBulkUserData(userIds)

  // Example feed items with user data
  useEffect(() => {
    // Simulate fetching feed data
    const mockFeedItems = [
      { id: 1, userId: 'user-1', content: 'Great book!', userName: 'Alice' },
      { id: 2, userId: 'user-2', content: 'I agree!', userName: 'Bob' },
      { id: 3, userId: 'user-3', content: 'Interesting point', userName: 'Charlie' },
      // ... more feed items
    ]
    setFeedItems(mockFeedItems)
  }, [])

  return (
    <div className="feed-container">
      {feedItems.map((item) => {
        const userStats = getUserStats(item.userId)
        
        return (
          <div key={item.id} className="feed-item">
            <div className="feed-content">
              {item.content}
            </div>
            
            {/* Hover card with instant data - no API calls needed */}
            <EntityHoverCard
              type="user"
              entity={{
                id: item.userId,
                name: item.userName,
                avatar_url: `/api/avatar/${item.userId}`,
                created_at: new Date().toISOString()
              }}
              userStats={userStats} // Pass the pre-fetched user stats
            >
              <span className="user-name-link">{item.userName}</span>
            </EntityHoverCard>
          </div>
        )
      })}
    </div>
  )
}

// Usage in your actual feed:
/*
1. Extract all user IDs from your feed data
2. Pass them to useBulkUserData hook
3. Pass the userStats to each EntityHoverCard
4. All hover cards work instantly with pre-fetched data
*/
