-- MANUAL FIX: Fix activities table data that the migration didn't properly update
-- This script addresses the issue where posts show "undefined" for both text and data
-- Run this manually using your Supabase CLI

-- First, let's see what's actually in the database
SELECT 
    'CURRENT STATE' as info,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as activities_with_text,
    COUNT(CASE WHEN text IS NULL OR text = '' THEN 1 END) as activities_without_text,
    COUNT(CASE WHEN data IS NOT NULL AND data != '{}' THEN 1 END) as activities_with_data,
    COUNT(CASE WHEN data IS NULL OR data = '{}' THEN 1 END) as activities_without_data
FROM public.activities;

-- Show the actual structure of activities that are missing content
SELECT 
    'ACTIVITIES MISSING CONTENT' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    LEFT(data::text, 200) as data_preview,
    created_at,
    updated_at
FROM public.activities 
WHERE (text IS NULL OR text = '') 
    AND (data IS NULL OR data = '{}')
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any activities with content in metadata or other fields
SELECT 
    'ACTIVITIES WITH POTENTIAL CONTENT' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    LEFT(data::text, 200) as data_preview,
    LEFT(metadata::text, 200) as metadata_preview,
    content_summary,
    created_at
FROM public.activities 
WHERE (text IS NULL OR text = '') 
    AND (data IS NULL OR data = '{}')
    AND (metadata IS NOT NULL OR content_summary IS NOT NULL)
ORDER BY created_at DESC 
LIMIT 10;

-- This will help us understand what data actually exists and needs to be migrated
