import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient();

    // Fetch the user's avatar from the images table
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('url')
      .eq('id', id)
      .single();

    if (imageError || !image?.url) {
      // If no image found, return a placeholder
      return NextResponse.redirect(new URL('/placeholder.svg', request.url));
    }

    // Redirect to the actual image URL
    return NextResponse.redirect(new URL(image.url));
  } catch (error) {
    console.error('Error fetching avatar:', error);
    // Return placeholder on error
    return NextResponse.redirect(new URL('/placeholder.svg', request.url));
  }
} 