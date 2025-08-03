-- Create table for employee-subcomponent relationships
CREATE TABLE IF NOT EXISTS public.rd_employee_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  step_id uuid NOT NULL,
  research_activity_id uuid NOT NULL,
  employee_time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  baseline_time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_employee_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_employee_subcomponents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_unique UNIQUE (employee_id, subcomponent_id, business_year_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_employee ON public.rd_employee_subcomponents USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_business_year ON public.rd_employee_subcomponents USING btree (business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_subcomponent ON public.rd_employee_subcomponents USING btree (subcomponent_id);

-- Enable RLS
ALTER TABLE public.rd_employee_subcomponents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.rd_employee_subcomponents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.rd_employee_subcomponents
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON public.rd_employee_subcomponents
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON public.rd_employee_subcomponents
    FOR DELETE USING (auth.uid() IS NOT NULL); 