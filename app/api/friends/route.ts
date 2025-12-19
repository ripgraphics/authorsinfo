import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserIdFromPermalinkServer } from '@/lib/utils/profile-url-server'

export async function POST(request: NextRequest) {
  try {
    console.log('Friend request POST started')
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user - use getUser() to authenticate with Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }
    if (!user) {
      console.log('No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const existingRequest = (allRequests[0] as any)

    if (existingRequest) {
      console.log('Existing request found:', existingRequest)
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Friend request already pending' }, { status: 409 })
      } else if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 409 })
      }
    }

    // Create friend request
    console.log('Creating friend request...', {
      user_id: user.id,
      friend_id: targetUserUUID,
      requested_by: user.id,
      status: 'pending'
    })
    
    try {
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

      console.log('Insert result - error:', insertError)
      console.log('Insert result - data:', friendRequest)

      if (insertError) {
        console.error('❌ Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          fullError: JSON.stringify(insertError, null, 2)
        })
        return NextResponse.json({ 
          error: 'Failed to send friend request',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }, { status: 500 })
      }

      if (!friendRequest) {
        console.error('❌ No friend request returned from insert')
        return NextResponse.json({ 
          error: 'Failed to send friend request',
          details: 'No data returned from insert'
        }, { status: 500 })
      }



      return NextResponse.json({ 
        success: true, 
        message: 'Friend request sent successfully',
        request: friendRequest
      })
    } catch (insertException) {
      console.error('❌ Exception during insert:', insertException)
      const exceptionMessage = insertException instanceof Error ? insertException.message : String(insertException)
      const exceptionStack = insertException instanceof Error ? insertException.stack : undefined
      console.error('Exception stack:', exceptionStack)
      return NextResponse.json({ 
        error: 'Failed to send friend request',
        details: exceptionMessage
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in friend request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error stack:', errorStack)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user - use getUser() to authenticate with Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const friendReq = friendRequest as any
    if (friendReq.friend_id !== user.id) {
      console.error('User not authorized to modify request. User:', user.id, 'Friend ID:', friendReq.friend_id)
      return NextResponse.json({ error: 'Unauthorized to modify this request' }, { status: 403 })
    }

    // Verify the request is still pending
    if (friendReq.status !== 'pending') {
      console.error('Request is not pending. Status:', friendReq.status)
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
      console.error('Update error details:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      })
      return NextResponse.json({ 
        error: 'Failed to update friend request',
        details: updateError.message
      }, { status: 500 })
    }



    return NextResponse.json({
      success: true,
      message: `Friend request ${action}ed successfully`,
      request: updatedRequest
    })

  } catch (error) {
    console.error('Error updating friend request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error stack:', errorStack)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user - use getUser() to authenticate with Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const relationship = friendRelationship as any
    const { error: deleteError } = await supabase
      .from('user_friends')
      .delete()
      .eq('id', relationship.id)

    if (deleteError) {
      console.error('Delete error details:', {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint
      })
      return NextResponse.json({ 
        error: 'Failed to remove friend',
        details: deleteError.message
      }, { status: 500 })
    }



    return NextResponse.json({
      success: true,
      message: 'Friend removed successfully'
    })

  } catch (error) {
    console.error('Error removing friend:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error stack:', errorStack)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user (optional - allow checking friend status without auth)
    const { data: { user } } = await supabase.auth.getUser()

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

    const statusData = friendStatus as any
    if (statusData) {
      status = statusData.status
      isPending = statusData.status === 'pending'
      isRequestedByMe = statusData.requested_by === user.id
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