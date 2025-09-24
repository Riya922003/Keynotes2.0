-- Migration: addis_starred column to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTSis_starred boolean DEFAULT false;
