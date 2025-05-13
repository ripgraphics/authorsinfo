import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: Get current theme settings
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('groups')
    .select('theme_mode, custom_theme')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update theme settings
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  
  // Verify user is an admin
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', params.id)
    .eq('user_id', body.user_id)
    .single();

  if (memberError || !member || member.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Update theme settings
  const { data, error } = await supabase
    .from('groups')
    .update({
      theme_mode: body.theme_mode,
      custom_theme: body.custom_theme,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
} 