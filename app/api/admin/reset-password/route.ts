import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, password, all } = body
    if (!password || (typeof password !== 'string')) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }
    if (all) {
      // Reset password for all users
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ limit: 1000 })
      if (error) {
        return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 })
      }
      const users = data?.users || []
      const results = []
      for (const user of users) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
        results.push({ id: user.id, email: user.email, success: !updateError, error: updateError?.message })
      }
      return NextResponse.json({ success: true, results })
    } else if (userId) {
      // Reset password for a single user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'userId or all=true is required.' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in reset-password API:', error)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
} 