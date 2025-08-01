-- Create rd_research_subcomponents table
-- This table stores the subcomponents for each research step

CREATE TABLE IF NOT EXISTS public.rd_research_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  description text NULL,
  subcomponent_order integer NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  hint text NULL,
  general_description text NULL,
  goal text NULL,
  hypothesis text NULL,
  alternatives text NULL,
  uncertainties text NULL,
  developmental_process text NULL,
  primary_goal text NULL,
  expected_outcome_type text NULL,
  cpt_codes text NULL,
  cdt_codes text NULL,
  alternative_paths text NULL,
  CONSTRAINT rd_research_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_research_subcomponents_step_id_fkey FOREIGN KEY (step_id) 
    REFERENCES rd_research_steps (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rd_research_subcomponents_step_id 
  ON public.rd_research_subcomponents 
  USING btree (step_id) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.rd_research_subcomponents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.rd_research_subcomponents
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_subcomponents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.rd_research_subcomponents
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_subcomponents
  FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.rd_research_subcomponents TO authenticated;
GRANT SELECT ON public.rd_research_subcomponents TO anon; 