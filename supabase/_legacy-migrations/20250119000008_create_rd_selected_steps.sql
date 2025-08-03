-- Create rd_selected_steps table for storing step time percentages
CREATE TABLE IF NOT EXISTS public.rd_selected_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  research_activity_id uuid NOT NULL,
  step_id uuid NOT NULL,
  time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  applied_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_selected_steps_pkey PRIMARY KEY (id),
  CONSTRAINT rd_selected_steps_business_year_id_step_id_key UNIQUE (business_year_id, step_id),
  CONSTRAINT rd_selected_steps_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES rd_business_years (id) ON DELETE CASCADE,
  CONSTRAINT rd_selected_steps_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities (id) ON DELETE CASCADE,
  CONSTRAINT rd_selected_steps_step_id_fkey FOREIGN KEY (step_id) REFERENCES rd_research_steps (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rd_selected_steps_business_year ON public.rd_selected_steps USING btree (business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_selected_steps_activity ON public.rd_selected_steps USING btree (research_activity_id);

-- Enable RLS on rd_selected_steps table
ALTER TABLE public.rd_selected_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rd_selected_steps
CREATE POLICY "Enable read access for all users" ON public.rd_selected_steps
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.rd_selected_steps
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON public.rd_selected_steps
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON public.rd_selected_steps
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add time_percentage column to rd_selected_subcomponents table
ALTER TABLE public.rd_selected_subcomponents 
ADD COLUMN IF NOT EXISTS time_percentage numeric(5, 2) DEFAULT 0;

-- Add comment to document the new column
COMMENT ON COLUMN rd_selected_subcomponents.time_percentage IS 'Step percentage calculated based on number of steps in the Research Activity';

-- Create updated_at trigger for rd_selected_steps
CREATE TRIGGER update_rd_selected_steps_updated_at 
    BEFORE UPDATE ON public.rd_selected_steps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 