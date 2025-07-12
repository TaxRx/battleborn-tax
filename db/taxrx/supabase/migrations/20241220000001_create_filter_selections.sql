-- Create filter selections table
CREATE TABLE IF NOT EXISTS rd_filter_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
    selected_categories TEXT[] DEFAULT '{}',
    selected_areas TEXT[] DEFAULT '{}',
    selected_focuses TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_year_id)
);

-- Add RLS policies
ALTER TABLE rd_filter_selections ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can restrict this further if needed)
CREATE POLICY "Allow all operations for authenticated users" ON rd_filter_selections
    FOR ALL USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_filter_selections_business_year_id ON rd_filter_selections(business_year_id); 