export type MessagingEntityType = 'author' | 'publisher' | 'book' | 'event' | 'group'

export interface EntityMessageTargetInput {
  entityType: MessagingEntityType
  entityId: string
  title: string
  ownerUserId?: string | null
  managedInboxId?: string | null
}

export interface EntityMessageTarget {
  entityType: MessagingEntityType
  entityId: string
  title: string
  recipientUserId: string | null
  managedInbox: boolean
  managedInboxId?: string
}

export function resolveEntityMessageTarget(
  input: EntityMessageTargetInput
): EntityMessageTarget | null {
  if (!input.entityId || !input.title) return null
  if (input.managedInboxId) {
    return {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      recipientUserId: null,
      managedInbox: true,
      managedInboxId: input.managedInboxId,
    }
  }
  if (!input.ownerUserId) return null
  return {
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    recipientUserId: input.ownerUserId,
    managedInbox: false,
  }
}
