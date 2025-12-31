import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UniversalPhotoUpload, EntityType } from './universal-photo-upload'
import { EntityPhotoAlbums } from './user-photo-albums'
import { useAuth } from '@/hooks/useAuth'

interface EntityPhotoGalleryDemoProps {
  className?: string
}

export function EntityPhotoGalleryDemo({ className = '' }: EntityPhotoGalleryDemoProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<EntityType>('user')

  // Mock entity IDs for demonstration
  const entityIds = {
    user: user?.id || 'demo-user-id',
    publisher: 'demo-publisher-id',
    author: 'demo-author-id',
    group: 'demo-group-id',
    book: 'demo-book-id',
    event: 'demo-event-id',
    content: 'demo-content-id',
  }

  const entityNames = {
    user: 'User Profile',
    publisher: 'Publisher',
    author: 'Author',
    group: 'Group',
    book: 'Book',
    event: 'Event',
    content: 'Content',
  }

  const entityDescriptions = {
    user: 'Personal photo albums and galleries',
    publisher: 'Publisher branding and content galleries',
    author: 'Author portraits and promotional content',
    group: 'Group photos and community content',
    book: 'Book covers and related imagery',
    event: 'Event promotional materials and photos',
    content: 'General content and media files',
  }

  return (
    <div className={`entity-photo-gallery-demo ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Universal Photo Upload System</CardTitle>
          <p className="text-muted-foreground">
            This demo shows how the photo upload system works for all entity types in the
            application.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EntityType)}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="user">User</TabsTrigger>
              <TabsTrigger value="publisher">Publisher</TabsTrigger>
              <TabsTrigger value="author">Author</TabsTrigger>
              <TabsTrigger value="group">Group</TabsTrigger>
              <TabsTrigger value="book">Book</TabsTrigger>
              <TabsTrigger value="event">Event</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            {Object.entries(entityNames).map(([entityType, name]) => (
              <TabsContent key={entityType} value={entityType}>
                <div className="space-y-6">
                  <div className="entity-info">
                    <h3 className="text-lg font-semibold">{name}</h3>
                    <p className="text-muted-foreground">
                      {entityDescriptions[entityType as EntityType]}
                    </p>
                  </div>

                  <div className="entity-photo-section">
                    <h4 className="text-md font-medium mb-4">Photo Albums</h4>
                    <EntityPhotoAlbums
                      entityId="demo-user-id"
                      entityType="user"
                      isOwnEntity={true}
                    />
                  </div>

                  <div className="entity-upload-section">
                    <h4 className="text-md font-medium mb-4">Direct Upload (No Album)</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload photos directly to this {entityType} entity:
                        </p>
                        <UniversalPhotoUpload
                          entityId={entityIds[entityType as EntityType]}
                          entityType={entityType as EntityType}
                          isOwner={true}
                          buttonText={`Upload to ${name}`}
                          variant="default"
                          size="md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="entity-upload-options">
                    <h4 className="text-md font-medium mb-4">Upload Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-2">Small Button</h5>
                          <UniversalPhotoUpload
                            entityId={entityIds[entityType as EntityType]}
                            entityType={entityType as EntityType}
                            isOwner={true}
                            buttonText="Add Photo"
                            variant="outline"
                            size="sm"
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-2">Large Button</h5>
                          <UniversalPhotoUpload
                            entityId={entityIds[entityType as EntityType]}
                            entityType={entityType as EntityType}
                            isOwner={true}
                            buttonText="Upload Photos"
                            variant="default"
                            size="lg"
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-2">Ghost Style</h5>
                          <UniversalPhotoUpload
                            entityId={entityIds[entityType as EntityType]}
                            entityType={entityType as EntityType}
                            isOwner={true}
                            buttonText="Add Images"
                            variant="ghost"
                            size="sm"
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h5 className="font-medium mb-2">No Icon</h5>
                          <UniversalPhotoUpload
                            entityId={entityIds[entityType as EntityType]}
                            entityType={entityType as EntityType}
                            isOwner={true}
                            buttonText="Upload"
                            showIcon={false}
                            variant="outline"
                            size="sm"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="entity-usage-info">
                    <h4 className="text-md font-medium mb-4">Usage Information</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Entity Type:</strong> {entityType}
                        </div>
                        <div>
                          <strong>Entity ID:</strong> {entityIds[entityType as EntityType]}
                        </div>
                        <div>
                          <strong>Supported Formats:</strong> JPEG, PNG, WebP, HEIC
                        </div>
                        <div>
                          <strong>Max File Size:</strong> 10MB per file
                        </div>
                        <div>
                          <strong>Max Files:</strong> 10 files per upload
                        </div>
                        <div>
                          <strong>Storage:</strong> Cloudinary with automatic optimization
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
