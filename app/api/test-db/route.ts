import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTING DATABASE CONNECTION')
    
    // Test 1: Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    console.log('✅ Supabase client created')
    
    // Test 2: Check if we can connect to the database
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    if (tablesError) {
      console.error('❌ Error querying tables:', tablesError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: tablesError.message,
        code: tablesError.code 
      }, { status: 500 })
    }
    
    console.log('✅ Database connection successful')
    console.log('📋 Available tables:', tables?.map(t => t.table_name))
    
    // Test 3: Check if posts table exists and has the right structure
    const { data: postsStructure, error: postsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'posts')
      .eq('table_schema', 'public')
    
    if (postsError) {
      console.error('❌ Error checking posts table structure:', postsError)
    } else {
      console.log('✅ Posts table structure:', postsStructure?.map(c => `${c.column_name} (${c.data_type})`))
    }
    
    // Test 4: Try to insert a test post
    const testPostData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      entity_type: 'user',
      entity_id: '00000000-0000-0000-0000-000000000000',
      content_type: 'text',
      content: { text: 'Test post content' },
      content_summary: 'Test post content',
      visibility: 'public',
      publish_status: 'published',
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      bookmark_count: 0,
      reaction_count: 0,
      engagement_score: 0,
      trending_score: 0,
      moderation_status: 'pending'
    }
    
    console.log('📝 Attempting to insert test post...')
    const { data: testPost, error: insertError } = await supabase
      .from('posts')
      .insert(testPostData)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Test post insertion failed:', insertError)
      return NextResponse.json({ 
        error: 'Test post insertion failed', 
        details: insertError.message,
        code: insertError.code,
        hint: 'This shows the exact error that would happen when creating a real post'
      }, { status: 500 })
    }
    
    console.log('✅ Test post created successfully:', testPost.id)
    
    // Clean up: Delete the test post
    await supabase
      .from('posts')
      .delete()
      .eq('id', testPost.id)
    
    console.log('🧹 Test post cleaned up')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and post creation test successful',
      available_tables: tables?.map(t => t.table_name),
      posts_structure: postsStructure?.map(c => `${c.column_name} (${c.data_type})`),
      test_post_created: true
    })
    
  } catch (error) {
    console.error('❌ Database test error:', error)
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
