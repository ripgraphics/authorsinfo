export interface GroupEvent {
  id: string
  group_id: string
  created_by: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  location_coordinates: Record<string, any> | null
  event_type: 'meeting' | 'social' | 'workshop' | 'conference' | 'other'
  max_attendees: number | null
  is_public: boolean
  requires_rsvp: boolean
  rsvp_deadline: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface GroupEventRSVP {
  id: string
  event_id: string
  user_id: string
  status: 'going' | 'not_going' | 'maybe'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GroupEventInput {
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  location?: string | null
  locationCoordinates?: Record<string, any> | null
  eventType?: 'meeting' | 'social' | 'workshop' | 'conference' | 'other'
  maxAttendees?: number | null
  isPublic?: boolean
  requiresRsvp?: boolean
  rsvpDeadline?: string | null
  metadata?: Record<string, any>
}
