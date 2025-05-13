import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all members and their roles for a group
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_members')
    .select('*, user:users(id, name, email), role:group_roles(id, name, description, permissions)')
    .eq('group_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Add a member to a group
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  const { user_id, role_id, status } = body;
  const { data, error } = await supabase
    .from('group_members')
    .insert([{ group_id: params.id, user_id, role_id, status: status || 'active' }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update a member's role or status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  const { user_id, role_id, status } = body;
  const { data, error } = await supabase
    .from('group_members')
    .update({ role_id, status })
    .eq('group_id', params.id)
    .eq('user_id', user_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove a member from a group
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  const { user_id } = body;
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', params.id)
    .eq('user_id', user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 