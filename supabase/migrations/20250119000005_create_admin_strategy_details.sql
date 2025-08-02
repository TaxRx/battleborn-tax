-- Create admin_strategy_details table for storing strategy details for admin clients
CREATE TABLE IF NOT EXISTS admin_strategy_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_file_id UUID NOT NULL REFERENCES admin_client_files(id) ON DELETE CASCADE,
  strategy_id TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_category TEXT NOT NULL,
  year INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT false,
  estimated_savings DECIMAL(12,2) DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique strategy per client per year
  UNIQUE(client_file_id, strategy_id, year)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_admin_strategy_details_client_file_id ON admin_strategy_details(client_file_id);
CREATE INDEX IF NOT EXISTS idx_admin_strategy_details_strategy_id ON admin_strategy_details(strategy_id);
CREATE INDEX IF NOT EXISTS idx_admin_strategy_details_year ON admin_strategy_details(year);

-- Add RLS policies
ALTER TABLE admin_strategy_details ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage their client strategies
CREATE POLICY "Admins can manage their client strategies" ON admin_strategy_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_client_files acf
      WHERE acf.id = admin_strategy_details.client_file_id
      AND acf.admin_id = auth.uid()
    )
  );

-- Policy for demo mode (allow all operations when no user)
CREATE POLICY "Demo mode access" ON admin_strategy_details
  FOR ALL USING (auth.uid() IS NULL);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_admin_strategy_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_strategy_details_updated_at
  BEFORE UPDATE ON admin_strategy_details
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_strategy_details_updated_at(); 