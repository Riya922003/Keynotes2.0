-- Migration: set NULL is_archived and is_starred to false for existing rows
-- This will update any existing documents where these boolean columns are NULL
BEGIN;

ALTER TABLE documents
  ALTER COLUMN is_archived SET DEFAULT false;

ALTER TABLE documents
  ALTER COLUMN is_starred SET DEFAULT false;

-- Update any existing NULL values to false
UPDATE documents
SET is_archived = false
WHERE is_archived IS NULL;

UPDATE documents
SET is_starred = false
WHERE is_starred IS NULL;

COMMIT;
