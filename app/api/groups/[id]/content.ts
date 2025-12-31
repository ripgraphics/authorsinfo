import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import {
  createGroupContent,
  updateGroupContent,
  deleteGroupContent,
} from '@/app/actions/groups/manage-content'

// GET: List all content items for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createRouteHandlerClientAsync()
    const { searchParams } = new URL(req.url)

    const contentType = searchParams.get('content_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('group_content')
      .select(
        `
        *,
        user:users(id, name, email),
        group:groups(id, name)
      `
      )
      .eq('group_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching content:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ content: data || [] })
  } catch (error) {
    console.error('Error in content GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new content item for a group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const result = await createGroupContent({
      groupId: id,
      contentType: body.content_type,
      title: body.title,
      content: body.content,
      contentHtml: body.content_html,
      isPinned: body.is_pinned,
      visibility: body.visibility,
      metadata: body.metadata,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error, warnings: result.warnings }, { status: 400 })
    }

    return NextResponse.json({ content: result.content }, { status: 201 })
  } catch (error) {
    console.error('Error in content POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update a content item
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    if (!body.content_id) {
      return NextResponse.json({ error: 'content_id is required' }, { status: 400 })
    }

    const result = await updateGroupContent({
      contentId: body.content_id,
      groupId: id,
      title: body.title,
      content: body.content,
      contentHtml: body.content_html,
      isPinned: body.is_pinned,
      isLocked: body.is_locked,
      visibility: body.visibility,
      metadata: body.metadata,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error, warnings: result.warnings }, { status: 400 })
    }

    return NextResponse.json({ content: result.content })
  } catch (error) {
    console.error('Error in content PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a content item
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const contentId = searchParams.get('content_id')

    if (!contentId) {
      return NextResponse.json({ error: 'content_id is required' }, { status: 400 })
    }

    const result = await deleteGroupContent({
      contentId,
      groupId: id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in content DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
