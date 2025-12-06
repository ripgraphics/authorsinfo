import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserIdFromPermalinkServer } from '@/lib/utils/profile-url-server'

export async function POST(request: NextRequest) {
  try {
    console.log('Friend request POST started')
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
    }
    if (!session?.user) {
      console.log('No user found in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    console.log('User authenticated:', user.id)
    const { targetUserId } = await request.json()
    console.log('Target user ID:', targetUserId)
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
    }

    // Convert permalink to UUID if needed
    const targetUserUUID = await getUserIdFromPermalinkServer(targetUserId)
    if (!targetUserUUID) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    if (user.id === targetUserUUID) {
      return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 })
    }

    // Check for existing friend request
    console.log('Checking for existing friend requests...')
    const { data: existingRequests, error: checkError } = await supabase
      .from('user_friends')
      .select('*')
      .eq('user_id', user.id)
      .eq('friend_id', targetUserUUID)

    console.log('Check error:', checkError)
    console.log('Existing requests:', existingRequests)

    if (checkError) {
      console.error('Check error:', checkError)
      return NextResponse.json({ error: 'Error checking friend status' }, { status: 500 })
    }

    // Also check reverse relationship
    const { data: reverseRequests, error: reverseCheckError } = await supabase
      .from('user_friends')
      .select('*')
      .eq('user_id', targetUserUUID)
      .eq('friend_id', user.id)

    console.log('Reverse check error:', reverseCheckError)
    console.log('Reverse requests:', reverseRequests)

    if (reverseCheckError) {
      console.error('Reverse check error:', reverseCheckError)
      return NextResponse.json({ error: 'Error checking friend status' }, { status: 500 })
    }

    // Combine both results
    const allRequests = [...(existingRequests || []), ...(reverseRequests || [])]
    const existingRequest = allRequests[0]

    if (existingRequest) {
      console.log('Existing request found:', existingRequest)
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Friend request already pending' }, { status: 409 })
      } else if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 409 })
      }
    }

    // Create friend request
    console.log('Creating friend request...')
    const { data: friendRequest, error: insertError } = await supabase
      .from('user_friends')
      .insert({
        user_id: user.id,
        friend_id: targetUserUUID,
        requested_by: user.id,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    console.log('Insert error:', insertError)
    console.log('Friend request created:', friendRequest)

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
    }



    return NextResponse.json({ 
      success: true, 
      message: 'Friend request sent successfully',
      request: friendRequest
    })

  } catch (error) {
    console.error('Error in friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const { requestId, action } = await request.json()
    
    console.log('PUT /api/friends - requestId:', requestId, 'action:', action, 'user:', user.id)
    
    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 })
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "reject"' }, { status: 400 })
    }

    // Get the friend request
    console.log('Looking for friend request with ID:', requestId)
    const { data: friendRequest, error: fetchError } = await supabase
      .from('user_friends')
      .select('*')
      .eq('id', requestId)
      .single()

    console.log('Fetch error:', fetchError)
    console.log('Friend request found:', friendRequest)

    if (fetchError || !friendRequest) {
      console.error('Friend request not found for ID:', requestId)
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    // Verify the current user is the one who received the request
    if (friendRequest.friend_id !== user.id) {
      console.error('User not authorized to modify request. User:', user.id, 'Friend ID:', friendRequest.friend_id)
      return NextResponse.json({ error: 'Unauthorized to modify this request' }, { status: 403 })
    }

    // Verify the request is still pending
    if (friendRequest.status !== 'pending') {
      console.error('Request is not pending. Status:', friendRequest.status)
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const respondedAt = new Date().toISOString()

    console.log('Updating friend request to status:', newStatus)

    // Update the friend request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('user_friends')
      .update({
        status: newStatus,
        responded_at: respondedAt
      })
      .eq('id', requestId)
      .select()
      .single()

    console.log('Update error:', updateError)
    console.log('Updated request:', updatedRequest)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update friend request' }, { status: 500 })
    }



    return NextResponse.json({
      success: true,
      message: `Friend request ${action}ed successfully`,
      request: updatedRequest
    })

  } catch (error) {
    console.error('Error updating friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friendId')
    
    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 })
    }

    // Find and delete the friend relationship
    const { data: friendRelationship, error: findError } = await supabase
      .from('user_friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .single()

    if (findError || !friendRelationship) {
      return NextResponse.json({ error: 'Friend relationship not found' }, { status: 404 })
    }

    // Delete the relationship
    const { error: deleteError } = await supabase
      .from('user_friends')
      .delete()
      .eq('id', friendRelationship.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 })
    }



    return NextResponse.json({
      success: true,
      message: 'Friend removed successfully'
    })

  } catch (error) {
    console.error('Error removing friend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user (optional - allow checking friend status without auth)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user || null

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('targetUserId')
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
    }
    
    // If no user is logged in, return a default status
    if (!user) {
      return NextResponse.json({
        status: 'none',
        isPending: false,
        isRequestedByMe: false,
        isFriends: false
      })
    }

    // Convert permalink to UUID if needed
    const targetUserUUID = await getUserIdFromPermalinkServer(targetUserId)
    if (!targetUserUUID) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Use admin client for faster queries - check both directions in parallel
    const [existingResult, reverseResult] = await Promise.all([
      supabaseAdmin
        .from('user_friends')
        .select('status, requested_by')
        .eq('user_id', user.id)
        .eq('friend_id', targetUserUUID)
        .maybeSingle(),
      supabaseAdmin
        .from('user_friends')
        .select('status, requested_by')
        .eq('user_id', targetUserUUID)
        .eq('friend_id', user.id)
        .maybeSingle()
    ])

    if (existingResult.error) {
      console.error('Check error:', existingResult.error)
      return NextResponse.json({ error: 'Error checking friend status' }, { status: 500 })
    }

    if (reverseResult.error) {
      console.error('Reverse check error:', reverseResult.error)
      return NextResponse.json({ error: 'Error checking friend status' }, { status: 500 })
    }

    // Get the friend status from either direction
    const friendStatus = existingResult.data || reverseResult.data

    let status = 'none'
    let isPending = false
    let isRequestedByMe = false

    if (friendStatus) {
      status = friendStatus.status
      isPending = friendStatus.status === 'pending'
      isRequestedByMe = friendStatus.requested_by === user.id
    }

    return NextResponse.json({
      status,
      isPending,
      isRequestedByMe,
      isFriends: status === 'accepted'
    })

  } catch (error) {
    console.error('Error checking friend status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 