# Universal Photo Upload System

This document explains how to use the universal photo upload system that works for all entity types in the AuthorsInfo application.

## Overview

The universal photo upload system provides a consistent way to upload photos for all entity types in the application:
- **Users** - Personal photo albums and galleries
- **Publishers** - Publisher branding and content galleries  
- **Authors** - Author portraits and promotional content
- **Groups** - Group photos and community content
- **Books** - Book covers and related imagery
- **Events** - Event promotional materials and photos
- **Content** - General content and media files

## Core Components

### 1. UniversalPhotoUpload Component

The main component for uploading photos to any entity type.

```tsx
import { UniversalPhotoUpload } from '@/components/universal-photo-upload'

<UniversalPhotoUpload
  entityId="your-entity-id"
  entityType="user" // or publisher, author, group, book, event, content
  albumId="optional-album-id"
  onUploadComplete={(photoIds) => console.log('Uploaded:', photoIds)}
  isOwner={true}
  buttonText="Add Photo"
  variant="outline"
  size="sm"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityId` | `string` | **required** | The ID of the entity to upload to |
| `entityType` | `EntityType` | **required** | Type of entity (user, publisher, author, group, book, event, content) |
| `albumId` | `string` | `undefined` | Optional album ID to add photos to |
| `onUploadComplete` | `(photoIds: string[]) => void` | `undefined` | Callback when upload completes |
| `onUploadStart` | `() => void` | `undefined` | Callback when upload starts |
| `onUploadError` | `(error: Error) => void` | `undefined` | Callback when upload fails |
| `maxFiles` | `number` | `10` | Maximum number of files per upload |
| `allowedTypes` | `string[]` | `['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']` | Allowed file types |
| `maxFileSize` | `number` | `10 * 1024 * 1024` | Maximum file size in bytes (10MB) |
| `className` | `string` | `''` | Additional CSS classes |
| `variant` | `'default' \| 'outline' \| 'ghost'` | `'outline'` | Button variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Button size |
| `showIcon` | `boolean` | `true` | Whether to show the upload icon |
| `buttonText` | `string` | `'Add Photo'` | Custom button text |
| `disabled` | `boolean` | `false` | Whether the upload is disabled |
| `isOwner` | `boolean` | `true` | Whether the current user owns the entity |

### 2. UserPhotoAlbums Component

Enhanced component for displaying photo albums with universal upload support.

```tsx
import { UserPhotoAlbums } from '@/components/user-photo-albums'

<UserPhotoAlbums
  userId="entity-id"
  isOwnProfile={true}
  entityType="user" // or any other entity type
/>
```

## Usage Examples

### Basic Upload for User Profile

```tsx
import { UniversalPhotoUpload } from '@/components/universal-photo-upload'

function UserProfilePage({ userId }: { userId: string }) {
  return (
    <div>
      <h2>My Photos</h2>
      <UniversalPhotoUpload
        entityId={userId}
        entityType="user"
        isOwner={true}
        buttonText="Add Photos"
        onUploadComplete={(photoIds) => {
          console.log('Uploaded photos:', photoIds)
          // Refresh the photo gallery
        }}
      />
    </div>
  )
}
```

### Publisher Gallery Upload

```tsx
function PublisherGallery({ publisherId }: { publisherId: string }) {
  return (
    <div>
      <h2>Publisher Gallery</h2>
      <UniversalPhotoUpload
        entityId={publisherId}
        entityType="publisher"
        isOwner={true}
        buttonText="Upload Publisher Content"
        variant="default"
        size="lg"
        maxFiles={20}
        onUploadComplete={(photoIds) => {
          // Handle publisher photo uploads
        }}
      />
    </div>
  )
}
```

### Author Portrait Upload

```tsx
function AuthorProfile({ authorId }: { authorId: string }) {
  return (
    <div>
      <h2>Author Photos</h2>
      <UniversalPhotoUpload
        entityId={authorId}
        entityType="author"
        isOwner={true}
        buttonText="Add Author Photos"
        maxFiles={5}
        allowedTypes={['image/jpeg', 'image/png']}
        onUploadComplete={(photoIds) => {
          // Handle author photo uploads
        }}
      />
    </div>
  )
}
```

### Group Photo Upload

```tsx
function GroupPhotos({ groupId, isGroupAdmin }: { groupId: string, isGroupAdmin: boolean }) {
  return (
    <div>
      <h2>Group Photos</h2>
      <UniversalPhotoUpload
        entityId={groupId}
        entityType="group"
        isOwner={isGroupAdmin}
        buttonText="Share Group Photos"
        variant="outline"
        maxFiles={15}
        onUploadComplete={(photoIds) => {
          // Handle group photo uploads
        }}
      />
    </div>
  )
}
```

### Book Cover Upload

```tsx
function BookEditor({ bookId }: { bookId: string }) {
  return (
    <div>
      <h2>Book Images</h2>
      <UniversalPhotoUpload
        entityId={bookId}
        entityType="book"
        isOwner={true}
        buttonText="Upload Book Images"
        maxFiles={3}
        allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
        onUploadComplete={(photoIds) => {
          // Handle book image uploads
        }}
      />
    </div>
  )
}
```

### Event Photo Upload

