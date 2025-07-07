export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          author_id: string | null
          book_id: string | null
          created_at: string | null
          data: Json | null
          entity_id: string | null
          entity_type: string | null
          event_id: string | null
          group_id: string | null
          id: string
          list_id: string | null
          review_id: string | null
          user_id: string
          user_profile_id: string | null
        }
        Insert: {
          activity_type: string
          author_id?: string | null
          book_id?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          list_id?: string | null
          review_id?: string | null
          user_id: string
          user_profile_id?: string | null
        }
        Update: {
          activity_type?: string
          author_id?: string | null
          book_id?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          list_id?: string | null
          review_id?: string | null
          user_id?: string
          user_profile_id?: string | null
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
          album_id: string
          created_at: string | null
          display_order: number
          entity_id: string | null
          entity_type_id: string | null
          id: string
          image_id: string
          is_cover: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          album_id: string
          created_at?: string | null
          display_order: number
          entity_id?: string | null
          entity_type_id?: string | null
          id?: string
          image_id: string
          is_cover?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          album_id?: string
          created_at?: string | null
          display_order?: number
          entity_id?: string | null
          entity_type_id?: string | null
          id?: string
          image_id?: string
          is_cover?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
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
          twitter_handle?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
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
      comments: {
        Row: {
          content: string
          created_at: string
          feed_entry_id: string | null
          id: string
          is_deleted: boolean
          is_hidden: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          feed_entry_id?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          feed_entry_id?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean
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
          caption: string | null
          created_at: string | null
          deleted_at: string | null
          entity_type_id: string | null
          file_size: number | null
          format: string | null
          height: number | null
          id: string
          is_processed: boolean | null
          large_url: string | null
          medium_url: string | null
          metadata: Json | null
          mime_type: string | null
          original_filename: string | null
          processing_status: string | null
          storage_path: string | null
          storage_provider: string | null
          thumbnail_url: string | null
          updated_at: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          deleted_at?: string | null
          entity_type_id?: string | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          is_processed?: boolean | null
          large_url?: string | null
          medium_url?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          processing_status?: string | null
          storage_path?: string | null
          storage_provider?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          deleted_at?: string | null
          entity_type_id?: string | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          is_processed?: boolean | null
          large_url?: string | null
          medium_url?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          processing_status?: string | null
          storage_path?: string | null
          storage_provider?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          url?: string
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
          feed_entry_id: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_entry_id?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
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
          cover_image_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_public: boolean
          like_count: number | null
          metadata: Json | null
          name: string
          owner_id: string
          share_count: number | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          cover_image_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_public?: boolean
          like_count?: number | null
          metadata?: Json | null
          name: string
          owner_id: string
          share_count?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          cover_image_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_public?: boolean
          like_count?: number | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          share_count?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
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
      posts: {
        Row: {
          allowed_user_ids: string[] | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean
          is_hidden: boolean
          link_url: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          allowed_user_ids?: string[] | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_hidden?: boolean
          link_url?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          allowed_user_ids?: string[] | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_hidden?: boolean
          link_url?: string | null
          updated_at?: string
          user_id?: string
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
            referencedRelation: "images"
            referencedColumns: ["id"]
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
          name: string | null
          role_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role_id?: string | null
          updated_at?: string | null
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
      anonymize_user_data_enhanced: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_data_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          health_check: string
          issue_count: number
          severity: string
          recommendation: string
        }[]
      }
      check_data_integrity_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_type: string
          issue_count: number
          severity: string
          recommendation: string
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
      check_publisher_data_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          status: string
        }[]
      }
      check_rate_limit_enhanced: {
        Args: {
          p_user_id: string
          p_action: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_reading_privacy_access: {
        Args: { target_user_id: string; requesting_user_id?: string }
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
          table_name: string
          records_deleted: number
          cleanup_type: string
          status: string
        }[]
      }
      comprehensive_system_health_check_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_data_version: {
        Args: {
          p_table_name: string
          p_record_id: string
          p_change_reason?: string
        }
        Returns: number
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
          success: boolean
          error_message: string
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
          book_id: string
          book_title: string
          action_taken: string
          publisher_id: string
          status: string
        }[]
      }
      generate_data_health_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          report_section: string
          metric_name: string
          metric_value: string
          status: string
          recommendation: string
        }[]
      }
      generate_intelligent_content: {
        Args: { p_content_type: string; p_input_data: Json; p_user_id?: string }
        Returns: {
          generated_content: string
          confidence_score: number
          metadata: Json
        }[]
      }
      generate_monitoring_report: {
        Args: { p_days_back?: number }
        Returns: Json
      }
      generate_smart_notification: {
        Args: {
          p_user_id: string
          p_notification_type: string
          p_context_data?: Json
        }
        Returns: string
      }
      generate_system_alerts_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_ai_book_recommendations: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          book_id: string
          title: string
          author_name: string
          recommendation_score: number
          recommendation_reason: string
        }[]
      }
      get_data_lineage: {
        Args: { p_table_name: string }
        Returns: {
          source_table: string
          source_column: string
          target_table: string
          target_column: string
          transformation_type: string
          data_flow_description: string
        }[]
      }
      get_data_quality_report: {
        Args: { p_table_name?: string }
        Returns: {
          table_name: string
          total_rules: number
          passed_rules: number
          failed_rules: number
          critical_issues: number
          overall_score: number
        }[]
      }
      get_entity_images: {
        Args: { p_entity_type: string; p_entity_id: string }
        Returns: {
          image_id: string
          image_url: string
          thumbnail_url: string
          alt_text: string
          file_size: number
          created_at: string
          album_name: string
          album_id: string
        }[]
      }
      get_performance_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: {
          recommendation_type: string
          priority: string
          description: string
          estimated_impact: string
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
        Args: { p_user_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          user_id: string
          activity_type: string
          entity_type: string
          entity_id: string
          is_public: boolean
          metadata: Json
          created_at: string
          user_name: string
          user_avatar_url: string
          like_count: number
          comment_count: number
          is_liked: boolean
        }[]
      }
      get_user_privacy_settings: {
        Args: { user_id_param?: string }
        Returns: {
          default_privacy_level: string
          allow_friends_to_see_reading: boolean
          allow_followers_to_see_reading: boolean
          allow_public_reading_profile: boolean
          show_reading_stats_publicly: boolean
          show_currently_reading_publicly: boolean
          show_reading_history_publicly: boolean
          show_reading_goals_publicly: boolean
        }[]
      }
      grant_reading_permission: {
        Args: {
          target_user_id: string
          permission_type?: string
          expires_at?: string
        }
        Returns: boolean
      }
      insert_follow_record: {
        Args: {
          p_follower_id: string
          p_following_id: string
          p_target_type_id: string
        }
        Returns: {
          success: boolean
          error_message: string
        }[]
      }
      log_sensitive_operation_enhanced: {
        Args: {
          p_operation_type: string
          p_table_name: string
          p_record_id: string
          p_user_id?: string
          p_details?: Json
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_activity_type: string
          p_activity_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_session_id?: string
          p_response_time_ms?: number
          p_status_code?: number
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
          health_metric: string
          current_value: number
          threshold_value: number
          status: string
          last_check: string
        }[]
      }
      monitor_database_performance_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      monitor_entity_storage_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          entity_type: string
          entity_id: string
          storage_usage_mb: number
          image_count: number
          warning_level: string
        }[]
      }
      monitor_query_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          query_pattern: string
          avg_execution_time: number
          total_calls: number
          performance_status: string
        }[]
      }
      perform_database_maintenance_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      perform_system_health_check: {
        Args: {
          p_check_name: string
          p_status: string
          p_details?: Json
          p_response_time_ms?: number
          p_error_message?: string
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
          p_metric_name: string
          p_metric_value: number
          p_metric_unit?: string
          p_category?: string
          p_additional_data?: Json
        }
        Returns: string
      }
      refresh_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: {
          view_name: string
          refresh_status: string
          refresh_time: string
        }[]
      }
      revoke_reading_permission: {
        Args: { target_user_id: string; permission_type?: string }
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
          records_processed: number
          performance_improvement: string
        }[]
      }
      safe_cleanup_orphaned_records: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          orphaned_count: number
          action_taken: string
        }[]
      }
      safe_fix_missing_publishers: {
        Args: Record<PropertyKey, never>
        Returns: {
          book_id: string
          book_title: string
          action_taken: string
          publisher_id: string
          status: string
        }[]
      }
      simple_check_publisher_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          status: string
        }[]
      }
      simple_fix_missing_publishers: {
        Args: Record<PropertyKey, never>
        Returns: {
          book_id: string
          book_title: string
          action_taken: string
          publisher_id: string
          status: string
        }[]
      }
      standardize_reading_status_mappings: {
        Args: Record<PropertyKey, never>
        Returns: {
          old_status: string
          new_status: string
          updated_count: number
        }[]
      }
      standardize_reading_statuses: {
        Args: Record<PropertyKey, never>
        Returns: {
          old_status: string
          new_status: string
          updated_count: number
        }[]
      }
      update_book_popularity_metrics: {
        Args: { p_book_id: string }
        Returns: undefined
      }
      update_user_privacy_settings: {
        Args: {
          default_privacy_level?: string
          allow_friends_to_see_reading?: boolean
          allow_followers_to_see_reading?: boolean
          allow_public_reading_profile?: boolean
          show_reading_stats_publicly?: boolean
          show_currently_reading_publicly?: boolean
          show_reading_history_publicly?: boolean
          show_reading_goals_publicly?: boolean
        }
        Returns: boolean
      }
      upsert_reading_progress: {
        Args: {
          p_user_id: string
          p_book_id: string
          p_status: string
          p_progress_percentage?: number
          p_privacy_level?: string
        }
        Returns: Json
      }
      validate_and_repair_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          validation_type: string
          issue_count: number
          fixed_count: number
          status: string
        }[]
      }
      validate_book_data: {
        Args: { book_data: Json }
        Returns: Json
      }
      validate_book_data_enhanced: {
        Args: {
          p_title: string
          p_author: string
          p_isbn?: string
          p_publication_year?: number
        }
        Returns: Json
      }
      validate_enterprise_data_quality: {
        Args: { p_table_name?: string }
        Returns: {
          rule_name: string
          table_name: string
          column_name: string
          rule_type: string
          validation_result: string
          error_count: number
          severity: string
        }[]
      }
      validate_follow_entity: {
        Args: { p_entity_id: string; p_target_type: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
