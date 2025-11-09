import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PATCH /api/admin/comments/[id]/moderate
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: commentId } = await params;
    const { is_hidden } = await request.json();
    const supabase = createClient();
    const { data: comment, error } = await supabase
      .from('event_comments')
      .update({ is_hidden, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: comment, message: is_hidden ? 'Comment hidden' : 'Comment unhidden' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to moderate comment' }, { status: 500 });
  }
} 