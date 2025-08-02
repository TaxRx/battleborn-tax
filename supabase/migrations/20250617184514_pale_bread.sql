

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  tax_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  filing_status filing_status NOT NULL,
  state text NOT NULL,
  agi numeric NOT NULL DEFAULT 0,
  se_income numeric DEFAULT 0,
  capital_gains numeric DEFAULT 0,
  additional_deductions numeric DEFAULT 0,
  qbi_eligible boolean DEFAULT false,
  dependents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);


-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status proposal_status DEFAULT 'draft',
  notes text DEFAULT '',
  estimated_savings numeric DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  type strategy_type NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  est_cost numeric DEFAULT 0,
  est_savings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);


-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;


-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS clients_created_by_idx ON clients(created_by);

CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients(created_at);

CREATE INDEX IF NOT EXISTS proposals_client_id_idx ON proposals(client_id);

CREATE INDEX IF NOT EXISTS proposals_created_by_idx ON proposals(created_by);

CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals(status);

CREATE INDEX IF NOT EXISTS proposals_created_at_idx ON proposals(created_at);

CREATE INDEX IF NOT EXISTS strategies_proposal_id_idx ON strategies(proposal_id);

CREATE INDEX IF NOT EXISTS strategies_type_idx ON strategies(type);

CREATE INDEX IF NOT EXISTS strategies_created_at_idx ON strategies(created_at);


-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can access own clients" ON clients;

DROP POLICY IF EXISTS "Admins can access all clients" ON clients;

DROP POLICY IF EXISTS "Users can access own proposals" ON proposals;

DROP POLICY IF EXISTS "Admins can access all proposals" ON proposals;

DROP POLICY IF EXISTS "Users can access own strategies" ON strategies;

DROP POLICY IF EXISTS "Admins can access all strategies" ON strategies;


-- RLS Policies for clients
CREATE POLICY "Users can access own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());


CREATE POLICY "Admins can access all clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- RLS Policies for proposals
CREATE POLICY "Users can access own proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());


CREATE POLICY "Admins can access all proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- RLS Policies for strategies
CREATE POLICY "Users can access own strategies"
  ON strategies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = strategies.proposal_id AND proposals.created_by = auth.uid()
    )
  );


CREATE POLICY "Admins can access all strategies"
  ON strategies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- Create or replace trigger function to update updated_at on proposals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();

  RETURN NEW;

END;

$$ language 'plpgsql';


-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;


-- Create trigger to update updated_at on proposals
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
;
