-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  income DECIMAL,
  state TEXT,
  donation_amount DECIMAL,
  calculations JSONB,
  contacted BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Add RLS policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all leads
CREATE POLICY "Admins can view all leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  ));

-- Allow admins to insert leads
CREATE POLICY "Admins can insert leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  ));

-- Allow admins to update leads
CREATE POLICY "Admins can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  ));

-- Allow public to insert leads (for the contact form)
CREATE POLICY "Public can insert leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index on email for faster searches
CREATE INDEX leads_email_idx ON public.leads (email); 