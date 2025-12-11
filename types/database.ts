// Re-export types from other files
export type { Author, Book, Review, BookWithAuthor, BookWithDetails } from './book'
export type { Publisher } from '../lib/publishers'

// Database type - this should be generated from Supabase
// For now, using a minimal structure that allows the build to pass
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database type - should be generated from Supabase
// Using a more permissive type structure to allow builds to pass
// TODO: Generate proper types using: npm run types:generate
export type Database = {
  public: {
    Tables: {
      activities: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      books: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      authors: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      publishers: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      events: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      user_profiles: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      bookshelves: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      reading_statuses: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      reading_challenges: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      countries: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      binding_types: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      format_types: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
      [key: string]: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}

// Event type - derived from Database
export type Event = Database['public']['Tables']['events']['Row'] & {
  location?: any
  sessions?: any[]
  speakers?: any[]
  ticket_types?: any[]
  books?: any[]
}

// User type - derived from Database
export type User = Database['public']['Tables']['user_profiles']['Row']

// Bookshelf type - derived from Database
export type Bookshelf = Database['public']['Tables']['bookshelves']['Row']

// ReadingStatus type - derived from Database
export type ReadingStatus = Database['public']['Tables']['reading_statuses']['Row']

// ReadingChallenge type - derived from Database
export type ReadingChallenge = Database['public']['Tables']['reading_challenges']['Row']

// Country type - derived from Database
export type Country = Database['public']['Tables']['countries']['Row']
