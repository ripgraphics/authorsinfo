-- BACKUP SCRIPT - Run this BEFORE applying fixes
-- This creates a backup of your current database structure

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_$(date +%Y%m%d_%H%M%S);

-- Backup current indexes
CREATE TABLE backup_indexes AS 
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- Backup current policies
CREATE TABLE backup_policies AS 
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Backup current constraints
CREATE TABLE backup_constraints AS 
SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';

-- Backup current triggers
CREATE TABLE backup_triggers AS 
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Create a summary of what was backed up
SELECT 'Backup completed successfully' as status;
