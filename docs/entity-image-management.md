# Entity Image Management System

## Overview

The Entity Image Management System is an enterprise-grade solution that integrates all entity images (book covers, avatars, entity headers, and gallery images) into a unified photo album system. This provides consistent image management, advanced features, and enterprise-grade capabilities across all entity types.

## Architecture

### Database Schema

#### Core Tables

1. **`images`** - Central image storage
   - `id` (UUID) - Primary key
   - `url` (text) - Image URL
   - `thumbnail_url` (text) - Thumbnail URL
   - `alt_text` (varchar) - Alt text for accessibility
   - `caption` (text) - Image caption
   - `storage_provider` (varchar) - Storage provider (Cloudinary, Supabase, etc.)
   - `storage_path` (text) - Storage path
   - `original_filename` (varchar) - Original filename
   - `file_size` (integer) - File size in bytes
   - `width` (integer) - Image width
   - `height` (integer) - Image height
   - `format` (varchar) - Image format
   - `mime_type` (varchar) - MIME type
   - `is_processed` (boolean) - Processing status
   - `processing_status` (varchar) - Processing status
   - `metadata` (jsonb) - Additional metadata
   - `entity_type_id` (UUID) - Reference to entity types

2. **`photo_albums`** - Album management
   - `id` (UUID) - Primary key
   - `name` (varchar) - Album name
   - `description` (text) - Album description
   - `owner_id` (UUID) - Album owner
   - `entity_id` (UUID) - Associated entity ID
   - `entity_type` (varchar) - Entity type (book, author, publisher, user)
   - `album_type` (enum) - Album type (cover, avatar, header, gallery)
   - `is_system_album` (boolean) - System-generated album
   - `auto_generated` (boolean) - Auto-generated album
   - `is_public` (boolean) - Public visibility
   - `view_count` (integer) - View count
   - `like_count` (integer) - Like count
   - `share_count` (integer) - Share count
   - `metadata` (jsonb) - Additional metadata

3. **`album_images`** - Album-image relationships
   - `id` (UUID) - Primary key
   - `album_id` (UUID) - Album reference
   - `image_id` (UUID) - Image reference
   - `display_order` (integer) - Display order
   - `is_cover` (boolean) - Is cover image
   - `is_featured` (boolean) - Is featured image
   - `metadata` (jsonb) - Additional metadata

#### Entity Tables with Image References

1. **`books`**
   - `cover_image_id` (UUID) - Cover image reference
   - `avatar_image_id` (UUID) - Avatar image reference
   - `entity_header_image_id` (UUID) - Entity header image reference

2. **`authors`**
   - `author_image_id` (UUID) - Author avatar reference
   - `cover_image_id` (UUID) - Author header image reference

### Album Types

The system supports the following album types for different entity types:

#### Book Albums
- `book_cover_album` - Book cover images
- `book_avatar_album` - Book avatar images
- `book_entity_header_album` - Book entity header images
- `book_gallery_album` - Additional book images

#### Author Albums
- `author_avatar_album` - Author avatar images
- `author_entity_header_album` - Author header images
- `author_gallery_album` - Author gallery images

#### Publisher Albums
- `publisher_avatar_album` - Publisher avatar images
- `publisher_entity_header_album` - Publisher header images
- `publisher_gallery_album` - Publisher gallery images

#### User Albums
- `user_avatar_album` - User avatar images
- `user_gallery_album` - User gallery images

## API Endpoints

### `/api/entity-images`

#### GET - Retrieve Entity Images
```typescript
GET /api/entity-images?entityId={id}&entityType={type}&albumType={albumType}
```

**Parameters:**
- `entityId` (string) - Entity ID
- `entityType` (string) - Entity type (book, author, publisher, user)
- `albumType` (string, optional) - Specific album type

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "image_id": "uuid",
      "image_url": "https://...",
      "thumbnail_url": "https://...",
      "alt_text": "Image description",
      "caption": "Image caption",
      "display_order": 1,
      "is_cover": true,
      "is_featured": false,
      "album_id": "uuid",
      "album_name": "Album Name",
      "album_type": "book_cover_album",
      "metadata": {}
    }
  ]
}
```

#### POST - Add Image to Entity Album
```typescript
POST /api/entity-images
```

**Request Body:**
```json
{
  "entityId": "uuid",
  "entityType": "book",
  "albumType": "book_cover_album",
  "imageUrl": "https://...",
  "altText": "Image description",
  "caption": "Image caption",
  "displayOrder": 1,
  "isCover": true,
  "isFeatured": false,
  "metadata": {}
}
```

#### PUT - Update Entity Image
```typescript
PUT /api/entity-images
```

**Request Body:**
```json
{
  "entityId": "uuid",
  "entityType": "book",
  "albumType": "book_cover_album",
  "imageId": "uuid",
  "altText": "Updated description",
  "caption": "Updated caption",
  "displayOrder": 2,
  "isCover": true,
  "isFeatured": true,
  "metadata": {}
}
```

#### DELETE - Remove Image from Entity Album
```typescript
DELETE /api/entity-images?entityId={id}&entityType={type}&albumType={albumType}&imageId={imageId}
```

## React Components

### EntityPhotoGallery

The main component for entity image management.

```typescript
interface EntityPhotoGalleryProps {
  entityId: string
  entityType: 'book' | 'author' | 'publisher' | 'user'
  entityName?: string
  isOwner?: boolean
  className?: string
  showUploadButtons?: boolean
  showAlbumManagement?: boolean
  maxImagesPerAlbum?: number
}
```

**Features:**
- Album overview with image counts
- Quick upload buttons for different image types
- Enterprise photo gallery integration
- Image cropping with aspect ratio support
- Album management for owners

**Usage:**
```tsx
<EntityPhotoGallery
  entityId={book.id}
  entityType="book"
  entityName={book.title}
  isOwner={canEdit}
  showUploadButtons={canEdit}
  showAlbumManagement={canEdit}
  maxImagesPerAlbum={100}
  className="space-y-6"
