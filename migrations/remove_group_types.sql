-- Drop foreign key constraints first
ALTER TABLE IF EXISTS group_target_type DROP CONSTRAINT IF EXISTS group_target_type_target_type_id_fkey;
DROP TABLE IF EXISTS group_target_type;
DROP TABLE IF EXISTS group_types; 