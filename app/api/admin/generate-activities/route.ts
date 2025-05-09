import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  generateAllAuthorActivities, 
  generateAllBookActivities,
  generateAuthorActivities,
  generateBookActivities,
  generatePublisherActivities,
  generateAllPublisherActivities,
  generateUserProfileActivities,
  generateAllUserProfileActivities,
  generateGroupActivities,
  generateAllGroupActivities,
  generateAllActivities
} from '@/lib/activity-generator'

export async function POST(request: Request) {
  try {
    // Use a consistent admin user ID for all activity generation
    // This is a temporary bypass of authentication
    const adminUserId = '00000000-0000-0000-0000-000000000000'
    
    // Get request body to determine what to generate
    const body = await request.json()
    const { type, id } = body
    
    let result = { success: false, message: 'No action taken', stats: {} }
    
    // Generate activities based on type
    switch (type) {
      case 'all':
        // Generate all activities for all entity types
        const allResult = await generateAllActivities(adminUserId)
        
        result = {
          success: allResult.success,
          message: 'Generated activities for all entity types',
          stats: allResult.counts
        }
        break
        
      case 'author':
        if (id) {
          // Generate activities for a specific author
          const success = await generateAuthorActivities(id, adminUserId)
          result = {
            success,
            message: success ? `Generated activities for author ${id}` : `Failed to generate activities for author ${id}`,
            stats: { processed: success ? 1 : 0 }
          }
        } else {
          // Generate activities for all authors
          const authorResult = await generateAllAuthorActivities(adminUserId)
          result = {
            success: authorResult.success,
            message: 'Generated activities for all authors',
            stats: { authors: authorResult.count }
          }
        }
        break
        
      case 'book':
        if (id) {
          // Generate activities for a specific book
          const success = await generateBookActivities(id, adminUserId)
          result = {
            success,
            message: success ? `Generated activities for book ${id}` : `Failed to generate activities for book ${id}`,
            stats: { processed: success ? 1 : 0 }
          }
        } else {
          // Generate activities for all books
          const bookResult = await generateAllBookActivities(adminUserId)
          result = {
            success: bookResult.success,
            message: 'Generated activities for all books',
            stats: { books: bookResult.count }
          }
        }
        break
        
      case 'publisher':
        if (id) {
          // Generate activities for a specific publisher
          const success = await generatePublisherActivities(id, adminUserId)
          result = {
            success,
            message: success ? `Generated activities for publisher ${id}` : `Failed to generate activities for publisher ${id}`,
            stats: { processed: success ? 1 : 0 }
          }
        } else {
          // Generate activities for all publishers
          const publisherResult = await generateAllPublisherActivities(adminUserId)
          result = {
            success: publisherResult.success,
            message: 'Generated activities for all publishers',
            stats: { publishers: publisherResult.count }
          }
        }
        break
        
      case 'user':
        if (id) {
          // Generate activities for a specific user profile
          const success = await generateUserProfileActivities(id, adminUserId)
          result = {
            success,
            message: success ? `Generated activities for user profile ${id}` : `Failed to generate activities for user profile ${id}`,
            stats: { processed: success ? 1 : 0 }
          }
        } else {
          // Generate activities for all user profiles
          const userResult = await generateAllUserProfileActivities(adminUserId)
          result = {
            success: userResult.success,
            message: 'Generated activities for all user profiles',
            stats: { users: userResult.count }
          }
        }
        break
        
      case 'group':
        if (id) {
          // Generate activities for a specific group
          const success = await generateGroupActivities(id, adminUserId)
          result = {
            success,
            message: success ? `Generated activities for group ${id}` : `Failed to generate activities for group ${id}`,
            stats: { processed: success ? 1 : 0 }
          }
        } else {
          // Generate activities for all groups
          const groupResult = await generateAllGroupActivities(adminUserId)
          result = {
            success: groupResult.success,
            message: 'Generated activities for all groups',
            stats: { groups: groupResult.count }
          }
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use "all", "author", "book", "publisher", "user", or "group"' },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating activities:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    )
  }
} 