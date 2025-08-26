import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

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
    
    // Get reaction counts grouped by reaction type
    const { data: reactionCounts, error } = await supabaseAdmin
      .from('engagement_likes')
      .select('reaction_type, count')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .select('reaction_type')
    
    if (error) {
      console.error('Error fetching reaction counts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reaction counts' },
        { status: 500 }
      )
    }
    
    // Count reactions by type
    const counts = reactionCounts.reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Ensure all reaction types are represented
    const allReactionTypes = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry']
    const completeCounts = allReactionTypes.reduce((acc, type) => {
      acc[type] = counts[type] || 0
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      entity_id: entityId,
      entity_type: entityType,
      counts: completeCounts,
      total_reactions: Object.values(completeCounts).reduce((sum, count) => sum + count, 0)
    })
    
  } catch (error) {
    console.error('Unexpected error in reaction counts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
