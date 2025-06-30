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
        Relationships: [
          {
            foreignKeyName: "activities_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
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
            foreignKeyName: "activity_log_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
        Relationships: [
          {
            foreignKeyName: "album_analytics_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "album_images_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
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
        ]
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
        Relationships: [
          {
            foreignKeyName: "book_authors_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
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
            foreignKeyName: "book_club_books_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
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
            referencedRelation: "books"
            referencedColumns: ["id"]
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
            foreignKeyName: "book_clubs_current_book_id_fkey"
            columns: ["current_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "book_genre_mappings_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_genre_mappings_new_genre_id_fkey"
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
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_publishers_new_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
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
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_recommendations_source_book_id_fkey"
            columns: ["source_book_id"]
            isOneToOne: false
            referencedRelation: "books"
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
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_book_reviews_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            foreignKeyName: "book_similarity_scores_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_similarity_scores_new_similar_book_id_fkey"
            columns: ["similar_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "book_subjects_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_subjects_new_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "book_tag_mappings_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_tag_mappings_new_tag_id_fkey"
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
            foreignKeyName: "book_views_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_views_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "publishers"
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
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "event_approvals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_approvals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_approvals_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "event_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
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
        Relationships: [
          {
            foreignKeyName: "event_calendar_exports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_calendar_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "event_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "event_chat_messages_hidden_by_fkey"
            columns: ["hidden_by"]
            isOneToOne: false
            referencedRelation: "users"
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
          {
            foreignKeyName: "event_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "event_locations"
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            foreignKeyName: "event_waitlists_converted_to_registration_id_fkey"
            columns: ["converted_to_registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlists_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            referencedRelation: "books"
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
            foreignKeyName: "events_event_category_id_fkey"
            columns: ["event_category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
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
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_target_type_id_fkey"
            columns: ["target_type_id"]
            isOneToOne: false
            referencedRelation: "follow_target_types"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "group_achievements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_analytics_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_author_events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_author_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_book_list_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_list_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "group_book_lists"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_book_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_book_reviews_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_reviews_new_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_reviews_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_book_swaps_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_swaps_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_swaps_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_swaps_offered_by_fkey"
            columns: ["offered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_book_wishlist_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_wishlist_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_book_wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "group_book_wishlists"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_book_wishlists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
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
        Relationships: [
          {
            foreignKeyName: "group_chat_channels_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_chat_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_chat_messages"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "group_chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_content_moderation_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_discussion_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_event_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_event_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_events_chat_channel_id_fkey"
            columns: ["chat_channel_id"]
            isOneToOne: false
            referencedRelation: "group_chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_invites_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_member_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "group_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_member_achievements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_member_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_member_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_member_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_membership_questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_moderation_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_onboarding_progress_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "group_onboarding_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_onboarding_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "group_onboarding_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_onboarding_tasks_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "group_onboarding_checklists"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_reading_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "group_reading_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reading_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_reading_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reading_progress_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_reading_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reading_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reading_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_rules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_shared_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_tags_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "group_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "group_webhooks"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "image_tag_mappings_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_tag_mappings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "image_tags"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "images_img_type_id_fkey"
            columns: ["img_type_id"]
            isOneToOne: false
            referencedRelation: "image_types"
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
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "likes_feed_entry_id_fkey"
            columns: ["feed_entry_id"]
            isOneToOne: false
            referencedRelation: "feed_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "list_followers_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "reading_lists"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "media_attachments_feed_entry_id_fkey"
            columns: ["feed_entry_id"]
            isOneToOne: false
            referencedRelation: "feed_entries"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_feed_entry_id_fkey"
            columns: ["feed_entry_id"]
            isOneToOne: false
            referencedRelation: "feed_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
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
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "payment_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "photo_albums_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          price: number
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
          price: number
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
          price?: number
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "promo_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "reactions_feed_entry_id_fkey"
            columns: ["feed_entry_id"]
            isOneToOne: false
            referencedRelation: "feed_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "reading_list_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "reading_lists"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "reading_series_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_series_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "reading_sessions_new_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "book_reviews"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "series_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "reading_series"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "similar_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "similar_books_similar_book_id_fkey"
            columns: ["similar_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "event_surveys"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "survey_responses_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "event_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ticket_benefits_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_book_interactions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
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
      accepted_friends: {
        Row: {
          friend_user_id: string | null
          id: string | null
          requested_at: string | null
          responded_at: string | null
          status: string | null
        }
        Relationships: []
      }
      personalized_recommendations_with_details: {
        Row: {
          authors: string | null
          average_rating: number | null
          book_id: number | null
          cover_image_id: string | null
          created_at: string | null
          id: string | null
          isbn13: string | null
          pages: number | null
          publication_date: string | null
          publishers: string | null
          review_count: number | null
          score: number | null
          synopsis: string | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      compute_similar_books: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      count_authors_per_book: {
        Args: Record<PropertyKey, never>
        Returns: {
          book_id: string
          author_count: number
        }[]
      }
      count_books_with_multiple_authors: {
        Args: Record<PropertyKey, never>
        Returns: {
          book_count: number
        }[]
      }
      count_publishers_per_book: {
        Args: Record<PropertyKey, never>
        Returns: {
          book_id: number
          publisher_count: number
        }[]
      }
      create_book_club_event: {
        Args: {
          book_club_id: string
          discussion_id: string
          title: string
          description: string
          start_time: string
          duration_minutes: number
          is_virtual: boolean
          created_by: string
        }
        Returns: string
      }
      create_get_user_reading_stats_function: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_group_with_roles: {
        Args: {
          p_name: string
          p_description: string
          p_cover_image_id: number
          p_group_image_id: number
          p_created_by: string
          p_target_type_id: number
          p_target_id: string
        }
        Returns: Json
      }
      create_new_user: {
        Args: { user_id: string; user_email: string; created_timestamp: string }
        Returns: undefined
      }
      create_or_update_user: {
        Args: { p_user_id: string; p_email: string; p_created_at?: string }
        Returns: boolean
      }
      export_schema_definitions: {
        Args: Record<PropertyKey, never>
        Returns: {
          definition: string
        }[]
      }
      generate_personalized_recommendations: {
        Args: { user_uuid: string }
        Returns: {
          book_id: number
          created_at: string | null
          explanation: string | null
          id: string
          is_dismissed: boolean | null
          recommendation_type: string
          score: number
          updated_at: string | null
          user_id: string
        }[]
      }
      generate_recommendations: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      get_column_names: {
        Args: { table_name: string }
        Returns: string[]
      }
      get_search_suggestions: {
        Args: { search_query: string; max_results?: number }
        Returns: {
          suggestion: string
          entity_type: string
        }[]
      }
      get_table_columns: {
        Args: { table_name_param: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      get_user_reading_stats: {
        Args: { user_id_param: string }
        Returns: {
          books_read: number
          books_reading: number
          books_want_to_read: number
          avg_rating: number
          review_count: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_album_view_count: {
        Args: { album_id: string }
        Returns: undefined
      }
      integer_to_uuid: {
        Args:
          | { integer_id: number }
          | { table_name_param: string; integer_id_param: number }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_group_owner: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      record_book_view: {
        Args: { book_id_param: number }
        Returns: undefined
      }
      search_all: {
        Args: { search_query: string; max_results?: number }
        Returns: {
          entity_type: string
          id: string
          title: string
          subtitle: string
          image_id: number
          similarity: number
        }[]
      }
      search_books: {
        Args: {
          search_query: string
          genre_filter?: string
          min_rating?: number
          max_results?: number
        }
        Returns: {
          id: string
          title: string
          author: string
          description: string
          cover_image_id: string
          pages: number
          published_date: string
          isbn: string
          review_count: number
          average_rating: number
          similarity: number
        }[]
      }
      search_reading_lists: {
        Args: { search_query: string; max_results?: number }
        Returns: {
          id: string
          user_id: string
          name: string
          description: string
          is_public: boolean
          book_count: number
          created_at: string
          updated_at: string
          similarity: number
        }[]
      }
      search_users: {
        Args: { search_query: string; max_results?: number }
        Returns: {
          id: string
          name: string
          email: string
          bio: string
          avatar_url: string
          follower_count: number
          following_count: number
          similarity: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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
