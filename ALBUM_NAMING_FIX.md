# Album Naming Fix - Entity Images API

## Problem Identified

The entity-images API was creating albums with names like:
- `book_entity_header_album` 
- `author_avatar_album`
- `publisher_cover_album`

But your existing photo album system expects user-friendly names like:
- **"Header Cover Images"** for entity header images
- **"Avatar Images"** for avatar/profile images
- **"Cover Images"** for cover images

## Root Cause

1. **Wrong Album Names**: API was using technical names instead of user-friendly names
2. **Album Search Issues**: The API couldn't find existing albums due to name mismatches
3. **Missing Albums**: No albums were being created, so images couldn't be added

## The Fix Applied

### 1. **User-Friendly Album Names**
```typescript
const albumNameMap: Record<AlbumPurpose, string> = {
  cover: 'Cover Images',
  avatar: 'Avatar Images',
  entity_header: 'Header Cover Images',  // ✅ Now matches your system
  gallery: 'Gallery Images',
  posts: 'Post Images'
}
```

### 2. **Improved Album Search**
```typescript
// First try to find by exact name match (more reliable)
let { data: existingAlbum } = await supabase
  .from('photo_albums')
  .select('id, metadata')
  .eq('entity_id', entityId)
  .eq('entity_type', entityType)
  .eq('name', albumName)  // ✅ Search by user-friendly name
  .single()

// If not found by name, try metadata search as fallback
if (!existingAlbum) {
  // Fallback to metadata search
}
```

### 3. **Enhanced Debugging**
- Added console logs to track album search and creation
- Better error handling for debugging
- Clear logging of what albums are being created

## Expected Album Names

Now when you upload entity header images on `/books/[id]`, the API will create:

| **Purpose** | **Album Name** | **Description** |
|-------------|----------------|-----------------|
| `entity_header` | **"Header Cover Images"** | For entity header cover images |
| `avatar` | **"Avatar Images"** | For avatar/profile images |
| `cover` | **"Cover Images"** | For general cover images |
| `gallery` | **"Gallery Images"** | For gallery collections |
| `posts` | **"Post Images"** | For post-related images |

## How It Works Now

### **Album Creation Flow**
1. **Check Existing**: Look for album with user-friendly name (e.g., "Header Cover Images")
2. **Create If Missing**: If no album exists, create one with the correct name
3. **Add Image**: Add the uploaded image to the album
4. **Update Entity**: Update the book/author with the new image reference

### **Example for Book Entity Header**
1. **Search**: Look for "Header Cover Images" album for the book
2. **Create**: If not found, create "Header Cover Images" album
3. **Add Image**: Add the uploaded header image to the album
4. **Update Book**: Set the book's header image reference

## Testing the Fix

1. **Try uploading entity header images** on `/books/[id]`
2. **Check browser console** for detailed logging
3. **Look for albums** in the photos tab:
   - Should see "Header Cover Images" album
   - Should see "Avatar Images" album (if avatars are uploaded)
4. **Verify images persist** after page refresh

## Expected Results

After the fix:
- ✅ **Albums Created**: "Header Cover Images" and "Avatar Images" albums
- ✅ **Images Added**: Images properly added to albums
- ✅ **Entity Updated**: Book/author header/avatar images updated
- ✅ **Persistence**: Images remain visible after page refresh
- ✅ **Integration**: Albums appear in your existing photo album system

The album naming fix should resolve the issue where images were being uploaded to Cloudinary but not properly organized in albums.
