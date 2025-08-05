import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enterpriseActivityGenerator } from '@/lib/enterprise-activity-system'

export async function POST(request: Request) {
  try {
    // Get a real user ID from the database for activity generation
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
    
    if (usersError || !users || users.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No users found in database. Please ensure users exist before generating activities.' 
        },
        { status: 400 }
      )
    }
    
    const adminUserId = users[0].id
    console.log(`Enterprise activity generation using user ID: ${adminUserId}`)
    
    // Get request body
    const body = await request.json()
    const { 
      type, 
      entityIds, 
      options = {} 
    } = body
    
    // Validate request
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Activity type is required' },
        { status: 400 }
      )
    }

    let result: any = { success: false, message: 'No action taken' }
    
    // Generate activities based on type with enterprise features
    switch (type) {
      case 'all':
        // Generate all activities for all entity types
        const allResult = await enterpriseActivityGenerator.generateAllActivities(
          adminUserId,
          {
            skipDuplicates: options.skipDuplicates ?? true,
            includeMetadata: options.includeMetadata ?? true,
            batchSize: options.batchSize ?? 100,
            entityTypes: options.entityTypes ?? ['authors', 'books', 'publishers', 'users', 'groups']
          }
        )
        
        result = {
          success: allResult.success,
          message: 'Generated activities for all entity types',
          stats: allResult.total,
          breakdown: allResult.breakdown
        }
        break
        
      case 'authors':
        if (entityIds && entityIds.length > 0) {
          // Generate activities for specific authors
          const authorResult = await enterpriseActivityGenerator.generateAuthorActivities(
            entityIds,
            adminUserId,
            {
              skipDuplicates: options.skipDuplicates ?? true,
              includeMetadata: options.includeMetadata ?? true,
              batchSize: options.batchSize ?? 100
            }
          )
          
          result = {
            success: authorResult.success,
            message: `Generated activities for ${authorResult.processed} authors`,
            stats: {
              processed: authorResult.processed,
              inserted: authorResult.inserted,
              duplicates: authorResult.duplicates,
              errors: authorResult.errors
            }
          }
        } else {
          // Get all author IDs first
          const { data: allAuthors, error: authorsError } = await supabaseAdmin
            .from('authors')
            .select('id')
          
          if (authorsError) {
            return NextResponse.json(
              { success: false, error: `Failed to fetch authors: ${authorsError.message}` },
              { status: 500 }
            )
          }
          
          const authorIds = allAuthors?.map(a => a.id) || []
          
          if (authorIds.length === 0) {
            return NextResponse.json(
              { success: false, error: 'No authors found in database' },
              { status: 400 }
            )
          }
          
          // Generate activities for all authors
          const authorResult = await enterpriseActivityGenerator.generateAuthorActivities(
            authorIds,
            adminUserId,
            {
              skipDuplicates: options.skipDuplicates ?? true,
              includeMetadata: options.includeMetadata ?? true,
              batchSize: options.batchSize ?? 100
            }
          )
          
          result = {
            success: authorResult.success,
            message: `Generated activities for ${authorResult.processed} authors`,
            stats: {
              processed: authorResult.processed,
              inserted: authorResult.inserted,
              duplicates: authorResult.duplicates,
              errors: authorResult.errors
            }
          }
        }
        break
        
      case 'books':
        if (entityIds && entityIds.length > 0) {
          // Generate activities for specific books
          const bookResult = await enterpriseActivityGenerator.generateBookActivities(
            entityIds,
            adminUserId,
            {
              skipDuplicates: options.skipDuplicates ?? true,
              includeMetadata: options.includeMetadata ?? true,
              batchSize: options.batchSize ?? 100
            }
          )
          
          result = {
            success: bookResult.success,
            message: `Generated activities for ${bookResult.processed} books`,
            stats: {
              processed: bookResult.processed,
              inserted: bookResult.inserted,
              duplicates: bookResult.duplicates,
              errors: bookResult.errors
            }
          }
        } else {
          // Get all book IDs first
          const { data: allBooks, error: booksError } = await supabaseAdmin
            .from('books')
            .select('id')
          
          if (booksError) {
            return NextResponse.json(
              { success: false, error: `Failed to fetch books: ${booksError.message}` },
              { status: 500 }
            )
          }
          
          const bookIds = allBooks?.map(b => b.id) || []
          
          if (bookIds.length === 0) {
            return NextResponse.json(
              { success: false, error: 'No books found in database' },
              { status: 400 }
            )
          }
          
          // Generate activities for all books
          const bookResult = await enterpriseActivityGenerator.generateBookActivities(
            bookIds,
            adminUserId,
            {
              skipDuplicates: options.skipDuplicates ?? true,
              includeMetadata: options.includeMetadata ?? true,
              batchSize: options.batchSize ?? 100
            }
          )
          
          result = {
            success: bookResult.success,
            message: `Generated activities for ${bookResult.processed} books`,
            stats: {
              processed: bookResult.processed,
              inserted: bookResult.inserted,
              duplicates: bookResult.duplicates,
              errors: bookResult.errors
            }
          }
        }
        break
        
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported activity type: ${type}` },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Enterprise activity generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Get activity statistics
    const stats = await enterpriseActivityGenerator.getActivityStats()
    
    return NextResponse.json({
      success: true,
      stats
    })
    
  } catch (error) {
    console.error('Error getting activity stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get activity statistics' 
      },
      { status: 500 }
    )
  }
} 