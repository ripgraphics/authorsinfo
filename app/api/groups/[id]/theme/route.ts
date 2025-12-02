import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: Get current theme settings
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('groups')
    .select('theme_mode, custom_theme')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update theme settings
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  
  // Verify user is an admin
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role_id, group_roles(name)')
    .eq('group_id', id)
    .eq('user_id', body.user_id)
    .single();

  const groupRole = Array.isArray(member?.group_roles) ? member.group_roles[0] : member?.group_roles
  if (memberError || !member || groupRole?.name !== 'Owner') {
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
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
} 