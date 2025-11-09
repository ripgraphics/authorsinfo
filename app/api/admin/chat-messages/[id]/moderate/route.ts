import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PATCH /api/admin/chat-messages/[id]/moderate
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: messageId } = await params;
    const { is_hidden } = await request.json();
    const supabase = createClient();
    const { data: message, error } = await supabase
      .from('event_chat_messages')
      .update({ is_hidden, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: message, message: is_hidden ? 'Message hidden' : 'Message unhidden' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to moderate chat message' }, { status: 500 });
  }
} 