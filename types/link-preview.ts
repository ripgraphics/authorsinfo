// TypeScript types for Enterprise Link Preview System
// Phase 1: Enterprise Link Post Component

export interface LinkPreviewMetadata {
  id?: string
  url: string
  normalized_url: string
  title?: string
  description?: string
  image_url?: string
  thumbnail_url?: string
  images?: string[] // Array of all available images from the page
  favicon_url?: string
  site_name?: string
  domain: string
  link_type?: 'article' | 'video' | 'image' | 'website' | 'product' | 'book' | 'other'
  author?: string
  published_at?: string
  metadata?: Record<string, any>
  security_score?: number
  extracted_at?: string
  expires_at?: string
  is_valid?: boolean
  created_at?: string
  updated_at?: string
}

export interface LinkAnalyticsEvent {
  id?: string
  link_preview_id: string
  post_id?: string
  user_id?: string
  event_type: 'view' | 'click' | 'share' | 'bookmark'
  clicked_at?: string
  user_agent?: string
  referrer?: string
  ip_address?: string
  created_at?: string
}

export interface LinkPreviewRequest {
  url: string
  refresh?: boolean
  validate_security?: boolean
  /** When true, skip Cloudinary image optimization for faster preview. */
  skip_image_optimization?: boolean
}

export interface LinkPreviewResponse {
  success: boolean
  data?: LinkPreviewMetadata
  error?: string
  from_cache?: boolean
  warnings?: string[]
}

export interface LinkValidationResult {
  is_valid: boolean
  security_score: number
  warnings: string[]
  errors: string[]
  domain_reputation?: 'good' | 'neutral' | 'suspicious' | 'malicious'
  ssl_valid?: boolean
  phishing_risk?: boolean
}

export interface ExtractedMetadata {
  // Open Graph tags
  og_title?: string
  og_description?: string
  og_image?: string
  og_url?: string
  og_type?: string
  og_site_name?: string
  og_author?: string
  og_published_time?: string
  og_article_author?: string
  og_article_published_time?: string

  // Twitter Card tags
  twitter_card?: string
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  twitter_site?: string
  twitter_creator?: string

  // HTML meta tags (fallback)
  html_title?: string
  html_description?: string
  html_keywords?: string
  html_author?: string

  // Additional metadata
  favicon?: string
  canonical_url?: string
  language?: string
  content_type?: string
  charset?: string

  // Video-specific
  video_url?: string
  video_type?: string
  video_duration?: number
  video_thumbnail?: string

  // Article-specific
  article_author?: string
  article_published_time?: string
  article_modified_time?: string
  article_section?: string
  article_tag?: string[]

  // Product-specific
  product_price?: string
  product_currency?: string
  product_availability?: string
  product_condition?: string

  // All images found on the page
  all_images?: string[]
}

export interface LinkPreviewOptions {
  timeout?: number
  max_redirects?: number
  user_agent?: string
  follow_redirects?: boolean
  validate_ssl?: boolean
  extract_images?: boolean
  extract_videos?: boolean
}

export interface ImageOptimizationResult {
  original_url: string
  optimized_url: string
  thumbnail_url?: string
  width: number
  height: number
  format: 'webp' | 'avif' | 'jpeg' | 'png'
  size_bytes: number
  cloudinary_public_id?: string
}

export interface LinkPreviewCacheEntry {
  url: string
  metadata: LinkPreviewMetadata
  cached_at: number
  expires_at: number
  hit_count: number
}
