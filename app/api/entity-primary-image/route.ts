import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'

type PrimaryKind = 'avatar' | 'cover'

interface SetPrimaryImageBody {
  entityType: 'user'
  entityId: string
  imageId: string
  primaryKind: PrimaryKind
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_REGEX.test(value)
}

async function verifyUserOwnsImage(userId: string, imageId: string) {
  // Enterprise-safe guardrails: ensure the user can only set a primary image that is already
  // associated to them via albums or stored metadata. We do NOT rely on uploader_id since some
  // upload paths do not populate it consistently.
  //
  // Accept if:
  // - image is in any album owned by the user, OR
  // - image is linked via album_images.entity_id == userId, OR
  // - images.metadata contains entity_id == userId and entity_type == 'user'

  const { data: imageRow, error: imageError } = await (supabaseAdmin
    .from('images') as any)
    .select('id, url, metadata')
    .eq('id', imageId)
    .maybeSingle()

  if (imageError || !imageRow) {
    return { ok: false as const, error: 'Image not found' }
  }

  const meta = (imageRow as any).metadata as any
  const metaEntityId = meta?.entity_id
  const metaEntityType = meta?.entity_type
  const metadataMatch = metaEntityType === 'user' && metaEntityId === userId

  if (metadataMatch) {
    return { ok: true as const, imageUrl: (imageRow as any).url as string }
  }

  // Check album ownership via album_images -> photo_albums.owner_id
  const { data: albumImageRows, error: albumImagesError } = await (supabaseAdmin
    .from('album_images') as any)
    .select('album_id, entity_id')
    .eq('image_id', imageId)
    .limit(50)

  if (albumImagesError) {
    return { ok: false as const, error: 'Failed to verify image ownership' }
  }

  const directEntityMatch = (albumImageRows || []).some((r: any) => r?.entity_id === userId)
  if (directEntityMatch) {
    return { ok: true as const, imageUrl: (imageRow as any).url as string }
  }

  const albumIds = (albumImageRows || [])
    .map((r: any) => r?.album_id)
    .filter((id: any) => typeof id === 'string' && id.length > 0)

  if (albumIds.length === 0) {
    return { ok: false as const, error: 'Image is not associated with this user' }
  }

  const { data: ownedAlbum, error: ownedAlbumError } = await (supabaseAdmin
    .from('photo_albums') as any)
    .select('id')
    .in('id', albumIds)
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()

  if (ownedAlbumError) {
    return { ok: false as const, error: 'Failed to verify album ownership' }
  }

  if (!ownedAlbum) {
    return { ok: false as const, error: 'Image is not owned by this user' }
  }

  return { ok: true as const, imageUrl: (imageRow as any).url as string }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as SetPrimaryImageBody | null
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const { entityType, entityId, imageId, primaryKind } = body

    if (entityType !== 'user') {
      return NextResponse.json({ success: false, error: 'Unsupported entityType' }, { status: 400 })
    }

    if (!isUuid(entityId) || !isUuid(imageId)) {
      return NextResponse.json({ success: false, error: 'entityId and imageId must be UUIDs' }, { status: 400 })
    }

    // Strict auth: users can only update their own profile primary images
    if (authData.user.id !== entityId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (primaryKind !== 'avatar' && primaryKind !== 'cover') {
      return NextResponse.json({ success: false, error: 'Invalid primaryKind' }, { status: 400 })
    }

    const verify = await verifyUserOwnsImage(entityId, imageId)
    if (!verify.ok) {
      return NextResponse.json({ success: false, error: verify.error }, { status: 400 })
    }

    const columnName = primaryKind === 'avatar' ? 'avatar_image_id' : 'cover_image_id'

    // Ensure profile exists, then update the canonical pointer.
    const { error: upsertError } = await (supabaseAdmin
      .from('profiles') as any)
      .upsert(
        {
          user_id: entityId,
          [columnName]: imageId,
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      return NextResponse.json(
        { success: false, error: `Failed to update profile: ${upsertError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      entityType,
      entityId,
      imageId,
      primaryKind,
      imageUrl: verify.imageUrl,
    })
  } catch (error) {
    console.error('Error in POST /api/entity-primary-image:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


