import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all posts for a discussion
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const discussionId = req.nextUrl.searchParams.get('discussion_id');
  
  if (!discussionId) {
    return NextResponse.json({ error: 'Missing discussion_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('book_discussion_posts')
    .select(`
      *,
      users (
        id,
        name
      )
    `)
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new post
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.discussion_id || !body.user_id || !body.content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify the discussion belongs to the group
  const { data: discussion, error: discussionError } = await supabase
    .from('book_discussions')
    .select('id')
    .eq('id', body.discussion_id)
    .eq('group_id', id)
    .single();

  if (discussionError || !discussion) {
    return NextResponse.json({ error: 'Discussion not found in group' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('book_discussion_posts')
    .insert([{ 
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Update participant's last_read_at
  await supabase
    .from('book_discussion_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('discussion_id', body.discussion_id)
    .eq('user_id', body.user_id);

  return NextResponse.json(data);
}

// PATCH: Update a post
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.id) {
    return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
  }

  // Verify the post belongs to a discussion in the group
  const { data: post, error: postError } = await supabase
    .from('book_discussion_posts')
    .select('discussion_id')
    .eq('id', body.id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const { data: discussion, error: discussionError } = await supabase
    .from('book_discussions')
    .select('id')
    .eq('id', post.discussion_id)
    .eq('group_id', id)
    .single();

  if (discussionError || !discussion) {
    return NextResponse.json({ error: 'Discussion not found in group' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('book_discussion_posts')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove a post
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const url = new URL(req.url);
  const postId = url.searchParams.get('post_id');
  
  if (!postId) {
    return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
  }

  // Verify the post belongs to a discussion in the group
  const { data: post, error: postError } = await supabase
    .from('book_discussion_posts')
    .select('discussion_id')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const { data: discussion, error: discussionError } = await supabase
    .from('book_discussions')
    .select('id')
    .eq('id', post.discussion_id)
    .eq('group_id', id)
    .single();

  if (discussionError || !discussion) {
    return NextResponse.json({ error: 'Discussion not found in group' }, { status: 404 });
  }

  const { error } = await supabase
    .from('book_discussion_posts')
    .delete()
    .eq('id', postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 