/>
```

## Database Functions

### `get_entity_images(p_entity_id, p_entity_type, p_album_type)`

Retrieves all images for a specific entity from its albums.

**Parameters:**
- `p_entity_id` (UUID) - Entity ID
- `p_entity_type` (text) - Entity type
- `p_album_type` (text, optional) - Album type filter

**Returns:** Table with image information including URLs, metadata, and album details.

### `add_image_to_entity_album(p_entity_id, p_entity_type, p_album_type, p_image_id, p_display_order, p_is_cover, p_is_featured)`

Adds an image to an entity album, creating the album if it doesn't exist.

**Parameters:**
- `p_entity_id` (UUID) - Entity ID
- `p_entity_type` (text) - Entity type
- `p_album_type` (text) - Album type
- `p_image_id` (UUID) - Image ID
- `p_display_order` (integer) - Display order
- `p_is_cover` (boolean) - Is cover image
- `p_is_featured` (boolean) - Is featured image

**Returns:** Album ID (UUID)

## Triggers and Automation

### Entity Image Update Trigger

The system includes triggers that automatically:
1. Create albums when entity images are added
2. Link images to appropriate albums
3. Update entity table references for cover/avatar/header images
4. Maintain consistency between entity tables and album system

### Automatic Album Management

- System albums are created automatically for entities with images
- Albums are categorized by purpose (cover, avatar, header, gallery)
- Image references in entity tables are kept in sync with album system
- Automatic cleanup when images are removed

## Enterprise Features

### Image Processing Pipeline
- Automatic image optimization
- Multiple format support (WebP, JPEG, PNG)
- Thumbnail generation
- Metadata extraction
- Quality analysis

### Security and Privacy
- Role-based access control
- Privacy settings per album
- Image watermarking
- Usage analytics
- Audit logging

### Performance Optimization
- CDN integration
- Lazy loading
- Progressive image loading
- Caching strategies
- Database indexing

### Analytics and Monitoring
- Image usage analytics
- Storage optimization
- Performance metrics
- Error tracking
- User engagement metrics

## Migration Strategy

### Phase 1: Database Migration
1. Run the migration script to add missing columns
2. Create system albums for existing entities
3. Link existing images to albums
4. Set up triggers for automatic management

### Phase 2: API Implementation
1. Implement entity image API endpoints
2. Add database functions for image management
3. Create views for easy data access
4. Set up proper indexing

### Phase 3: Frontend Integration
1. Create EntityPhotoGallery component
2. Integrate with existing photo gallery system
3. Add image cropping functionality
4. Implement album management UI

### Phase 4: Enterprise Features
1. Add image processing pipeline
2. Implement security features
3. Add analytics and monitoring
4. Performance optimization

## Usage Examples

### Adding a Book Cover Image
```typescript
const response = await fetch('/api/entity-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityId: book.id,
    entityType: 'book',
    albumType: 'book_cover_album',
    imageUrl: 'https://example.com/cover.jpg',
    altText: 'Book cover for The Great Gatsby',
    isCover: true
  })
})
```

### Retrieving Book Images
```typescript
const response = await fetch(`/api/entity-images?entityId=${book.id}&entityType=book`)
const { images } = await response.json()

// Filter by album type
const coverImages = images.filter(img => img.album_type === 'book_cover_album')
const galleryImages = images.filter(img => img.album_type === 'book_gallery_album')
```

### Using the React Component
```tsx
<EntityPhotoGallery
  entityId={book.id}
  entityType="book"
  entityName={book.title}
  isOwner={userCanEdit}
  showUploadButtons={userCanEdit}
  showAlbumManagement={userCanEdit}
/>
```

## Best Practices

### Image Management
1. Always use the album system for image organization
2. Set appropriate aspect ratios for different image types
3. Provide meaningful alt text for accessibility
4. Use appropriate image formats and compression
5. Implement proper error handling

### Performance
1. Use CDN for image delivery
2. Implement lazy loading for large galleries
3. Optimize database queries with proper indexing
4. Cache frequently accessed images
5. Monitor storage usage and costs

### Security
1. Validate image uploads
2. Implement proper access controls
3. Sanitize user inputs
4. Monitor for abuse
5. Regular security audits

### User Experience
1. Provide clear upload interfaces
2. Show upload progress
3. Implement drag-and-drop functionality
4. Offer image editing capabilities
5. Provide bulk operations

## Troubleshooting

### Common Issues

1. **Images not appearing in albums**
   - Check if albums exist for the entity
   - Verify image records are properly linked
   - Check album visibility settings

2. **Upload failures**
   - Verify storage provider configuration
   - Check file size limits
   - Validate image format support

3. **Performance issues**
   - Review database query performance
   - Check CDN configuration
   - Monitor storage usage

4. **Permission errors**
   - Verify user permissions
   - Check album privacy settings
   - Review role-based access controls

### Debugging Tools

1. Database views for album analysis
2. API response logging
3. Image processing status tracking
4. Performance monitoring
5. Error tracking and alerting

## Future Enhancements

### Planned Features
1. AI-powered image tagging
2. Advanced image editing tools
3. Bulk image operations
4. Advanced analytics dashboard
5. Integration with external image services

### Scalability Considerations
1. Horizontal scaling for image processing
2. Multi-region CDN deployment
3. Database sharding strategies
4. Microservices architecture
5. Container orchestration

This enterprise-grade entity image management system provides a comprehensive solution for managing all entity images through a unified photo album system, ensuring consistency, scalability, and advanced features across the entire application. 