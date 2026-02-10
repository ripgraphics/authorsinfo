import { NextResponse } from 'next/server'

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

    // Query likes table and group by like_type to get counts for each reaction type
    const { data: reactionData, error } = await supabaseAdmin
      .from('likes')
      .select('like_type')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (error) {
      console.error('Error fetching reaction counts:', error)
      return NextResponse.json({ error: 'Failed to fetch reaction counts' }, { status: 500 })
    }

    // Count reactions by type
    const allReactionTypes = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry']
    const counts: Record<string, number> = {}
    
    // Initialize all types to 0
    allReactionTypes.forEach(type => {
      counts[type] = 0
    })

    // Count each reaction type from the data
    let totalReactions = 0
    if (reactionData) {
      reactionData.forEach((row: { like_type: string }) => {
        const reactionType = row.like_type || 'like'
        if (counts[reactionType] !== undefined) {
          counts[reactionType]++
        } else {
          counts[reactionType] = 1
        }
        totalReactions++
      })
    }

    return NextResponse.json({
      success: true,
      entity_id: entityId,
      entity_type: entityType,
      counts,
      total_reactions: totalReactions,
    })
  } catch (error) {
    console.error('Unexpected error in reaction counts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

