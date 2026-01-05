export type EntityType = 'author' | 'publisher' | 'book' | 'group' | 'user' | 'event'

export interface ContactInfo {
  id?: string
  entity_type: EntityType
  entity_id: string
  email?: string
  phone?: string
  website?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface Image {
  id: string
  url: string
  alt_text?: string
  created_at?: string
}

export interface EntityStats {
  followers?: number
  following?: number
  books?: number
  members?: number
  reviews?: number
  pages_read?: number
}

export interface EntityMetadata {
  entityType: EntityType
  entityId: string
  
  // Core content
  title: string
  description?: string
  bio?: string
  about?: string
  synopsis?: string
  overview?: string
  
  // Contact Information
  contact?: ContactInfo
  
  // URLs
  website?: string
  permalink?: string
  
  // Social
  socialLinks?: Record<string, string>
  
  // Media
  images?: {
    primary?: Image
    cover?: Image
    avatar?: Image
    gallery?: Image[]
  }
  
  // Statistics
  stats?: EntityStats
  
  // Entity-specific metadata
  entityData?: Record<string, any>
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface EntityTabContent {
  id: string
  label: string
  disabled?: boolean
  requiresData?: string[]
}

export interface EntityMoreTabConfig {
  sections: {
    stats?: boolean
    preferences?: boolean
    events?: boolean
    recommendations?: boolean
    related?: boolean
    [key: string]: boolean | undefined
  }
  customSections?: Record<string, any>
}
