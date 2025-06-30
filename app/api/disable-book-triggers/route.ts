import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // First, let's check what triggers exist on the books table
    const { data: triggers, error: triggersError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('event_object_table', 'books');

    if (triggersError) {
      console.log('Error fetching triggers:', triggersError);
      return NextResponse.json({ error: triggersError.message }, { status: 500 });
    }

    console.log('Current triggers on books table:', triggers);

    // Try to disable triggers by updating a book without triggers
    const testBookId = '94d23dab-6c0d-4311-b433-d5f8af3ddd27';
    
    // Simple update without updated_at to test
    const { data, error } = await supabaseAdmin
      .from('books')
      .update({ title: 'Test Update - No Triggers' })
      .eq('id', testBookId)
      .select();

    if (error) {
      console.log('Error updating book:', error);
      return NextResponse.json({ 
        error: error.message, 
        triggers: triggers,
        message: 'Book update failed - triggers may still be active'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      triggers: triggers,
      message: 'Book updated successfully - triggers may be disabled'
    });

  } catch (error) {
    console.error('Error disabling triggers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 