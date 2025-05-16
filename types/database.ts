export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  bio?: string
  created_at?: string
  updated_at?: string
}

export interface Book {
  id: string
  title: string
  isbn?: string
  isbn13?: string
  author_id?: string
  publisher_id?: string
  publish_date?: string
  cover_image_id?: number
  original_image_url?: string
  cover_image_url?: string // This will be populated from either cover_image.url or original_image_url
  synopsis?: string
  page_count?: number
  genre?: string
  language?: string
  average_rating?: number
  format?: string
  edition?: string
  price?: number
  series?: string
  series_number?: number
  created_at?: string
  updated_at?: string
  // Additional fields from joins
  author_name?: string
  publisher_name?: string
  book_gallery_img?: string[] | null
  // Joined fields
  cover_image?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  binding?: string
  isbn10?: string
  pages?: number
  list_price?: number
  overview?: string
  dimensions?: string
  weight?: string
  publication_date?: string
}

export interface Author {
  id: string
  name: string
  bio?: string
  nationality?: string
  website?: string
  birth_date?: string
  email?: string
  twitter_handle?: string
  facebook_handle?: string
  instagram_handle?: string
  author_image?: {
    id: string
    url: string
    alt_text?: string
  }
  cover_image?: {
    id: string
    url: string
    alt_text?: string
  }
}

export interface Publisher {
  id: string
  name: string
  website?: string
  founded_year?: number
  email?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  about?: string
  cover_image_id?: number
  publisher_image_id?: number
  publisher_gallery_id?: number
  featured?: string | boolean
  created_at?: string
  updated_at?: string
  // Joined fields
  cover_image?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  publisher_image?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  publisher_gallery?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  country_id?: number
  country_details?: Country
  logo_url?: string
}

export interface Review {
  id: string
  user_id: string
  book_id: string
  rating: number
  content?: string
  created_at?: string
  updated_at?: string
}

export interface Bookshelf {
  id: string
  user_id: string
  name: string
  is_public: boolean
  created_at?: string
  updated_at?: string
}

export interface BookshelfBook {
  id: string
  bookshelf_id: string
  book_id: string
  added_at?: string
}

export interface ReadingStatus {
  id: string
  user_id: string
  book_id: string
  status: "want_to_read" | "currently_reading" | "read"
  created_at?: string
  updated_at?: string
}

export interface ReadingChallenge {
  id: string
  user_id: string
  year: number
  target_books: number
  books_read: number
  created_at?: string
  updated_at?: string
}

export interface UserFriend {
  id: string
  user_id: string
  friend_id: string
  status: "pending" | "accepted" | "rejected"
  created_at?: string
  updated_at?: string
}

export interface Comment {
  id: string
  user_id: string
  content: string
  parent_id?: string
  review_id?: string
  created_at?: string
  updated_at?: string
}

export interface Like {
  id: string
  user_id: string
  review_id?: string
  comment_id?: string
  created_at?: string
}

export interface Country {
  id: number
  code: string
  name: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          description: string | null
          isbn13: string | null
          isbn10: string | null
          language: string | null
          pages: number | null
          publication_date: string | null
          publisher_id: string | null
          created_at: string
          updated_at: string
          cover_image_id: number | null
          binding_type_id: number | null
          format_type_id: number | null
          review_count: number | null
          weight: number | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          isbn13?: string | null
          isbn10?: string | null
          language?: string | null
          pages?: number | null
          publication_date?: string | null
          publisher_id?: string | null
          created_at?: string
          updated_at?: string
          cover_image_id?: number | null
          binding_type_id?: number | null
          format_type_id?: number | null
          review_count?: number | null
          weight?: number | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          isbn13?: string | null
          isbn10?: string | null
          language?: string | null
          pages?: number | null
          publication_date?: string | null
          publisher_id?: string | null
          created_at?: string
          updated_at?: string
          cover_image_id?: number | null
          binding_type_id?: number | null
          format_type_id?: number | null
          review_count?: number | null
          weight?: number | null
        }
      }
      authors: {
        Row: {
          id: string
          name: string
          bio: string | null
          created_at: string
          updated_at: string
          photo_url: string | null
          author_image: {
            id: number
            url: string
            alt_text?: string
            img_type_id?: number
          } | null
          cover_image_id: number | null
        }
        Insert: {
          id?: string
          name: string
          bio?: string | null
          created_at?: string
          updated_at?: string
          photo_url?: string | null
          author_image?: {
            id: number
            url: string
            alt_text?: string
            img_type_id?: number
          } | null
          cover_image_id?: number | null
        }
        Update: {
          id?: string
          name?: string
          bio?: string | null
          created_at?: string
          updated_at?: string
          photo_url?: string | null
          author_image?: {
            id: number
            url: string
            alt_text?: string
            img_type_id?: number
          } | null
          cover_image_id?: number | null
        }
      }
      publishers: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          featured: boolean
          website: string | null
          email: string | null
          phone: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          about: string | null
          cover_image_id: number | null
          publisher_image_id: number | null
          publisher_gallery_id: number | null
          founded_year: number | null
          country_id: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          featured?: boolean
          website?: string | null
          email?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          about?: string | null
          cover_image_id?: number | null
          publisher_image_id?: number | null
          publisher_gallery_id?: number | null
          founded_year?: number | null
          country_id?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          featured?: boolean
          website?: string | null
          email?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          about?: string | null
          cover_image_id?: number | null
          publisher_image_id?: number | null
          publisher_gallery_id?: number | null
          founded_year?: number | null
          country_id?: number | null
        }
      }
      book_reviews: {
        Row: {
          id: string
          book_id: string
          user_id: string
          rating: number
          content: string | null
          created_at: string
          updated_at: string
          contains_spoilers: boolean
        }
        Insert: {
          id?: string
          book_id: string
          user_id: string
          rating: number
          content?: string | null
          created_at?: string
          updated_at?: string
          contains_spoilers?: boolean
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string
          rating?: number
          content?: string | null
          created_at?: string
          updated_at?: string
          contains_spoilers?: boolean
        }
      }
      binding_types: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      format_types: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          book_id: string
          status: string
          current_page: number
          total_pages: number
          percentage_complete: number
          created_at: string
          updated_at: string
          start_date: string | null
          finish_date: string | null
          notes: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          status: string
          current_page: number
          total_pages: number
          percentage_complete: number
          created_at?: string
          updated_at?: string
          start_date?: string | null
          finish_date?: string | null
          notes?: string | null
          is_public?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          status?: string
          current_page?: number
          total_pages?: number
          percentage_complete?: number
          created_at?: string
          updated_at?: string
          start_date?: string | null
          finish_date?: string | null
          notes?: string | null
          is_public?: boolean
        }
      }
    }
  }
}

