-- Add step_order column to rd_research_steps table for proper ordering in UI and reports
-- Migration: 20250128000004_add_step_order_to_research_steps.sql

-- Add step_order column to rd_research_steps table if it doesn't exist
ALTER TABLE public.rd_research_steps 
ADD COLUMN IF NOT EXISTS step_order INTEGER DEFAULT 1;

-- Create index for better performance when ordering steps
CREATE INDEX IF NOT EXISTS idx_rd_research_steps_activity_step_order 
ON public.rd_research_steps (research_activity_id, step_order);

-- Update existing steps to have sequential step_order values
-- This ensures any existing data gets proper ordering
DO $$
DECLARE
    activity_record RECORD;
    step_record RECORD;
    current_order INTEGER;
BEGIN
    -- Loop through each research activity
    FOR activity_record IN 
        SELECT DISTINCT research_activity_id 
        FROM public.rd_research_steps 
        WHERE step_order IS NULL OR step_order = 1
    LOOP
        current_order := 1;
        
        -- Loop through steps for this activity, ordered by created_at
        FOR step_record IN 
            SELECT id 
            FROM public.rd_research_steps 
            WHERE research_activity_id = activity_record.research_activity_id 
            ORDER BY created_at ASC
        LOOP
            -- Update step_order for this step
            UPDATE public.rd_research_steps 
            SET step_order = current_order 
            WHERE id = step_record.id;
            
            current_order := current_order + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Successfully updated step_order for all existing research steps';
END $$;

-- Add comment to document the step_order column
COMMENT ON COLUMN public.rd_research_steps.step_order IS 'Numeric order for displaying steps in UI and reports. Lower numbers appear first.';

-- Verify the changes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rd_research_steps' 
        AND column_name = 'step_order'
    ) THEN
        RAISE NOTICE '✅ SUCCESS: step_order column added to rd_research_steps table';
    ELSE
        RAISE WARNING '❌ FAILED: step_order column was not created successfully';
    END IF;
END $$; 