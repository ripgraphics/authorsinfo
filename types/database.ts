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
  featured?: string | boolean
  birth_date?: string
  nationality?: string
  website?: string
  author_image_id?: number
  cover_image_id?: number
  author_gallery_id?: number
  twitter_handle?: string
  facebook_handle?: string
  instagram_handle?: string
  goodreads_url?: string
  created_at?: string
  updated_at?: string
  // Joined fields
  author_image?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  cover_image?: {
    id: number
    url: string
    alt_text?: string
    img_type_id?: number
  }
  photo_url?: string // Legacy field
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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
