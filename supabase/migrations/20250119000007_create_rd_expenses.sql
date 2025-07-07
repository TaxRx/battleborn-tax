-- Create table for R&D expenses tracking
CREATE TABLE IF NOT EXISTS public.rd_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_year_id uuid NOT NULL,
  research_activity_id uuid NOT NULL,
  step_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  employee_id uuid NULL,
  contractor_id uuid NULL,
  supply_id uuid NULL,
  category text NOT NULL,
  first_name text NULL,
  last_name text NULL,
  role_name text NULL,
  supply_name text NULL,
  research_activity_title text NOT NULL,
  research_activity_practice_percent numeric(5, 2) NOT NULL,
  step_name text NOT NULL,
  subcomponent_title text NOT NULL,
  subcomponent_year_percent numeric(5, 2) NOT NULL,
  subcomponent_frequency_percent numeric(5, 2) NOT NULL,
  subcomponent_time_percent numeric(5, 2) NOT NULL,
  total_cost numeric(10, 2) NOT NULL,
  applied_percent numeric(5, 2) NOT NULL,
  baseline_applied_percent numeric(5, 2) NOT NULL,
  employee_practice_percent numeric(5, 2) NULL,
  employee_time_percent numeric(5, 2) NULL,
  notes text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT rd_expenses_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
  CONSTRAINT rd_expenses_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES public.rd_research_activities(id) ON DELETE CASCADE,
  CONSTRAINT rd_expenses_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.rd_research_steps(id) ON DELETE CASCADE,
  CONSTRAINT rd_expenses_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE,
  CONSTRAINT rd_expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE,
  CONSTRAINT rd_expenses_category_check CHECK (category IN ('Employee', 'Contractor', 'Supply'))
);

-- Create helper table for contractors
CREATE TABLE IF NOT EXISTS public.rd_contractors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  role text NULL,
  annual_cost numeric(10, 2) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_contractors_pkey PRIMARY KEY (id),
  CONSTRAINT rd_contractors_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE
);

-- Create helper table for supplies
CREATE TABLE IF NOT EXISTS public.rd_supplies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text NULL,
  annual_cost numeric(10, 2) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_supplies_pkey PRIMARY KEY (id),
  CONSTRAINT rd_supplies_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.rd_businesses(id) ON DELETE CASCADE
);

-- Create table for employee-subcomponent relationships
CREATE TABLE IF NOT EXISTS public.rd_employee_subcomponents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  subcomponent_id uuid NOT NULL,
  business_year_id uuid NOT NULL,
  time_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  applied_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  baseline_applied_percent numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rd_employee_subcomponents_pkey PRIMARY KEY (id),
  CONSTRAINT rd_employee_subcomponents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.rd_employees(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES public.rd_research_subcomponents(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
  CONSTRAINT rd_employee_subcomponents_unique UNIQUE (employee_id, subcomponent_id, business_year_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rd_expenses_business_year_id ON public.rd_expenses(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_expenses_employee_id ON public.rd_expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_rd_expenses_category ON public.rd_expenses(category);
CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents(employee_id);
CREATE INDEX IF NOT EXISTS idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents(subcomponent_id);
CREATE INDEX IF NOT EXISTS idx_rd_contractors_business_id ON public.rd_contractors(business_id);
CREATE INDEX IF NOT EXISTS idx_rd_supplies_business_id ON public.rd_supplies(business_id);

-- Add RLS policies
ALTER TABLE public.rd_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_employee_subcomponents ENABLE ROW LEVEL SECURITY;

-- Create policies (basic policies - adjust based on your auth requirements)
CREATE POLICY "Enable read access for authenticated users" ON public.rd_expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_expenses FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractors FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.rd_supplies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_supplies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_supplies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_supplies FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.rd_employee_subcomponents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_employee_subcomponents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.rd_employee_subcomponents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_employee_subcomponents FOR DELETE USING (auth.role() = 'authenticated'); 