```tsx
function EventPhotos({ eventId, isEventOrganizer }: { eventId: string, isEventOrganizer: boolean }) {
  return (
    <div>
      <h2>Event Photos</h2>
      <UniversalPhotoUpload
        entityId={eventId}
        entityType="event"
        isOwner={isEventOrganizer}
        buttonText="Add Event Photos"
        variant="default"
        size="md"
        maxFiles={25}
        onUploadComplete={(photoIds) => {
          // Handle event photo uploads
        }}
      />
    </div>
  )
}
```

## Album Integration

### Upload to Specific Album

```tsx
function AlbumUpload({ albumId, entityId, entityType }: { 
  albumId: string, 
  entityId: string, 
  entityType: EntityType 
}) {
  return (
    <UniversalPhotoUpload
      entityId={entityId}
      entityType={entityType}
      albumId={albumId}
      isOwner={true}
      buttonText="Add to Album"
      onUploadComplete={(photoIds) => {
        // Photos will be automatically added to the specified album
        console.log('Added to album:', photoIds)
      }}
    />
  )
}
```

### Complete Album System

```tsx
import { UserPhotoAlbums } from '@/components/user-photo-albums'

function EntityPhotoGallery({ entityId, entityType, isOwner }: {
  entityId: string
  entityType: EntityType
  isOwner: boolean
}) {
  return (
    <UserPhotoAlbums
      userId={entityId}
      isOwnProfile={isOwner}
      entityType={entityType}
    />
  )
}
```

## File Validation

The system automatically validates:

- **File Types**: JPEG, JPG, PNG, WebP, HEIC
- **File Size**: Maximum 10MB per file (configurable)
- **File Count**: Maximum 10 files per upload (configurable)
- **Entity Ownership**: Only owners can upload (configurable)

## Error Handling

```tsx
<UniversalPhotoUpload
  entityId={entityId}
  entityType={entityType}
  onUploadError={(error) => {
    console.error('Upload failed:', error.message)
    // Show custom error message
    showNotification('Upload failed: ' + error.message, 'error')
  }}
  onUploadComplete={(photoIds) => {
    console.log('Upload successful:', photoIds)
    // Show success message
    showNotification(`Uploaded ${photoIds.length} photos successfully`, 'success')
  }}
/>
```

## Progress Tracking

The component automatically shows upload progress:

```tsx
<UniversalPhotoUpload
  entityId={entityId}
  entityType={entityType}
  onUploadStart={() => {
    console.log('Upload started')
    // Show loading state
  }}
  onUploadComplete={(photoIds) => {
    console.log('Upload completed')
    // Hide loading state
  }}
/>
```

## Styling Options

### Button Variants

```tsx
// Default style
<UniversalPhotoUpload variant="default" />

// Outline style
<UniversalPhotoUpload variant="outline" />

// Ghost style
<UniversalPhotoUpload variant="ghost" />
```

### Button Sizes

```tsx
// Small
<UniversalPhotoUpload size="sm" />

// Medium
<UniversalPhotoUpload size="md" />

// Large
<UniversalPhotoUpload size="lg" />
```

### Custom Styling

```tsx
<UniversalPhotoUpload
  className="my-custom-upload-button"
  buttonText="Custom Upload Text"
  showIcon={false}
/>
```

## Database Integration

The system integrates with your existing database schema:

### Tables Used

- `images` - Stores image metadata and URLs
- `album_images` - Links images to albums
- `photo_albums` - Album information
- `entity_types` - Entity type definitions

### Entity Types Supported

Based on your database schema, these entity types are supported:

1. **user** - User profiles and personal galleries
2. **publisher** - Publisher branding and content
3. **author** - Author portraits and promotional content
4. **group** - Group photos and community content
5. **book** - Book covers and related imagery
6. **event** - Event promotional materials
7. **content** - General content and media

## Security Features

- **Ownership Check**: Only entity owners can upload
- **File Validation**: Strict file type and size validation
- **Rate Limiting**: Built-in upload rate limiting
- **Error Handling**: Comprehensive error handling and user feedback

## Performance Features

- **Cloudinary Integration**: Automatic image optimization
- **Progress Tracking**: Real-time upload progress
- **Batch Upload**: Support for multiple file uploads
- **Lazy Loading**: Efficient image loading and caching

## Best Practices

1. **Always check ownership**: Use `isOwner` prop to control access
2. **Provide feedback**: Use callbacks to show upload status
3. **Validate on server**: Don't rely only on client-side validation
4. **Handle errors gracefully**: Provide clear error messages
5. **Limit file sizes**: Use appropriate `maxFileSize` for your use case
6. **Use appropriate entity types**: Choose the correct entity type for your content

## Migration Guide

If you're migrating from the old photo upload system:

1. Replace old upload components with `UniversalPhotoUpload`
2. Update entity type references to use the new system
3. Test upload functionality for each entity type
4. Update any custom upload handlers to use the new callbacks

## Troubleshooting

### Common Issues

1. **Upload fails**: Check file size and type restrictions
2. **No upload button**: Verify `isOwner` prop is set correctly
3. **Wrong entity type**: Ensure `entityType` matches your use case
4. **Album not found**: Verify `albumId` exists and is accessible

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages and upload progress information. 