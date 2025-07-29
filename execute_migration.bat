@echo off
echo ============================================================
echo EXECUTING ENTERPRISE PHOTO SYSTEM MIGRATION
echo ============================================================
echo.
echo Applying enterprise photo system enhancement migration...
echo.

REM Execute the migration SQL directly
type supabase\migrations\20250115_enterprise_photo_system_enhancement.sql | npx supabase db remote exec

echo.
echo ============================================================
echo MIGRATION EXECUTION COMPLETE
echo ============================================================
echo.
echo The enterprise photo system migration has been applied.
echo Your database now includes:
echo - Analytics tracking (photo_analytics)
echo - Monetization features (photo_monetization) 
echo - Community features (photo_community)
echo - AI integration (ai_image_analysis)
echo - Processing jobs (image_processing_jobs)
echo.
echo Next steps:
echo 1. Test the Enterprise Dashboard at /admin/enterprise-dashboard
echo 2. Verify the new tables exist in your Supabase dashboard
echo 3. Update your application hooks to use the new tables
echo.
pause 