-- Add description columns to research taxonomy tables
-- Migration: 20250121000000_add_description_columns.sql

-- Add description column to rd_research_categories
ALTER TABLE rd_research_categories 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add description column to rd_areas
ALTER TABLE rd_areas 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add description column to rd_focuses
ALTER TABLE rd_focuses 
ADD COLUMN IF NOT EXISTS description TEXT; 