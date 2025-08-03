-- Add research_guidelines column to rd_selected_activities table
ALTER TABLE rd_selected_activities ADD COLUMN research_guidelines JSONB;

-- Add comment to document the column
COMMENT ON COLUMN rd_selected_activities.research_guidelines IS 'Structured answers to R&D qualification questions for each research activity'; 