import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient();

    // Fetch the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        *,
        group_image:images!group_image_id(url),
        cover_image:images!cover_image_id(url)
      `)
      .eq('id', id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: groupError?.message || 'Group not found' }, { status: 404 });
    }

    // Fetch the creator user
    const { data: creator, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role_id, created_at, updated_at')
      .eq('id', group.created_by)
      .single();

    // Fetch creator's membership information
    const { data: creatorMembership, error: membershipError } = await supabase
      .from('group_members')
      .select('joined_at')
      .eq('group_id', id)
      .eq('user_id', group.created_by)
      .single();

    // Merge and return
    return NextResponse.json({
      ...group,
      group_image_url: group.group_image?.url,
      cover_image_url: group.cover_image?.url || group.cover_image_url,
      creatorName: creator?.name || '',
      creatorEmail: creator?.email || '',
      creatorRoleId: creator?.role_id || '',
      creatorCreatedAt: creator?.created_at || '',
      creatorUpdatedAt: creator?.updated_at || '',
      creatorJoinedAt: creatorMembership?.joined_at || ''
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient();
    const body = await request.json();
    const { data, error } = await supabase
      .from('groups')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 