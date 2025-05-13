import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all group reading challenges (optionally filter by year/active)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const url = new URL(req.url);
  const year = url.searchParams.get('year');
  let query = supabase
    .from('group_reading_challenges')
    .select('*')
    .eq('group_id', params.id)
    .order('created_at', { ascending: false });
  if (year) query = query.eq('year', year);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new group reading challenge
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.title || !body.target_books || !body.created_by) {
    return NextResponse.json({ error: 'Missing title, target_books, or created_by' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('group_reading_challenges')
    .insert([{ ...body, group_id: params.id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update a challenge
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing challenge id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_reading_challenges')
    .update(body)
    .eq('id', body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Delete a challenge (admin/mod only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const url = new URL(req.url);
  const challengeId = url.searchParams.get('id');
  const userId = url.searchParams.get('user_id');
  if (!challengeId || !userId) return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 });
  // Fetch the challenge
  const { data: challenge, error: fetchError } = await supabase
    .from('group_reading_challenges')
    .select('id, created_by')
    .eq('id', challengeId)
    .single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });
  // Mock admin check: allow if user is creator or user_id === 'admin'
  if (challenge.created_by !== userId && userId !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { error } = await supabase
    .from('group_reading_challenges')
    .delete()
    .eq('id', challengeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// --- Progress ---
// GET: List all user progress for a challenge
export async function GET_progress(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const challengeId = new URL(req.url).searchParams.get('challenge_id');
  if (!challengeId) return NextResponse.json({ error: 'Missing challenge_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_reading_challenge_progress')
    .select('*')
    .eq('challenge_id', challengeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
// POST: Update user progress for a challenge
export async function POST_progress(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.challenge_id || !body.user_id) return NextResponse.json({ error: 'Missing challenge_id or user_id' }, { status: 400 });
  // Upsert progress
  const { data, error } = await supabase
    .from('group_reading_challenge_progress')
    .upsert([{ ...body, group_id: params.id }], { onConflict: ['challenge_id', 'user_id'] })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
} 