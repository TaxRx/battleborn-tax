-- Create state pro forma data table
CREATE TABLE IF NOT EXISTS rd_state_proforma_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_year_id UUID NOT NULL REFERENCES business_years(id) ON DELETE CASCADE,
  state_code VARCHAR(2) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('standard', 'alternative')),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries for same state/method/year
  UNIQUE(business_year_id, state_code, method)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rd_state_proforma_data_lookup 
ON rd_state_proforma_data(business_year_id, state_code, method);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_rd_state_proforma_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rd_state_proforma_data_updated_at
  BEFORE UPDATE ON rd_state_proforma_data
  FOR EACH ROW
  EXECUTE FUNCTION update_rd_state_proforma_data_updated_at();

-- Enable RLS
ALTER TABLE rd_state_proforma_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own state pro forma data" ON rd_state_proforma_data
  FOR SELECT USING (
    business_year_id IN (
      SELECT id FROM business_years 
      WHERE client_id IN (
        SELECT id FROM clients 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own state pro forma data" ON rd_state_proforma_data
  FOR INSERT WITH CHECK (
    business_year_id IN (
      SELECT id FROM business_years 
      WHERE client_id IN (
        SELECT id FROM clients 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own state pro forma data" ON rd_state_proforma_data
  FOR UPDATE USING (
    business_year_id IN (
      SELECT id FROM business_years 
      WHERE client_id IN (
        SELECT id FROM clients 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own state pro forma data" ON rd_state_proforma_data
  FOR DELETE USING (
    business_year_id IN (
      SELECT id FROM business_years 
      WHERE client_id IN (
        SELECT id FROM clients 
        WHERE user_id = auth.uid()
      )
    )
  ); 