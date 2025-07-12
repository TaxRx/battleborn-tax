-- Fix tax_calculations table structure to match code expectations
-- Migration: 20250118000000_fix_tax_calculations_structure.sql

-- Drop the old table if it exists with the wrong structure
DROP TABLE IF EXISTS tax_calculations;

-- Create the correct tax_calculations table structure
CREATE TABLE tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  year integer NOT NULL,
  tax_info jsonb NOT NULL,
  breakdown jsonb NOT NULL,
  strategies jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_calculations
CREATE POLICY "Users can view own calculations"
  ON tax_calculations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations"
  ON tax_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculations"
  ON tax_calculations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations"
  ON tax_calculations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS tax_calculations_user_id_idx ON tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS tax_calculations_year_idx ON tax_calculations(year);

-- Comments for documentation
COMMENT ON TABLE tax_calculations IS 'Stores tax calculations with strategies for each user';
COMMENT ON COLUMN tax_calculations.user_id IS 'References auth.users(id)';
COMMENT ON COLUMN tax_calculations.year IS 'Tax year for the calculation';
COMMENT ON COLUMN tax_calculations.tax_info IS 'JSON object containing tax information';
COMMENT ON COLUMN tax_calculations.breakdown IS 'JSON object containing tax breakdown';
COMMENT ON COLUMN tax_calculations.strategies IS 'JSON array containing enabled tax strategies'; 