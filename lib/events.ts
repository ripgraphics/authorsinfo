import { createClient } from './supabase-server';
import type { Event, EventCategory, EventType, EventLocation, EventSession, EventSpeaker, EventRegistration, EventTicketType } from '@/types/database';

// Get all public published events with pagination
export async function getPublicEvents(
  page = 1, 
  limit = 10, 
  search = '', 
  categoryId = '', 
  startDate = '', 
  endDate = ''
) {
  const supabase = createClient();
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('visibility', 'public');
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('end_date', endDate);
  }
  
  const { data, error, count } = await query
    .order('start_date', { ascending: true })
    .range(offset, offset + limit - 1)
    .returns<Event[]>();
  
  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
  
  return { data, count };
}

// Get a single event by ID or slug with all details
export async function getEventById(eventId: string, includeDetails = true) {
  const supabase = createClient();
  
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  
  let query = supabase.from('events').select('*');
  
  if (isUuid) {
    query = query.eq('id', eventId);
  } else {
    query = query.eq('slug', eventId);
  }
  
  const { data, error } = await query.single<Event>();
  
  if (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
  
  if (includeDetails && data) {
    // Get event location
    const { data: locationData } = await supabase
      .from('event_locations')
      .select('*')
      .eq('event_id', data.id)
      .eq('is_primary', true)
      .single<EventLocation>();
    
    // Get event sessions
    const { data: sessionData } = await supabase
      .from('event_sessions')
      .select('*')
      .eq('event_id', data.id)
      .order('start_time', { ascending: true })
      .returns<EventSession[]>();
    
    // Get event speakers
    const { data: speakerData } = await supabase
      .from('event_speakers')
      .select(`
        *,
        author:authors(*)
      `)
      .eq('event_id', data.id)
      .order('speaker_order', { ascending: true })
      .returns<EventSpeaker[]>();
    
    // Get ticket types if registration is required
    let ticketTypes = null;
    if (data.requires_registration) {
      const { data: ticketData } = await supabase
        .from('event_ticket_types')
        .select('*')
        .eq('event_id', data.id)
        .returns<EventTicketType[]>();
      
      ticketTypes = ticketData;
    }
    
    // Get related books if any
    const { data: bookData } = await supabase
      .from('event_books')
      .select(`
        book_id,
        book:books(*)
      `)
      .eq('event_id', data.id);
    
    // Enhanced data with joined entities
    return {
      ...data,
      location: locationData || null,
      sessions: sessionData || [],
      speakers: speakerData || [],
      ticketTypes: ticketTypes || [],
      books: bookData?.map(item => item.book) || []
    };
  }
  
  return data;
}

// Get featured events
export async function getFeaturedEvents(limit = 4) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('featured', true)
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)
    .returns<Event[]>();
  
  if (error) {
    console.error('Error fetching featured events:', error);
    throw error;
  }
  
  return data;
}

// Get upcoming events for an author
export async function getAuthorEvents(authorId: number, limit = 5) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('author_id', authorId)
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)
    .returns<Event[]>();
  
  if (error) {
    console.error('Error fetching author events:', error);
    throw error;
  }
  
  return data;
}

// Get upcoming events for a book
export async function getBookEvents(bookId: number, limit = 5) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('book_id', bookId)
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)
    .returns<Event[]>();
  
  if (error) {
    console.error('Error fetching book events:', error);
    throw error;
  }
  
  return data;
}

// Register user for an event
export async function registerForEvent(
  eventId: string, 
  userId: string, 
  ticketTypeId?: string,
  additionalData: any = {}
) {
  const supabase = createClient();
  
  // First check if registration is open and event is available
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('status', 'published')
    .single<Event>();
  
  if (!event) {
    throw new Error('Event not found or not available for registration');
  }
  
  if (!event.requires_registration) {
    throw new Error('This event does not require registration');
  }
  
  const now = new Date().toISOString();
  
  if (event.registration_opens_at && now < event.registration_opens_at) {
    throw new Error('Registration has not opened yet');
  }
  
  if (event.registration_closes_at && now > event.registration_closes_at) {
    throw new Error('Registration has closed');
  }
  
  // Check if the user is already registered
  const { data: existingReg } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .not('registration_status', 'eq', 'cancelled')
    .maybeSingle();
  
  if (existingReg) {
    throw new Error('You are already registered for this event');
  }
  
  // Get ticket information if ticketTypeId is provided
  let ticketPrice = 0;
  if (ticketTypeId) {
    const { data: ticketType } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single<EventTicketType>();
    
    if (!ticketType) {
      throw new Error('Invalid ticket type');
    }
    
    ticketPrice = ticketType.price;
  }
  
  // Create the registration
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      user_id: userId,
      registration_status: 'registered',
      registration_time: now,
      ticket_id: `TICKET-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      registration_source: 'website',
      ticket_type_id: ticketTypeId,
      ticket_price: ticketPrice,
      ...additionalData
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
  
  return data;
}

// Get all categories
export async function getEventCategories() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .order('name')
    .returns<EventCategory[]>();
  
  if (error) {
    console.error('Error fetching event categories:', error);
    throw error;
  }
  
  return data;
}

// Track event view
export async function trackEventView(eventId: string, userId?: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('event_views')
    .insert({
      event_id: eventId,
      user_id: userId || null,
      viewed_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error tracking event view:', error);
  }
} 