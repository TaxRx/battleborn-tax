-- State Calculations Table Setup
-- Run this in your Supabase SQL Editor

-- Create state calculations table with updated structure
CREATE TABLE IF NOT EXISTS rd_state_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(2) NOT NULL,
    calculation_method TEXT NOT NULL,
    refundable TEXT NULL,
    carryforward TEXT NULL,
    eligible_entities TEXT[] NULL,
    calculation_formula TEXT NOT NULL,
    special_notes TEXT NULL,
    start_year NUMERIC NOT NULL,
    end_year NUMERIC NULL,
    is_active BOOLEAN NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    formula_correct TEXT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_state_calculations_state ON rd_state_calculations(state);
CREATE INDEX IF NOT EXISTS idx_state_calculations_active ON rd_state_calculations(is_active);
CREATE INDEX IF NOT EXISTS idx_state_calculations_year ON rd_state_calculations(start_year, end_year);

-- Create unique constraint to prevent duplicate state/year combinations
CREATE UNIQUE INDEX IF NOT EXISTS idx_state_calculations_unique 
ON rd_state_calculations(state, start_year) 
WHERE is_active = TRUE;

-- Add RLS policies
ALTER TABLE rd_state_calculations ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to state calculations" ON rd_state_calculations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only to authenticated users (admin functionality)
CREATE POLICY "Allow full access to state calculations" ON rd_state_calculations
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rd_state_calculations_updated_at 
    BEFORE UPDATE ON rd_state_calculations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data with updated structure
INSERT INTO rd_state_calculations (
    state, 
    calculation_method, 
    refundable, 
    carryforward, 
    eligible_entities, 
    calculation_formula, 
    special_notes, 
    start_year,
    formula_correct
) VALUES 
('CA', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.15 × (Wages + 0.65×Contractor Costs + Supply Costs) + 0.24 × Contract Research', 'California offers both standard and ASC credits', 2024, 'Credit = 0.15 × (Wages + 0.65×Contractor Costs + Supply Costs) + 0.24 × Contract Research'),
('NY', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.09 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)', 'New York uses fixed-base percentage calculation', 2024, 'Credit = 0.09 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)'),
('TX', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships', 'llcs'], 'Credit = 0.05 × QREs', 'Texas offers a simple percentage of QREs', 2024, 'Credit = 0.05 × QREs'),
('FL', 'No Credit', 'No', 'No', ARRAY['corporations', 'partnerships'], 'No state R&D credit available', 'Florida does not offer R&D tax credits', 2024, 'No state R&D credit available'),
('IL', 'Standard Credit', 'No', 'Yes', ARRAY['corporations'], 'Credit = 0.065 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)', 'Illinois uses fixed-base percentage with 6.5% rate', 2024, 'Credit = 0.065 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)'),
('PA', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.10 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)', 'Pennsylvania offers 10% credit with base calculation', 2024, 'Credit = 0.10 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)'),
('OH', 'Standard Credit', 'No', 'Yes', ARRAY['corporations'], 'Credit = 0.07 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)', 'Ohio offers 7% credit with base calculation', 2024, 'Credit = 0.07 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)'),
('MI', 'No Credit', 'No', 'No', ARRAY['corporations', 'partnerships'], 'No state R&D credit available', 'Michigan does not offer R&D tax credits', 2024, 'No state R&D credit available'),
('NC', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.025 × QREs', 'North Carolina offers 2.5% credit', 2024, 'Credit = 0.025 × QREs'),
('VA', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.15 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)', 'Virginia offers 15% credit with base calculation', 2024, 'Credit = 0.15 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)'),
('CO', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.03 × QREs', 'Colorado offers 3% credit', 2024, 'Credit = 0.03 × QREs'),
('WA', 'No Credit', 'No', 'No', ARRAY['corporations', 'partnerships'], 'No state R&D credit available', 'Washington does not offer R&D tax credits', 2024, 'No state R&D credit available'),
('AZ', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.24 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)', 'Arizona offers 24% credit with base calculation', 2024, 'Credit = 0.24 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)'),
('GA', 'Standard Credit', 'No', 'Yes', ARRAY['corporations', 'partnerships'], 'Credit = 0.10 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)', 'Georgia offers 10% credit with base calculation', 2024, 'Credit = 0.10 × (QREs − Base); Base = fixed‑base % × avg gross receipts (prior 3 yrs)'),
('TN', 'No Credit', 'No', 'No', ARRAY['corporations', 'partnerships'], 'No state R&D credit available', 'Tennessee does not offer R&D tax credits', 2024, 'No state R&D credit available');

-- Verify the table was created successfully
SELECT 
    state,
    calculation_method,
    refundable,
    carryforward,
    calculation_formula,
    start_year
FROM rd_state_calculations 
WHERE is_active = TRUE 
ORDER BY state; 