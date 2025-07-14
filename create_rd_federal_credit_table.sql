-- Create rd_federal_credit table for audit logging and data snapshots
CREATE TABLE IF NOT EXISTS rd_federal_credit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core identification
    business_year_id UUID NOT NULL REFERENCES business_years(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    
    -- Research activity details
    research_activity_id UUID REFERENCES research_activities(id),
    research_activity_name TEXT,
    
    -- QRE breakdown
    direct_research_wages NUMERIC(15,2) DEFAULT 0,
    supplies_expenses NUMERIC(15,2) DEFAULT 0,
    contractor_expenses NUMERIC(15,2) DEFAULT 0,
    total_qre NUMERIC(15,2) DEFAULT 0,
    
    -- Subcomponent details
    subcomponent_count INTEGER DEFAULT 0,
    subcomponent_groups TEXT,
    applied_percent NUMERIC(5,2) DEFAULT 0,
    
    -- AI-generated descriptions
    line_49f_description TEXT,
    ai_generation_timestamp TIMESTAMP,
    ai_prompt_used TEXT,
    ai_response_raw TEXT,
    
    -- Calculation details
    federal_credit_amount NUMERIC(15,2) DEFAULT 0,
    federal_credit_percentage NUMERIC(5,2) DEFAULT 0,
    calculation_method TEXT,
    
    -- Industry and context
    industry_type TEXT,
    focus_area TEXT,
    general_description TEXT,
    
    -- Audit trail
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Version control
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,
    previous_version_id UUID REFERENCES rd_federal_credit(id),
    
    -- Metadata
    calculation_timestamp TIMESTAMP DEFAULT NOW(),
    data_snapshot JSONB,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_percentages CHECK (applied_percent >= 0 AND applied_percent <= 100),
    CONSTRAINT valid_amounts CHECK (direct_research_wages >= 0 AND supplies_expenses >= 0 AND contractor_expenses >= 0),
    CONSTRAINT valid_subcomponent_count CHECK (subcomponent_count >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_business_year ON rd_federal_credit(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_client ON rd_federal_credit(client_id);
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_activity ON rd_federal_credit(research_activity_id);
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_created_at ON rd_federal_credit(created_at);
CREATE INDEX IF NOT EXISTS idx_rd_federal_credit_latest ON rd_federal_credit(is_latest) WHERE is_latest = TRUE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rd_federal_credit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rd_federal_credit_updated_at ON rd_federal_credit;
CREATE TRIGGER trigger_update_rd_federal_credit_updated_at
    BEFORE UPDATE ON rd_federal_credit
    FOR EACH ROW
    EXECUTE FUNCTION update_rd_federal_credit_updated_at();

-- Create function to archive previous versions
CREATE OR REPLACE FUNCTION archive_rd_federal_credit_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark previous version as not latest
    UPDATE rd_federal_credit 
    SET is_latest = FALSE 
    WHERE business_year_id = NEW.business_year_id 
    AND research_activity_id = NEW.research_activity_id
    AND id != NEW.id;
    
    -- Set previous version reference
    UPDATE rd_federal_credit 
    SET previous_version_id = (
        SELECT id FROM rd_federal_credit 
        WHERE business_year_id = NEW.business_year_id 
        AND research_activity_id = NEW.research_activity_id
        AND id != NEW.id
        ORDER BY created_at DESC 
        LIMIT 1
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_archive_rd_federal_credit_version ON rd_federal_credit;
CREATE TRIGGER trigger_archive_rd_federal_credit_version
    AFTER INSERT ON rd_federal_credit
    FOR EACH ROW
    EXECUTE FUNCTION archive_rd_federal_credit_version();

-- Create view for latest versions only
CREATE OR REPLACE VIEW rd_federal_credit_latest AS
SELECT * FROM rd_federal_credit WHERE is_latest = TRUE;

-- Add RLS policies
ALTER TABLE rd_federal_credit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own rd_federal_credit" ON rd_federal_credit;
DROP POLICY IF EXISTS "Users can insert own rd_federal_credit" ON rd_federal_credit;
DROP POLICY IF EXISTS "Users can update own rd_federal_credit" ON rd_federal_credit;

-- Policy for users to see their own data
CREATE POLICY "Users can view own rd_federal_credit" ON rd_federal_credit
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE created_by = auth.uid()
        )
    );

-- Policy for users to insert their own data
CREATE POLICY "Users can insert own rd_federal_credit" ON rd_federal_credit
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE created_by = auth.uid()
        )
    );

-- Policy for users to update their own data
CREATE POLICY "Users can update own rd_federal_credit" ON rd_federal_credit
    FOR UPDATE USING (
        client_id IN (
            SELECT id FROM clients WHERE created_by = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE rd_federal_credit IS 'Audit log and snapshot table for R&D federal credit calculations';
COMMENT ON COLUMN rd_federal_credit.data_snapshot IS 'JSON snapshot of all calculation inputs and intermediate values';
COMMENT ON COLUMN rd_federal_credit.line_49f_description IS 'AI-generated description for Form 6765 Line 49(f)';
COMMENT ON COLUMN rd_federal_credit.version IS 'Version number for tracking changes';
COMMENT ON COLUMN rd_federal_credit.is_latest IS 'Flag indicating if this is the most recent version'; 