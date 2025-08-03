-- Create the rd_credit_calculations table
CREATE TABLE IF NOT EXISTS rd_credit_calculations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  qras JSONB NOT NULL DEFAULT '[]',
  employees JSONB NOT NULL DEFAULT '[]',
  contractors JSONB NOT NULL DEFAULT '[]',
  supplies JSONB NOT NULL DEFAULT '[]',
  total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS rd_credit_calculations_user_id_idx ON rd_credit_calculations(user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_rd_credit_calculations_updated_at
  BEFORE UPDATE ON rd_credit_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE rd_credit_calculations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own calculations
CREATE POLICY "Users can view their own calculations"
  ON rd_credit_calculations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own calculations
CREATE POLICY "Users can insert their own calculations"
  ON rd_credit_calculations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own calculations
CREATE POLICY "Users can update their own calculations"
  ON rd_credit_calculations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own calculations
CREATE POLICY "Users can delete their own calculations"
  ON rd_credit_calculations
  FOR DELETE
  USING (auth.uid() = user_id); 