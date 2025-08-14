-- Check what entity types currently exist in the database
SELECT DISTINCT entity_type, COUNT(*) as count
FROM activities 
WHERE entity_type IS NOT NULL
GROUP BY entity_type 
ORDER BY count DESC;
