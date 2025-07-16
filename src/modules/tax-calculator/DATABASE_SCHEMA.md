# Database Schema Documentation

## Core Tables

### rd_businesses
```sql
CREATE TABLE rd_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entity_type entity_type NOT NULL,
    start_year INTEGER NOT NULL,
    domicile_state TEXT NOT NULL,
    contact_info JSONB NOT NULL,
    is_controlled_grp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### rd_business_years
```sql
CREATE TABLE rd_business_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES rd_businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    gross_receipts DECIMAL(15,2) NOT NULL,
    total_qre DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### rd_research_activities
```sql
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
```

### rd_subcomponents
```sql
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
```

### rd_selected_subcomponents
```sql
CREATE TABLE rd_selected_subcomponents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_year_id UUID NOT NULL,
    research_activity_id UUID NOT NULL,
    step_id UUID NOT NULL,
    subcomponent_id UUID NOT NULL,
    frequency_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    year_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    start_month INTEGER NOT NULL DEFAULT 1,
    start_year INTEGER NOT NULL,
    selected_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    non_rd_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    approval_data JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hint TEXT NULL,
    general_description TEXT NULL,
    goal TEXT NULL,
    hypothesis TEXT NULL,
    alternatives TEXT NULL,
    uncertainties TEXT NULL,
    developmental_process TEXT NULL,
    primary_goal TEXT NULL,
    expected_outcome_type TEXT NULL,
    cpt_codes TEXT NULL,
    cdt_codes TEXT NULL,
    alternative_paths TEXT NULL,
    applied_percentage NUMERIC NULL,
    time_percentage NUMERIC NULL,
    user_notes TEXT NULL,
    step_name TEXT NULL,
    practice_percent NUMERIC(5, 2) NULL DEFAULT 0,
    CONSTRAINT rd_selected_subcomponents_pkey PRIMARY KEY (id),
    CONSTRAINT rd_selected_subcomponents_business_year_id_subcomponent_id_key UNIQUE (business_year_id, subcomponent_id),
    CONSTRAINT rd_selected_subcomponents_business_year_id_fkey FOREIGN KEY (business_year_id) REFERENCES rd_business_years (id) ON DELETE CASCADE,
    CONSTRAINT rd_selected_subcomponents_research_activity_id_fkey FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities (id) ON DELETE CASCADE,
    CONSTRAINT rd_selected_subcomponents_step_id_fkey FOREIGN KEY (step_id) REFERENCES rd_research_steps (id) ON DELETE CASCADE,
    CONSTRAINT rd_selected_subcomponents_subcomponent_id_fkey FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents (id) ON DELETE CASCADE
);
```

## Key Relationships

### Research Activities → Subcomponents
- `rd_research_activities.id` → `rd_subcomponents.activity_id`
- Activities have many subcomponents

### Business Years → Selected Subcomponents
- `rd_business_years.id` → `rd_selected_subcomponents.business_year_id`
- Business years have many selected subcomponents

### Selected Subcomponents → Research Activities
- `rd_selected_subcomponents.research_activity_id` → `rd_research_activities.id`
- Selected subcomponents belong to research activities

### Selected Subcomponents → Subcomponents
- `rd_selected_subcomponents.subcomponent_id` → `rd_subcomponents.id`
- Selected subcomponents reference the base subcomponent

## Important Notes

1. **Column Names**: 
   - `rd_research_activities` uses `title` (not `name`)
   - `rd_subcomponents` uses `title` (not `name`)
   - `rd_businesses` uses `name`

2. **Missing Tables**: 
   - `rd_research_steps` table doesn't exist in the original schema
   - `rd_research_subcomponents` table doesn't exist (use `rd_subcomponents` instead)

3. **Step Information**: 
   - Step names are stored in `rd_selected_subcomponents.step_name`
   - No separate steps table exists

4. **Foreign Key References**:
   - `rd_selected_subcomponents.step_id` references a non-existent table
   - This should be handled carefully in queries

## Query Patterns

### For Research Report Modal
```sql
SELECT 
  ssc.*,
  ra.title as activity_title,
  sc.title as subcomponent_title
FROM rd_selected_subcomponents ssc
INNER JOIN rd_research_activities ra ON ra.id = ssc.research_activity_id
INNER JOIN rd_subcomponents sc ON sc.id = ssc.subcomponent_id
WHERE ssc.business_year_id = $1
```

### For Business Profile
```sql
SELECT 
  by.*,
  rb.name,
  rb.entity_type,
  rb.domicile_state,
  rb.start_year,
  rb.contact_info
FROM rd_business_years by
INNER JOIN rd_businesses rb ON rb.id = by.business_id
WHERE by.id = $1
``` 