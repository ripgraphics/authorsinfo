import {
  resolveEntityMessageTarget,
  type EntityMessageTargetInput,
} from '@/lib/messaging/entity-targets'

describe('entity message target resolution', () => {
  test('resolves an event owner as the human message recipient', () => {
    const input: EntityMessageTargetInput = {
      entityType: 'event',
      entityId: 'event-1',
      ownerUserId: 'user-1',
      title: 'Author event',
    }

    expect(resolveEntityMessageTarget(input)).toEqual({
      entityType: 'event',
      entityId: 'event-1',
      title: 'Author event',
      recipientUserId: 'user-1',
      managedInbox: false,
    })
  })

  test('fails closed when an entity has no authorized owner or managed inbox', () => {
    expect(
      resolveEntityMessageTarget({
        entityType: 'book',
        entityId: 'book-1',
        title: 'A book',
      })
    ).toBeNull()
  })

  test('supports an explicitly authorized managed inbox', () => {
    expect(
      resolveEntityMessageTarget({
        entityType: 'publisher',
        entityId: 'publisher-1',
        title: 'Publisher',
        managedInboxId: 'inbox-1',
      })
    ).toEqual({
      entityType: 'publisher',
      entityId: 'publisher-1',
      title: 'Publisher',
      recipientUserId: null,
      managedInbox: true,
      managedInboxId: 'inbox-1',
    })
  })
})
