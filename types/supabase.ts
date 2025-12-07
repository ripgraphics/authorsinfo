// Generated Supabase types
// This file should be populated by running: npm run types:generate
// For now, we provide a permissive type definition to avoid build errors

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, any>
      Insert: Record<string, any>
      Update: Record<string, any>
      Relationships: any[]
    }>
    Views: Record<string, {
      Row: Record<string, any>
      Relationships: any[]
    }>
    Functions: Record<string, {
      Args: Record<string, any>
      Returns: any
    }>
    Enums: Record<string, string>
    CompositeTypes: Record<string, any>
  }
}
