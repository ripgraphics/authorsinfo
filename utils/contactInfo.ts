import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { ContactInfo, ContactInfoInput, EntityType } from '@/types/contact';
import { Database } from '@/types/database';

const supabase = createClientComponentClient<Database>();

export async function getContactInfo(entityType: EntityType, entityId: string | number): Promise<ContactInfo | null> {
    if (!entityType || !entityId) {
        console.error('Invalid parameters for getContactInfo:', { entityType, entityId });
        return null;
    }

    try {
        console.log('Fetching contact info for:', { entityType, entityId: String(entityId) });
        
        const { data, error } = await supabase
            .from('contact_info')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', String(entityId))
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('No contact info found for:', { entityType, entityId });
                return null;
            }
            
            console.error('Error fetching contact info:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                entityType,
                entityId,
                stack: new Error().stack
            });
            throw error;
        }

        console.log('Contact info fetched successfully:', {
            hasEmail: !!data?.email,
            hasPhone: !!data?.phone,
            hasWebsite: !!data?.website
        });

        return data;
    } catch (error) {
        console.error('Unexpected error in getContactInfo:', {
            error,
            entityType,
            entityId,
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}

export async function upsertContactInfo(contactInfo: ContactInfoInput): Promise<ContactInfo | null> {
    if (!contactInfo.entity_type || !contactInfo.entity_id) {
        console.error('Invalid parameters for upsertContactInfo:', contactInfo);
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('contact_info')
            .upsert({
                ...contactInfo,
                entity_id: String(contactInfo.entity_id),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error upserting contact info:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                contactInfo,
                stack: new Error().stack
            });
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error in upsertContactInfo:', {
            error,
            contactInfo,
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}

export async function deleteContactInfo(entityType: EntityType, entityId: string | number): Promise<boolean> {
    if (!entityType || !entityId) {
        console.error('Invalid parameters for deleteContactInfo:', { entityType, entityId });
        return false;
    }

    try {
        const { error } = await supabase
            .from('contact_info')
            .delete()
            .eq('entity_type', entityType)
            .eq('entity_id', String(entityId));

        if (error) {
            console.error('Error deleting contact info:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                entityType,
                entityId,
                stack: new Error().stack
            });
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error in deleteContactInfo:', {
            error,
            entityType,
            entityId,
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
} 