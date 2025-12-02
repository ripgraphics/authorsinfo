import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entity_id')
    const entityType = searchParams.get('entity_type')
    
    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'Missing required parameters: entity_id, entity_type' },
        { status: 400 }
      )
    }
    
    // Use likes table for all entity types (activity_likes doesn't exist)
    const { count, error } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
    
    if (error) {
      console.error('Error fetching like count:', error)
      return NextResponse.json(
        { error: 'Failed to fetch like count' },
        { status: 500 }
      )
    }
    
    // Return counts with all reaction types set to 0 except 'like'
    // Note: The likes table doesn't support reaction types, so only 'like' is available
    const allReactionTypes = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry']
    const completeCounts = allReactionTypes.reduce((acc, type) => {
      acc[type] = type === 'like' ? (count || 0) : 0
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      entity_id: entityId,
      entity_type: entityType,
      counts: completeCounts,
      total_reactions: count || 0
    })
    
  } catch (error) {
    console.error('Unexpected error in reaction counts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
