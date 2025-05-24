import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ContactInfo, ContactInfoInput, EntityType } from '@/types/contact';
import { Database } from '@/types/database';

export async function getContactInfo(entityType: EntityType, entityId: string): Promise<ContactInfo | null> {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

    if (error) {
        // Check if the error is because no rows were found
        if (error.code === 'PGRST116') {
            // This is expected when no contact info exists
            return null;
        }
        
        // For other errors, log detailed information
        console.error('Error fetching contact info:', {
            error,
            entityType,
            entityId,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return null;
    }

    return data;
}

export async function upsertContactInfo(
    entityType: EntityType,
    entityId: string,
    contactInfo: ContactInfoInput
): Promise<ContactInfo | null> {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase
        .from('contact_info')
        .upsert({
            entity_type: entityType,
            entity_id: entityId,
            ...contactInfo,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting contact info:', error);
        return null;
    }

    return data;
}

export async function deleteContactInfo(entityType: EntityType, entityId: string): Promise<boolean> {
    const supabase = createClientComponentClient<Database>();
    const { error } = await supabase
        .from('contact_info')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

    if (error) {
        console.error('Error deleting contact info:', error);
        return false;
    }

    return true;
} 