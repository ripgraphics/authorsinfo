export interface ContactInfo {
    id: string;
    entity_type: string;
    entity_id: string;
    email?: string;
    phone?: string;
    website?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    created_at: string;
    updated_at: string;
}

export type EntityType = 'group' | 'publisher' | 'author' | 'event';

export interface ContactInfoInput {
    email?: string;
    phone?: string;
    website?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
} 