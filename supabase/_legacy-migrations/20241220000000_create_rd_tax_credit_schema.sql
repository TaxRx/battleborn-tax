-- Create enums
CREATE TYPE role_type AS ENUM ('ADMIN', 'CLIENT', 'STAFF');
CREATE TYPE entity_type AS ENUM ('LLC', 'SCORP', 'CCORP', 'PARTNERSHIP', 'SOLEPROP', 'OTHER');
CREATE TYPE rd_report_type AS ENUM ('RESEARCH_DESIGN', 'RESEARCH_SUMMARY', 'FILING_GUIDE');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role_type role_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_clients table
CREATE TABLE rd_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_businesses table
CREATE TABLE rd_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES rd_clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ein TEXT NOT NULL,
    entity_type entity_type NOT NULL,
    start_year INTEGER NOT NULL,
    domicile_state TEXT NOT NULL,
    contact_info JSONB NOT NULL,
    is_controlled_grp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_business_years table
CREATE TABLE rd_business_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES rd_businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    gross_receipts DECIMAL(15,2) NOT NULL,
    total_qre DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for business years
CREATE INDEX idx_rd_business_years_business_year ON rd_business_years(business_id, year);

-- Create rd_roles table
CREATE TABLE rd_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES rd_businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES rd_roles(id) ON DELETE SET NULL
);

-- Create rd_employees table
CREATE TABLE rd_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES rd_businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES rd_roles(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT FALSE,
    annual_wage DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_employee_year_data table
CREATE TABLE rd_employee_year_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rd_employees(id) ON DELETE CASCADE,
    business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
    applied_percent DECIMAL(5,2) NOT NULL,
    calculated_qre DECIMAL(15,2) NOT NULL,
    activity_roles JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for employee year data
CREATE INDEX idx_rd_employee_year_data_employee_year ON rd_employee_year_data(employee_id, business_year_id);

-- Create rd_supply_year_data table
CREATE TABLE rd_supply_year_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cost_amount DECIMAL(15,2) NOT NULL,
    applied_percent DECIMAL(5,2) NOT NULL,
    activity_link JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_contractor_year_data table
CREATE TABLE rd_contractor_year_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cost_amount DECIMAL(15,2) NOT NULL,
    applied_percent DECIMAL(5,2) NOT NULL,
    activity_link JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_research_categories table
CREATE TABLE rd_research_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_areas table
CREATE TABLE rd_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES rd_research_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_focuses table
CREATE TABLE rd_focuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    area_id UUID NOT NULL REFERENCES rd_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_research_activities table
CREATE TABLE rd_research_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    focus_id UUID NOT NULL REFERENCES rd_focuses(id) ON DELETE CASCADE,
    general_description TEXT,
    goal TEXT,
    hypothesis TEXT,
    alternatives TEXT,
    uncertainties TEXT,
    developmental_process TEXT,
    primary_goal TEXT,
    expected_outcome_type TEXT,
    cpt_codes TEXT,
    cdt_codes TEXT,
    alternative_paths TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    default_roles JSONB NOT NULL,
    default_steps JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_subcomponents table
CREATE TABLE rd_subcomponents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES rd_research_activities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    phase TEXT NOT NULL,
    step TEXT,
    hint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rd_selected_activities table
CREATE TABLE rd_selected_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL REFERENCES rd_business_years(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES rd_research_activities(id) ON DELETE CASCADE,
    practice_percent DECIMAL(5,2) NOT NULL,
    selected_roles JSONB NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for selected activities
CREATE INDEX idx_rd_selected_activities_business_year_activity ON rd_selected_activities(business_year_id, activity_id);

-- Create rd_reports table
CREATE TABLE rd_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES rd_businesses(id) ON DELETE SET NULL,
    business_year_id UUID REFERENCES rd_business_years(id) ON DELETE SET NULL,
    type rd_report_type NOT NULL,
    generated_text TEXT NOT NULL,
    editable_text TEXT,
    ai_version TEXT NOT NULL,
    locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for reports
CREATE INDEX idx_rd_reports_business_year_type ON rd_reports(business_year_id, type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_clients_updated_at BEFORE UPDATE ON rd_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_businesses_updated_at BEFORE UPDATE ON rd_businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_business_years_updated_at BEFORE UPDATE ON rd_business_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_employees_updated_at BEFORE UPDATE ON rd_employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_employee_year_data_updated_at BEFORE UPDATE ON rd_employee_year_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_supply_year_data_updated_at BEFORE UPDATE ON rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_contractor_year_data_updated_at BEFORE UPDATE ON rd_contractor_year_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_research_categories_updated_at BEFORE UPDATE ON rd_research_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_areas_updated_at BEFORE UPDATE ON rd_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_focuses_updated_at BEFORE UPDATE ON rd_focuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_research_activities_updated_at BEFORE UPDATE ON rd_research_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_subcomponents_updated_at BEFORE UPDATE ON rd_subcomponents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_selected_activities_updated_at BEFORE UPDATE ON rd_selected_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rd_reports_updated_at BEFORE UPDATE ON rd_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 