import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("authors")
      .select("nationality")
      .not("nationality", "is", null)
      .order("nationality")

    if (error) {
      console.error("Error fetching nationalities:", error)
      return NextResponse.json(
        { error: `Error fetching nationalities: ${error.message}` },
        { status: 500 }
      )
    }

    // Extract unique nationalities
    const uniqueNationalities = Array.from(new Set(data.map((item) => item.nationality).filter(Boolean)))
    
    return NextResponse.json({
      nationalities: uniqueNationalities
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 