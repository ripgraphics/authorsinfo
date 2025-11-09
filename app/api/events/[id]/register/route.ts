import { NextRequest, NextResponse } from 'next/server';
import { registerForEvent } from '@/lib/events';
import { createClient } from '@/lib/supabase-server';

// POST /api/events/[id]/register - Register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const registrationData = await request.json();
    
    // Register for the event
    const registration = await registerForEvent(
      eventId,
      user.id,
      registrationData.ticketTypeId,
      {
        additional_guests: registrationData.additionalGuests || 0,
        guest_names: registrationData.guestNames || null,
        answers: registrationData.answers || null
      }
    );
    
    return NextResponse.json({
      data: registration,
      message: 'Successfully registered for event'
    });
  } catch (error: any) {
    console.error('[API] Error registering for event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register for event' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/register - Check registration status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user is registered for this event
    const { data: registration, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('[API] Error checking registration status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to check registration status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data: registration,
      isRegistered: !!registration && registration.registration_status !== 'cancelled'
    });
  } catch (error: any) {
    console.error('[API] Error checking registration status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check registration status' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/register - Cancel registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Find the user's registration
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .not('registration_status', 'eq', 'cancelled')
      .maybeSingle();
    
    if (!registration) {
      return NextResponse.json(
        { error: 'No active registration found' },
        { status: 404 }
      );
    }
    
    // Update the registration status to cancelled
    const { error } = await supabase
      .from('event_registrations')
      .update({
        registration_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', registration.id);
    
    if (error) {
      console.error('[API] Error cancelling registration:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to cancel registration' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Registration cancelled successfully'
    });
  } catch (error: any) {
    console.error('[API] Error cancelling registration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel registration' },
      { status: 500 }
    );
  }
} 