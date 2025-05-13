import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all resources for a group
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_resources')
    .select('*')
    .eq('group_id', params.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Add a new resource to a group
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.type || !body.title || !body.url) return NextResponse.json({ error: 'Missing type, title, or url' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_resources')
    .insert([{ ...body, group_id: params.id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
} 