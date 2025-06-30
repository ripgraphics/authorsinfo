import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ limit: 1 })
    
    if (error) {
      return NextResponse.json({ 
        error: 'Supabase connection failed', 
        details: error.message,
        code: error.status 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      userCount: data?.users?.length || 0,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    })

  } catch (error: any) {
    console.error('Supabase test error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error testing Supabase',
      details: error.message 
    }, { status: 500 })
  }
} 