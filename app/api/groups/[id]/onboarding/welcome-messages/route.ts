import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all welcome messages for a group
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('group_welcome_messages')
    .select(`
      *,
      group_roles (
        id,
        name
      )
    `)
    .eq('group_id', params.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new welcome message
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  
  // Verify user is an admin
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role_id, group_roles(name)')
    .eq('group_id', params.id)
    .eq('user_id', body.user_id)
    .single();

  if (memberError || !member || member.group_roles?.name !== 'Owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Create welcome message
  const { data, error } = await supabase
    .from('group_welcome_messages')
    .insert({
      group_id: params.id,
      role_id: body.role_id,
      message: body.message
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update a welcome message
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  
  // Verify user is an admin
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role_id, group_roles(name)')
    .eq('group_id', params.id)
    .eq('user_id', body.user_id)
    .single();

  if (memberError || !member || member.group_roles?.name !== 'Owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Update welcome message
  const { data, error } = await supabase
    .from('group_welcome_messages')
    .update({
      role_id: body.role_id,
      message: body.message
    })
    .eq('id', body.message_id)
    .eq('group_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove a welcome message
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const messageId = req.nextUrl.searchParams.get('message_id');
  
  if (!messageId) {
    return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });
  }

  // Verify user is an admin
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role_id, group_roles(name)')
    .eq('group_id', params.id)
    .eq('user_id', userId)
    .single();

  if (memberError || !member || member.group_roles?.name !== 'Owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Delete welcome message
  const { error } = await supabase
    .from('group_welcome_messages')
    .delete()
    .eq('id', messageId)
    .eq('group_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 