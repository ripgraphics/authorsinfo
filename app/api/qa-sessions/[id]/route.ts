import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/qa-sessions/[id]
 * Get a specific Q&A session with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = createClient();
    const { id } = params;

    const { data: session, error } = await supabase
      .from('qa_sessions')
      .select(`
        *,
        host:host_id(id, full_name, avatar_url),
        author:author_id(id, name, photo_url, bio),
        book:book_id(id, title, cover_url, description)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API] Error fetching Q&A session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Q&A session not found' }, { status: 404 });
    }

    // Get question count
    const { count: questionCount } = await supabase
      .from('qa_questions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id);

    return NextResponse.json({
      data: {
        ...session,
        questionCount: questionCount || 0,
      },
    });
  } catch (error: any) {
    console.error('[API] Error fetching Q&A session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Q&A session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/qa-sessions/[id]
 * Update a Q&A session (host only)
 * Body: UpdateQASessionInput
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if user is the host
    const { data: session } = await supabase
      .from('qa_sessions')
      .select('host_id')
      .eq('id', id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Q&A session not found' }, { status: 404 });
    }

    if (session.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can update this session' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    const allowedFields = [
      'title',
      'description',
      'session_type',
      'scheduled_start',
      'scheduled_end',
      'status',
      'actual_start',
      'actual_end',
      'max_questions',
      'is_public',
      'requires_approval',
      'allow_anonymous',
    ];

    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key) && body[key] !== undefined) {
        updateData[key] = body[key];
      }
    });

    // Validate dates if provided
    if (updateData.scheduled_start && updateData.scheduled_end) {
      const startDate = new Date(updateData.scheduled_start);
      const endDate = new Date(updateData.scheduled_end);
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'scheduled_end must be after scheduled_start' },
          { status: 400 }
        );
      }
    }

    // Update the session
    const { data: updatedSession, error } = await supabase
      .from('qa_sessions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        host:host_id(id, full_name, avatar_url),
        author:author_id(id, name, photo_url),
        book:book_id(id, title, cover_url)
      `)
      .single();

    if (error) {
      console.error('[API] Error updating Q&A session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedSession,
      message: 'Q&A session updated successfully',
    });
  } catch (error: any) {
    console.error('[API] Error updating Q&A session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Q&A session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qa-sessions/[id]
 * Delete a Q&A session (host only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    // Check if user is the host
    const { data: session } = await supabase
      .from('qa_sessions')
      .select('host_id')
      .eq('id', id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Q&A session not found' }, { status: 404 });
    }

    if (session.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can delete this session' },
        { status: 403 }
      );
    }

    // Delete the session (cascade will handle questions and answers)
    const { error } = await supabase
      .from('qa_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting Q&A session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Q&A session deleted successfully',
    });
  } catch (error: any) {
    console.error('[API] Error deleting Q&A session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete Q&A session' },
      { status: 500 }
    );
  }
}
