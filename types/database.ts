export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          ai_enhanced: boolean | null
          ai_enhanced_performance: number | null
          ai_enhanced_text: string | null
          author_id: string | null
          book_id: string | null
          collaboration_type: string | null
          comment_count: number | null
          content_summary: string | null
          content_type: string | null
          created_at: string | null
          cross_posted_to: string[] | null
          data: Json | null
          engagement_score: number | null
          entity_id: string | null
          entity_type: string | null
          event_id: string | null
          group_id: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          like_count: number | null
          link_url: string | null
          list_id: string | null
          metadata: Json | null
          review_id: string | null
          share_count: number | null
          text: string | null
          user_id: string
          user_profile_id: string | null
          view_count: number | null
          visibility: string | null
        }
        Insert: {
          activity_type: string
          ai_enhanced?: boolean | null
          ai_enhanced_performance?: number | null
          ai_enhanced_text?: string | null
          author_id?: string | null
          book_id?: string | null
          collaboration_type?: string | null
          comment_count?: number | null
          content_summary?: string | null
          content_type?: string | null
          created_at?: string | null
          cross_posted_to?: string[] | null
          data?: Json | null
          engagement_score?: number | null
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          group_id?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          link_url?: string | null
          list_id?: string | null
          metadata?: Json | null
          review_id?: string | null
          share_count?: number | null
          text?: string | null
          user_id: string
          user_profile_id?: string | null
          view_count?: number | null
          visibility?: string | null
        }
        Update: {
          activity_type?: string
          ai_enhanced?: boolean | null
          ai_enhanced_performance?: number | null
          ai_enhanced_text?: string | null
          author_id?: string | null
          book_id?: string | null
          collaboration_type?: string | null
          comment_count?: number | null
          content_summary?: string | null
          content_type?: string | null
          created_at?: string | null
          cross_posted_to?: string[] | null
          data?: Json | null
          engagement_score?: number | null
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          group_id?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          link_url?: string | null
          list_id?: string | null
          metadata?: Json | null
          review_id?: string | null
          share_count?: number | null
          text?: string | null
          user_id?: string
          user_profile_id?: string | null
          view_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "activities_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "reading_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "book_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      activity_comments: {
        Row: {
          activity_id: string
          comment_text: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          comment_text: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          comment_text?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_likes: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_likes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          data: Json | null
          id: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          data?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          data?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_image_analysis: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          content_safety_score: number | null
          created_at: string
          id: string
          image_id: string
          metadata: Json | null
          model_version: string | null
          moderation_flags: string[] | null
          objects_detected: Json | null
          processing_time_ms: number | null
          quality_metrics: Json | null
          sentiment_score: number | null
          tags: string[] | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          content_safety_score?: number | null
          created_at?: string
          id?: string
          image_id: string
          metadata?: Json | null
          model_version?: string | null
          moderation_flags?: string[] | null
          objects_detected?: Json | null
          processing_time_ms?: number | null
          quality_metrics?: Json | null
          sentiment_score?: number | null
          tags?: string[] | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          content_safety_score?: number | null
          created_at?: string
          id?: string
          image_id?: string
          metadata?: Json | null
          model_version?: string | null
          moderation_flags?: string[] | null
          objects_detected?: Json | null
          processing_time_ms?: number | null
          quality_metrics?: Json | null
          sentiment_score?: number | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_image_analysis_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "ai_image_analysis_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      album_analytics: {
        Row: {
          album_id: string
          created_at: string | null
          date: string
          id: string
          likes: number | null
          shares: number | null
          unique_views: number | null
          views: number | null
        }
        Insert: {
          album_id: string
          created_at?: string | null
          date: string
          id?: string
          likes?: number | null
          shares?: number | null
          unique_views?: number | null
          views?: number | null
        }
        Update: {
          album_id?: string
          created_at?: string | null
          date?: string
          id?: string
          likes?: number | null
          shares?: number | null
          unique_views?: number | null
          views?: number | null
        }
        Relationships: []
      }
      album_images: {
        Row: {
          ai_tags: string[] | null
          album_id: string
          caption: string | null
          comment_count: number | null
          community_engagement: number | null
          created_at: string | null
          display_order: number
          entity_id: string | null
          entity_type_id: string | null
          id: string
          image_id: string
          is_cover: boolean | null
          is_featured: boolean | null
          last_viewed_at: string | null
          like_count: number | null
          metadata: Json | null
          performance_score: number | null
          revenue_generated: number | null
          share_count: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          ai_tags?: string[] | null
          album_id: string
          caption?: string | null
          comment_count?: number | null
          community_engagement?: number | null
          created_at?: string | null
          display_order: number
          entity_id?: string | null
          entity_type_id?: string | null
          id?: string
          image_id: string
          is_cover?: boolean | null
          is_featured?: boolean | null
          last_viewed_at?: string | null
          like_count?: number | null
          metadata?: Json | null
          performance_score?: number | null
          revenue_generated?: number | null
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          ai_tags?: string[] | null
          album_id?: string
          caption?: string | null
          comment_count?: number | null
          community_engagement?: number | null
          created_at?: string | null
          display_order?: number
          entity_id?: string | null
          entity_type_id?: string | null
          id?: string
          image_id?: string
          is_cover?: boolean | null
          is_featured?: boolean | null
          last_viewed_at?: string | null
          like_count?: number | null
          metadata?: Json | null
          performance_score?: number | null
          revenue_generated?: number | null
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "album_images_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_images_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "album_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      album_shares: {
        Row: {
          access_token: string | null
          album_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          share_type: string
          shared_by: string
          shared_with: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          album_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          share_type: string
          shared_by: string
          shared_with?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          album_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          share_type?: string
          shared_by?: string
          shared_with?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "album_shares_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "album_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "album_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "album_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      authors: {
        Row: {
          author_gallery_id: string | null
          author_image_id: string | null
          bio: string | null
          birth_date: string | null
          cover_image_id: string | null
          created_at: string | null
          facebook_handle: string | null
          featured: boolean | null
          goodreads_url: string | null
          id: string
          instagram_handle: string | null
          name: string
          nationality: string | null
          permalink: string | null
          twitter_handle: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          author_gallery_id?: string | null
          author_image_id?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          facebook_handle?: string | null
          featured?: boolean | null
          goodreads_url?: string | null
          id?: string
          instagram_handle?: string | null
          name: string
          nationality?: string | null
          permalink?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          author_gallery_id?: string | null
          author_image_id?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          facebook_handle?: string | null
          featured?: boolean | null
          goodreads_url?: string | null
          id?: string
          instagram_handle?: string | null
          name?: string
          nationality?: string | null
          permalink?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_author_image_id_fkey"
            columns: ["author_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "authors_author_image_id_fkey"
            columns: ["author_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "authors_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          end_time: string | null
          error_message: string | null
          execution_duration: unknown | null
          execution_status: string
          id: string
          input_data: Json | null
          output_data: Json | null
          performance_metrics: Json | null
          start_time: string | null
          workflow_id: string | null
        }
        Insert: {
          end_time?: string | null
          error_message?: string | null
          execution_duration?: unknown | null
          execution_status: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          performance_metrics?: Json | null
          start_time?: string | null
          workflow_id?: string | null
        }
        Update: {
          end_time?: string | null
          error_message?: string | null
          execution_duration?: unknown | null
          execution_status?: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          performance_metrics?: Json | null
          start_time?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          execution_frequency: string | null
          id: string
          is_active: boolean | null
          last_executed: string | null
          next_execution: string | null
          trigger_conditions: Json
          updated_at: string | null
          workflow_name: string
          workflow_steps: Json
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          execution_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          next_execution?: string | null
          trigger_conditions: Json
          updated_at?: string | null
          workflow_name: string
          workflow_steps: Json
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          execution_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          next_execution?: string | null
          trigger_conditions?: Json
          updated_at?: string | null
          workflow_name?: string
          workflow_steps?: Json
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "automation_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      binding_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      book_authors: {
        Row: {
          author_id: string
          book_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          book_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          book_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_authors_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_authors_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_authors_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_authors_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
        ]
      }
      book_club_books: {
        Row: {
          book_club_id: string | null
          book_id: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          book_club_id?: string | null
          book_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          book_club_id?: string | null
          book_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_club_books_book_club_id_fkey"
            columns: ["book_club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_club_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_club_books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      book_club_discussion_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          discussion_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          discussion_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          discussion_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_club_discussion_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_club_discussion_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_discussion_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_club_discussion_comments_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "book_club_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      book_club_discussions: {
        Row: {
          book_club_id: string
          book_id: string | null
          content: string | null
          created_at: string | null
          created_by: string
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          book_club_id: string
          book_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          book_club_id?: string
          book_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_club_discussions_book_club_id_fkey"
            columns: ["book_club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_club_discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_discussions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_club_discussions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_discussions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      book_club_members: {
        Row: {
          book_club_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          book_club_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          book_club_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_club_members_book_club_id_fkey"
            columns: ["book_club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      book_clubs: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          current_book_id: string | null
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          current_book_id?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          current_book_id?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_clubs_current_book_id_fkey"
            columns: ["current_book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_clubs_current_book_id_fkey"
            columns: ["current_book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_clubs_current_book_id_fkey"
            columns: ["current_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_clubs_current_book_id_fkey"
            columns: ["current_book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
        ]
      }
      book_genre_mappings: {
        Row: {
          book_id: string
          genre_id: string
          id: string
        }
        Insert: {
          book_id: string
          genre_id: string
          id?: string
        }
        Update: {
          book_id?: string
          genre_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_genre_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_genre_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_genre_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_genre_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_genre_mappings_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "book_genres"
            referencedColumns: ["id"]
          },
        ]
      }
      book_genres: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      book_id_mapping: {
        Row: {
          match_method: string
          new_id: string
          old_id: number
        }
        Insert: {
          match_method: string
          new_id: string
          old_id: number
        }
        Update: {
          match_method?: string
          new_id?: string
          old_id?: number
        }
        Relationships: []
      }
      book_popularity_metrics: {
        Row: {
          avg_rating: number | null
          book_id: string
          id: string
          last_updated: string
          reading_list_count: number | null
          reading_progress_count: number | null
          reviews_count: number | null
          views_count: number | null
        }
        Insert: {
          avg_rating?: number | null
          book_id: string
          id?: string
          last_updated?: string
          reading_list_count?: number | null
          reading_progress_count?: number | null
          reviews_count?: number | null
          views_count?: number | null
        }
        Update: {
          avg_rating?: number | null
          book_id?: string
          id?: string
          last_updated?: string
          reading_list_count?: number | null
          reading_progress_count?: number | null
          reviews_count?: number | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_popularity_metrics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_popularity_metrics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_popularity_metrics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_popularity_metrics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
        ]
      }
      book_publishers: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          publisher_id: string
          updated_at: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          publisher_id: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          publisher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_publishers_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_publishers_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_publishers_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_publishers_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_publishers_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_summary"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "book_publishers_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      book_recommendations: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          score: number
          source_book_id: string | null
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          score: number
          source_book_id?: string | null
          source_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          score?: number
          source_book_id?: string | null
          source_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_recommendations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_recommendations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_recommendations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_recommendations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reviews: {
        Row: {
          book_id: string | null
          contains_spoilers: boolean | null
          created_at: string | null
          group_id: string | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          book_id?: string | null
          contains_spoilers?: boolean | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          book_id?: string | null
          contains_spoilers?: boolean | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      book_similarity_scores: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          similar_book_id: string | null
          similarity_score: number | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          similar_book_id?: string | null
          similarity_score?: number | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          similar_book_id?: string | null
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_similarity_scores_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_similarity_scores_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_similarity_scores_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_similarity_scores_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
        ]
      }
      book_subjects: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_subjects_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_subjects_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_subjects_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_subjects_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      book_tag_mappings: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          tag_id: string
          updated_at: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          tag_id: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          tag_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_tag_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_tag_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_tag_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_tag_mappings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_tag_mappings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "book_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      book_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      book_views: {
        Row: {
          book_id: string | null
          id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          book_id?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          book_id?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_views_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_views_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "book_views_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_views_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "book_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          bookmark_folder: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_private: boolean | null
          notes: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bookmark_folder?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_private?: boolean | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bookmark_folder?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_private?: boolean | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          author_id: string | null
          average_rating: number | null
          binding: string | null
          binding_type_id: string | null
          book_gallery_img: string[] | null
          cover_image_id: string | null
          created_at: string
          dimensions: string | null
          edition: string | null
          featured: boolean
          format_type_id: string | null
          id: string
          isbn10: string | null
          isbn13: string | null
          language: string | null
          list_price: number | null
          original_image_url: string | null
          overview: string | null
          pages: number | null
          permalink: string | null
          publication_date: string | null
          publisher_id: string | null
          review_count: number | null
          status_id: string | null
          synopsis: string | null
          title: string
          title_long: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          author?: string | null
          author_id?: string | null
          average_rating?: number | null
          binding?: string | null
          binding_type_id?: string | null
          book_gallery_img?: string[] | null
          cover_image_id?: string | null
          created_at?: string
          dimensions?: string | null
          edition?: string | null
          featured?: boolean
          format_type_id?: string | null
          id?: string
          isbn10?: string | null
          isbn13?: string | null
          language?: string | null
          list_price?: number | null
          original_image_url?: string | null
          overview?: string | null
          pages?: number | null
          permalink?: string | null
          publication_date?: string | null
          publisher_id?: string | null
          review_count?: number | null
          status_id?: string | null
          synopsis?: string | null
          title: string
          title_long?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          author?: string | null
          author_id?: string | null
          average_rating?: number | null
          binding?: string | null
          binding_type_id?: string | null
          book_gallery_img?: string[] | null
          cover_image_id?: string | null
          created_at?: string
          dimensions?: string | null
          edition?: string | null
          featured?: boolean
          format_type_id?: string | null
          id?: string
          isbn10?: string | null
          isbn13?: string | null
          language?: string | null
          list_price?: number | null
          original_image_url?: string | null
          overview?: string | null
          pages?: number | null
          permalink?: string | null
          publication_date?: string | null
          publisher_id?: string | null
          review_count?: number | null
          status_id?: string | null
          synopsis?: string | null
          title?: string
          title_long?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_binding_type_id_fkey"
            columns: ["binding_type_id"]
            isOneToOne: false
            referencedRelation: "binding_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "books_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_format_type_id_fkey"
            columns: ["format_type_id"]
            isOneToOne: false
            referencedRelation: "format_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_summary"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "books_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_images: {
        Row: {
          active: boolean | null
          alt_text: string | null
          carousel_name: string | null
          id: string
          image_url: string | null
          position: number | null
        }
        Insert: {
          active?: boolean | null
          alt_text?: string | null
          carousel_name?: string | null
          id?: string
          image_url?: string | null
          position?: number | null
        }
        Update: {
          active?: boolean | null
          alt_text?: string | null
          carousel_name?: string | null
          id?: string
          image_url?: string | null
          position?: number | null
        }
        Relationships: []
      }
      collaborative_filtering_data: {
        Row: {
          context_data: Json | null
          id: string
          interaction_strength: number | null
          interaction_timestamp: string | null
          interaction_type: string
          item_id: string | null
          item_type: string
          user_id: string | null
        }
        Insert: {
          context_data?: Json | null
          id?: string
          interaction_strength?: number | null
          interaction_timestamp?: string | null
          interaction_type: string
          item_id?: string | null
          item_type: string
          user_id?: string | null
        }
        Update: {
          context_data?: Json | null
          id?: string
          interaction_strength?: number | null
          interaction_timestamp?: string | null
          interaction_type?: string
          item_id?: string | null
          item_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_filtering_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "collaborative_filtering_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_filtering_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "photo_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          feed_entry_id: string | null
          id: string
          is_deleted: boolean
          is_hidden: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feed_entry_id?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feed_entry_id?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_feed_entry_id_fkey"
            columns: ["feed_entry_id"]
            isOneToOne: false
            referencedRelation: "feed_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_info: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          entity_id: string
          entity_type: string
          id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          entity_id: string
          entity_type: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      content_features: {
        Row: {
          content_id: string
          content_type: string
          feature_importance: number | null
          feature_name: string
          feature_value: Json
          id: string
          last_updated: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          feature_importance?: number | null
          feature_name: string
          feature_value: Json
          id?: string
          last_updated?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          feature_importance?: number | null
          feature_name?: string
          feature_value?: Json
          id?: string
          last_updated?: string | null
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          flag_details: string | null
          flag_reason: string
          flagged_by: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          flag_details?: string | null
          flag_reason: string
          flagged_by: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          flag_details?: string | null
          flag_reason?: string
          flagged_by?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_flags_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_flags_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_generation_jobs: {
        Row: {
          completed_at: string | null
          content_metadata: Json | null
          content_type: string
          created_at: string | null
          created_by: string | null
          generated_content: string | null
          generation_status: string
          id: string
          input_parameters: Json
          quality_score: number | null
        }
        Insert: {
          completed_at?: string | null
          content_metadata?: Json | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          generated_content?: string | null
          generation_status?: string
          id?: string
          input_parameters: Json
          quality_score?: number | null
        }
        Update: {
          completed_at?: string | null
          content_metadata?: Json | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          generated_content?: string | null
          generation_status?: string
          id?: string
          input_parameters?: Json
          quality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_generation_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_generation_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_generation_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          continent: string | null
          created_at: string | null
          id: string
          name: string
          phone_code: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          continent?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone_code?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          continent?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          id: string
          permission_type: string
          target_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          permission_type: string
          target_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          permission_type?: string
          target_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_permissions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_enrichment_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          enrichment_config: Json
          enrichment_status: string
          enrichment_type: string
          id: string
          records_processed: number | null
          records_updated: number | null
          target_column: string
          target_table: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          enrichment_config: Json
          enrichment_status?: string
          enrichment_type: string
          id?: string
          records_processed?: number | null
          records_updated?: number | null
          target_column: string
          target_table: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          enrichment_config?: Json
          enrichment_status?: string
          enrichment_type?: string
          id?: string
          records_processed?: number | null
          records_updated?: number | null
          target_column?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_enrichment_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "data_enrichment_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_enrichment_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dewey_decimal_classifications: {
        Row: {
          code: string
          created_at: string | null
          description: string
          id: string
          level: number
          parent_code: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          id?: string
          level?: number
          parent_code?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          id?: string
          level?: number
          parent_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dewey_decimal_classifications_parent_code_fkey"
            columns: ["parent_code"]
            isOneToOne: false
            referencedRelation: "dewey_decimal_classifications"
            referencedColumns: ["code"]
          },
        ]
      }
      discussion_comments: {
        Row: {
          content: string
          created_at: string | null
          discussion_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          discussion_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          discussion_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          book_id: string | null
          category_id: number | null
          content: string
          created_at: string | null
          group_id: string | null
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          category_id?: number | null
          content: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          category_id?: number | null
          content?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_analytics: {
        Row: {
          action: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      enterprise_audit_trail: {
        Row: {
          application_version: string | null
          changed_at: string
          changed_by: string
          environment: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          session_id: string | null
          table_name: string
          transaction_id: string | null
          user_agent: string | null
        }
        Insert: {
          application_version?: string | null
          changed_at?: string
          changed_by: string
          environment?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          session_id?: string | null
          table_name: string
          transaction_id?: string | null
          user_agent?: string | null
        }
        Update: {
          application_version?: string | null
          changed_at?: string
          changed_by?: string
          environment?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          session_id?: string | null
          table_name?: string
          transaction_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      enterprise_data_lineage: {
        Row: {
          created_at: string
          data_flow_description: string | null
          id: string
          source_column: string | null
          source_table: string
          target_column: string | null
          target_table: string
          transformation_logic: string | null
          transformation_type: string
        }
        Insert: {
          created_at?: string
          data_flow_description?: string | null
          id?: string
          source_column?: string | null
          source_table: string
          target_column?: string | null
          target_table: string
          transformation_logic?: string | null
          transformation_type: string
        }
        Update: {
          created_at?: string
          data_flow_description?: string | null
          id?: string
          source_column?: string | null
          source_table?: string
          target_column?: string | null
          target_table?: string
          transformation_logic?: string | null
          transformation_type?: string
        }
        Relationships: []
      }
      enterprise_data_quality_rules: {
        Row: {
          column_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          rule_definition: string
          rule_name: string
          rule_type: string
          severity: string
          table_name: string
          updated_at: string
        }
        Insert: {
          column_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_definition: string
          rule_name: string
          rule_type: string
          severity: string
          table_name: string
          updated_at?: string
        }
        Update: {
          column_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_definition?: string
          rule_name?: string
          rule_type?: string
          severity?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_data_versions: {
        Row: {
          change_reason: string | null
          created_at: string
          created_by: string
          data_snapshot: Json
          id: string
          is_current: boolean | null
          record_id: string
          table_name: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          created_by: string
          data_snapshot: Json
          id?: string
          is_current?: boolean | null
          record_id: string
          table_name: string
          version_number: number
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          created_by?: string
          data_snapshot?: Json
          id?: string
          is_current?: boolean | null
          record_id?: string
          table_name?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_data_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string | null
          description: string | null
          engagement_count: number | null
          id: string
          last_engagement: string | null
          last_post: string | null
          metadata: Json | null
          name: string | null
          post_count: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          engagement_count?: number | null
          id?: string
          last_engagement?: string | null
          last_post?: string | null
          metadata?: Json | null
          name?: string | null
          post_count?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          engagement_count?: number | null
          id?: string
          last_engagement?: string | null
          last_post?: string | null
          metadata?: Json | null
          name?: string | null
          post_count?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      entity_tags: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_verified: boolean | null
          tag_category: string | null
          tag_color: string | null
          tag_name: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_verified?: boolean | null
          tag_category?: string | null
          tag_color?: string | null
          tag_name: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_verified?: boolean | null
          tag_category?: string | null
          tag_color?: string | null
          tag_name?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "entity_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      entity_types: {
        Row: {
          created_at: string | null
          description: string | null
          entity_category: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_category?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_category?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_analytics: {
        Row: {
          cancellations: number | null
          comments: number | null
          created_at: string | null
          date: string
          event_id: string
          id: string
          likes: number | null
          registrations: number | null
          shares: number | null
          unique_visitors: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          cancellations?: number | null
          comments?: number | null
          created_at?: string | null
          date: string
          event_id: string
          id?: string
          likes?: number | null
          registrations?: number | null
          shares?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          cancellations?: number | null
          comments?: number | null
          created_at?: string | null
          date?: string
          event_id?: string
          id?: string
          likes?: number | null
          registrations?: number | null
          shares?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      event_approvals: {
        Row: {
          approval_status: string | null
          event_id: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          submitted_at: string | null
          submitted_by: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          event_id: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          submitted_at?: string | null
          submitted_by: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          event_id?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          submitted_at?: string | null
          submitted_by?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_books: {
        Row: {
          book_id: string
          created_at: string | null
          display_order: number | null
          event_id: string
          feature_type: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          display_order?: number | null
          event_id: string
          feature_type?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          feature_type?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "event_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_books_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_calendar_exports: {
        Row: {
          calendar_event_id: string | null
          calendar_type: string | null
          created_at: string | null
          event_id: string
          id: string
          synced_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          calendar_type?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          synced_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
          calendar_type?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          synced_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_chat_messages: {
        Row: {
          chat_room_id: string
          created_at: string | null
          hidden_by: string | null
          hidden_reason: string | null
          id: string
          is_hidden: boolean | null
          message: string
          user_id: string
        }
        Insert: {
          chat_room_id: string
          created_at?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean | null
          message: string
          user_id: string
        }
        Update: {
          chat_room_id?: string
          created_at?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chat_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "event_chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_chat_rooms: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          is_active: boolean | null
          is_moderated: boolean | null
          moderator_ids: string[] | null
          name: string
          requires_ticket: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          is_moderated?: boolean | null
          moderator_ids?: string[] | null
          name: string
          requires_ticket?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          is_moderated?: boolean | null
          moderator_ids?: string[] | null
          name?: string
          requires_ticket?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_chat_rooms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          id: string
          is_hidden: boolean | null
          is_pinned: boolean | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "event_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_creator_permissions: {
        Row: {
          approved_categories: string[] | null
          attendee_limit: number | null
          can_create_paid_events: boolean | null
          created_at: string | null
          id: string
          permission_level: string | null
          requires_approval: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_categories?: string[] | null
          attendee_limit?: number | null
          can_create_paid_events?: boolean | null
          created_at?: string | null
          id?: string
          permission_level?: string | null
          requires_approval?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_categories?: string[] | null
          attendee_limit?: number | null
          can_create_paid_events?: boolean | null
          created_at?: string | null
          id?: string
          permission_level?: string | null
          requires_approval?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_creator_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_financials: {
        Row: {
          created_at: string | null
          currency: string | null
          event_id: string
          id: string
          net_revenue: number | null
          organizer_fees: number | null
          payout_date: string | null
          payout_method: string | null
          payout_reference: string | null
          payout_status: string | null
          ticket_sales_breakdown: Json | null
          total_fees: number | null
          total_refunds: number | null
          total_revenue: number | null
          total_taxes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          event_id: string
          id?: string
          net_revenue?: number | null
          organizer_fees?: number | null
          payout_date?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          ticket_sales_breakdown?: Json | null
          total_fees?: number | null
          total_refunds?: number | null
          total_revenue?: number | null
          total_taxes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          event_id?: string
          id?: string
          net_revenue?: number | null
          organizer_fees?: number | null
          payout_date?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          ticket_sales_breakdown?: Json | null
          total_fees?: number | null
          total_refunds?: number | null
          total_revenue?: number | null
          total_taxes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_financials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          interest_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          interest_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          interest_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_likes: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_livestreams: {
        Row: {
          created_at: string | null
          embed_code: string | null
          end_time: string | null
          event_id: string
          id: string
          is_active: boolean | null
          max_concurrent_viewers: number | null
          provider: string | null
          recording_url: string | null
          requires_ticket: boolean | null
          start_time: string | null
          stream_key: string | null
          stream_url: string
          ticket_types: string[] | null
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          created_at?: string | null
          embed_code?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          max_concurrent_viewers?: number | null
          provider?: string | null
          recording_url?: string | null
          requires_ticket?: boolean | null
          start_time?: string | null
          stream_key?: string | null
          stream_url: string
          ticket_types?: string[] | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          created_at?: string | null
          embed_code?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          max_concurrent_viewers?: number | null
          provider?: string | null
          recording_url?: string | null
          requires_ticket?: boolean | null
          start_time?: string | null
          stream_key?: string | null
          stream_url?: string
          ticket_types?: string[] | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_livestreams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_locations: {
        Row: {
          accessibility_info: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          event_id: string
          google_place_id: string | null
          id: string
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          state: string | null
          updated_at: string | null
          venue_notes: string | null
        }
        Insert: {
          accessibility_info?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          event_id: string
          google_place_id?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          venue_notes?: string | null
        }
        Update: {
          accessibility_info?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          event_id?: string
          google_place_id?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          venue_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_media: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration: number | null
          event_id: string
          file_size: number | null
          file_type: string | null
          height: number | null
          id: string
          media_type: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: number | null
          event_id: string
          file_size?: number | null
          file_type?: string | null
          height?: number | null
          id?: string
          media_type?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: number | null
          event_id?: string
          file_size?: number | null
          file_type?: string | null
          height?: number | null
          id?: string
          media_type?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_permission_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          request_reason: string | null
          requested_level: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          request_reason?: string | null
          requested_level?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          request_reason?: string | null
          requested_level?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_permission_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_permission_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_questions: {
        Row: {
          created_at: string | null
          display_order: number | null
          event_id: string
          help_text: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          question: string
          question_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          event_id: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question: string
          question_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question?: string
          question_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          additional_guests: number | null
          answers: Json | null
          check_in_time: string | null
          created_at: string | null
          event_id: string
          guest_names: Json | null
          id: string
          notes: string | null
          registration_source: string | null
          registration_status: string | null
          registration_time: string | null
          session_ids: string[] | null
          ticket_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_guests?: number | null
          answers?: Json | null
          check_in_time?: string | null
          created_at?: string | null
          event_id: string
          guest_names?: Json | null
          id?: string
          notes?: string | null
          registration_source?: string | null
          registration_status?: string | null
          registration_time?: string | null
          session_ids?: string[] | null
          ticket_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_guests?: number | null
          answers?: Json | null
          check_in_time?: string | null
          created_at?: string | null
          event_id?: string
          guest_names?: Json | null
          id?: string
          notes?: string | null
          registration_source?: string | null
          registration_status?: string | null
          registration_time?: string | null
          session_ids?: string[] | null
          ticket_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          notification_sent: boolean | null
          notification_time: string | null
          reminder_time: string
          reminder_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          notification_sent?: boolean | null
          notification_time?: string | null
          reminder_time: string
          reminder_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          notification_sent?: boolean | null
          notification_time?: string | null
          reminder_time?: string
          reminder_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          event_id: string
          id: string
          location_id: string | null
          max_attendees: number | null
          requires_separate_registration: boolean | null
          session_materials: Json | null
          speaker_ids: string[] | null
          start_time: string
          title: string
          updated_at: string | null
          virtual_meeting_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          event_id: string
          id?: string
          location_id?: string | null
          max_attendees?: number | null
          requires_separate_registration?: boolean | null
          session_materials?: Json | null
          speaker_ids?: string[] | null
          start_time: string
          title: string
          updated_at?: string | null
          virtual_meeting_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_id?: string
          id?: string
          location_id?: string | null
          max_attendees?: number | null
          requires_separate_registration?: boolean | null
          session_materials?: Json | null
          speaker_ids?: string[] | null
          start_time?: string
          title?: string
          updated_at?: string | null
          virtual_meeting_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_shares: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          share_platform: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          share_platform?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          share_platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_shares_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          author_id: string | null
          bio: string | null
          created_at: string | null
          event_id: string
          headshot_url: string | null
          id: string
          name: string
          presentation_description: string | null
          presentation_title: string | null
          session_ids: string[] | null
          social_links: Json | null
          speaker_order: number | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          author_id?: string | null
          bio?: string | null
          created_at?: string | null
          event_id: string
          headshot_url?: string | null
          id?: string
          name: string
          presentation_description?: string | null
          presentation_title?: string | null
          session_ids?: string[] | null
          social_links?: Json | null
          speaker_order?: number | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          author_id?: string | null
          bio?: string | null
          created_at?: string | null
          event_id?: string
          headshot_url?: string | null
          id?: string
          name?: string
          presentation_description?: string | null
          presentation_title?: string | null
          session_ids?: string[] | null
          social_links?: Json | null
          speaker_order?: number | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "event_speakers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          benefits_description: string | null
          contact_email: string | null
          contact_name: string | null
          contribution_amount: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          event_id: string
          id: string
          is_featured: boolean | null
          logo_url: string | null
          name: string
          sponsor_level: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          benefits_description?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contribution_amount?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          sponsor_level?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          benefits_description?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contribution_amount?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          sponsor_level?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          permissions: Json | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_surveys: {
        Row: {
          available_from: string | null
          available_until: string | null
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          is_active: boolean | null
          is_anonymous: boolean | null
          requires_ticket: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          requires_ticket?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          requires_ticket?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_surveys_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          created_at: string | null
          event_id: string
          tag_id: number
        }
        Insert: {
          created_at?: string | null
          event_id: string
          tag_id: number
        }
        Update: {
          created_at?: string | null
          event_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_views: {
        Row: {
          event_id: string
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          event_id: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_waitlists: {
        Row: {
          converted_to_registration_id: string | null
          created_at: string | null
          event_id: string
          expiration_time: string | null
          id: string
          notification_sent_at: string | null
          position: number
          status: string | null
          ticket_type_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          converted_to_registration_id?: string | null
          created_at?: string | null
          event_id: string
          expiration_time?: string | null
          id?: string
          notification_sent_at?: string | null
          position: number
          status?: string | null
          ticket_type_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          converted_to_registration_id?: string | null
          created_at?: string | null
          event_id?: string
          expiration_time?: string | null
          id?: string
          notification_sent_at?: string | null
          position?: number
          status?: string | null
          ticket_type_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          author_id: string | null
          book_id: string | null
          canonical_url: string | null
          content_blocks: Json | null
          cover_image_id: string | null
          created_at: string | null
          created_by: string
          currency: string | null
          description: string | null
          end_date: string
          event_category_id: string | null
          event_image_id: string | null
          featured: boolean | null
          format: string | null
          group_id: string | null
          id: string
          is_free: boolean | null
          is_recurring: boolean | null
          max_attendees: number | null
          parent_event_id: string | null
          permalink: string | null
          price: number | null
          published_at: string | null
          publisher_id: string | null
          recurrence_pattern: Json | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          requires_registration: boolean | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          start_date: string
          status: string | null
          subtitle: string | null
          summary: string | null
          timezone: string | null
          title: string
          type_id: string | null
          updated_at: string | null
          virtual_meeting_id: string | null
          virtual_meeting_password: string | null
          virtual_meeting_url: string | null
          virtual_platform: string | null
          visibility: string | null
        }
        Insert: {
          all_day?: boolean | null
          author_id?: string | null
          book_id?: string | null
          canonical_url?: string | null
          content_blocks?: Json | null
          cover_image_id?: string | null
          created_at?: string | null
          created_by: string
          currency?: string | null
          description?: string | null
          end_date: string
          event_category_id?: string | null
          event_image_id?: string | null
          featured?: boolean | null
          format?: string | null
          group_id?: string | null
          id?: string
          is_free?: boolean | null
          is_recurring?: boolean | null
          max_attendees?: number | null
          parent_event_id?: string | null
          permalink?: string | null
          price?: number | null
          published_at?: string | null
          publisher_id?: string | null
          recurrence_pattern?: Json | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          requires_registration?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          start_date: string
          status?: string | null
          subtitle?: string | null
          summary?: string | null
          timezone?: string | null
          title: string
          type_id?: string | null
          updated_at?: string | null
          virtual_meeting_id?: string | null
          virtual_meeting_password?: string | null
          virtual_meeting_url?: string | null
          virtual_platform?: string | null
          visibility?: string | null
        }
        Update: {
          all_day?: boolean | null
          author_id?: string | null
          book_id?: string | null
          canonical_url?: string | null
          content_blocks?: Json | null
          cover_image_id?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          description?: string | null
          end_date?: string
          event_category_id?: string | null
          event_image_id?: string | null
          featured?: boolean | null
          format?: string | null
          group_id?: string | null
          id?: string
          is_free?: boolean | null
          is_recurring?: boolean | null
          max_attendees?: number | null
          parent_event_id?: string | null
          permalink?: string | null
          price?: number | null
          published_at?: string | null
          publisher_id?: string | null
          recurrence_pattern?: Json | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          requires_registration?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          start_date?: string
          status?: string | null
          subtitle?: string | null
          summary?: string | null
          timezone?: string | null
          title?: string
          type_id?: string | null
          updated_at?: string | null
          virtual_meeting_id?: string | null
          virtual_meeting_password?: string | null
          virtual_meeting_url?: string | null
          virtual_platform?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "events_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "events_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_event_image_id_fkey"
            columns: ["event_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "events_event_image_id_fkey"
            columns: ["event_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_summary"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "events_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_entries: {
        Row: {
          allowed_user_ids: string[] | null
          content: Json
          created_at: string
          entity_id: string | null
          entity_type: string | null
          group_id: string | null
          id: string
          is_deleted: boolean
          is_hidden: boolean
          type: string
          updated_at: string
          user_id: string | null
          visibility: string
        }
        Insert: {
          allowed_user_ids?: string[] | null
          content: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          group_id?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean
          type: string
          updated_at?: string
          user_id?: string | null
          visibility?: string
        }
        Update: {
          allowed_user_ids?: string[] | null
          content?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          group_id?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean
          type?: string
          updated_at?: string
          user_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_entry_tags: {
        Row: {
          created_at: string | null
          feed_entry_id: string
          tag_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feed_entry_id: string
          tag_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feed_entry_id?: string
          tag_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_entry_tags_feed_entry_id_fkey"
            columns: ["feed_entry_id"]
            isOneToOne: false
            referencedRelation: "feed_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_target_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          target_type_id: string | null
          target_type_id_uuid_temp: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          target_type_id?: string | null
          target_type_id_uuid_temp?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          target_type_id?: string | null
          target_type_id_uuid_temp?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      format_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      friend_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          friend_id: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          friend_id: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          friend_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_activities_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_activities_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_activities_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friend_analytics: {
        Row: {
          created_at: string | null
          friend_requests_accepted: number | null
          friend_requests_received: number | null
          friend_requests_rejected: number | null
          friend_requests_sent: number | null
          id: string
          last_activity_at: string | null
          total_friends: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_requests_accepted?: number | null
          friend_requests_received?: number | null
          friend_requests_rejected?: number | null
          friend_requests_sent?: number | null
          id?: string
          last_activity_at?: string | null
          total_friends?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_requests_accepted?: number | null
          friend_requests_received?: number | null
          friend_requests_rejected?: number | null
          friend_requests_sent?: number | null
          id?: string
          last_activity_at?: string | null
          total_friends?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friend_suggestions: {
        Row: {
          common_interests: string[] | null
          created_at: string | null
          id: string
          is_dismissed: boolean | null
          mutual_friends_count: number | null
          suggested_user_id: string
          suggestion_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          common_interests?: string[] | null
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          mutual_friends_count?: number | null
          suggested_user_id: string
          suggestion_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          common_interests?: string[] | null
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          mutual_friends_count?: number | null
          suggested_user_id?: string
          suggestion_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_suggestions_suggested_user_id_fkey"
            columns: ["suggested_user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_suggestions_suggested_user_id_fkey"
            columns: ["suggested_user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_suggestions_suggested_user_id_fkey"
            columns: ["suggested_user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          requested_at: string
          requested_by: string
          responded_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          requested_at?: string
          requested_by: string
          responded_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          requested_at?: string
          requested_by?: string
          responded_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_achievements: {
        Row: {
          created_at: string | null
          criteria: string | null
          description: string | null
          group_id: string
          icon_url: string | null
          id: string
          name: string
          points: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria?: string | null
          description?: string | null
          group_id: string
          icon_url?: string | null
          id?: string
          name: string
          points?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: string | null
          description?: string | null
          group_id?: string
          icon_url?: string | null
          id?: string
          name?: string
          points?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      group_analytics: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          metric_name: string
          metric_value: number | null
          recorded_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          metric_name: string
          metric_value?: number | null
          recorded_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          metric_name?: string
          metric_value?: number | null
          recorded_at?: string | null
        }
        Relationships: []
      }
      group_announcements: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          is_pinned: boolean | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string | null
        }
        Relationships: []
      }
      group_audit_log: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          group_id: string | null
          id: string
          performed_by: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          group_id?: string | null
          id?: string
          performed_by?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          group_id?: string | null
          id?: string
          performed_by?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      group_author_events: {
        Row: {
          author_id: string | null
          event_id: string | null
          group_id: string | null
          id: string
          scheduled_at: string | null
        }
        Insert: {
          author_id?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          scheduled_at?: string | null
        }
        Update: {
          author_id?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          scheduled_at?: string | null
        }
        Relationships: []
      }
      group_book_list_items: {
        Row: {
          added_at: string | null
          added_by: string | null
          book_id: string | null
          id: string
          list_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          book_id?: string | null
          id?: string
          list_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          book_id?: string | null
          id?: string
          list_id?: string | null
        }
        Relationships: []
      }
      group_book_lists: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          group_id: string | null
          id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
        }
        Relationships: []
      }
      group_book_reviews: {
        Row: {
          book_id: string | null
          created_at: string | null
          group_id: string | null
          id: string
          rating: number | null
          review: string | null
          user_id: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id: string
          rating?: number | null
          review?: string | null
          user_id?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_book_swaps: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          book_id: string | null
          created_at: string | null
          group_id: string | null
          id: string
          offered_by: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          book_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id: string
          offered_by?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          book_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          offered_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      group_book_wishlist_items: {
        Row: {
          added_at: string | null
          added_by: string | null
          book_id: string | null
          id: string
          wishlist_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          book_id?: string | null
          id?: string
          wishlist_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          book_id?: string | null
          id?: string
          wishlist_id?: string | null
        }
        Relationships: []
      }
      group_book_wishlists: {
        Row: {
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
        }
        Relationships: []
      }
      group_books: {
        Row: {
          added_at: string | null
          added_by: string | null
          book_id: string
          group_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          book_id: string
          group_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          book_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_books_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "group_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_books_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_bots: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          group_id: string | null
          id: string
          name: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      group_chat_channels: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string | null
          group_id: string | null
          id: string
          is_event_channel: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          is_event_channel?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          is_event_channel?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      group_chat_message_attachments: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string | null
          id: string
          message_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      group_chat_message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string | null
          reaction: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          reaction?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          reaction?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_chat_messages: {
        Row: {
          channel_id: string | null
          created_at: string | null
          id: string
          is_hidden: boolean | null
          message: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_content_moderation_logs: {
        Row: {
          action: string | null
          content_id: string | null
          content_type: string | null
          created_at: string | null
          group_id: string | null
          id: string
          reason: string | null
          reviewed_by: string | null
        }
        Insert: {
          action?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          reason?: string | null
          reviewed_by?: string | null
        }
        Update: {
          action?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          reason?: string | null
          reviewed_by?: string | null
        }
        Relationships: []
      }
      group_custom_fields: {
        Row: {
          created_at: string | null
          field_name: string | null
          field_options: Json | null
          field_type: string | null
          group_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          field_name?: string | null
          field_options?: Json | null
          field_type?: string | null
          group_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          field_name?: string | null
          field_options?: Json | null
          field_type?: string | null
          group_id?: string | null
          id?: string
        }
        Relationships: []
      }
      group_discussion_categories: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_event_feedback: {
        Row: {
          created_at: string | null
          event_id: string | null
          feedback: string | null
          group_id: string | null
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          feedback?: string | null
          group_id?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          feedback?: string | null
          group_id?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_events: {
        Row: {
          chat_channel_id: string | null
          created_at: string | null
          event_id: string | null
          group_id: string | null
          id: string
          is_recurring: boolean | null
          recurrence_pattern: Json | null
        }
        Insert: {
          chat_channel_id?: string | null
          created_at?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
        }
        Update: {
          chat_channel_id?: string | null
          created_at?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
        }
        Relationships: []
      }
      group_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          group_id: string | null
          id: string
          type: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          type?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          type?: string | null
        }
        Relationships: []
      }
      group_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string | null
          expires_at: string | null
          group_id: string | null
          id: string
          invite_code: string | null
          invited_user_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          invite_code?: string | null
          invited_user_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          invite_code?: string | null
          invited_user_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      group_leaderboards: {
        Row: {
          data: Json | null
          generated_at: string | null
          group_id: string | null
          id: string
          leaderboard_type: string | null
        }
        Insert: {
          data?: Json | null
          generated_at?: string | null
          group_id?: string | null
          id?: string
          leaderboard_type?: string | null
        }
        Update: {
          data?: Json | null
          generated_at?: string | null
          group_id?: string | null
          id?: string
          leaderboard_type?: string | null
        }
        Relationships: []
      }
      group_member_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          earned_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          earned_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          earned_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      group_member_devices: {
        Row: {
          created_at: string | null
          device_token: string | null
          device_type: string | null
          group_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_token?: string | null
          device_type?: string | null
          group_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_token?: string | null
          device_type?: string | null
          group_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      group_member_streaks: {
        Row: {
          current_streak: number | null
          group_id: string | null
          id: string
          last_active_date: string | null
          longest_streak: number | null
          streak_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_streak?: number | null
          group_id?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          streak_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_streak?: number | null
          group_id?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          streak_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          role_id: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          role_id?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          role_id?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_membership_questions: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_required: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_required?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_required?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_moderation_logs: {
        Row: {
          action: string | null
          created_at: string | null
          group_id: string | null
          id: string
          performed_by: string | null
          reason: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          performed_by?: string | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          performed_by?: string | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      group_onboarding_checklists: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: string | null
          id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
        }
        Relationships: []
      }
      group_onboarding_progress: {
        Row: {
          checklist_id: string | null
          completed_at: string | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          checklist_id?: string | null
          completed_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          checklist_id?: string | null
          completed_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_onboarding_tasks: {
        Row: {
          checklist_id: string | null
          created_at: string | null
          id: string
          order_index: number | null
          task: string | null
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          task?: string | null
        }
        Update: {
          checklist_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          task?: string | null
        }
        Relationships: []
      }
      group_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number | null
          poll_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index?: number | null
          poll_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number | null
          poll_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_polls: {
        Row: {
          allow_multiple: boolean | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          group_id: string | null
          id: string
          is_anonymous: boolean | null
          options: string[] | null
          question: string
        }
        Insert: {
          allow_multiple?: boolean | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          options?: string[] | null
          question: string
        }
        Update: {
          allow_multiple?: boolean | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          options?: string[] | null
          question?: string
        }
        Relationships: []
      }
      group_reading_challenge_progress: {
        Row: {
          books_read: number | null
          challenge_id: string | null
          id: string
          progress_details: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          books_read?: number | null
          challenge_id?: string | null
          id?: string
          progress_details?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          books_read?: number | null
          challenge_id?: string | null
          id?: string
          progress_details?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_reading_challenges: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          group_id: string | null
          id: string
          start_date: string | null
          target_books: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          start_date?: string | null
          target_books?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          start_date?: string | null
          target_books?: number | null
          title?: string | null
        }
        Relationships: []
      }
      group_reading_progress: {
        Row: {
          book_id: string | null
          finished_at: string | null
          group_id: string | null
          id: string
          progress_percentage: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          book_id?: string | null
          finished_at?: string | null
          group_id?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          book_id?: string | null
          finished_at?: string | null
          group_id?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_reading_sessions: {
        Row: {
          book_id: string | null
          created_at: string | null
          created_by: string | null
          end_time: string | null
          group_id: string | null
          id: string
          session_description: string | null
          session_title: string | null
          start_time: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          group_id?: string | null
          id?: string
          session_description?: string | null
          session_title?: string | null
          start_time?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          group_id?: string | null
          id?: string
          session_description?: string | null
          session_title?: string | null
          start_time?: string | null
        }
        Relationships: []
      }
      group_reports: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          reason: string | null
          reported_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          reason?: string | null
          reported_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          reason?: string | null
          reported_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      group_roles: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: string
          id: string
          is_default: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id: string
          id?: string
          is_default?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      group_rules: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: string
          id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id: string
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: string
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_shared_documents: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      group_tags: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_types: {
        Row: {
          display_name: string
          id: string
          slug: string
        }
        Insert: {
          display_name: string
          id?: string
          slug: string
        }
        Update: {
          display_name?: string
          id?: string
          slug?: string
        }
        Relationships: []
      }
      group_webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          response_code: number | null
          status: string | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          response_code?: number | null
          status?: string | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          response_code?: number | null
          status?: string | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      group_webhooks: {
        Row: {
          created_at: string | null
          event_types: string[] | null
          group_id: string | null
          id: string
          secret: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          event_types?: string[] | null
          group_id?: string | null
          id?: string
          secret?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          event_types?: string[] | null
          group_id?: string | null
          id?: string
          secret?: string | null
          url?: string | null
        }
        Relationships: []
      }
      group_welcome_messages: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          message: string | null
          role_id: number | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message?: string | null
          role_id?: number | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message?: string | null
          role_id?: number | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          permalink: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          permalink?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          permalink?: string | null
        }
        Relationships: []
      }
      id_mappings: {
        Row: {
          new_id: string
          old_id: number
          table_name: string
        }
        Insert: {
          new_id: string
          old_id: number
          table_name: string
        }
        Update: {
          new_id?: string
          old_id?: number
          table_name?: string
        }
        Relationships: []
      }
      image_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          image_id: string
          job_type: string
          parameters: Json | null
          priority: number | null
          processing_time_ms: number | null
          result: Json | null
          started_at: string | null
          status: string | null
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_id: string
          job_type: string
          parameters?: Json | null
          priority?: number | null
          processing_time_ms?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_id?: string
          job_type?: string
          parameters?: Json | null
          priority?: number | null
          processing_time_ms?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_processing_jobs_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "image_processing_jobs_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      image_tag_mappings: {
        Row: {
          created_at: string | null
          image_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          image_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          image_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      image_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      images: {
        Row: {
          alt_text: string | null
          camera_info: Json | null
          caption: string | null
          comment_count: number | null
          content_rating: string | null
          copyright_status: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          download_count: number | null
          edit_history: Json[] | null
          entity_type_id: string | null
          file_size: number | null
          format: string | null
          height: number | null
          id: string
          ip_address: unknown | null
          is_ai_generated: boolean | null
          is_featured: boolean | null
          is_monetized: boolean | null
          is_nsfw: boolean | null
          is_processed: boolean | null
          large_url: string | null
          license_type: string | null
          like_count: number | null
          location: Json | null
          medium_url: string | null
          metadata: Json | null
          mime_type: string | null
          original_filename: string | null
          processing_status: string | null
          quality_score: number | null
          revenue_generated: number | null
          share_count: number | null
          storage_path: string | null
          storage_provider: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          upload_source: string | null
          uploader_id: string | null
          uploader_type: string | null
          url: string
          user_agent: string | null
          view_count: number | null
          watermark_applied: boolean | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          camera_info?: Json | null
          caption?: string | null
          comment_count?: number | null
          content_rating?: string | null
          copyright_status?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          edit_history?: Json[] | null
          entity_type_id?: string | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          ip_address?: unknown | null
          is_ai_generated?: boolean | null
          is_featured?: boolean | null
          is_monetized?: boolean | null
          is_nsfw?: boolean | null
          is_processed?: boolean | null
          large_url?: string | null
          license_type?: string | null
          like_count?: number | null
          location?: Json | null
          medium_url?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          processing_status?: string | null
          quality_score?: number | null
          revenue_generated?: number | null
          share_count?: number | null
          storage_path?: string | null
          storage_provider?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          upload_source?: string | null
          uploader_id?: string | null
          uploader_type?: string | null
          url: string
          user_agent?: string | null
          view_count?: number | null
          watermark_applied?: boolean | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          camera_info?: Json | null
          caption?: string | null
          comment_count?: number | null
          content_rating?: string | null
          copyright_status?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          edit_history?: Json[] | null
          entity_type_id?: string | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          ip_address?: unknown | null
          is_ai_generated?: boolean | null
          is_featured?: boolean | null
          is_monetized?: boolean | null
          is_nsfw?: boolean | null
          is_processed?: boolean | null
          large_url?: string | null
          license_type?: string | null
          like_count?: number | null
          location?: Json | null
          medium_url?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          processing_status?: string | null
          quality_score?: number | null
          revenue_generated?: number | null
          share_count?: number | null
          storage_path?: string | null
          storage_provider?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          upload_source?: string | null
          uploader_id?: string | null
          uploader_type?: string | null
          url?: string
          user_agent?: string | null
          view_count?: number | null
          watermark_applied?: boolean | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "images_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_address: Json | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          event_id: string
          id: string
          invoice_number: string
          invoice_pdf_url: string | null
          line_items: Json | null
          notes: string | null
          paid_date: string | null
          registration_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_address?: Json | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          registration_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_address?: Json | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          registration_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          feed_entry_id: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feed_entry_id?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feed_entry_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      list_followers: {
        Row: {
          created_at: string | null
          id: string
          list_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      media_attachments: {
        Row: {
          alt_text: string | null
          created_at: string
          feed_entry_id: string | null
          id: string
          type: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          feed_entry_id?: string | null
          id?: string
          type?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          feed_entry_id?: string | null
          id?: string
          type?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      mentions: {
        Row: {
          comment_id: string | null
          created_at: string
          feed_entry_id: string | null
          id: string
          mentioned_user_id: string
          updated_at: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          feed_entry_id?: string | null
          id?: string
          mentioned_user_id: string
          updated_at?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          feed_entry_id?: string | null
          id?: string
          mentioned_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          model_file_path: string | null
          model_metrics: Json | null
          model_name: string
          model_parameters: Json
          model_type: string
          model_version: string
          training_data_snapshot: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          model_file_path?: string | null
          model_metrics?: Json | null
          model_name: string
          model_parameters?: Json
          model_type: string
          model_version: string
          training_data_snapshot?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          model_file_path?: string | null
          model_metrics?: Json | null
          model_name?: string
          model_parameters?: Json
          model_type?: string
          model_version?: string
          training_data_snapshot?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ml_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ml_predictions: {
        Row: {
          confidence_score: number | null
          id: string
          input_data: Json
          metadata: Json | null
          model_id: string | null
          prediction_result: Json
          prediction_timestamp: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          id?: string
          input_data: Json
          metadata?: Json | null
          model_id?: string | null
          prediction_result: Json
          prediction_timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          id?: string
          input_data?: Json
          metadata?: Json | null
          model_id?: string | null
          prediction_result?: Json
          prediction_timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ml_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ml_training_jobs: {
        Row: {
          created_at: string | null
          end_time: string | null
          error_message: string | null
          id: string
          job_name: string
          job_status: string
          model_id: string | null
          progress_percentage: number | null
          start_time: string | null
          training_config: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          job_name: string
          job_status?: string
          model_id?: string | null
          progress_percentage?: number | null
          start_time?: string | null
          training_config: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          job_name?: string
          job_status?: string
          model_id?: string | null
          progress_percentage?: number | null
          start_time?: string | null
          training_config?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_training_jobs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          content_id: string
          content_type: string
          created_at: string
          first_flagged_at: string
          flag_count: number | null
          id: string
          last_flagged_at: string
          priority: string | null
          resolution_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          content_id: string
          content_type: string
          created_at?: string
          first_flagged_at?: string
          flag_count?: number | null
          id?: string
          last_flagged_at?: string
          priority?: string | null
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          first_flagged_at?: string
          flag_count?: number | null
          id?: string
          last_flagged_at?: string
          priority?: string | null
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      nlp_analysis: {
        Row: {
          analysis_results: Json
          analysis_type: string
          confidence_score: number | null
          content_id: string | null
          content_type: string
          created_at: string | null
          id: string
          language_detected: string | null
          original_text: string
          processed_text: string | null
        }
        Insert: {
          analysis_results: Json
          analysis_type: string
          confidence_score?: number | null
          content_id?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          language_detected?: string | null
          original_text: string
          processed_text?: string | null
        }
        Update: {
          analysis_results?: Json
          analysis_type?: string
          confidence_score?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          language_detected?: string | null
          original_text?: string
          processed_text?: string | null
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          is_sent: boolean | null
          message: string | null
          notification_type: string
          scheduled_at: string | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          notification_type: string
          scheduled_at?: string | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          notification_type?: string
          scheduled_at?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          expiry_date: string | null
          id: string
          is_default: boolean | null
          last_four: string | null
          metadata: Json | null
          nickname: string | null
          payment_type: string | null
          provider_payment_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          nickname?: string | null
          payment_type?: string | null
          provider_payment_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          nickname?: string | null
          payment_type?: string | null
          provider_payment_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          error_message: string | null
          event_id: string
          fees: number | null
          id: string
          metadata: Json | null
          payment_method_id: string | null
          payment_provider: string | null
          provider_transaction_id: string | null
          receipt_email_sent: boolean | null
          receipt_url: string | null
          registration_id: string
          status: string | null
          tax_details: Json | null
          taxes: number | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_id: string
          fees?: number | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string | null
          provider_transaction_id?: string | null
          receipt_email_sent?: boolean | null
          receipt_url?: string | null
          registration_id: string
          status?: string | null
          tax_details?: Json | null
          taxes?: number | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_id?: string
          fees?: number | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string | null
          provider_transaction_id?: string | null
          receipt_email_sent?: boolean | null
          receipt_url?: string | null
          registration_id?: string
          status?: string | null
          tax_details?: Json | null
          taxes?: number | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          additional_data: Json | null
          category: string
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
        }
        Insert: {
          additional_data?: Json | null
          category: string
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
        }
        Update: {
          additional_data?: Json | null
          category?: string
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      personalized_recommendations: {
        Row: {
          book_id: number
          created_at: string | null
          explanation: string | null
          id: string
          is_dismissed: boolean | null
          recommendation_type: string
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          is_dismissed?: boolean | null
          recommendation_type: string
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          is_dismissed?: boolean | null
          recommendation_type?: string
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      photo_album: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: number
          entity_type: string
          id: string
          image_type_id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id: number
          entity_type: string
          id?: string
          image_type_id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: number
          entity_type?: string
          id?: string
          image_type_id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      photo_albums: {
        Row: {
          ai_enhanced: boolean | null
          analytics_enabled: boolean | null
          community_features: boolean | null
          community_score: number | null
          cover_image_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          entity_id: string | null
          entity_metadata: Json | null
          entity_type: string | null
          id: string
          is_public: boolean
          like_count: number | null
          metadata: Json | null
          monetization_enabled: boolean | null
          name: string
          owner_id: string
          premium_content: boolean | null
          revenue_generated: number | null
          share_count: number | null
          total_subscribers: number | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          ai_enhanced?: boolean | null
          analytics_enabled?: boolean | null
          community_features?: boolean | null
          community_score?: number | null
          cover_image_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_metadata?: Json | null
          entity_type?: string | null
          id?: string
          is_public?: boolean
          like_count?: number | null
          metadata?: Json | null
          monetization_enabled?: boolean | null
          name: string
          owner_id: string
          premium_content?: boolean | null
          revenue_generated?: number | null
          share_count?: number | null
          total_subscribers?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          ai_enhanced?: boolean | null
          analytics_enabled?: boolean | null
          community_features?: boolean | null
          community_score?: number | null
          cover_image_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_metadata?: Json | null
          entity_type?: string | null
          id?: string
          is_public?: boolean
          like_count?: number | null
          metadata?: Json | null
          monetization_enabled?: boolean | null
          name?: string
          owner_id?: string
          premium_content?: boolean | null
          revenue_generated?: number | null
          share_count?: number | null
          total_subscribers?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_albums_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_albums_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_albums_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "photo_albums_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_albums_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      photo_analytics: {
        Row: {
          album_id: string
          created_at: string
          event_type: string
          id: string
          image_id: string | null
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          album_id: string
          created_at?: string
          event_type: string
          id?: string
          image_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          album_id?: string
          created_at?: string
          event_type?: string
          id?: string
          image_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_analytics_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_analytics_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_analytics_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "photo_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      photo_bookmarks: {
        Row: {
          collection_name: string | null
          created_at: string | null
          id: string
          notes: string | null
          photo_id: string
          user_id: string
        }
        Insert: {
          collection_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_id: string
          user_id: string
        }
        Update: {
          collection_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_bookmarks_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_bookmarks_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_comments: {
        Row: {
          content: string
          content_html: string | null
          created_at: string | null
          edited_at: string | null
          id: string
          ip_address: unknown | null
          is_edited: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          language: string | null
          like_count: number | null
          mentions: string[] | null
          moderation_status: string | null
          parent_id: string | null
          photo_id: string
          reply_count: number | null
          sentiment_score: number | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          content: string
          content_html?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          language?: string | null
          like_count?: number | null
          mentions?: string[] | null
          moderation_status?: string | null
          parent_id?: string | null
          photo_id: string
          reply_count?: number | null
          sentiment_score?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          content?: string
          content_html?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          language?: string | null
          like_count?: number | null
          mentions?: string[] | null
          moderation_status?: string | null
          parent_id?: string | null
          photo_id?: string
          reply_count?: number | null
          sentiment_score?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "photo_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_community: {
        Row: {
          album_id: string
          content: string | null
          created_at: string
          id: string
          image_id: string | null
          interaction_type: string
          metadata: Json | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          album_id: string
          content?: string | null
          created_at?: string
          id?: string
          image_id?: string | null
          interaction_type: string
          metadata?: Json | null
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          album_id?: string
          content?: string | null
          created_at?: string
          id?: string
          image_id?: string | null
          interaction_type?: string
          metadata?: Json | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_community_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_community_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_community_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_community_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "photo_community_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_community_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      photo_likes: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          like_type: string | null
          photo_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          like_type?: string | null
          photo_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          like_type?: string | null
          photo_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_monetization: {
        Row: {
          album_id: string
          amount: number | null
          created_at: string
          currency: string | null
          event_type: string
          id: string
          image_id: string | null
          metadata: Json | null
          payment_method: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          album_id: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          image_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          album_id?: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          image_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_monetization_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_monetization_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_monetization_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_monetization_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "photo_monetization_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_monetization_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      photo_shares: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          photo_id: string
          platform_data: Json | null
          referrer_url: string | null
          share_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          photo_id: string
          platform_data?: Json | null
          referrer_url?: string | null
          share_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          photo_id?: string
          platform_data?: Json | null
          referrer_url?: string | null
          share_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_shares_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_shares_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_tags: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          height: number | null
          id: string
          is_auto_generated: boolean | null
          is_verified: boolean | null
          photo_id: string
          tagged_by: string | null
          updated_at: string | null
          verified_by: string | null
          visibility: string | null
          width: number | null
          x_position: number
          y_position: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          height?: number | null
          id?: string
          is_auto_generated?: boolean | null
          is_verified?: boolean | null
          photo_id: string
          tagged_by?: string | null
          updated_at?: string | null
          verified_by?: string | null
          visibility?: string | null
          width?: number | null
          x_position: number
          y_position: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          height?: number | null
          id?: string
          is_auto_generated?: boolean | null
          is_verified?: boolean | null
          photo_id?: string
          tagged_by?: string | null
          updated_at?: string | null
          verified_by?: string | null
          visibility?: string | null
          width?: number | null
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          folder: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_hidden: boolean | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_hidden?: boolean | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_hidden?: boolean | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          share_content: string | null
          share_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          share_content?: string | null
          share_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          share_content?: string | null
          share_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          age_restriction: string | null
          allowed_user_ids: string[] | null
          bookmark_count: number | null
          categories: string[] | null
          comment_count: number | null
          content: Json
          content_summary: string | null
          content_type: string | null
          content_warnings: string[] | null
          created_at: string
          engagement_score: number | null
          enterprise_features: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          image_url: string | null
          is_deleted: boolean
          is_featured: boolean | null
          is_hidden: boolean
          is_pinned: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          last_activity_at: string | null
          like_count: number | null
          link_url: string | null
          media_files: Json | null
          metadata: Json | null
          publish_status: string | null
          published_at: string | null
          regions: string[] | null
          scheduled_at: string | null
          sensitive_content: boolean | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          share_count: number | null
          tags: string[] | null
          trending_score: number | null
          updated_at: string
          user_id: string
          view_count: number | null
          visibility: string
        }
        Insert: {
          age_restriction?: string | null
          allowed_user_ids?: string[] | null
          bookmark_count?: number | null
          categories?: string[] | null
          comment_count?: number | null
          content: Json
          content_summary?: string | null
          content_type?: string | null
          content_warnings?: string[] | null
          created_at?: string
          engagement_score?: number | null
          enterprise_features?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_featured?: boolean | null
          is_hidden?: boolean
          is_pinned?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_activity_at?: string | null
          like_count?: number | null
          link_url?: string | null
          media_files?: Json | null
          metadata?: Json | null
          publish_status?: string | null
          published_at?: string | null
          regions?: string[] | null
          scheduled_at?: string | null
          sensitive_content?: boolean | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          share_count?: number | null
          tags?: string[] | null
          trending_score?: number | null
          updated_at?: string
          user_id: string
          view_count?: number | null
          visibility?: string
        }
        Update: {
          age_restriction?: string | null
          allowed_user_ids?: string[] | null
          bookmark_count?: number | null
          categories?: string[] | null
          comment_count?: number | null
          content?: Json
          content_summary?: string | null
          content_type?: string | null
          content_warnings?: string[] | null
          created_at?: string
          engagement_score?: number | null
          enterprise_features?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_featured?: boolean | null
          is_hidden?: boolean
          is_pinned?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_activity_at?: string | null
          like_count?: number | null
          link_url?: string | null
          media_files?: Json | null
          metadata?: Json | null
          publish_status?: string | null
          published_at?: string | null
          regions?: string[] | null
          scheduled_at?: string | null
          sensitive_content?: boolean | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          share_count?: number | null
          tags?: string[] | null
          trending_score?: number | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
          visibility?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          book_id: string
          condition: string | null
          created_at: string | null
          currency: string
          id: string
          link: string | null
          merchant: string | null
          price: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          book_id: string
          condition?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          link?: string | null
          merchant?: string | null
          price?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          condition?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          link?: string | null
          merchant?: string | null
          price?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      privacy_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_value: Json | null
          old_value: Json | null
          permission_type: string | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          permission_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          permission_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applies_to_ticket_types: string[] | null
          code: string
          created_at: string | null
          created_by: string
          current_uses: number | null
          description: string | null
          discount_type: string | null
          discount_value: number
          end_date: string | null
          event_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          applies_to_ticket_types?: string[] | null
          code: string
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          end_date?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          applies_to_ticket_types?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          end_date?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publishers: {
        Row: {
          about: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          country_id: string | null
          cover_image_id: string | null
          created_at: string | null
          email: string | null
          featured: boolean
          founded_year: number | null
          id: string
          name: string
          permalink: string | null
          phone: string | null
          postal_code: string | null
          publisher_gallery_id: string | null
          publisher_image_id: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          about?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          country_id?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          email?: string | null
          featured?: boolean
          founded_year?: number | null
          id?: string
          name: string
          permalink?: string | null
          phone?: string | null
          postal_code?: string | null
          publisher_gallery_id?: string | null
          publisher_image_id?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          about?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          country_id?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          email?: string | null
          featured?: boolean
          founded_year?: number | null
          id?: string
          name?: string
          permalink?: string | null
          phone?: string | null
          postal_code?: string | null
          publisher_gallery_id?: string | null
          publisher_image_id?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publishers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishers_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "publishers_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishers_publisher_image_id_fkey"
            columns: ["publisher_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "publishers_publisher_image_id_fkey"
            columns: ["publisher_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          feed_entry_id: string
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_entry_id: string
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feed_entry_id?: string
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_challenges: {
        Row: {
          books_read: number
          created_at: string | null
          id: string
          target_books: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          books_read?: number
          created_at?: string | null
          id?: string
          target_books: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          books_read?: number
          created_at?: string | null
          id?: string
          target_books?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          created_at: string | null
          current_value: number
          end_date: string
          goal_type: string
          id: string
          is_completed: boolean
          start_date: string
          target_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number
          end_date: string
          goal_type: string
          id?: string
          is_completed?: boolean
          start_date: string
          target_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number
          end_date?: string
          goal_type?: string
          id?: string
          is_completed?: boolean
          start_date?: string
          target_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_list_items: {
        Row: {
          added_at: string | null
          book_id: string | null
          id: string
          list_id: string
          notes: string | null
        }
        Insert: {
          added_at?: string | null
          book_id?: string | null
          id?: string
          list_id: string
          notes?: string | null
        }
        Update: {
          added_at?: string | null
          book_id?: string | null
          id?: string
          list_id?: string
          notes?: string | null
        }
        Relationships: []
      }
      reading_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reading_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reading_progress: {
        Row: {
          allow_followers: boolean
          allow_friends: boolean
          book_id: string | null
          created_at: string | null
          custom_permissions: Json | null
          finish_date: string | null
          id: string
          privacy_audit_log: Json | null
          privacy_level: string
          progress_percentage: number
          start_date: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_followers?: boolean
          allow_friends?: boolean
          book_id?: string | null
          created_at?: string | null
          custom_permissions?: Json | null
          finish_date?: string | null
          id?: string
          privacy_audit_log?: Json | null
          privacy_level?: string
          progress_percentage?: number
          start_date?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_followers?: boolean
          allow_friends?: boolean
          book_id?: string | null
          created_at?: string | null
          custom_permissions?: Json | null
          finish_date?: string | null
          id?: string
          privacy_audit_log?: Json | null
          privacy_level?: string
          progress_percentage?: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reading_series: {
        Row: {
          author_id: string | null
          cover_image_id: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          organizer_id: string
          publisher_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          cover_image_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organizer_id: string
          publisher_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          cover_image_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organizer_id?: string
          publisher_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_id: string | null
          created_at: string | null
          end_time: string | null
          id: string
          minutes_spent: number | null
          notes: string | null
          pages_read: number | null
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id: string
          minutes_spent?: number | null
          notes?: string | null
          pages_read?: number | null
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          minutes_spent?: number | null
          notes?: string | null
          pages_read?: number | null
          start_time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reading_stats_daily: {
        Row: {
          books_finished: number
          books_read: number
          books_started: number
          created_at: string | null
          date: string
          id: string
          total_minutes: number
          total_pages: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          books_finished?: number
          books_read?: number
          books_started?: number
          created_at?: string | null
          date: string
          id?: string
          total_minutes?: number
          total_pages?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          books_finished?: number
          books_read?: number
          books_started?: number
          created_at?: string | null
          date?: string
          id?: string
          total_minutes?: number
          total_pages?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_streaks: {
        Row: {
          created_at: string | null
          days: number
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days: number
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days?: number
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_likes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      series_events: {
        Row: {
          created_at: string | null
          event_id: string
          event_number: number | null
          series_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_number?: number | null
          series_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_number?: number | null
          series_id?: string
        }
        Relationships: []
      }
      session_registrations: {
        Row: {
          check_in_time: string | null
          created_at: string | null
          id: string
          registration_status: string | null
          registration_time: string | null
          session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          created_at?: string | null
          id?: string
          registration_status?: string | null
          registration_time?: string | null
          session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          created_at?: string | null
          id?: string
          registration_status?: string | null
          registration_time?: string | null
          session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shares: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_public: boolean | null
          share_platform: string | null
          share_text: string | null
          share_type: string | null
          share_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_public?: boolean | null
          share_platform?: string | null
          share_text?: string | null
          share_type?: string | null
          share_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_public?: boolean | null
          share_platform?: string | null
          share_text?: string | null
          share_type?: string | null
          share_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      similar_books: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          similar_book_id: string
          similarity_score: number | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          similar_book_id: string
          similarity_score?: number | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          similar_book_id?: string
          similarity_score?: number | null
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          delivery_channel: string
          delivery_status: string
          id: string
          notification_content: string
          notification_title: string
          notification_type: string
          personalization_data: Json | null
          priority_level: string
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          delivery_channel?: string
          delivery_status?: string
          id?: string
          notification_content: string
          notification_title: string
          notification_type: string
          personalization_data?: Json | null
          priority_level?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          delivery_channel?: string
          delivery_status?: string
          id?: string
          notification_content?: string
          notification_title?: string
          notification_type?: string
          personalization_data?: Json | null
          priority_level?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "smart_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      social_audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          target_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          target_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          target_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "social_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      statuses: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          options: Json | null
          question: string
          question_type: string | null
          survey_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question: string
          question_type?: string | null
          survey_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question?: string
          question_type?: string | null
          survey_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string | null
          id: string
          registration_id: string | null
          response_data: Json
          survey_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          registration_id?: string | null
          response_data: Json
          survey_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          registration_id?: string | null
          response_data?: Json
          survey_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sync_state: {
        Row: {
          created_at: string
          current_page: number
          error: string | null
          id: string
          last_synced_date: string
          processed_books: number
          status: string
          total_books: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_page?: number
          error?: string | null
          id?: string
          last_synced_date: string
          processed_books?: number
          status?: string
          total_books?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_page?: number
          error?: string | null
          id?: string
          last_synced_date?: string
          processed_books?: number
          status?: string
          total_books?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          check_name: string
          checked_at: string
          details: Json | null
          error_message: string | null
          id: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          check_name: string
          checked_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status: string
        }
        Update: {
          check_name?: string
          checked_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_benefits: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          ticket_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          ticket_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          ticket_type_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          access_code: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          event_id: string
          has_waitlist: boolean | null
          id: string
          includes_features: Json | null
          is_active: boolean | null
          max_per_order: number | null
          min_per_order: number | null
          name: string
          price: number
          quantity_sold: number | null
          quantity_total: number | null
          sale_end_date: string | null
          sale_start_date: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          access_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          event_id: string
          has_waitlist?: boolean | null
          id?: string
          includes_features?: Json | null
          is_active?: boolean | null
          max_per_order?: number | null
          min_per_order?: number | null
          name: string
          price: number
          quantity_sold?: number | null
          quantity_total?: number | null
          sale_end_date?: string | null
          sale_start_date?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          access_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          event_id?: string
          has_waitlist?: boolean | null
          id?: string
          includes_features?: Json | null
          is_active?: boolean | null
          max_per_order?: number | null
          min_per_order?: number | null
          name?: string
          price?: number
          quantity_sold?: number | null
          quantity_total?: number | null
          sale_end_date?: string | null
          sale_start_date?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          access_code: string | null
          attendee_email: string | null
          attendee_name: string | null
          barcode: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          currency: string | null
          event_id: string
          id: string
          purchase_price: number
          qr_code: string | null
          registration_id: string
          status: string | null
          ticket_number: string
          ticket_pdf_url: string | null
          ticket_type_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_code?: string | null
          attendee_email?: string | null
          attendee_name?: string | null
          barcode?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          currency?: string | null
          event_id: string
          id?: string
          purchase_price: number
          qr_code?: string | null
          registration_id: string
          status?: string | null
          ticket_number: string
          ticket_pdf_url?: string | null
          ticket_type_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_code?: string | null
          attendee_email?: string | null
          attendee_name?: string | null
          barcode?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string
          id?: string
          purchase_price?: number
          qr_code?: string | null
          registration_id?: string
          status?: string | null
          ticket_number?: string
          ticket_pdf_url?: string | null
          ticket_type_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          category: string | null
          created_at: string
          engagement_count: number | null
          id: string
          last_activity_at: string | null
          post_count: number | null
          topic: string
          trending_score: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          engagement_count?: number | null
          id?: string
          last_activity_at?: string | null
          post_count?: number | null
          topic: string
          trending_score?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          engagement_count?: number | null
          id?: string
          last_activity_at?: string | null
          post_count?: number | null
          topic?: string
          trending_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_details: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          response_time_ms: number | null
          session_id: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_details?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          response_time_ms?: number | null
          session_id?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          response_time_ms?: number | null
          session_id?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_book_interactions: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          interaction_type: string
          interaction_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          interaction_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          interaction_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          requested_at: string | null
          requested_by: string
          responded_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          requested_at?: string | null
          requested_by: string
          responded_at?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          requested_at?: string | null
          requested_by?: string
          responded_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_friends_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_friends_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_privacy_settings: {
        Row: {
          allow_followers_to_see_reading: boolean
          allow_friends_to_see_reading: boolean
          allow_public_reading_profile: boolean
          created_at: string
          default_privacy_level: string
          id: string
          show_currently_reading_publicly: boolean
          show_reading_goals_publicly: boolean
          show_reading_history_publicly: boolean
          show_reading_stats_publicly: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_followers_to_see_reading?: boolean
          allow_friends_to_see_reading?: boolean
          allow_public_reading_profile?: boolean
          created_at?: string
          default_privacy_level?: string
          id?: string
          show_currently_reading_publicly?: boolean
          show_reading_goals_publicly?: boolean
          show_reading_history_publicly?: boolean
          show_reading_stats_publicly?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_followers_to_see_reading?: boolean
          allow_friends_to_see_reading?: boolean
          allow_public_reading_profile?: boolean
          created_at?: string
          default_privacy_level?: string
          id?: string
          show_currently_reading_publicly?: boolean
          show_reading_goals_publicly?: boolean
          show_reading_history_publicly?: boolean
          show_reading_stats_publicly?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reading_preferences: {
        Row: {
          created_at: string | null
          disliked_genres: string[] | null
          favorite_authors: string[] | null
          favorite_genres: string[] | null
          id: string
          preferred_complexity: string | null
          preferred_length: string | null
          preferred_publication_era: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          disliked_genres?: string[] | null
          favorite_authors?: string[] | null
          favorite_genres?: string[] | null
          id?: string
          preferred_complexity?: string | null
          preferred_length?: string | null
          preferred_publication_era?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          disliked_genres?: string[] | null
          favorite_authors?: string[] | null
          favorite_genres?: string[] | null
          id?: string
          preferred_complexity?: string | null
          preferred_length?: string | null
          preferred_publication_era?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          location: string | null
          name: string | null
          permalink: string | null
          role_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          location?: string | null
          name?: string | null
          permalink?: string | null
          role_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          name?: string | null
          permalink?: string | null
          role_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      advanced_analytics_dashboard_enhanced: {
        Row: {
          active_readers: number | null
          active_reviewers: number | null
          activities_last_24h: number | null
          avg_rating: number | null
          books_without_author: number | null
          books_without_title: number | null
          dashboard_timestamp: string | null
          health_checks_last_24h: number | null
          list_creators: number | null
          total_book_views: number | null
          total_books: number | null
          total_reviews: number | null
        }
        Relationships: []
      }
      book_popularity_analytics: {
        Row: {
          author: string | null
          avg_rating: number | null
          id: string | null
          last_updated: string | null
          popularity_rank: number | null
          rating_rank: number | null
          reading_list_count: number | null
          reading_progress_count: number | null
          reviews_count: number | null
          title: string | null
          views_count: number | null
        }
        Relationships: []
      }
      book_popularity_summary: {
        Row: {
          active_reads: number | null
          author: string | null
          average_rating: number | null
          avg_progress: number | null
          book_id: string | null
          completed_reads: number | null
          created_at: string | null
          review_count: number | null
          title: string | null
          total_reading_entries: number | null
          unique_readers: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      data_consistency_monitoring: {
        Row: {
          issue_count: number | null
          issue_type: string | null
          severity: string | null
        }
        Relationships: []
      }
      enterprise_audit_summary: {
        Row: {
          first_operation: string | null
          last_operation: string | null
          operation: string | null
          operation_count: number | null
          table_name: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      enterprise_data_quality_dashboard: {
        Row: {
          critical_issues: number | null
          failed_rules: number | null
          overall_score: number | null
          passed_rules: number | null
          quality_status: string | null
          table_name: string | null
          total_rules: number | null
        }
        Relationships: []
      }
      enterprise_photo_analytics: {
        Row: {
          album_id: string | null
          avg_time_between_events: number | null
          event_count: number | null
          event_type: string | null
          first_event: string | null
          image_id: string | null
          last_event: string | null
          unique_sessions: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_analytics_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_analytics_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_analytics_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_photo_community: {
        Row: {
          album_id: string | null
          avg_rating: number | null
          first_interaction: string | null
          image_id: string | null
          interaction_count: number | null
          interaction_type: string | null
          last_interaction: string | null
          rating_count: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_community_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_community_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_community_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_photo_monetization: {
        Row: {
          album_id: string | null
          avg_transaction_value: number | null
          event_type: string | null
          first_transaction: string | null
          image_id: string | null
          last_transaction: string | null
          total_revenue: number | null
          transaction_count: number | null
          unique_payers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_monetization_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_monetization_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "photo_monetization_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_album_analytics: {
        Row: {
          avg_photos_per_album: number | null
          entity_id: string | null
          entity_type: string | null
          first_album_created: string | null
          latest_album_created: string | null
          private_albums: number | null
          public_albums: number | null
          total_albums: number | null
          total_photos: number | null
        }
        Relationships: []
      }
      entity_image_analytics: {
        Row: {
          avg_file_size: number | null
          earliest_image: string | null
          entity_category: string | null
          entity_type_name: string | null
          latest_image: string | null
          total_images: number | null
          total_storage_used: number | null
          unique_entities: number | null
        }
        Relationships: []
      }
      entity_social_analytics: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          recent_engagement_score: number | null
          total_bookmarks: number | null
          total_comments: number | null
          total_likes: number | null
          total_shares: number | null
          total_tags: number | null
          unique_bookmarkers: number | null
          unique_commenters: number | null
          unique_likers: number | null
          unique_sharers: number | null
        }
        Relationships: []
      }
      image_uploaders: {
        Row: {
          alt_text: string | null
          created_at: string | null
          image_id: string | null
          uploader_email: string | null
          uploader_id: string | null
          uploader_name: string | null
          uploader_type: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "images_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_analytics: {
        Row: {
          avg_resolution_time_hours: number | null
          content_type: string | null
          flag_count: number | null
          flag_date: string | null
          flag_reason: string | null
          priority: string | null
          status: string | null
        }
        Relationships: []
      }
      performance_dashboard: {
        Row: {
          category: string | null
          metric: string | null
          status: string | null
          value: string | null
        }
        Relationships: []
      }
      publisher_summary: {
        Row: {
          avg_rating: number | null
          publisher_id: string | null
          publisher_name: string | null
          total_books: number | null
          total_reading_entries: number | null
          total_reviews: number | null
          unique_readers: number | null
        }
        Relationships: []
      }
      social_activity_analytics: {
        Row: {
          action_count: number | null
          action_type: string | null
          activity_date: string | null
          entity_type: string | null
          unique_entities: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      system_performance_overview: {
        Row: {
          avg_value: number | null
          category: string | null
          last_measured: string | null
          max_value: number | null
          measurement_count: number | null
          metric_name: string | null
          min_value: number | null
        }
        Relationships: []
      }
      unified_book_data: {
        Row: {
          author: string | null
          author_id: string | null
          author_image_id: string | null
          author_name: string | null
          average_rating: number | null
          binding: string | null
          binding_type_id: string | null
          binding_type_name: string | null
          book_gallery_img: string[] | null
          cover_image_id: string | null
          created_at: string | null
          dimensions: string | null
          edition: string | null
          featured: boolean | null
          format_type_id: string | null
          format_type_name: string | null
          id: string | null
          isbn10: string | null
          isbn13: string | null
          language: string | null
          list_price: number | null
          original_image_url: string | null
          overview: string | null
          pages: number | null
          publication_date: string | null
          publisher_id: string | null
          publisher_name: string | null
          publisher_website: string | null
          review_count: number | null
          status_id: string | null
          synopsis: string | null
          title: string | null
          title_long: string | null
          updated_at: string | null
          weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_author_image_id_fkey"
            columns: ["author_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "authors_author_image_id_fkey"
            columns: ["author_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_binding_type_id_fkey"
            columns: ["binding_type_id"]
            isOneToOne: false
            referencedRelation: "binding_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "image_uploaders"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "books_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_format_type_id_fkey"
            columns: ["format_type_id"]
            isOneToOne: false
            referencedRelation: "format_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publisher_summary"
            referencedColumns: ["publisher_id"]
          },
          {
            foreignKeyName: "books_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_reading_progress: {
        Row: {
          allow_followers: boolean | null
          allow_friends: boolean | null
          book_id: string | null
          created_at: string | null
          custom_permissions: Json | null
          finish_date: string | null
          id: string | null
          privacy_audit_log: Json | null
          privacy_level: string | null
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allow_followers?: never
          allow_friends?: never
          book_id?: string | null
          created_at?: string | null
          custom_permissions?: Json | null
          finish_date?: string | null
          id?: string | null
          privacy_audit_log?: Json | null
          privacy_level?: never
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allow_followers?: never
          allow_friends?: never
          book_id?: string | null
          created_at?: string | null
          custom_permissions?: Json | null
          finish_date?: string | null
          id?: string | null
          privacy_audit_log?: Json | null
          privacy_level?: never
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book_popularity_summary"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "unified_book_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_engagement_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_privacy_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_activity_metrics: {
        Row: {
          avg_response_time: number | null
          book_views: number | null
          email: string | null
          first_activity: string | null
          last_activity: string | null
          login_count: number | null
          reviews: number | null
          total_activities: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_activity_summary: {
        Row: {
          avg_progress_percentage: number | null
          books_completed: number | null
          books_in_progress: number | null
          email: string | null
          last_activity: string | null
          total_follows: number | null
          total_friends: number | null
          total_reading_entries: number | null
          unique_books_read: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_engagement_analytics: {
        Row: {
          avg_review_rating: number | null
          books_in_lists: number | null
          books_in_progress: number | null
          books_reviewed: number | null
          email: string | null
          id: string | null
          last_activity: string | null
          reading_lists_created: number | null
          total_activities: number | null
        }
        Relationships: []
      }
      user_privacy_overview: {
        Row: {
          active_custom_permissions: number | null
          allow_public_reading_profile: boolean | null
          default_privacy_level: string | null
          email: string | null
          privacy_actions_last_30_days: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_activity_comment: {
        Args: {
          p_activity_id: string
          p_comment_text: string
          p_user_id: string
        }
        Returns: string
      }
      add_entity_comment: {
        Args: {
          p_content: string
          p_entity_id: string
          p_entity_type: string
          p_parent_id?: string
          p_user_id: string
        }
        Returns: string
      }
      anonymize_user_data_enhanced: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      calculate_engagement_score: {
        Args: {
          p_comment_count: number
          p_like_count: number
          p_share_count: number
          p_view_count: number
        }
        Returns: number
      }
      check_data_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          health_check: string
          issue_count: number
          recommendation: string
          severity: string
        }[]
      }
      check_data_integrity_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_count: number
          issue_type: string
          recommendation: string
          severity: string
        }[]
      }
      check_data_quality_issues_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_existing_follow: {
        Args: {
          p_follower_id: string
          p_following_id: string
          p_target_type_id: string
        }
        Returns: {
          follow_exists: boolean
        }[]
      }
      check_is_following: {
        Args: {
          p_follower_id: string
          p_following_id: string
          p_target_type_id: string
        }
        Returns: {
          is_following: boolean
        }[]
      }
      check_permalink_availability: {
        Args: { entity_type: string; exclude_id?: string; permalink: string }
        Returns: boolean
      }
      check_publisher_data_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_value: number
          metric_name: string
          status: string
        }[]
      }
      check_rate_limit_enhanced: {
        Args: {
          p_action: string
          p_max_attempts?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_reading_privacy_access: {
        Args: { requesting_user_id?: string; target_user_id: string }
        Returns: boolean
      }
      cleanup_old_audit_trail: {
        Args: { p_days_to_keep?: number }
        Returns: number
      }
      cleanup_old_monitoring_data: {
        Args: { p_days_to_keep?: number }
        Returns: undefined
      }
      cleanup_orphaned_records: {
        Args: Record<PropertyKey, never>
        Returns: {
          cleanup_type: string
          records_deleted: number
          status: string
          table_name: string
        }[]
      }
      comprehensive_system_health_check_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_data_version: {
        Args: {
          p_change_reason?: string
          p_record_id: string
          p_table_name: string
        }
        Returns: number
      }
      create_entity_album: {
        Args: {
          p_description?: string
          p_entity_id: string
          p_entity_type: string
          p_is_public?: boolean
          p_metadata?: Json
          p_name: string
        }
        Returns: string
      }
      decrypt_sensitive_data_enhanced: {
        Args: { p_encrypted_data: string; p_key?: string }
        Returns: string
      }
      delete_follow_record: {
        Args: {
          p_follower_id: string
          p_following_id: string
          p_target_type_id: string
        }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      encrypt_sensitive_data_enhanced: {
        Args: { p_data: string; p_key?: string }
        Returns: string
      }
      export_user_data_enhanced: {
        Args: { p_user_id: string }
        Returns: Json
      }
      extract_book_dimensions: {
        Args: { book_uuid: string; dimensions_json: Json }
        Returns: undefined
      }
      fix_missing_publisher_relationships: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_taken: string
          book_id: string
          book_title: string
          publisher_id: string
          status: string
        }[]
      }
      flag_content: {
        Args: {
          p_content_id: string
          p_content_type: string
          p_flag_details?: string
          p_flag_reason: string
          p_flagged_by: string
        }
        Returns: string
      }
      generate_data_health_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          metric_value: string
          recommendation: string
          report_section: string
          status: string
        }[]
      }
      generate_friend_suggestions: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      generate_intelligent_content: {
        Args: { p_content_type: string; p_input_data: Json; p_user_id?: string }
        Returns: {
          confidence_score: number
          generated_content: string
          metadata: Json
        }[]
      }
      generate_monitoring_report: {
        Args: { p_days_back?: number }
        Returns: Json
      }
      generate_permalink: {
        Args: { entity_type?: string; input_text: string }
        Returns: string
      }
      generate_smart_notification: {
        Args: {
          p_context_data?: Json
          p_notification_type: string
          p_user_id: string
        }
        Returns: string
      }
      generate_system_alerts_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_ai_book_recommendations: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          author_name: string
          book_id: string
          recommendation_reason: string
          recommendation_score: number
          title: string
        }[]
      }
      get_data_lineage: {
        Args: { p_table_name: string }
        Returns: {
          data_flow_description: string
          source_column: string
          source_table: string
          target_column: string
          target_table: string
          transformation_type: string
        }[]
      }
      get_data_quality_report: {
        Args: { p_table_name?: string }
        Returns: {
          critical_issues: number
          failed_rules: number
          overall_score: number
          passed_rules: number
          table_name: string
          total_rules: number
        }[]
      }
      get_entity_albums: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id?: string }
        Returns: {
          album_description: string
          album_id: string
          album_name: string
          can_edit: boolean
          created_at: string
          is_public: boolean
          owner_id: string
          photo_count: number
        }[]
      }
      get_entity_by_permalink: {
        Args: { entity_type: string; permalink: string }
        Returns: string
      }
      get_entity_images: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          album_id: string
          album_name: string
          alt_text: string
          created_at: string
          file_size: number
          image_id: string
          image_url: string
          thumbnail_url: string
        }[]
      }
      get_entity_social_stats: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id?: string }
        Returns: {
          bookmark_count: number
          comment_count: number
          is_bookmarked: boolean
          is_liked: boolean
          like_count: number
          share_count: number
          tag_count: number
          user_reaction_type: string
        }[]
      }
      get_moderation_stats: {
        Args: { p_days_back?: number }
        Returns: {
          avg_resolution_time_hours: number
          pending_flags: number
          resolved_flags: number
          top_flag_reasons: Json
          total_flags: number
        }[]
      }
      get_mutual_friends_count: {
        Args: { user1_id: string; user2_id: string }
        Returns: number
      }
      get_performance_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string
          estimated_impact: string
          priority: string
          recommendation_type: string
        }[]
      }
      get_privacy_audit_summary: {
        Args: { days_back?: number }
        Returns: {
          action: string
          count: number
          last_occurrence: string
        }[]
      }
      get_user_feed_activities: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          activity_type: string
          comment_count: number
          content_summary: string
          content_type: string
          created_at: string
          data: Json
          engagement_score: number
          entity_id: string
          entity_type: string
          hashtags: string[]
          id: string
          image_url: string
          is_liked: boolean
          is_public: boolean
          like_count: number
          link_url: string
          metadata: Json
          share_count: number
          text: string
          user_avatar_url: string
          user_id: string
          user_name: string
          view_count: number
          visibility: string
        }[]
      }
      get_user_privacy_settings: {
        Args: { user_id_param?: string }
        Returns: {
          allow_followers_to_see_reading: boolean
          allow_friends_to_see_reading: boolean
          allow_public_reading_profile: boolean
          default_privacy_level: string
          show_currently_reading_publicly: boolean
          show_reading_goals_publicly: boolean
          show_reading_history_publicly: boolean
          show_reading_stats_publicly: boolean
        }[]
      }
      grant_reading_permission: {
        Args: {
          expires_at?: string
          permission_type?: string
          target_user_id: string
        }
        Returns: boolean
      }
      has_user_liked_entity: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id: string }
        Returns: boolean
      }
      insert_follow_record: {
        Args: {
          p_follower_id: string
          p_following_id: string
          p_target_type_id: string
        }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      log_sensitive_operation_enhanced: {
        Args: {
          p_details?: Json
          p_operation_type: string
          p_record_id: string
          p_table_name: string
          p_user_id?: string
        }
        Returns: string
      }
      log_social_action: {
        Args: {
          p_action_details?: Json
          p_action_type: string
          p_entity_id: string
          p_entity_type: string
          p_ip_address?: unknown
          p_session_id?: string
          p_target_id?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_activity_details?: Json
          p_activity_type: string
          p_ip_address?: unknown
          p_response_time_ms?: number
          p_session_id?: string
          p_status_code?: number
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      map_progress_to_reading_status: {
        Args: { status: string }
        Returns: string
      }
      map_reading_status_to_progress: {
        Args: { status: string }
        Returns: string
      }
      mask_sensitive_data: {
        Args: { input_text: string; mask_type?: string }
        Returns: string
      }
      monitor_data_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_value: number
          health_metric: string
          last_check: string
          status: string
          threshold_value: number
        }[]
      }
      monitor_database_performance_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      monitor_entity_storage_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          entity_id: string
          entity_type: string
          image_count: number
          storage_usage_mb: number
          warning_level: string
        }[]
      }
      monitor_query_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_execution_time: number
          performance_status: string
          query_pattern: string
          total_calls: number
        }[]
      }
      perform_database_maintenance_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      perform_system_health_check: {
        Args: {
          p_check_name: string
          p_details?: Json
          p_error_message?: string
          p_response_time_ms?: number
          p_status: string
        }
        Returns: string
      }
      populate_album_images_entity_context: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_dewey_decimal_classifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_images_entity_type_id: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_complete_isbndb_book_data: {
        Args: { book_uuid: string; isbndb_data: Json }
        Returns: undefined
      }
      process_dewey_decimal_classifications: {
        Args: { book_uuid: string; dewey_array: string[] }
        Returns: undefined
      }
      process_image_with_ai: {
        Args: { p_analysis_types?: string[]; p_image_id: string }
        Returns: Json
      }
      process_other_isbns: {
        Args: { book_uuid: string; other_isbns_json: Json }
        Returns: undefined
      }
      process_related_books: {
        Args: { book_uuid: string; related_json: Json }
        Returns: undefined
      }
      record_performance_metric: {
        Args: {
          p_additional_data?: Json
          p_category?: string
          p_metric_name: string
          p_metric_unit?: string
          p_metric_value: number
        }
        Returns: string
      }
      refresh_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: {
          refresh_status: string
          refresh_time: string
          view_name: string
        }[]
      }
      revoke_reading_permission: {
        Args: { permission_type?: string; target_user_id: string }
        Returns: boolean
      }
      run_data_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          maintenance_step: string
          records_processed: number
          status: string
        }[]
      }
      run_performance_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          maintenance_step: string
          performance_improvement: string
          records_processed: number
        }[]
      }
      safe_cleanup_orphaned_records: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_taken: string
          orphaned_count: number
          table_name: string
        }[]
      }
      safe_fix_missing_publishers: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_taken: string
          book_id: string
          book_title: string
          publisher_id: string
          status: string
        }[]
      }
      simple_check_publisher_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_value: number
          metric_name: string
          status: string
        }[]
      }
      simple_fix_missing_publishers: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_taken: string
          book_id: string
          book_title: string
          publisher_id: string
          status: string
        }[]
      }
      standardize_reading_status_mappings: {
        Args: Record<PropertyKey, never>
        Returns: {
          new_status: string
          old_status: string
          updated_count: number
        }[]
      }
      standardize_reading_statuses: {
        Args: Record<PropertyKey, never>
        Returns: {
          new_status: string
          old_status: string
          updated_count: number
        }[]
      }
      toggle_activity_like: {
        Args: { p_activity_id: string; p_user_id: string }
        Returns: boolean
      }
      toggle_entity_like: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id: string }
        Returns: boolean
      }
      track_photo_analytics_event: {
        Args: {
          p_album_id: string
          p_event_type: string
          p_image_id?: string
          p_metadata?: Json
          p_user_id?: string
        }
        Returns: string
      }
      update_book_popularity_metrics: {
        Args: { p_book_id: string }
        Returns: undefined
      }
      update_user_privacy_settings: {
        Args: {
          allow_followers_to_see_reading?: boolean
          allow_friends_to_see_reading?: boolean
          allow_public_reading_profile?: boolean
          default_privacy_level?: string
          show_currently_reading_publicly?: boolean
          show_reading_goals_publicly?: boolean
          show_reading_history_publicly?: boolean
          show_reading_stats_publicly?: boolean
        }
        Returns: boolean
      }
      upsert_reading_progress: {
        Args: {
          p_book_id: string
          p_privacy_level?: string
          p_progress_percentage?: number
          p_status: string
          p_user_id: string
        }
        Returns: Json
      }
      validate_and_repair_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed_count: number
          issue_count: number
          status: string
          validation_type: string
        }[]
      }
      validate_book_data: {
        Args: { book_data: Json }
        Returns: Json
      }
      validate_book_data_enhanced: {
        Args: {
          p_author: string
          p_isbn?: string
          p_publication_year?: number
          p_title: string
        }
        Returns: Json
      }
      validate_enterprise_data_quality: {
        Args: { p_table_name?: string }
        Returns: {
          column_name: string
          error_count: number
          rule_name: string
          rule_type: string
          severity: string
          table_name: string
          validation_result: string
        }[]
      }
      validate_follow_entity: {
        Args: { p_entity_id: string; p_target_type: string }
        Returns: boolean
      }
      validate_permalink: {
        Args: { permalink: string }
        Returns: boolean
      }
      validate_user_data_enhanced: {
        Args: { p_email: string; p_name?: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
