// Database type definitions
// This file exports the Database type from Supabase and individual table row types

// Import the Database type from generated Supabase types
// Note: This will be populated when you run: npm run types:generate
import type { Database as SupabaseDatabase } from './supabase'

// Re-export the Database type
export type Database = SupabaseDatabase

// Export individual table row types for convenience
// These are type aliases to the table row types from the Database type
export type Book = Database['public']['Tables']['books']['Row']
export type Author = Database['public']['Tables']['authors']['Row']
export type Publisher = Database['public']['Tables']['publishers']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Bookshelf = Database['public']['Tables']['bookshelves']['Row']
export type ReadingStatus = Database['public']['Tables']['reading_status']['Row']
export type ReadingChallenge = Database['public']['Tables']['reading_challenges']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Country = Database['public']['Tables']['countries']['Row']

// Export other commonly used types
export type BindingType = Database['public']['Tables']['binding_types']['Row']
export type FormatType = Database['public']['Tables']['format_types']['Row']











