-- Migration: Add time percentage management to research activities and steps
-- Purpose: Allow setting default time percentages for steps with activity-level locking
-- Features: 
--   - Per-step time percentage defaults
--   - Per-activity time percentage locking
--   - Auto-distribution to maintain 100% total per activity

-- Add default_time_percentage column to rd_research_steps
ALTER TABLE public.rd_research_steps 
ADD COLUMN IF NOT EXISTS default_time_percentage NUMERIC(5,2) DEFAULT NULL;

-- Add time_percentage_locked column to rd_research_activities
ALTER TABLE public.rd_research_activities 
ADD COLUMN IF NOT EXISTS time_percentage_locked BOOLEAN DEFAULT FALSE;

-- Add updated_at timestamp for tracking changes
ALTER TABLE public.rd_research_steps 
ADD COLUMN IF NOT EXISTS time_percentage_updated_at TIMESTAMP DEFAULT NOW();

-- Create index for performance on time percentage queries
CREATE INDEX IF NOT EXISTS idx_rd_research_steps_time_percentage 
ON public.rd_research_steps(research_activity_id, default_time_percentage) 
WHERE default_time_percentage IS NOT NULL;

-- Create index for locked activities
CREATE INDEX IF NOT EXISTS idx_rd_research_activities_time_locked 
ON public.rd_research_activities(time_percentage_locked) 
WHERE time_percentage_locked = TRUE;

-- Add constraint to ensure time percentage is between 0 and 100
ALTER TABLE public.rd_research_steps 
ADD CONSTRAINT check_time_percentage_range 
CHECK (default_time_percentage IS NULL OR (default_time_percentage >= 0 AND default_time_percentage <= 100));

-- Create function to auto-distribute time percentages to maintain 100% total
CREATE OR REPLACE FUNCTION auto_distribute_time_percentages(activity_id UUID, exclude_step_id UUID DEFAULT NULL)
RETURNS TABLE(step_id UUID, new_percentage NUMERIC(5,2)) AS $$
DECLARE
    total_steps INTEGER;
    remaining_percentage NUMERIC(5,2);
    equal_distribution NUMERIC(5,2);
BEGIN
    -- Count steps in the activity (excluding the one being updated if specified)
    SELECT COUNT(*) INTO total_steps
    FROM rd_research_steps 
    WHERE research_activity_id = activity_id 
    AND is_active = TRUE
    AND (exclude_step_id IS NULL OR id != exclude_step_id);
    
    -- If no steps or only one step, return early
    IF total_steps <= 0 THEN
        RETURN;
    END IF;
    
    -- Calculate equal distribution
    remaining_percentage := 100.0;
    IF exclude_step_id IS NOT NULL THEN
        -- Get the percentage of the excluded step
        SELECT COALESCE(default_time_percentage, 0) INTO remaining_percentage
        FROM rd_research_steps 
        WHERE id = exclude_step_id;
        remaining_percentage := 100.0 - remaining_percentage;
    END IF;
    
    equal_distribution := remaining_percentage / total_steps;
    
    -- Return the new percentages for each step
    RETURN QUERY
    SELECT rs.id, equal_distribution
    FROM rd_research_steps rs
    WHERE rs.research_activity_id = activity_id 
    AND rs.is_active = TRUE
    AND (exclude_step_id IS NULL OR rs.id != exclude_step_id);
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update timestamp when time percentage changes
CREATE OR REPLACE FUNCTION update_time_percentage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.default_time_percentage IS DISTINCT FROM NEW.default_time_percentage THEN
        NEW.time_percentage_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time percentage updates
DROP TRIGGER IF EXISTS trigger_update_time_percentage_timestamp ON public.rd_research_steps;
CREATE TRIGGER trigger_update_time_percentage_timestamp
    BEFORE UPDATE ON public.rd_research_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_time_percentage_timestamp();

-- Add helpful comments
COMMENT ON COLUMN public.rd_research_steps.default_time_percentage IS 'Default time allocation percentage for this step (0-100). Used as baseline when activity is selected in client files.';
COMMENT ON COLUMN public.rd_research_activities.time_percentage_locked IS 'When true, the time percentages for steps in this activity are locked as defaults for client use.';
COMMENT ON COLUMN public.rd_research_steps.time_percentage_updated_at IS 'Timestamp when default_time_percentage was last modified.';

-- Verify the migration
SELECT 
    'rd_research_steps time percentage management added' as status,
    COUNT(*) as total_steps,
    COUNT(default_time_percentage) as steps_with_percentages
FROM public.rd_research_steps;

SELECT 
    'rd_research_activities time locking added' as status,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN time_percentage_locked THEN 1 END) as locked_activities
FROM public.rd_research_activities;