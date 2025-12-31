import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { ContactInfo, ContactInfoInput } from '@/types/contact'

export interface GroupUpdateInput {
  name?: string
  description?: string
  is_private?: boolean
  is_public?: boolean
  is_discoverable?: boolean
  tags?: string[]
  cover_image_url?: string
  group_image_id?: number
  cover_image_id?: number
}

export async function updateGroupInfo(
  groupId: string,
  updates: GroupUpdateInput
): Promise<boolean> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await (supabase.from('groups') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)

  if (error) {
    console.error('Error updating group info:', {
      error,
      groupId,
      updates,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return false
  }

  return true
}

export async function getGroupInfo(groupId: string) {
  if (!groupId) {
    console.error('getGroupInfo: groupId is required')
    throw new Error('Group ID is required')
  }

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Fetch basic group data only - no complex joins
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError) {
      console.error('Error fetching group info:', {
        error: groupError,
        groupId,
        message: groupError.message,
        details: groupError.details,
        hint: groupError.hint,
        code: groupError.code,
      })
      throw new Error(`Failed to fetch group info: ${groupError.message}`)
    }

    if (!groupData) {
      console.error('No group data found for ID:', groupId)
      throw new Error('Group not found')
    }

    // Fetch creator information
    const { data: creatorData, error: creatorError } = await supabase
      .from('users')
      .select('name, email, created_at, updated_at, role_id')
      .eq('id', (groupData as any).created_by)
      .single()

    if (creatorError) {
      console.error('Error fetching creator info:', {
        error: creatorError,
        groupId,
        message: creatorError.message,
      })
    }

    // Fetch creator's membership information
    const { data: creatorMembership, error: membershipError } = await supabase
      .from('group_members')
      .select('joined_at')
      .eq('group_id', groupId)
      .eq('user_id', (groupData as any).created_by)
      .single()

    if (membershipError) {
      // Only log the error if it's not a "no rows returned" error
      if (membershipError.code !== 'PGRST116') {
        console.error('Error fetching creator membership:', {
          error: membershipError,
          groupId,
          message: membershipError.message,
        })
      }
      // Don't throw error, just continue with null membership
    }

    // Fetch contact information separately
    console.log('Fetching contact info for group ID:', groupId)
    const { data: contactData, error: contactError } = await supabase
      .from('contact_info')
      .select('*')
      .eq('entity_type', 'group')
      .eq('entity_id', groupId)
      .single()

    console.log('Contact data query result:', { contactData, contactError })

    // Don't throw error if no contact info exists, just log it
    if (contactError && contactError.code !== 'PGRST116') {
      console.error('Error fetching contact info:', {
        error: contactError,
        groupId,
        message: contactError.message,
      })
    }

    // Add contact info and creator info to group data
    const result = {
      ...(groupData as any),
      contact_info: contactData || null,
      creatorName: (creatorData as any)?.name,
      creatorEmail: (creatorData as any)?.email,
      creatorRoleId: (creatorData as any)?.role_id,
      creatorCreatedAt: (creatorData as any)?.created_at,
      creatorUpdatedAt: (creatorData as any)?.updated_at,
      creatorJoinedAt: (creatorMembership as any)?.joined_at,
    }

    console.log('Final result with contact info:', result)
    console.log('Contact info specifically:', result.contact_info)

    return result
  } catch (error) {
    console.error('Unexpected error in getGroupInfo:', {
      error,
      groupId,
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

export async function updateGroupMemberRole(
  groupId: string,
  userId: string,
  roleId: number
): Promise<boolean> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await (supabase.from('group_members') as any)
    .update({ role_id: roleId })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating group member role:', {
      error,
      groupId,
      userId,
      roleId,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return false
  }

  return true
}

export async function updateGroupMemberStatus(
  groupId: string,
  userId: string,
  status: string
): Promise<boolean> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await (supabase.from('group_members') as any)
    .update({ status })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating group member status:', {
      error,
      groupId,
      userId,
      status,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return false
  }

  return true
}

export async function addGroupCustomField(
  groupId: string,
  fieldName: string,
  fieldType: string,
  fieldOptions: any
): Promise<boolean> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await (supabase.from('group_custom_fields') as any).insert({
    group_id: groupId,
    field_name: fieldName,
    field_type: fieldType,
    field_options: fieldOptions,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error adding group custom field:', {
      error,
      groupId,
      fieldName,
      fieldType,
      fieldOptions,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return false
  }

  return true
}

export async function updateGroupCustomField(
  fieldId: string,
  updates: {
    field_name?: string
    field_type?: string
    field_options?: any
  }
): Promise<boolean> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await (supabase.from('group_custom_fields') as any)
    .update(updates)
    .eq('id', fieldId)

  if (error) {
    console.error('Error updating group custom field:', {
      error,
      fieldId,
      updates,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return false
  }

  return true
}

export async function deleteGroupCustomField(fieldId: string): Promise<boolean> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.from('group_custom_fields').delete().eq('id', fieldId)

  if (error) {
    console.error('Error deleting group custom field:', {
      error,
      fieldId,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return false
  }

  return true
}

export async function updateGroupContactInfo(
  groupId: string,
  contactInfo: ContactInfoInput
): Promise<ContactInfo> {
  if (!groupId) {
    throw new Error('Group ID is required')
  }

  if (!contactInfo) {
    throw new Error('Contact information is required')
  }

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // First check if the group exists
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single()

    if (groupError) {
      console.error('Error checking group existence:', {
        error: groupError,
        groupId,
        message: groupError.message,
        details: groupError.details,
        hint: groupError.hint,
        code: groupError.code,
      })
      throw new Error(`Group not found: ${groupError.message}`)
    }

    if (!groupData) {
      throw new Error('Group not found')
    }

    // Upsert the contact info
    const { data, error } = await (supabase.from('contact_info') as any)
      .upsert({
        ...contactInfo,
        entity_type: 'group',
        entity_id: groupId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating group contact info:', {
        error,
        groupId,
        contactInfo,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Failed to update contact info: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned after updating contact info')
    }

    return data
  } catch (error) {
    console.error('Unexpected error in updateGroupContactInfo:', {
      error,
      groupId,
      contactInfo,
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

export async function getGroupContactInfo(groupId: string): Promise<ContactInfo | null> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .eq('entity_type', 'group')
    .eq('entity_id', groupId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No contact info exists yet
      return null
    }
    console.error('Error fetching group contact info:', {
      error,
      groupId,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return null
  }

  return data
}

export async function deleteGroupContactInfo(groupId: string): Promise<boolean> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('contact_info')
    .delete()
    .eq('entity_type', 'group')
    .eq('entity_id', groupId)

  if (error) {
    console.error('Error deleting group contact info:', {
      error,
      groupId,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return false
  }

  return true
}
