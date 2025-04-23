import { Database } from './database'

export type Author = {
  id: string;
  name: string;
  bio: string | undefined;
  created_at: string;
  updated_at: string;
  photo_url: string | undefined;
  author_image: {
    id: number;
    url: string;
    alt_text?: string;
    img_type_id?: number;
  } | null;
  cover_image_id: number | undefined;
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
  title: string;
  title_long: string | null;
  publisher_id: number | null;
  publication_date: string | null;
  binding: string | null;
  pages: number | null;
  list_price: number | null;
  language: string | null;
  edition: string | null;
  synopsis: string | null;
  overview: string | null;
  dimensions: string | null;
  weight: number | null;
  cover_image_id: number | null;
  original_image_url: string | null;
  author: string | null;
  featured: boolean | null;
  author_id: number | null;
  book_gallery_img: string[] | null;
  average_rating: number | null;
  review_count: number | null;
  binding_type_id: number | null;
  format_type_id: number | null;
  description: string | null;
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