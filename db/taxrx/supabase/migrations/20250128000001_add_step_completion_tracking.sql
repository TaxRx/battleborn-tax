-- ========================================
-- STEP COMPLETION & LOCKING SYSTEM
-- ========================================
-- Migration: Add step completion tracking to rd_business_years
-- Purpose: Track completion status and prevent overwrites for completed steps

-- Add step completion columns to rd_business_years table
ALTER TABLE public.rd_business_years
ADD COLUMN IF NOT EXISTS business_setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_setup_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS business_setup_completed_by UUID REFERENCES profiles(id),

ADD COLUMN IF NOT EXISTS research_activities_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS research_activities_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS research_activities_completed_by UUID REFERENCES profiles(id),

ADD COLUMN IF NOT EXISTS research_design_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS research_design_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS research_design_completed_by UUID REFERENCES profiles(id),

ADD COLUMN IF NOT EXISTS calculations_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calculations_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS calculations_completed_by UUID REFERENCES profiles(id),

-- Add overall completion tracking
ADD COLUMN IF NOT EXISTS overall_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_step_completed TEXT,
ADD COLUMN IF NOT EXISTS completion_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN public.rd_business_years.business_setup_completed IS 'Whether the Business Setup step is completed and locked';
COMMENT ON COLUMN public.rd_business_years.business_setup_completed_at IS 'When the Business Setup step was completed';
COMMENT ON COLUMN public.rd_business_years.business_setup_completed_by IS 'Who completed the Business Setup step';

COMMENT ON COLUMN public.rd_business_years.research_activities_completed IS 'Whether the Research Activities step is completed and locked';
COMMENT ON COLUMN public.rd_business_years.research_activities_completed_at IS 'When the Research Activities step was completed';
COMMENT ON COLUMN public.rd_business_years.research_activities_completed_by IS 'Who completed the Research Activities step';

COMMENT ON COLUMN public.rd_business_years.research_design_completed IS 'Whether the Research Design step is completed and locked';
COMMENT ON COLUMN public.rd_business_years.research_design_completed_at IS 'When the Research Design step was completed';
COMMENT ON COLUMN public.rd_business_years.research_design_completed_by IS 'Who completed the Research Design step';

COMMENT ON COLUMN public.rd_business_years.calculations_completed IS 'Whether the Calculations step is completed and locked';
COMMENT ON COLUMN public.rd_business_years.calculations_completed_at IS 'When the Calculations step was completed';
COMMENT ON COLUMN public.rd_business_years.calculations_completed_by IS 'Who completed the Calculations step';

COMMENT ON COLUMN public.rd_business_years.overall_completion_percentage IS 'Overall completion percentage (0-100) for progress tracking';
COMMENT ON COLUMN public.rd_business_years.last_step_completed IS 'Name of the last completed step';

-- Create indexes for efficient completion queries
CREATE INDEX IF NOT EXISTS idx_rd_business_years_business_setup_completed 
ON public.rd_business_years(business_setup_completed) 
WHERE business_setup_completed = true;

CREATE INDEX IF NOT EXISTS idx_rd_business_years_research_activities_completed 
ON public.rd_business_years(research_activities_completed) 
WHERE research_activities_completed = true;

CREATE INDEX IF NOT EXISTS idx_rd_business_years_research_design_completed 
ON public.rd_business_years(research_design_completed) 
WHERE research_design_completed = true;

CREATE INDEX IF NOT EXISTS idx_rd_business_years_calculations_completed 
ON public.rd_business_years(calculations_completed) 
WHERE calculations_completed = true;

CREATE INDEX IF NOT EXISTS idx_rd_business_years_completion_percentage 
ON public.rd_business_years(overall_completion_percentage);

-- Create function to automatically calculate completion percentage
CREATE OR REPLACE FUNCTION update_completion_percentage()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate completion percentage based on completed steps
    NEW.overall_completion_percentage = (
        (CASE WHEN NEW.business_setup_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.research_activities_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.research_design_completed THEN 25 ELSE 0 END) +
        (CASE WHEN NEW.calculations_completed THEN 25 ELSE 0 END)
    );
    
    -- Update last completed step and timestamp
    IF NEW.business_setup_completed != OLD.business_setup_completed AND NEW.business_setup_completed THEN
        NEW.last_step_completed = 'Business Setup';
        NEW.completion_updated_at = NOW();
    ELSIF NEW.research_activities_completed != OLD.research_activities_completed AND NEW.research_activities_completed THEN
        NEW.last_step_completed = 'Research Activities';
        NEW.completion_updated_at = NOW();
    ELSIF NEW.research_design_completed != OLD.research_design_completed AND NEW.research_design_completed THEN
        NEW.last_step_completed = 'Research Design';
        NEW.completion_updated_at = NOW();
    ELSIF NEW.calculations_completed != OLD.calculations_completed AND NEW.calculations_completed THEN
        NEW.last_step_completed = 'Calculations';
        NEW.completion_updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update completion percentage
DROP TRIGGER IF EXISTS trigger_update_completion_percentage ON public.rd_business_years;
CREATE TRIGGER trigger_update_completion_percentage
    BEFORE UPDATE OF business_setup_completed, research_activities_completed, research_design_completed, calculations_completed
    ON public.rd_business_years
    FOR EACH ROW
    EXECUTE FUNCTION update_completion_percentage();

-- Create view for client progress tracking (for the dashboard)
CREATE OR REPLACE VIEW rd_client_progress_summary AS
SELECT 
    cb.id as business_id,
    cb.name as business_name,
    cb.client_id,
    p.full_name as client_name,
    p.email as client_email,
    tp.business_name as tax_profile_business_name,
    by.year,
    by.business_setup_completed,
    by.research_activities_completed, 
    by.research_design_completed,
    by.calculations_completed,
    by.qre_locked as qres_completed,
    by.overall_completion_percentage,
    by.last_step_completed,
    by.completion_updated_at,
    by.qc_status
FROM rd_businesses cb
JOIN tax_profiles tp ON cb.client_id = tp.id
LEFT JOIN profiles p ON tp.user_id = p.id
LEFT JOIN rd_business_years by ON cb.id = by.business_id
WHERE by.year IS NOT NULL
ORDER BY p.full_name, cb.name, by.year DESC;

-- Grant permissions on the view
GRANT SELECT ON rd_client_progress_summary TO authenticated;