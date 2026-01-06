# Like System Issue Analysis - Why Likes Disappear on Refresh

## **The Problem**
When you click the like button on an author's page:
1. ✅ **Like is saved** to the database successfully
2. ❌ **Like disappears** when you refresh the page
3. ❌ **Like count resets** to 0

## **Root Cause: RLS Policy Mismatch**

### **What's Happening:**
1. **Like Creation Works**: `toggle_entity_like()` function successfully inserts into `engagement_likes` table
2. **Like Reading Fails**: RLS policy blocks reading the like back

### **The Broken RLS Policy:**
```sql
CREATE POLICY "engagement_likes_select_policy" ON "public"."engagement_likes"
FOR SELECT USING (EXISTS ( 
  SELECT 1 FROM "public"."activities" "a"
  WHERE ("a"."id" = "engagement_likes"."entity_id") 
  AND ("a"."entity_type" = "engagement_likes"."entity_type")
));
```

### **Why It Fails for Authors:**
- **`entity_type`** = `'author'`
- **`entity_id`** = author's UUID (e.g., `e31e061d-a4a8-4cc8-af18-754786ad5ee3`)
- **Problem**: There's NO record in `activities` table with `id = author_uuid`
- **Result**: Policy fails, like can't be read back

## **The Fix: Update RLS Policy**

### **Solution:**
Replace the broken policy with one that allows reading likes for all entity types:

```sql
-- Drop broken policy
DROP POLICY IF EXISTS "engagement_likes_select_policy" ON "public"."engagement_likes";

-- Create working policy
CREATE POLICY "engagement_likes_select_policy" ON "public"."engagement_likes"
FOR SELECT USING (auth.uid() IS NOT NULL);
```

### **Why This Fix Works:**
1. **Removes dependency** on `activities` table
2. **Allows reading** likes for any entity type (authors, books, posts, etc.)
3. **Maintains security** by requiring authentication
4. **Preserves existing functionality** for other entity types

## **Files to Run:**
- **`fix_author_likes_rls.sql`** - Contains the complete fix

## **Expected Result:**
After running the fix:
- ✅ Likes will persist after refresh
- ✅ Like counts will be accurate
- ✅ Comments will also work properly
- ✅ No security vulnerabilities introduced

## **Technical Details:**
- **Table**: `engagement_likes`
- **Function**: `toggle_entity_like()`
- **API**: `/api/engagement/like`
- **Component**: `EntityComments` in author page
- **Issue**: RLS policy too restrictive for author entities
