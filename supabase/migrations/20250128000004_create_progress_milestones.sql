-- ========================================
-- PROGRESS MILESTONE TRACKING SYSTEM
-- ========================================
-- Migration: Create rd_progress_milestones table for tracking R&D process progress
-- Purpose: Track manual and automated milestones in the R&D tax credit process

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.rd_progress_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
    
    -- Milestone identification
    milestone_type TEXT NOT NULL CHECK (milestone_type IN (
        'engaged',                    -- Manual: Engagement contract signed
        'tax_returns_received',       -- Manual: Client tax returns received
        'wages_received',            -- Manual: Employee wage data received  
        'support_documents_received', -- Manual: Supporting documents received
        'scoping_call',              -- Manual: Scoping call completed
        'data_entry',                -- Auto: Expenses step locked in wizard
        'qc_review',                 -- Manual: QC review completed (ties to calculations lock)
        'jurat',                     -- Auto: Client portal jurat signature completed
        'completed'                  -- Manual: All work completed
    )),
    
    -- Status and timing
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES public.profiles(id),
    
    -- Contract-specific fields
    engagement_contract_expiration TIMESTAMP WITH TIME ZONE, -- For 'engaged' milestone
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rd_progress_milestones_business_year 
ON public.rd_progress_milestones(business_year_id);

CREATE INDEX IF NOT EXISTS idx_rd_progress_milestones_type 
ON public.rd_progress_milestones(milestone_type);

CREATE INDEX IF NOT EXISTS idx_rd_progress_milestones_completed 
ON public.rd_progress_milestones(is_completed) 
WHERE is_completed = true;

CREATE INDEX IF NOT EXISTS idx_rd_progress_milestones_engagement_expiration 
ON public.rd_progress_milestones(engagement_contract_expiration) 
WHERE milestone_type = 'engaged' AND engagement_contract_expiration IS NOT NULL;

-- Create unique constraint to prevent duplicate milestones per business year
CREATE UNIQUE INDEX IF NOT EXISTS idx_rd_progress_milestones_unique_milestone
ON public.rd_progress_milestones(business_year_id, milestone_type);

-- Add comments for documentation
COMMENT ON TABLE public.rd_progress_milestones IS 'Tracks progress milestones for R&D tax credit process per business year';
COMMENT ON COLUMN public.rd_progress_milestones.milestone_type IS 'Type of milestone: manual entry (engaged, tax_returns_received, etc.) or auto-tracked (data_entry, jurat)';
COMMENT ON COLUMN public.rd_progress_milestones.engagement_contract_expiration IS 'Contract expiration date for engaged milestone';
COMMENT ON COLUMN public.rd_progress_milestones.is_completed IS 'Whether this milestone has been completed';
COMMENT ON COLUMN public.rd_progress_milestones.completed_at IS 'When the milestone was marked complete';
COMMENT ON COLUMN public.rd_progress_milestones.completed_by IS 'Who marked the milestone complete';

-- Create view for progress dashboard
CREATE OR REPLACE VIEW public.rd_progress_dashboard AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    b.client_id,
    b.start_year as business_start_year,
    by.id as business_year_id,
    by.year,
    
    -- Progress milestones (using aggregation to get completion status)
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'engaged' THEN pm.is_completed END), FALSE) as engaged_completed,
    MAX(CASE WHEN pm.milestone_type = 'engaged' THEN pm.completed_at END) as engaged_completed_at,
    MAX(CASE WHEN pm.milestone_type = 'engaged' THEN pm.engagement_contract_expiration END) as engagement_expiration,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'tax_returns_received' THEN pm.is_completed END), FALSE) as tax_returns_completed,
    MAX(CASE WHEN pm.milestone_type = 'tax_returns_received' THEN pm.completed_at END) as tax_returns_completed_at,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'wages_received' THEN pm.is_completed END), FALSE) as wages_completed,
    MAX(CASE WHEN pm.milestone_type = 'wages_received' THEN pm.completed_at END) as wages_completed_at,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'support_documents_received' THEN pm.is_completed END), FALSE) as support_docs_completed,
    MAX(CASE WHEN pm.milestone_type = 'support_documents_received' THEN pm.completed_at END) as support_docs_completed_at,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'scoping_call' THEN pm.is_completed END), FALSE) as scoping_call_completed,
    MAX(CASE WHEN pm.milestone_type = 'scoping_call' THEN pm.completed_at END) as scoping_call_completed_at,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'data_entry' THEN pm.is_completed END), FALSE) as data_entry_completed,
    MAX(CASE WHEN pm.milestone_type = 'data_entry' THEN pm.completed_at END) as data_entry_completed_at,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'qc_review' THEN pm.is_completed END), FALSE) as qc_review_completed,
    MAX(CASE WHEN pm.milestone_type = 'qc_review' THEN pm.completed_at END) as qc_review_completed_at,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'jurat' THEN pm.is_completed END), FALSE) as jurat_completed,
    MAX(CASE WHEN pm.milestone_type = 'jurat' THEN pm.completed_at END) as jurat_completed_at,
    
    COALESCE(BOOL_OR(CASE WHEN pm.milestone_type = 'completed' THEN pm.is_completed END), FALSE) as project_completed,
    MAX(CASE WHEN pm.milestone_type = 'completed' THEN pm.completed_at END) as project_completed_at,
    
    -- Calculate overall progress percentage
    ROUND(
        (CASE WHEN BOOL_OR(pm.milestone_type = 'engaged' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'tax_returns_received' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'wages_received' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'support_documents_received' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'scoping_call' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'data_entry' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'qc_review' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'jurat' AND pm.is_completed) THEN 1 ELSE 0 END +
         CASE WHEN BOOL_OR(pm.milestone_type = 'completed' AND pm.is_completed) THEN 1 ELSE 0 END
        ) * 100.0 / 9, 1
    ) as progress_percentage

FROM public.rd_businesses b
JOIN public.rd_business_years by ON b.id = by.business_id
LEFT JOIN public.rd_progress_milestones pm ON by.id = pm.business_year_id
GROUP BY b.id, b.name, b.client_id, b.start_year, by.id, by.year
ORDER BY b.name, by.year DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rd_progress_milestones TO authenticated;
GRANT SELECT ON public.rd_progress_dashboard TO authenticated;

-- Enable RLS
ALTER TABLE public.rd_progress_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage milestones for their businesses
CREATE POLICY "Users can manage progress milestones for their businesses" 
ON public.rd_progress_milestones
FOR ALL USING (
    business_year_id IN (
        SELECT by.id 
        FROM public.rd_business_years by
        JOIN public.rd_businesses b ON by.business_id = b.id
        JOIN public.clients c ON b.client_id = c.id
        WHERE c.created_by = auth.uid()
    )
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_rd_progress_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rd_progress_milestones_updated_at
    BEFORE UPDATE ON public.rd_progress_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_rd_progress_milestones_updated_at();