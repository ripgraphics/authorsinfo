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
          event_id?: string | null
          group_id?: string | null
          id?: string
          list_id?: string | null
          review_id?: string | null
          user_id?: string
          user_profile_id?: string | null
        }
        Relationships: []
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
        Relationships: []
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
          id?: string
          image_id?: string
          is_cover?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      authors: {
        Row: {
          author_gallery_id: number | null
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
          author_gallery_id?: number | null
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
          author_gallery_id?: number | null
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
        Relationships: []
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
        Relationships: []
      }
      book_authors: {
        Row: {
          author_id: string | null
          book_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      book_genre_mappings: {
        Row: {
          book_id: string | null
          genre_id: string | null
          id: string
        }
        Insert: {
          book_id?: string | null
          genre_id?: string | null
          id?: string
        }
        Update: {
          book_id?: string | null
          genre_id?: string | null
          id?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      book_subjects: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      book_tag_mappings: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          tag_id: string | null
          updated_at: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          tag_id?: string | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          tag_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
          book_id: string | null
          created_at: string | null
          display_order: number | null
          event_id: string
          feature_type: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id: string
          feature_type?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          feature_type?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      feed_entries: {
        Row: {
          allowed_user_ids: string[] | null
          content: Json
          created_at: string
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
          group_id?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean
          type?: string
          updated_at?: string
          user_id?: string | null
          visibility?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
      image_types: {
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
      images: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          deleted_at: string | null
          file_size: number | null
          format: string | null
          height: number | null
          id: string
          img_type_id: string | null
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
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          img_type_id?: string | null
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
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          img_type_id?: string | null
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
        Relationships: []
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
          album_type: string
          cover_image_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_public: boolean | null
          like_count: number | null
          metadata: Json | null
          name: string
          owner_id: string
          share_count: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          album_type: string
          cover_image_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          name: string
          owner_id: string
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          album_type?: string
          cover_image_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string | null
          created_at: string | null
          finish_date: string | null
          id: string
          progress_percentage: number
          start_date: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          finish_date?: string | null
          id?: string
          progress_percentage?: number
          start_date?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          finish_date?: string | null
          id?: string
          progress_percentage?: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_book_dimensions: {
        Args: { book_uuid: string; dimensions_json: Json }
        Returns: undefined
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
      populate_dewey_decimal_classifications: {
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
