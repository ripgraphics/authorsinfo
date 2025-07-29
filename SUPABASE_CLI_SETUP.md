# Supabase CLI Setup Guide

## Overview
This guide will help you set up the Supabase CLI to work with your remote project for future migrations.

## Prerequisites
- Node.js installed
- Access to your Supabase project dashboard

## Step 1: Get Your Access Token

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click on your profile icon (top right)
3. Go to "Account" → "Access Tokens"
4. Create a new access token with a descriptive name (e.g., "CLI Access Token")
5. **Copy the token** - it will look like `sbp_0102...1920`

## Step 2: Update Your .env.local

Add this line to your `.env.local` file:

```env
SUPABASE_ACCESS_TOKEN=sbp_your_access_token_here
```

## Step 3: Authenticate CLI

Run this command and paste your access token when prompted:

```bash
npx supabase login
```

## Step 4: Link to Your Project

```bash
npx supabase link --project-ref nmrohtlcfqujtfgcyqhw
```

## Step 5: Test the Setup

```bash
# List your projects
npx supabase projects list

# Check your database
npx supabase db list
```

## Step 6: Create Your First Migration

```bash
# Create a new migration
npx supabase migration new your_migration_name

# Apply migrations
npx supabase db push
```

## Troubleshooting

### If you get "Invalid access token format"
- Make sure you're using the access token (starts with `sbp_`) not the service role key
- The access token is different from your API keys

### If you get connection errors
- Verify your project ref is correct: `nmrohtlcfqujtfgcyqhw`
- Check that your access token has the right permissions

### If migrations fail
- Check the SQL syntax in your migration files
- Ensure you have the right permissions on your project

## Future Workflow

1. **Create migrations**: `npx supabase migration new migration_name`
2. **Edit the generated SQL file** in `supabase/migrations/`
3. **Apply migrations**: `npx supabase db push`
4. **Check status**: `npx supabase db diff`

## Migration Best Practices

- Always test migrations on a development database first
- Use descriptive migration names
- Include rollback instructions in comments
- Keep migrations small and focused
- Document complex migrations

## Example Migration

```sql
-- Migration: add_user_preferences_table
-- Date: 2025-07-13
-- Description: Creates user preferences table

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    theme text DEFAULT 'light',
    notifications_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
ON public.user_preferences
FOR ALL USING (auth.uid() = user_id);
```

## Environment Variables Reference

```env
# Required for CLI
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
SUPABASE_PROJECT_REF=nmrohtlcfqujtfgcyqhw

# Required for app
NEXT_PUBLIC_SUPABASE_URL=https://nmrohtlcfqujtfgcyqhw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
``` 