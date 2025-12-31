import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, password, all } = await request.json()

    if (all) {
      // Reset all users' passwords
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 })
      }

      console.log(`Resetting passwords for all users to: ${password}`)

      const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      })
      if (fetchError) {
        console.error('Error fetching users:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }

      console.log(`Found ${users.users.length} users to reset`)

      const results = []
      for (const user of users.users) {
        try {
          console.log(`Resetting password for user: ${user.email}`)

          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: password,
          })

          if (updateError) {
            console.error(`Failed to reset password for ${user.email}:`, updateError)
            results.push({
              id: user.id,
              email: user.email,
              success: false,
              error: updateError.message,
            })
          } else {
            console.log(`✅ Successfully reset password for: ${user.email}`)
            results.push({
              id: user.id,
              email: user.email,
              success: true,
            })
          }
        } catch (error: any) {
          console.error(`Error resetting password for ${user.email}:`, error)
          results.push({
            id: user.id,
            email: user.email,
            success: false,
            error: error.message,
          })
        }
      }

      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      console.log(`Password reset complete: ${successful} successful, ${failed} failed`)

      return NextResponse.json({
        message: `Reset ${successful} passwords successfully. ${failed} failed.`,
        results,
        summary: {
          total: users.users.length,
          successful,
          failed,
        },
      })
    } else if (userId) {
      // Reset a specific user's password
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 })
      }

      console.log(`Resetting password for user ${userId} to: ${password}`)

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
      })

      if (error) {
        console.error('Error resetting password:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`✅ Successfully reset password for user ${userId}`)
      return NextResponse.json({ message: 'Password reset successfully' })
    } else {
      return NextResponse.json({ error: 'Either userId or all must be provided' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