export interface EventCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
  icon?: string
  color?: string
  created_at?: string
  updated_at?: string
}

export interface EventType {
  id: string
  name: string
  description?: string
  icon?: string
  created_at?: string
  updated_at?: string
}

export interface Event {
  id: string
  title: string
  subtitle?: string
  description?: string
  summary?: string
  category_id?: string
  type_id?: string
  format: 'physical' | 'virtual' | 'hybrid'
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'postponed'
  visibility: 'public' | 'private' | 'invite_only' | 'group_only'
  featured?: boolean
  start_date: string
  end_date: string
  timezone?: string
  all_day?: boolean
  max_attendees?: number
  cover_image_id?: number
  event_image_id?: number
  is_recurring?: boolean
  recurrence_pattern?: any
  parent_event_id?: string
  created_by: string
  created_at?: string
  updated_at?: string
  published_at?: string
  requires_registration?: boolean
  registration_opens_at?: string
  registration_closes_at?: string
  is_free?: boolean
  price?: number
  currency?: string
  book_id?: number
  author_id?: number
  publisher_id?: number
  group_id?: string
  virtual_meeting_url?: string
  virtual_meeting_id?: string
  virtual_meeting_password?: string
  virtual_platform?: string
  slug?: string
  seo_title?: string
  seo_description?: string
  canonical_url?: string
  content_blocks?: any
  
  // Joined fields
  category?: EventCategory
  type?: EventType
  cover_image?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  event_image?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  location?: EventLocation
  author?: Author
  book?: Book
  publisher?: Publisher
}

export interface EventLocation {
  id: string
  event_id: string
  name: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  latitude?: number
  longitude?: number
  google_place_id?: string
  is_primary?: boolean
  venue_notes?: string
  accessibility_info?: string
  created_at?: string
  updated_at?: string
}

export interface EventSession {
  id: string
  event_id: string
  title: string
  description?: string
  speaker_ids?: string[]
  start_time: string
  end_time: string
  location_id?: string
  virtual_meeting_url?: string
  max_attendees?: number
  requires_separate_registration?: boolean
  session_materials?: any
  created_at?: string
  updated_at?: string
  
  // Joined fields
  location?: EventLocation
  speakers?: EventSpeaker[]
}

export interface EventSpeaker {
  id: string
  event_id: string
  user_id?: string
  name: string
  bio?: string
  headshot_url?: string
  website?: string
  social_links?: any
  presentation_title?: string
  presentation_description?: string
  speaker_order?: number
  author_id?: number
  created_at?: string
  updated_at?: string
  session_ids?: string[]
  
  // Joined fields
  author?: Author
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  registration_status: 'registered' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show'
  registration_time?: string
  check_in_time?: string
  ticket_id?: string
  registration_source?: string
  additional_guests?: number
  guest_names?: any
  answers?: any
  payment_status?: 'pending' | 'completed' | 'refunded' | 'failed'
  ticket_type_id?: string
  ticket_price?: number
  created_at?: string
  updated_at?: string
  
  // Joined fields
  event?: Event
  user?: User
  ticket_type?: EventTicketType
}

export interface EventTicketType {
  id: string
  event_id: string
  name: string
  description?: string
  price: number
  currency?: string
  capacity?: number
  available_from?: string
  available_until?: string
  is_early_bird?: boolean
  benefits?: string[]
  created_at?: string
  updated_at?: string
}
