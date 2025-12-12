# Album Search Logic Fix - Additional Solution

## Problem Identified

Even after fixing the `owner_id` in album creation, images were still going to the user's profile. This revealed a **second issue** in the album search logic.

## Root Cause Analysis

The problem was that the **album search logic** was not checking the `owner_id` field:

### **Before (WRONG)**
```typescript
// Search for existing album
let { data: existingAlbum } = await supabase
  .from('photo_albums')
  .select('id, metadata')
  .eq('entity_id', entityId)      // ✅ Book ID
  .eq('entity_type', entityType)  // ✅ Book type
  .eq('name', albumName)          // ✅ Album name
  // ❌ Missing: .eq('owner_id', entityId)
```

### **Why This Happened**
1. **Existing album found**: Album with wrong `owner_id` (user ID) was found
2. **API used existing album**: Instead of creating new one with correct `owner_id`
3. **Result**: Image added to wrong album location

## The Additional Fix Applied

### **Updated Album Search Logic**
```typescript
// Search for existing album with correct owner_id
let { data: existingAlbum } = await supabase
  .from('photo_albums')
  .select('id, metadata, owner_id')
  .eq('entity_id', entityId)      // ✅ Book ID
  .eq('entity_type', entityType)  // ✅ Book type
  .eq('owner_id', entityId)       // ✅ Ensure album owned by entity
  .eq('name', albumName)          // ✅ Album name
```

### **Updated Fallback Search**
```typescript
// Metadata search fallback also checks owner_id
const { data: metadataAlbum } = await supabase
  .from('photo_albums')
  .select('id, metadata, owner_id')
  .eq('entity_id', entityId)
  .eq('entity_type', entityType)
  .eq('owner_id', entityId)       // ✅ Ensure album owned by entity
  .contains('metadata', { album_purpose: albumPurpose })
```

## How This Fixes the Issue

### **Before Fix**
1. **Search found album**: With `owner_id: user.id` (wrong)
2. **Used existing album**: Added image to user's album
3. **Result**: Image appeared in user profile

### **After Fix**
1. **Search won't find album**: Because `owner_id` doesn't match
2. **Creates new album**: With correct `owner_id: entityId`
3. **Result**: Image appears in book's profile

## Enhanced Debugging

Added logging to show album ownership:
```typescript
if (existingAlbum) {
  console.log('Found existing album:', { 
    id: existingAlbum.id, 
    owner_id: existingAlbum.owner_id 
  })
} else {
  console.log('No existing album found, will create new one')
}
```

## Expected Results After Fix

1. **No existing albums found**: Because search now checks `owner_id`
2. **New albums created**: With correct `owner_id: entityId`
3. **Images appear**: In book's photos tab, not user's profile
4. **Proper separation**: User albums vs. entity albums

## Testing the Fix

1. **Try uploading an entity header image** on `/books/[id]`
2. **Check console logs**: Should see "No existing album found, will create new one"
3. **Check book's photos tab**: Should see "Header Cover Images" album
4. **Check user's photos tab**: Should NOT see book albums

## Summary

The complete fix now ensures:
- ✅ **Album creation**: Uses correct `owner_id: entityId`
- ✅ **Album search**: Only finds albums owned by the entity
- ✅ **Proper location**: Albums created in entity's profile, not user's
- ✅ **No conflicts**: User albums and entity albums are properly separated

The album location issue should now be completely resolved with both fixes applied!
