-- Migration: add is_favorited column to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS is_favorited boolean DEFAULT false;
