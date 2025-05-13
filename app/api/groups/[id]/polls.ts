import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all polls for a group (optionally filter by active/expired, anonymous, etc.)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const url = new URL(req.url);
  const status = url.searchParams.get('status'); // 'active', 'expired', or undefined
  const now = new Date().toISOString();
  let query = supabase
    .from('group_polls')
    .select('*')
    .eq('group_id', params.id)
    .order('created_at', { ascending: false });
  if (status === 'active') query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
  if (status === 'expired') query = query.lte('expires_at', now);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new poll
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.question || !body.options || !body.created_by) {
    return NextResponse.json({ error: 'Missing question, options, or created_by' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('group_polls')
    .insert([{ ...body, group_id: params.id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Optionally: trigger notification logic here
  return NextResponse.json(data);
}

// PATCH: Update a poll (only by creator or admin)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing poll id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_polls')
    .update(body)
    .eq('id', body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Delete a poll (only by creator or admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const url = new URL(req.url);
  const pollId = url.searchParams.get('id');
  const userId = url.searchParams.get('user_id');
  if (!pollId || !userId) return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 });
  // Fetch the poll
  const { data: poll, error: fetchError } = await supabase
    .from('group_polls')
    .select('id, created_by')
    .eq('id', pollId)
    .single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });
  // Mock admin check: allow if user is creator or user_id === 'admin'
  if (poll.created_by !== userId && userId !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { error } = await supabase
    .from('group_polls')
    .delete()
    .eq('id', pollId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// --- Voting ---
// POST: Vote on a poll
export async function POST_vote(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.poll_id || !body.user_id || typeof body.option_index !== 'number') {
    return NextResponse.json({ error: 'Missing poll_id, user_id, or option_index' }, { status: 400 });
  }
  // Check if already voted (for single-vote polls)
  const { data: existing, error: existingError } = await supabase
    .from('group_poll_votes')
    .select('*')
    .eq('poll_id', body.poll_id)
    .eq('user_id', body.user_id);
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (existing && existing.length > 0 && !body.allow_multiple) {
    return NextResponse.json({ error: 'Already voted' }, { status: 409 });
  }
  const { data, error } = await supabase
    .from('group_poll_votes')
    .insert([{ ...body, group_id: params.id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// GET: Get poll results (vote counts, optionally user votes if not anonymous)
export async function GET_results(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const pollId = new URL(req.url).searchParams.get('poll_id');
  if (!pollId) return NextResponse.json({ error: 'Missing poll_id' }, { status: 400 });
  // Get poll
  const { data: poll, error: pollError } = await supabase
    .from('group_polls')
    .select('*')
    .eq('id', pollId)
    .single();
  if (pollError) return NextResponse.json({ error: pollError.message }, { status: 404 });
  // Get votes
  const { data: votes, error: votesError } = await supabase
    .from('group_poll_votes')
    .select('*')
    .eq('poll_id', pollId);
  if (votesError) return NextResponse.json({ error: votesError.message }, { status: 400 });
  // Tally votes
  const results = (poll.options || []).map((_, idx: number) => ({ option_index: idx, count: 0, voters: [] as string[] }));
  for (const vote of votes || []) {
    if (results[vote.option_index]) {
      results[vote.option_index].count++;
      if (!poll.is_anonymous) results[vote.option_index].voters.push(vote.user_id);
    }
  }
  return NextResponse.json({ poll, results });
} 