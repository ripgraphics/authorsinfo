-- Check what activity types currently exist in the database
SELECT DISTINCT activity_type, COUNT(*) as count
FROM activities 
GROUP BY activity_type 
ORDER BY count DESC;
