-- Rename facebook_handle to social_handle in the authors table.
-- This is a metadata-only operation in Postgres — no data is moved or rewritten.
-- Column rename applied; all application-level compatibility shims have been removed.

ALTER TABLE authors RENAME COLUMN facebook_handle TO social_handle;
