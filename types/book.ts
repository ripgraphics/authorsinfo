import { Database } from './database'

export type Author = {
  id: string; // UUID
  name: string;
  bio: string | undefined;
  created_at: string;
  updated_at: string;
  photo_url: string | undefined;
  author_image: {
    id: string; // UUID
    url: string;
    alt_text?: string;
    img_type_id?: number;
  } | null;
  cover_image_id: string | undefined; // UUID
  cover_image?: {
    id: string; // UUID
    url: string;
    alt_text?: string;
    img_type_id?: number;
  } | null;
  nationality?: string | null;
  website?: string | null;
  permalink?: string | null;
  facebook_handle?: string | null;
  instagram_handle?: string | null;
  twitter_handle?: string | null;
  goodreads_url?: string | null;
  birth_date?: string | null;
  featured?: boolean | null;
  author_gallery_id?: string | null;
};

export type Review = {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  updated_at: string;
  contains_spoilers: boolean;
};

export type Book = {
  id: string;
  isbn10: string | null;
  isbn13: string | null;
  isbn: string | null;
  title: string;
  title_long: string | null;
  publisher_id: string | null;
  publication_date: string | null;
  publish_date: string | null;
  binding: string | null;
  pages: number | null;
  page_count: number | null;
  list_price: number | null;
  language: string | null;
  edition: string | null;
  synopsis: string | null;
  overview: string | null;
  dimensions: string | null;
  weight: number | null;
  lexile_measure: string | null;
  cover_image_id: string | null;
  original_image_url: string | null; // ADMIN USE ONLY - for troubleshooting/regeneration
  cover_image_url: string | null; // DEPRECATED - use cover_image relation instead
  cover_image?: {
    id: number;
    url: string;
    alt_text?: string;
    img_type_id?: number;
  } | null;
  author: string | null;
  featured: boolean | null;
  author_id: string | null;
  book_gallery_img: string[] | null;
  average_rating: number | null;
  review_count: number | null;
  genre: string | null;
  series: string | null;
  series_number: number | null;
  binding_type_id: number | null;
  format_type_id: number | null;
  format: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type BindingType = Database['public']['Tables']['binding_types']['Row']
export type FormatType = Database['public']['Tables']['format_types']['Row']

export interface BookWithAuthor extends Omit<Book, 'author'> {
  author: Author;
}

export interface BookWithDetails extends Omit<Book, 'author'> {
  author: Author;
  binding_type: BindingType;
  format_type: FormatType;
  reviews: Review[];
} 