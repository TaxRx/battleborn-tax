-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business links table
CREATE TABLE IF NOT EXISTS business_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  client_id UUID REFERENCES users(id),
  review_status TEXT NOT NULL CHECK (review_status IN ('pending', 'approved', 'rejected')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_size INTEGER,
  mime_type TEXT
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  client_id UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Changelog table
CREATE TABLE IF NOT EXISTS changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  annual_wage DECIMAL(10,2) NOT NULL,
  is_business_owner BOOLEAN DEFAULT false,
  yearly_activities JSONB,
  business_id UUID REFERENCES businesses(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee activities table
CREATE TABLE IF NOT EXISTS employee_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  year INTEGER NOT NULL,
  activity_id UUID REFERENCES activities(id),
  percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, year, activity_id)
);

-- Employee subcomponents table
CREATE TABLE IF NOT EXISTS employee_subcomponents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  year INTEGER NOT NULL,
  activity_id UUID REFERENCES activities(id),
  subcomponent_id UUID,
  percentage DECIMAL(5,2) NOT NULL,
  role_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, year, activity_id, subcomponent_id)
);

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (role = 'admin');

-- RLS Policies for businesses
CREATE POLICY "Users can view their own businesses" ON businesses
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM business_links WHERE business_id = businesses.id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all businesses" ON businesses
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for business_links
CREATE POLICY "Users can view their own business links" ON business_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all business links" ON business_links
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all activities" ON activities
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all expenses" ON expenses
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for changelog
CREATE POLICY "Users can view their own changelog entries" ON changelog
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all changelog entries" ON changelog
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for employees
CREATE POLICY "Users can view their own employees" ON employees
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = employees.business_id 
    AND (businesses.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM business_links 
      WHERE business_links.business_id = businesses.id 
      AND business_links.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Admins can view all employees" ON employees
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for employee_activities
CREATE POLICY "Users can view their own employee activities" ON employee_activities
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = employee_activities.employee_id 
    AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = employees.business_id 
      AND (businesses.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM business_links 
        WHERE business_links.business_id = businesses.id 
        AND business_links.user_id = auth.uid()
      ))
    )
  ));

CREATE POLICY "Admins can view all employee activities" ON employee_activities
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for employee_subcomponents
CREATE POLICY "Users can view their own employee subcomponents" ON employee_subcomponents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM employees 
    WHERE employees.id = employee_subcomponents.employee_id 
    AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = employees.business_id 
      AND (businesses.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM business_links 
        WHERE business_links.business_id = businesses.id 
        AND business_links.user_id = auth.uid()
      ))
    )
  ));

CREATE POLICY "Admins can view all employee subcomponents" ON employee_subcomponents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Demo mode policies
CREATE POLICY "Demo mode can view all data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON business_links
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON documents
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON expenses
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON changelog
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON employees
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON employee_activities
  FOR SELECT USING (true);

CREATE POLICY "Demo mode can view all data" ON employee_subcomponents
  FOR SELECT USING (true); 