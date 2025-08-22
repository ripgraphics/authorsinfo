-- Cleanup Conflicting Schema Files
-- This script removes all conflicting schema versions and keeps only the Enterprise version
-- Run this to clean up your schema directory

-- Note: This is a documentation script - manually delete the conflicting files

/*
CONFLICTING SCHEMA FILES TO DELETE:
- schemas/schema_20250802_020005.sql (Basic schema - conflicts with Enterprise)
- schemas/schema_20250802_103845.sql (Basic schema - conflicts with Enterprise)  
- schemas/schema_20250802_111313.sql (Basic schema - conflicts with Enterprise)
- schemas/latest_schema.sql (Basic schema - conflicts with Enterprise)
- schemas/current_schema.sql (Basic schema - conflicts with Enterprise)

KEEP ONLY:
- current_schema_analysis.sql (Enterprise schema - AUTHORITATIVE)
- current_schema_full.sql (Enterprise schema - AUTHORITATIVE)
- current_policies.sql (Enterprise schema - AUTHORITATIVE)
- supabase/migrations/20250818151717_remote_schema.sql (Enterprise schema - AUTHORITATIVE)

REASON:
The Enterprise schema has the complete activities table with:
- like_count, comment_count, share_count, view_count columns
- content_type, text, image_url, visibility columns  
- metadata, engagement_score columns
- All the enterprise features your application needs

The basic schemas are missing these columns and will cause errors.
*/

-- This script documents what needs to be cleaned up
SELECT 'Cleanup required: Remove conflicting basic schema files' as action;
