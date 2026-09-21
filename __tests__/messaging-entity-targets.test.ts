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

  test('prefers a managed inbox over an owner when both are present', () => {
    expect(
      resolveEntityMessageTarget({
        entityType: 'author',
        entityId: 'author-1',
        title: 'Author',
        ownerUserId: 'user-1',
        managedInboxId: 'inbox-1',
      })
    ).toEqual({
      entityType: 'author',
      entityId: 'author-1',
      title: 'Author',
      recipientUserId: null,
      managedInbox: true,
      managedInboxId: 'inbox-1',
    })
  })

  test('fails closed when the entity identifier is blank', () => {
    expect(
      resolveEntityMessageTarget({
        entityType: 'book',
        entityId: '',
        title: 'A book',
        ownerUserId: 'user-1',
      })
    ).toBeNull()
  })

  test('fails closed when the entity title is blank', () => {
    expect(
      resolveEntityMessageTarget({
        entityType: 'group',
        entityId: 'group-1',
        title: '',
        ownerUserId: 'user-1',
      })
    ).toBeNull()
  })

  test('fails closed when a managed inbox identifier is blank', () => {
    expect(
      resolveEntityMessageTarget({
        entityType: 'publisher',
        entityId: 'publisher-1',
        title: 'Publisher',
        managedInboxId: '',
      })
    ).toBeNull()
  })

  test('treats a null owner as an unauthorized recipient', () => {
    expect(
      resolveEntityMessageTarget({
        entityType: 'event',
        entityId: 'event-1',
        title: 'Orphan event',
        ownerUserId: null,
      })
    ).toBeNull()
  })
})
