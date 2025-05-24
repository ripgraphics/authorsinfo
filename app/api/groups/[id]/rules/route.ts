import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: List all rules for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('group_rules')
      .select('*')
      .eq('group_id', groupId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching group rules:', error);
      return NextResponse.json({ error: 'Failed to fetch group rules' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in group rules API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new rule for a group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get the highest order_index
    const { data: existingRules } = await supabase
      .from('group_rules')
      .select('order_index')
      .eq('group_id', groupId)
      .order('order_index', { ascending: false })
      .limit(1);

    const newOrderIndex = existingRules && existingRules.length > 0 
      ? existingRules[0].order_index + 1 
      : 0;

    const { data, error } = await supabase
      .from('group_rules')
      .insert([
        {
          group_id: groupId,
          title: body.title,
          description: body.description,
          order_index: newOrderIndex
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating group rule:', error);
      return NextResponse.json({ error: 'Failed to create group rule' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in group rules API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.id || !body.title) {
      return NextResponse.json({ error: 'ID and title are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('group_rules')
      .update({
        title: body.title,
        description: body.description
      })
      .eq('id', body.id)
      .eq('group_id', groupId)
      .select()
      .single();

    if (error) {
      console.error('Error updating group rule:', error);
      return NextResponse.json({ error: 'Failed to update group rule' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in group rules API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('group_rules')
      .delete()
      .eq('id', ruleId)
      .eq('group_id', groupId);

    if (error) {
      console.error('Error deleting group rule:', error);
      return NextResponse.json({ error: 'Failed to delete group rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in group rules API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 