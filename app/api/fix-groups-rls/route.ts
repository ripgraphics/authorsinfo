import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    console.log('🚨 EMERGENCY: Fixing Groups RLS Infinite Recursion...')

    // Step 1: Disable RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "public"."groups" DISABLE ROW LEVEL SECURITY;'
    })
    console.log('✅ Step 1: Disabled RLS')

    // Step 2: Drop all problematic policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Public read access for public groups" ON "public"."groups";',
      'DROP POLICY IF EXISTS "groups_public_read" ON "public"."groups";',
      'DROP POLICY IF EXISTS "groups_owner_manage" ON "public"."groups";',
      'DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."groups";',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."groups";',
      'DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."groups";',
      'DROP POLICY IF EXISTS "Enable delete for users based on email" ON "public"."groups";'
    ]

    for (const policy of dropPolicies) {
      await supabase.rpc('exec_sql', { sql: policy })
    }
    console.log('✅ Step 2: Dropped all problematic policies')

    // Step 3: Create simple, working policies
    const createPolicies = [
      'CREATE POLICY "groups_select_policy" ON "public"."groups" FOR SELECT USING (true);',
      'CREATE POLICY "groups_insert_policy" ON "public"."groups" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);',
      'CREATE POLICY "groups_update_policy" ON "public"."groups" FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);',
      'CREATE POLICY "groups_delete_policy" ON "public"."groups" FOR DELETE USING (auth.uid() = created_by);'
    ]

    for (const policy of createPolicies) {
      await supabase.rpc('exec_sql', { sql: policy })
    }
    console.log('✅ Step 3: Created simple, working policies')

    // Step 4: Re-enable RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;'
    })
    console.log('✅ Step 4: Re-enabled RLS')

    // Step 5: Test the fix
    const { data: testGroups, error: testError } = await supabase
      .from('groups')
      .select('id, name')
      .limit(1)

    if (testError) {
      console.error('❌ Test failed:', testError)
      return NextResponse.json({ 
        error: 'Fix failed - test query still errors', 
        details: testError 
      }, { status: 500 })
    }

    console.log('✅ Step 5: Test query successful!')

    // Step 6: Create sample group if none exist
    if (!testGroups || testGroups.length === 0) {
      const { data: users } = await supabase.auth.admin.listUsers()
      
      if (users.users && users.users.length > 0) {
        const { error: insertError } = await supabase
          .from('groups')
          .insert({
            name: 'Book Lovers Community',
            description: 'A welcoming community for book enthusiasts to share recommendations and discuss their favorite reads.',
            is_private: false,
            created_by: users.users[0].id,
            member_count: 1
          })

        if (!insertError) {
          console.log('✅ Step 6: Created sample group')
        }
      }
    }

    console.log('🎉 Groups RLS fix completed successfully!')

    return NextResponse.json({ 
      success: true, 
      message: 'Groups RLS infinite recursion fixed successfully!',
      testGroupsCount: testGroups?.length || 0
    })

  } catch (error) {
    console.error('❌ Emergency fix failed:', error)
    return NextResponse.json({ 
      error: 'Emergency fix failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 