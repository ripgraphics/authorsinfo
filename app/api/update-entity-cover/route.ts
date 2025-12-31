import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entityType, entityId, imageId } = body

    console.log('Updating entity cover:', { entityType, entityId, imageId })

    // Update entity profile - handle different table names and column names
    let tableName: string
    let updateColumn: string

    switch (entityType) {
      case 'author':
        tableName = 'authors'
        updateColumn = 'cover_image_id'
        break
      case 'publisher':
        tableName = 'publishers'
        updateColumn = 'cover_image_id'
        break
      case 'group':
        tableName = 'groups'
        updateColumn = 'cover_image_id'
        break
      case 'user':
        tableName = 'users'
        updateColumn = 'cover_image_id'
        break
      case 'event':
        tableName = 'events'
        updateColumn = 'cover_image_id'
        break
      case 'photo':
        tableName = 'photos'
        updateColumn = 'cover_image_id'
        break
      case 'book':
        tableName = 'books'
        updateColumn = 'cover_image_id'
        break
      default:
        tableName = 'books'
        updateColumn = 'cover_image_id'
    }

    if (!entityId) {
      return NextResponse.json({ error: 'Entity ID not found' }, { status: 400 })
    }

    console.log(
      `Updating ${tableName} table with ${updateColumn} = ${imageId} where id = ${entityId}`
    )

    // Use server-side Supabase client to avoid RLS issues
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from(tableName as any)
      .update({
        [updateColumn]: imageId,
      })
      .eq('id', entityId)
      .select('id, ' + updateColumn)

    if (updateError) {
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      return NextResponse.json(
        { error: `Failed to update ${entityType} profile: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('Update successful:', updateData)
    return NextResponse.json({ success: true, data: updateData })
  } catch (error) {
    console.error('Error updating entity cover:', error)
    return NextResponse.json({ error: 'Failed to update entity cover' }, { status: 500 })
  }
}
