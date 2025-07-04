import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      url, 
      alt_text, 
      storage_provider, 
      storage_path, 
      original_filename, 
      file_size, 
      mime_type 
    } = body

    console.log('Inserting image:', { 
      url, 
      alt_text, 
      storage_provider, 
      storage_path, 
      original_filename, 
      file_size, 
      mime_type 
    })

    // Use server-side Supabase client to avoid RLS issues
    const { data: imageData, error: imageError } = await supabaseAdmin
      .from('images')
      .insert({
        url,
        alt_text,
        storage_provider,
        storage_path,
        original_filename,
        file_size,
        mime_type,
        is_processed: true,
        processing_status: 'completed'
      })
      .select()
      .single()

    if (imageError) {
      console.error('Image insertion error:', JSON.stringify(imageError, null, 2))
      return NextResponse.json({ error: `Failed to insert image record: ${imageError.message}` }, { status: 500 })
    }

    console.log('Image inserted successfully:', imageData)
    return NextResponse.json({ success: true, data: imageData })

  } catch (error) {
    console.error("Error inserting image:", error)
    return NextResponse.json({ error: "Failed to insert image" }, { status: 500 })
  }
} 