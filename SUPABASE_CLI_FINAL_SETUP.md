# Supabase CLI Final Setup Guide

## ✅ Current Status

- ✅ **Supabase CLI installed** (version 2.31.8)
- ✅ **Access token configured** (sbp_02f5446adc4b7757e60d0c34ca042edeb7a719c3)
- ✅ **Projects list working**
- ⚠️ **Project is paused** - Needs to be unpaused
- ✅ **Database connection working**

## 🔧 Required Action

### Step 1: Unpause Your Supabase Project

1. Go to: https://supabase.com/dashboard/project/nmrohtlcfqujtfgcyqhw
2. Look for a "Resume" or "Unpause" button
3. Click it to reactivate your project
4. Wait for the project to become active

### Step 2: Apply the Missing Database Function

Once your project is unpaused, run this command:

```bash
node scripts/apply_migration_final.js
```

This will:
- Create a new migration file
- Add the missing `add_image_to_entity_album` function
- Apply it to your remote database

## 🧪 Testing the Fix

After applying the migration:

1. Go to your application: http://localhost:3034
2. Navigate to a book page (e.g., `/books/[id]`)
3. Try uploading an image to the book entity
4. The "Failed to add image to album" error should be resolved

## 📋 Available Commands

### Basic CLI Commands
```bash
# List projects
npx supabase projects list

# Link to project
npx supabase link --project-ref nmrohtlcfqujtfgcyqhw

# Check database status
npx supabase db list

# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db push

# Check for schema differences
npx supabase db diff
```

### Environment Variables
Your `.env.local` file should contain:
```env
SUPABASE_ACCESS_TOKEN=sbp_02f5446adc4b7757e60d0c34ca042edeb7a719c3
SUPABASE_PROJECT_REF=nmrohtlcfqujtfgcyqhw
```

## 🔍 Troubleshooting

### If CLI commands fail:
1. Make sure the project is unpaused
2. Verify your access token is correct
3. Check the Supabase dashboard for any errors
4. Try running commands with `--debug` flag

### If migration fails:
1. Check the migration file in `supabase/migrations/`
2. Verify the SQL syntax
3. Check the Supabase dashboard logs
4. Try applying manually via the SQL editor

## 🎯 Next Steps

1. **Unpause the project** (required)
2. **Apply the migration** using the script
3. **Test the image upload functionality**
4. **Verify the fix works** in your application

## 📞 Support

If you encounter any issues:
1. Check the Supabase dashboard logs
2. Review the migration file content
3. Test with the debug flag: `npx supabase db push --debug`

---

**Status**: Ready to apply migration once project is unpaused
**Last Updated**: $(date) 