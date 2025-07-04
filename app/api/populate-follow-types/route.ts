import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    console.log('🔍 Populating follow target types...')
    
    // Define the required follow target types
    const targetTypes = [
      { name: 'user', description: 'Follow other users' },
      { name: 'book', description: 'Follow books' },
      { name: 'author', description: 'Follow authors' },
      { name: 'publisher', description: 'Follow publishers' },
      { name: 'group', description: 'Follow groups' }
    ]
    
    // Check existing target types
    const { data: existingTypes, error: fetchError } = await supabaseAdmin
      .from('follow_target_types')
      .select('name')
    
    if (fetchError) {
      console.error('❌ Error fetching existing target types:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch existing target types' }, { status: 500 })
    }
    
    const existingNames = new Set(existingTypes?.map(t => t.name) || [])
    const newTypes = targetTypes.filter(type => !existingNames.has(type.name))
    
    if (newTypes.length === 0) {
      return NextResponse.json({ 
        message: 'All follow target types already exist',
        existingCount: existingTypes?.length || 0
      })
    }
    
    console.log(`📝 Inserting ${newTypes.length} new target types...`)
    
    // Insert new target types
    const { data: insertedTypes, error: insertError } = await supabaseAdmin
      .from('follow_target_types')
      .insert(newTypes)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting target types:', insertError)
      return NextResponse.json({ error: 'Failed to insert target types' }, { status: 500 })
    }
    
    console.log(`✅ Successfully inserted ${insertedTypes.length} target types`)
    
    return NextResponse.json({
      message: 'Follow target types populated successfully',
      insertedCount: insertedTypes.length,
      totalCount: (existingTypes?.length || 0) + insertedTypes.length,
      insertedTypes: insertedTypes.map(t => t.name)
    })
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
} 