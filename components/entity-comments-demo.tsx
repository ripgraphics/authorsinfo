'use client'

import EntityComments from '@/components/entity-comments'

interface EntityCommentsDemoProps {
  entityType: 'photo' | 'book' | 'author' | 'publisher' | 'user' | 'group'
  entityId: string
  entityName: string
  entityAvatar?: string
  entityCreatedAt?: string
  isOwner?: boolean
}

export function EntityCommentsDemo({
  entityType,
  entityId,
  entityName,
  entityAvatar,
  entityCreatedAt,
  isOwner = false,
}: EntityCommentsDemoProps) {
  return (
    <div className="flex h-screen">
      {/* Main content area */}
      <div className="flex-1 bg-muted/20 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Entity Comments Demo</h1>
          <div className="bg-background rounded-lg p-4 shadow-xs">
            <h2 className="text-lg font-semibold mb-2">{entityName}</h2>
            <p className="text-muted-foreground mb-4">
              This is a demo of the EntityComments component for {entityType} entities.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Entity Type:</span>
                <span className="text-sm text-muted-foreground">{entityType}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Entity ID:</span>
                <span className="text-sm text-muted-foreground">{entityId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm text-muted-foreground">
                  {entityCreatedAt ? new Date(entityCreatedAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments sidebar */}
      <EntityComments
        entityId={entityId}
        entityType={entityType}
        entityName={entityName}
        entityAvatar={entityAvatar}
        entityCreatedAt={entityCreatedAt}
        isOwner={isOwner}
      />
    </div>
  )
}
