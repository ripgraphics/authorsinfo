import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')

    if (!tableName) {
      return NextResponse.json({
        error: 'table parameter is required'
      }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()

    // Get a sample row to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    // Get all rows to see actual data
    const { data: allData, error: allError } = await supabase
      .from(tableName)
      .select('*')
      .limit(100)

    return NextResponse.json({
      table: tableName,
      sampleRow: sampleData?.[0] || null,
      totalRows: allData?.length || 0,
      columns: sampleData?.[0] ? Object.keys(sampleData[0]) : [],
      sampleData: sampleData,
      allData: allData,
      errors: {
        sampleError: sampleError?.message,
        allError: allError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

