

-- Add admin fields to proposals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE proposals ADD COLUMN admin_notes text DEFAULT '';

  END IF;


  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'expert_email'
  ) THEN
    ALTER TABLE proposals ADD COLUMN expert_email text;

  END IF;


  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'last_updated_by_admin'
  ) THEN
    ALTER TABLE proposals ADD COLUMN last_updated_by_admin timestamptz;

  END IF;

END $$;


-- Create experts table
CREATE TABLE IF NOT EXISTS experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  specialization text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);


-- Enable RLS on experts table
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;


-- RLS Policy for experts (admin only)
DROP POLICY IF EXISTS "Admins can access all experts" ON experts;

CREATE POLICY "Admins can access all experts"
  ON experts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- Insert sample experts
INSERT INTO experts (name, email, specialization) VALUES
  ('Dr. Sarah Johnson', 'sarah.johnson@taxexperts.com', 'Business Tax Strategy'),
  ('Michael Chen', 'michael.chen@taxexperts.com', 'Individual Tax Planning'),
  ('Lisa Rodriguez', 'lisa.rodriguez@taxexperts.com', 'Estate & Trust Planning')
ON CONFLICT (email) DO NOTHING;


-- Create index for experts
CREATE INDEX IF NOT EXISTS experts_active_idx ON experts(active);
;
