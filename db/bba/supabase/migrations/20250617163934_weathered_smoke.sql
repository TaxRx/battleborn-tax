

-- Create custom types
CREATE TYPE filing_status AS ENUM ('MFJ', 'Single', 'HOH', 'MFS');


CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  filing_status filing_status NOT NULL,
  state text NOT NULL,
  agi numeric NOT NULL DEFAULT 0,
  additional_deductions numeric DEFAULT 0,
  capital_gains numeric DEFAULT 0,
  se_income numeric DEFAULT 0,
  qbi_eligible boolean DEFAULT false,
  dependents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);


ALTER TABLE clients ENABLE ROW LEVEL SECURITY;


-- Users can access clients they created
CREATE POLICY "Users can access own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());


-- Admins can access all clients
CREATE POLICY "Admins can access all clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Create index for performance
CREATE INDEX clients_created_by_idx ON clients(created_by);

CREATE INDEX clients_created_at_idx ON clients(created_at);
;
