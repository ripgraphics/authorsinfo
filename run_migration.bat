@echo off
echo ============================================================
echo ENTERPRISE PHOTO SYSTEM MIGRATION SCRIPT
echo ============================================================
echo.
echo This script will help you execute the enterprise photo system migration.
echo.
echo STEP 1: Link to your Supabase project
echo ----------------------------------------
echo You need your Project Reference ID from Supabase Dashboard.
echo Go to: Dashboard → Settings → General → Project Reference
echo.
set /p PROJECT_REF="Enter your Project Reference ID: "
echo.
echo Linking to project: %PROJECT_REF%
npx supabase link --project-ref %PROJECT_REF%
echo.
echo STEP 2: Apply the migration
echo ----------------------------------------
echo Applying enterprise photo system enhancement migration...
npx supabase db push
echo.
echo STEP 3: Verify migration
echo ----------------------------------------
echo Checking migration status...
npx supabase migration list
echo.
echo ============================================================
echo MIGRATION COMPLETE!
echo ============================================================
echo.
echo Your enterprise photo system is now ready with:
echo - Analytics tracking (photo_analytics)
echo - Monetization features (photo_monetization)
echo - Community features (photo_community)
echo - AI integration (ai_image_analysis)
echo - Processing jobs (image_processing_jobs)
echo.
echo Next steps:
echo 1. Test the Enterprise Dashboard at /admin/enterprise-dashboard
echo 2. Update your hooks to use the new database tables
echo 3. Enable real-time analytics tracking
echo.
pause 