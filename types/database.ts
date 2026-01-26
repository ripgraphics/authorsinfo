// Re-export types from other files
export type { Author, Book, Review, BookWithAuthor, BookWithDetails } from './book'
export type { Publisher } from '../lib/publishers'

// Database type - manually extracted from SQL backup schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          review_id: string | null
          list_id: string | null
          data: Json | null
          created_at: string | null
          user_profile_id: string | null
          group_id: string | null
          event_id: string | null
          book_id: string | null
          author_id: string | null
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          view_count: number
          cross_posted_to: string[]
          collaboration_type: string
          ai_enhanced: boolean
          ai_enhanced_text: string | null
          ai_enhanced_performance: number | null
          content_type: string
          visibility: string
          content_summary: string | null
          text: string | null
          image_url: string | null
          hashtags: string[] | null
          link_url: string | null
          engagement_score: number
          updated_at: string | null
          publish_status: string
          scheduled_at: string | null
          published_at: string | null
          is_featured: boolean
          is_pinned: boolean
          trending_score: number
          like_count: number
          comment_count: number
          share_count: number
          bookmark_count: number
          user_has_reacted: boolean
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          review_id?: string | null
          list_id?: string | null
          data?: Json | null
          created_at?: string | null
          user_profile_id?: string | null
          group_id?: string | null
          event_id?: string | null
          book_id?: string | null
          author_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          view_count?: number
          cross_posted_to?: string[]
          collaboration_type?: string
          ai_enhanced?: boolean
          ai_enhanced_text?: string | null
          ai_enhanced_performance?: number | null
          content_type?: string
          visibility?: string
          content_summary?: string | null
          text?: string | null
          image_url?: string | null
          hashtags?: string[] | null
          link_url?: string | null
          engagement_score?: number
          updated_at?: string | null
          publish_status?: string
          scheduled_at?: string | null
          published_at?: string | null
          is_featured?: boolean
          is_pinned?: boolean
          trending_score?: number
          like_count?: number
          comment_count?: number
          share_count?: number
          bookmark_count?: number
          user_has_reacted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          review_id?: string | null
          list_id?: string | null
          data?: Json | null
          created_at?: string | null
          user_profile_id?: string | null
          group_id?: string | null
          event_id?: string | null
          book_id?: string | null
          author_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          view_count?: number
          cross_posted_to?: string[]
          collaboration_type?: string
          ai_enhanced?: boolean
          ai_enhanced_text?: string | null
          ai_enhanced_performance?: number | null
          content_type?: string
          visibility?: string
          content_summary?: string | null
          text?: string | null
          image_url?: string | null
          hashtags?: string[] | null
          link_url?: string | null
          engagement_score?: number
          updated_at?: string | null
          publish_status?: string
          scheduled_at?: string | null
          published_at?: string | null
          is_featured?: boolean
          is_pinned?: boolean
          trending_score?: number
          like_count?: number
          comment_count?: number
          share_count?: number
          bookmark_count?: number
          user_has_reacted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          created_at: string | null
          updated_at: string | null
          role_id: string | null
          permalink: string | null
          location: string | null
          website: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          created_at?: string | null
          updated_at?: string | null
          role_id?: string | null
          permalink?: string | null
          location?: string | null
          website?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          created_at?: string | null
          updated_at?: string | null
          role_id?: string | null
          permalink?: string | null
          location?: string | null
          website?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          isbn10: string | null
          isbn13: string | null
          title: string
          title_long: string | null
          publisher_id: string | null
          publication_date: string | null
          binding: string | null
          pages: number | null
          list_price: number | null
          language: string | null
          edition: string | null
          synopsis: string | null
          overview: string | null
          dimensions: string | null
          weight: number | null
          cover_image_id: string | null
          original_image_url: string | null
          author: string | null
          featured: boolean
          book_gallery_img: string[] | null
          average_rating: number
          review_count: number
          created_at: string
          author_id: string | null
          binding_type_id: string | null
          format_type_id: string | null
          status_id: string | null
          updated_at: string
          permalink: string | null
        }
        Insert: {
          id?: string
          isbn10?: string | null
          isbn13?: string | null
          title: string
          title_long?: string | null
          publisher_id?: string | null
          publication_date?: string | null
          binding?: string | null
          pages?: number | null
          list_price?: number | null
          language?: string | null
          edition?: string | null
          synopsis?: string | null
          overview?: string | null
          dimensions?: string | null
          weight?: number | null
          cover_image_id?: string | null
          original_image_url?: string | null
          author?: string | null
          featured?: boolean
          book_gallery_img?: string[] | null
          average_rating?: number
          review_count?: number
          created_at?: string
          author_id?: string | null
          binding_type_id?: string | null
          format_type_id?: string | null
          status_id?: string | null
          updated_at?: string
          permalink?: string | null
        }
        Update: {
          id?: string
          isbn10?: string | null
          isbn13?: string | null
          title?: string
          title_long?: string | null
          publisher_id?: string | null
          publication_date?: string | null
          binding?: string | null
          pages?: number | null
          list_price?: number | null
          language?: string | null
          edition?: string | null
          synopsis?: string | null
          overview?: string | null
          dimensions?: string | null
          weight?: number | null
          cover_image_id?: string | null
          original_image_url?: string | null
          author?: string | null
          featured?: boolean
          book_gallery_img?: string[] | null
          average_rating?: number
          review_count?: number
          created_at?: string
          author_id?: string | null
          binding_type_id?: string | null
          format_type_id?: string | null
          status_id?: string | null
          updated_at?: string
          permalink?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          id: string
          name: string
          bio: string | null
          featured: boolean
          birth_date: string | null
          nationality: string | null
          website: string | null
          author_image_id: string | null
          twitter_handle: string | null
          facebook_handle: string | null
          instagram_handle: string | null
          goodreads_url: string | null
          cover_image_id: string | null
          created_at: string | null
          updated_at: string | null
          author_gallery_id: string | null
          permalink: string | null
        }
        Insert: {
          id?: string
          name: string
          bio?: string | null
          featured?: boolean
          birth_date?: string | null
          nationality?: string | null
          website?: string | null
          author_image_id?: string | null
          twitter_handle?: string | null
          facebook_handle?: string | null
          instagram_handle?: string | null
          goodreads_url?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          author_gallery_id?: string | null
          permalink?: string | null
        }
        Update: {
          id?: string
          name?: string
          bio?: string | null
          featured?: boolean
          birth_date?: string | null
          nationality?: string | null
          website?: string | null
          author_image_id?: string | null
          twitter_handle?: string | null
          facebook_handle?: string | null
          instagram_handle?: string | null
          goodreads_url?: string | null
          cover_image_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          author_gallery_id?: string | null
          permalink?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          created_at: string | null
          updated_at: string | null
          role: string
          birth_date: string | null
          gender: string | null
          occupation: string | null
          education: string | null
          interests: string[] | null
          social_links: Json | null
          phone: string | null
          timezone: string | null
          language_preference: string
          profile_completion_percentage: number
          last_profile_update: string | null
          profile_visibility: string
          avatar_image_id: string | null
          cover_image_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          created_at?: string | null
          updated_at?: string | null
          role?: string
          birth_date?: string | null
          gender?: string | null
          occupation?: string | null
          education?: string | null
          interests?: string[] | null
          social_links?: Json | null
          phone?: string | null
          timezone?: string | null
          language_preference?: string
          profile_completion_percentage?: number
          last_profile_update?: string | null
          profile_visibility?: string
          avatar_image_id?: string | null
          cover_image_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          created_at?: string | null
          updated_at?: string | null
          role?: string
          birth_date?: string | null
          gender?: string | null
          occupation?: string | null
          education?: string | null
          interests?: string[] | null
          social_links?: Json | null
          phone?: string | null
          timezone?: string | null
          language_preference?: string
          profile_completion_percentage?: number
          last_profile_update?: string | null
          profile_visibility?: string
          avatar_image_id?: string | null
          cover_image_id?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          created_by: string | null
          created_at: string | null
          member_count: number
          permalink: string | null
          cover_image_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          created_by?: string | null
          created_at?: string | null
          member_count?: number
          permalink?: string | null
          cover_image_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          created_by?: string | null
          created_at?: string | null
          member_count?: number
          permalink?: string | null
          cover_image_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          description: string | null
          summary: string | null
          event_category_id: string | null
          type_id: string | null
          format: string | null
          status: string | null
          visibility: string | null
          featured: boolean
          start_date: string
          end_date: string
          timezone: string | null
          all_day: boolean
          max_attendees: number | null
          cover_image_id: string | null
          event_image_id: string | null
          is_recurring: boolean
          recurrence_pattern: Json | null
          parent_event_id: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
          published_at: string | null
          requires_registration: boolean
          registration_opens_at: string | null
          registration_closes_at: string | null
          is_free: boolean
          price: number | null
          currency: string | null
          group_id: string | null
          virtual_meeting_url: string | null
          virtual_meeting_id: string | null
          virtual_meeting_password: string | null
          virtual_platform: string | null
          slug: string | null
          seo_title: string | null
          seo_description: string | null
          canonical_url: string | null
          content_blocks: Json | null
          author_id: string | null
          book_id: string | null
          publisher_id: string | null
          permalink: string | null
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          description?: string | null
          summary?: string | null
          event_category_id?: string | null
          type_id?: string | null
          format?: string | null
          status?: string | null
          visibility?: string | null
          featured?: boolean
          start_date: string
          end_date: string
          timezone?: string | null
          all_day?: boolean
          max_attendees?: number | null
          cover_image_id?: string | null
          event_image_id?: string | null
          is_recurring?: boolean
          recurrence_pattern?: Json | null
          parent_event_id?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
          requires_registration?: boolean
          registration_opens_at?: string | null
          registration_closes_at?: string | null
          is_free?: boolean
          price?: number | null
          currency?: string | null
          group_id?: string | null
          virtual_meeting_url?: string | null
          virtual_meeting_id?: string | null
          virtual_meeting_password?: string | null
          virtual_platform?: string | null
          slug?: string | null
          seo_title?: string | null
          seo_description?: string | null
          canonical_url?: string | null
          content_blocks?: Json | null
          author_id?: string | null
          book_id?: string | null
          publisher_id?: string | null
          permalink?: string | null
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          summary?: string | null
          event_category_id?: string | null
          type_id?: string | null
          format?: string | null
          status?: string | null
          visibility?: string | null
          featured?: boolean
          start_date?: string
          end_date?: string
          timezone?: string | null
          all_day?: boolean
          max_attendees?: number | null
          cover_image_id?: string | null
          event_image_id?: string | null
          is_recurring?: boolean
          recurrence_pattern?: Json | null
          parent_event_id?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
          requires_registration?: boolean
          registration_opens_at?: string | null
          registration_closes_at?: string | null
          is_free?: boolean
          price?: number | null
          currency?: string | null
          group_id?: string | null
          virtual_meeting_url?: string | null
          virtual_meeting_id?: string | null
          virtual_meeting_password?: string | null
          virtual_platform?: string | null
          slug?: string | null
          seo_title?: string | null
          seo_description?: string | null
          canonical_url?: string | null
          content_blocks?: Json | null
          author_id?: string | null
          book_id?: string | null
          publisher_id?: string | null
          permalink?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          data: Json | null
          is_read: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          data?: Json | null
          is_read?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          content_type: string
          title: string | null
          content: string | null
          content_summary: string | null
          image_url: string | null
          link_url: string | null
          hashtags: string[]
          metadata: Json
          visibility: string
          publish_status: string
          scheduled_at: string | null
          published_at: string | null
          is_featured: boolean
          is_pinned: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          content_type?: string
          title?: string | null
          content?: string | null
          content_summary?: string | null
          image_url?: string | null
          link_url?: string | null
          hashtags?: string[]
          metadata?: Json
          visibility?: string
          publish_status?: string
          scheduled_at?: string | null
          published_at?: string | null
          is_featured?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          content_type?: string
          title?: string | null
          content?: string | null
          content_summary?: string | null
          image_url?: string | null
          link_url?: string | null
          hashtags?: string[]
          metadata?: Json
          visibility?: string
          publish_status?: string
          scheduled_at?: string | null
          published_at?: string | null
          is_featured?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          user_id: string
          feed_entry_id: string | null
          content: string
          created_at: string
          updated_at: string
          is_hidden: boolean
          is_deleted: boolean
          entity_type: string | null
          entity_id: string | null
          parent_id: string | null
          parent_comment_id: string | null
          thread_id: string | null
          comment_depth: number
          reply_count: number
          moderation_status: string
          content_html: string | null
          mentions: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          feed_entry_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
          is_hidden?: boolean
          is_deleted?: boolean
          entity_type?: string | null
          entity_id?: string | null
          parent_id?: string | null
          parent_comment_id?: string | null
          thread_id?: string | null
          comment_depth?: number
          reply_count?: number
          moderation_status?: string
          content_html?: string | null
          mentions?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          feed_entry_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
          is_hidden?: boolean
          is_deleted?: boolean
          entity_type?: string | null
          entity_id?: string | null
          parent_id?: string | null
          parent_comment_id?: string | null
          thread_id?: string | null
          comment_depth?: number
          reply_count?: number
          moderation_status?: string
          content_html?: string | null
          mentions?: string[] | null
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          status: string
          progress_percentage: number
          current_page: number | null
          total_pages: number | null
          percentage: number | null
          start_date: string | null
          finish_date: string | null
          created_at: string | null
          updated_at: string | null
          book_id: string | null
          privacy_level: string
          allow_friends: boolean
          allow_followers: boolean
          custom_permissions: Json
          privacy_audit_log: Json
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          progress_percentage?: number
          current_page?: number | null
          total_pages?: number | null
          percentage?: number | null
          start_date?: string | null
          finish_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          book_id?: string | null
          privacy_level?: string
          allow_friends?: boolean
          allow_followers?: boolean
          custom_permissions?: Json
          privacy_audit_log?: Json
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          progress_percentage?: number
          current_page?: number | null
          total_pages?: number | null
          percentage?: number | null
          start_date?: string | null
          finish_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          book_id?: string | null
          privacy_level?: string
          allow_friends?: boolean
          allow_followers?: boolean
          custom_permissions?: Json
          privacy_audit_log?: Json
        }
        Relationships: []
      }
      custom_permissions: {
        Row: {
          id: string
          user_id: string
          target_user_id: string
          permission_type: string
          granted_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_user_id: string
          permission_type: string
          granted_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_user_id?: string
          permission_type?: string
          granted_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string | null
          updated_at: string | null
          target_type_id_uuid_temp: string | null
          target_type_id: string | null
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string | null
          updated_at?: string | null
          target_type_id_uuid_temp?: string | null
          target_type_id?: string | null
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string | null
          updated_at?: string | null
          target_type_id_uuid_temp?: string | null
          target_type_id?: string | null
        }
        Relationships: []
      }
      user_privacy_settings: {
        Row: {
          id: string
          user_id: string
          default_privacy_level: string
          allow_friends_to_see_reading: boolean
          allow_followers_to_see_reading: boolean
          allow_public_reading_profile: boolean
          show_reading_stats_publicly: boolean
          show_currently_reading_publicly: boolean
          show_reading_history_publicly: boolean
          show_reading_goals_publicly: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_privacy_level?: string
          allow_friends_to_see_reading?: boolean
          allow_followers_to_see_reading?: boolean
          allow_public_reading_profile?: boolean
          show_reading_stats_publicly?: boolean
          show_currently_reading_publicly?: boolean
          show_reading_history_publicly?: boolean
          show_reading_goals_publicly?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_privacy_level?: string
          allow_friends_to_see_reading?: boolean
          allow_followers_to_see_reading?: boolean
          allow_public_reading_profile?: boolean
          show_reading_stats_publicly?: boolean
          show_currently_reading_publicly?: boolean
          show_reading_history_publicly?: boolean
          show_reading_goals_publicly?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_entries: {
        Row: {
          id: string
          user_id: string | null
          group_id: string | null
          type: string
          content: Json
          created_at: string
          updated_at: string
          visibility: string
          allowed_user_ids: string[] | null
          is_hidden: boolean
          is_deleted: boolean
          entity_type: string | null
          entity_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          group_id?: string | null
          type: string
          content: Json
          created_at?: string
          updated_at?: string
          visibility?: string
          allowed_user_ids?: string[] | null
          is_hidden?: boolean
          is_deleted?: boolean
          entity_type?: string | null
          entity_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          group_id?: string | null
          type?: string
          content?: Json
          created_at?: string
          updated_at?: string
          visibility?: string
          allowed_user_ids?: string[] | null
          is_hidden?: boolean
          is_deleted?: boolean
          entity_type?: string | null
          entity_id?: string | null
        }
        Relationships: []
      }
      privacy_audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          privacy_level_before: string | null
          privacy_level_after: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type: string
          privacy_level_before?: string | null
          privacy_level_after?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          privacy_level_before?: string | null
          privacy_level_after?: string | null
          created_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
          status: 'active' | 'archived' | 'blocked' | 'pending'
          created_by: string | null
          metadata: Json
          usage_count: number
          created_at: string
          updated_at: string
          deleted_at: string | null
          default_locale: string
          localized_names: Json
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
          status?: 'active' | 'archived' | 'blocked' | 'pending'
          created_by?: string | null
          metadata?: Json
          usage_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          default_locale?: string
          localized_names?: Json
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
          status?: 'active' | 'archived' | 'blocked' | 'pending'
          created_by?: string | null
          metadata?: Json
          usage_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          default_locale?: string
          localized_names?: Json
        }
        Relationships: []
      }
      tag_aliases: {
        Row: {
          id: string
          tag_id: string
          alias: string
          alias_slug: string
          created_at: string
        }
        Insert: {
          id?: string
          tag_id: string
          alias: string
          alias_slug: string
          created_at?: string
        }
        Update: {
          id?: string
          tag_id?: string
          alias?: string
          alias_slug?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tag_aliases_tag_id_fkey'
            columns: ['tag_id']
            referencedRelation: 'tags'
            referencedColumns: ['id']
          }
        ]
      }
      taggings: {
        Row: {
          id: string
          tag_id: string
          entity_type: string
          entity_id: string
          tagged_by: string | null
          context: 'post' | 'comment' | 'profile' | 'message' | 'photo' | 'activity' | 'book' | 'author' | 'group' | 'event'
          position_start: number | null
          position_end: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tag_id: string
          entity_type: string
          entity_id: string
          tagged_by?: string | null
          context: 'post' | 'comment' | 'profile' | 'message' | 'photo' | 'activity' | 'book' | 'author' | 'group' | 'event'
          position_start?: number | null
          position_end?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tag_id?: string
          entity_type?: string
          entity_id?: string
          tagged_by?: string | null
          context?: 'post' | 'comment' | 'profile' | 'message' | 'photo' | 'activity' | 'book' | 'author' | 'group' | 'event'
          position_start?: number | null
          position_end?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'taggings_tag_id_fkey'
            columns: ['tag_id']
            referencedRelation: 'tags'
            referencedColumns: ['id']
          }
        ]
      }
      tag_policies: {
        Row: {
          id: string
          entity_type: string
          entity_id: string | null
          allow_user_mentions: boolean
          allow_entity_mentions: boolean
          allow_hashtags: boolean
          require_approval: boolean
          blocked_tag_ids: string[]
          allowed_tag_types: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id?: string | null
          allow_user_mentions?: boolean
          allow_entity_mentions?: boolean
          allow_hashtags?: boolean
          require_approval?: boolean
          blocked_tag_ids?: string[]
          allowed_tag_types?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string | null
          allow_user_mentions?: boolean
          allow_entity_mentions?: boolean
          allow_hashtags?: boolean
          require_approval?: boolean
          blocked_tag_ids?: string[]
          allowed_tag_types?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tag_audit_log: {
        Row: {
          id: string
          tag_id: string | null
          tagging_id: string | null
          action: 'create' | 'update' | 'delete' | 'block' | 'unblock' | 'merge' | 'approve' | 'reject'
          actor_id: string | null
          entity_type: string | null
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tag_id?: string | null
          tagging_id?: string | null
          action: 'create' | 'update' | 'delete' | 'block' | 'unblock' | 'merge' | 'approve' | 'reject'
          actor_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tag_id?: string | null
          tagging_id?: string | null
          action?: 'create' | 'update' | 'delete' | 'block' | 'unblock' | 'merge' | 'approve' | 'reject'
          actor_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tag_audit_log_tag_id_fkey'
            columns: ['tag_id']
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tag_audit_log_tagging_id_fkey'
            columns: ['tagging_id']
            referencedRelation: 'taggings'
            referencedColumns: ['id']
          }
        ]
      }
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: any[]
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      check_reading_privacy_access: {
        Args: {
          target_user_id: string
          requesting_user_id: string
        }
        Returns: boolean
      }
      log_privacy_event: {
        Args: Record<string, any>
        Returns: void
      }
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
