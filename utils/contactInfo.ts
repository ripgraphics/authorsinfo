import { createBrowserClient } from '@supabase/ssr';
import type { ContactInfo, ContactInfoInput, EntityType } from '@/types/contact';
import { Database } from '@/types/database';

const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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
        console.log('Attempting to upsert contact info:', {
            entity_type: contactInfo.entity_type,
            entity_id: contactInfo.entity_id,
            hasEmail: !!contactInfo.email,
            hasPhone: !!contactInfo.phone,
            hasWebsite: !!contactInfo.website
        });

        // First, check if the table exists and is accessible
        const { data: tableCheck, error: tableError } = await supabase
            .from('contact_info')
            .select('id')
            .limit(1);

        if (tableError) {
            console.error('Table access error:', {
                message: tableError.message,
                details: tableError.details,
                hint: tableError.hint,
                code: tableError.code
            });
            throw new Error(`Cannot access contact_info table: ${tableError.message}`);
        }

        // Prepare the data for upsert
        const upsertData = {
            ...contactInfo,
            entity_id: String(contactInfo.entity_id),
            updated_at: new Date().toISOString()
        };

        console.log('Upsert data prepared:', upsertData);

        const { data, error } = await supabase
            .from('contact_info')
            .upsert(upsertData)
            .select()
            .single();

        if (error) {
            console.error('Error upserting contact info:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                contactInfo: upsertData,
                stack: new Error().stack
            });
            
            // Provide more specific error information
            let errorMessage = 'Failed to upsert contact info';
            if (error.code === '23505') {
                errorMessage = 'Contact info already exists for this entity';
            } else if (error.code === '23503') {
                errorMessage = 'Foreign key constraint violation';
            } else if (error.code === '42501') {
                errorMessage = 'Permission denied - check RLS policies';
            } else if (error.code === '42P01') {
                errorMessage = 'Table contact_info does not exist';
            }
            
            throw new Error(`${errorMessage}: ${error.message}`);
        }

        console.log('Contact info upserted successfully:', data);
        return data;
    } catch (error) {
        console.error('Unexpected error in upsertContactInfo:', {
            error: error instanceof Error ? error.message : error,
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