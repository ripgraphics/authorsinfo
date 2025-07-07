import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 });
    }

    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .select(`
        *,
        cover_image:cover_image_id(id, url, alt_text),
        author_image:author_image_id(id, url, alt_text)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching author:', error);
      return NextResponse.json({ error: 'Failed to fetch author' }, { status: 500 });
    }

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    return NextResponse.json(author);
  } catch (err) {
    console.error('Internal server error in author route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const cookiesStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookiesStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    const allowedFields = [
      'name', 
      'bio', 
      'nationality', 
      'birth_date', 
      'website', 
      'twitter_handle', 
      'facebook_handle', 
      'instagram_handle', 
      'goodreads_url'
    ];
    
    const updateData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedAuthor, error } = await supabaseAdmin
      .from('authors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating author:', error);
      return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
    }

    try {
      await supabaseAdmin.from('activities').insert({
        user_id: session?.user?.id,
        activity_type: 'author_profile_updated',
        data: {
          author_id: id,
          author_name: updatedAuthor.name,
          updated_fields: Object.keys(updateData)
        },
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error creating activity log:', logError);
    }

    return NextResponse.json(updatedAuthor);
  } catch (err) {
    console.error('Internal server error in author update route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 