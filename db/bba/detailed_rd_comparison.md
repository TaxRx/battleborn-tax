# LOCAL DATABASE RD_* TABLES DETAILED STRUCTURE REPORT

**Database:** postgresql://postgres:postgres@localhost:54322/postgres  
**Generated:** $(date)  
**Total Tables:** 43

## EXECUTIVE SUMMARY

The local database contains 43 rd_* tables with the following structure:

| Table Name | Columns | Primary Key | Foreign Keys | Unique Constraints |
|------------|---------|-------------|--------------|-------------------|
| rd_areas | 6 | id | 1 | 1 |
| rd_billable_time_summary | 17 | id | 1 | 0 |
| rd_business_years | 42 | id | 4 | 0 |
| rd_businesses | 18 | id | 2 | 0 |
| rd_client_portal_tokens | 11 | id | 1 | 1 |
| rd_contractor_subcomponents | 16 | id | 3 | 1 |
| rd_contractor_year_data | 12 | id | 2 | 0 |
| rd_contractors | 14 | id | 3 | 0 |
| rd_document_links | 10 | id | 0 | 0 |
| rd_employee_subcomponents | 16 | id | 3 | 1 |
| rd_employee_year_data | 10 | id | 2 | 0 |
| rd_employees | 10 | id | 3 | 0 |
| rd_expenses | 28 | id | 5 | 0 |
| rd_federal_credit | 32 | id | 1 | 0 |
| rd_federal_credit_results | 27 | id | 1 | 1 |
| rd_focuses | 6 | id | 1 | 1 |
| rd_procedure_analysis | 13 | id | 0 | 0 |
| rd_procedure_research_links | 14 | id | 2 | 0 |
| rd_qc_document_controls | 18 | id | 1 | 0 |
| rd_reports | 16 | id | 2 | 0 |
| rd_research_activities | 18 | id | 1 | 1 |
| rd_research_categories | 5 | id | 0 | 2 |
| rd_research_raw | 21 | id | 0 | 0 |
| rd_research_steps | 11 | id | 1 | 0 |
| rd_research_subcomponents | 23 | id | 1 | 0 |
| rd_roles | 11 | id | 3 | 0 |
| rd_selected_activities | 12 | id | 2 | 0 |
| rd_selected_filter | 7 | id | 1 | 1 |
| rd_selected_steps | 9 | id | 3 | 1 |
| rd_selected_subcomponents | 33 | id | 4 | 1 |
| rd_signature_records | 11 | id | 1 | 0 |
| rd_signatures | 9 | id | 0 | 0 |
| rd_state_calculations | 14 | id | 0 | 0 |
| rd_state_calculations_full | 18 | id | 0 | 0 |
| rd_state_credit_configs | 5 | id | 0 | 0 |
| rd_state_proforma_data | 7 | id | 1 | 0 |
| rd_state_proforma_lines | 11 | id | 0 | 0 |
| rd_state_proformas | 7 | id | 1 | 0 |
| rd_subcomponents | 19 | id | 1 | 0 |
| rd_supplies | 7 | id | 1 | 0 |
| rd_supply_subcomponents | 9 | id | 3 | 1 |
| rd_supply_year_data | 10 | id | 2 | 0 |
| rd_support_documents | 15 | id | 1 | 0 |

## KEY RELATIONSHIPS

### Core Entity Hierarchy:
1. **rd_research_categories** (root) → **rd_areas** → **rd_focuses** → **rd_research_activities** → **rd_research_steps** → **rd_research_subcomponents**
2. **rd_businesses** → **rd_business_years** (pivot table for yearly data)
3. **rd_employees**, **rd_contractors**, **rd_supplies** → linked to businesses and business years

### Major Foreign Key Relationships:
- rd_business_years.business_id → rd_businesses.id
- rd_businesses.client_id → clients.id
- rd_areas.category_id → rd_research_categories.id
- rd_focuses.area_id → rd_areas.id
- rd_research_activities.focus_id → rd_focuses.id
- rd_research_steps.research_activity_id → rd_research_activities.id
- rd_research_subcomponents.step_id → rd_research_steps.id

## DETAILED TABLE STRUCTURES

### Table: rd_businesses
```sql
                                Table "public.rd_businesses"
      Column       |           Type           | Collation | Nullable |       Default        
-------------------+--------------------------+-----------+----------+----------------------
 id                | uuid                     |           | not null | gen_random_uuid()
 client_id         | uuid                     |           | not null | 
 name              | text                     |           | not null | 
 ein               | text                     |           |          | 
 entity_type       | entity_type              |           | not null | 'OTHER'::entity_type
 start_year        | integer                  |           | not null | 
 domicile_state    | text                     |           | not null | 
 contact_info      | jsonb                    |           | not null | 
 is_controlled_grp | boolean                  |           |          | false
 created_at        | timestamp with time zone |           |          | now()
 updated_at        | timestamp with time zone |           |          | now()
 historical_data   | jsonb                    |           | not null | '[]'::jsonb
 website           | text                     |           |          | 
 image_path        | text                     |           |          | 
 naics             | character varying(10)    |           |          | 
 category_id       | uuid                     |           |          | 
 github_token      | text                     |           |          | 
 portal_email      | text                     |           |          | 
Indexes:
    "rd_businesses_pkey" PRIMARY KEY, btree (id)
    "idx_rd_businesses_category_id" btree (category_id)
    "idx_rd_businesses_ein" btree (ein) WHERE ein IS NOT NULL
    "idx_rd_businesses_github_token_exists" btree (github_token) WHERE github_token IS NOT NULL
    "idx_rd_businesses_historical_data" gin (historical_data)
Check constraints:
    "check_historical_data_structure" CHECK (validate_historical_data(historical_data))
Foreign-key constraints:
    "rd_businesses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE SET NULL
    "rd_businesses_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_business_years" CONSTRAINT "rd_business_years_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    TABLE "rd_client_portal_tokens" CONSTRAINT "rd_client_portal_tokens_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    TABLE "rd_contractors" CONSTRAINT "rd_contractors_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    TABLE "rd_employees" CONSTRAINT "rd_employees_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    TABLE "rd_reports" CONSTRAINT "rd_reports_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE SET NULL
    TABLE "rd_roles" CONSTRAINT "rd_roles_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    TABLE "rd_supplies" CONSTRAINT "rd_supplies_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE

```

### Table: rd_business_years
```sql
                                     Table "public.rd_business_years"
              Column              |            Type             | Collation | Nullable |      Default      
----------------------------------+-----------------------------+-----------+----------+-------------------
 id                               | uuid                        |           | not null | gen_random_uuid()
 business_id                      | uuid                        |           | not null | 
 year                             | integer                     |           | not null | 
 gross_receipts                   | numeric(15,2)               |           | not null | 
 total_qre                        | numeric(15,2)               |           |          | 0
 created_at                       | timestamp with time zone    |           |          | now()
 updated_at                       | timestamp with time zone    |           |          | now()
 qc_status                        | character varying(50)       |           |          | 'pending'::text
 qc_approved_by                   | uuid                        |           |          | 
 qc_approved_at                   | timestamp without time zone |           |          | 
 qc_notes                         | text                        |           |          | 
 payment_received                 | boolean                     |           |          | false
 payment_received_at              | timestamp without time zone |           |          | 
 payment_amount                   | numeric(15,2)               |           |          | 
 documents_released               | boolean                     |           |          | false
 documents_released_at            | timestamp without time zone |           |          | 
 documents_released_by            | uuid                        |           |          | 
 employee_qre                     | numeric(15,2)               |           |          | 0
 contractor_qre                   | numeric(15,2)               |           |          | 0
 supply_qre                       | numeric(15,2)               |           |          | 0
 qre_locked                       | boolean                     |           |          | false
 federal_credit                   | numeric(15,2)               |           |          | 0
 state_credit                     | numeric(15,2)               |           |          | 0
 credits_locked                   | boolean                     |           |          | false
 credits_calculated_at            | timestamp with time zone    |           |          | 
 credits_locked_by                | uuid                        |           |          | 
 credits_locked_at                | timestamp with time zone    |           |          | 
 business_setup_completed         | boolean                     |           |          | false
 business_setup_completed_at      | timestamp with time zone    |           |          | 
 business_setup_completed_by      | uuid                        |           |          | 
 research_activities_completed    | boolean                     |           |          | false
 research_activities_completed_at | timestamp with time zone    |           |          | 
 research_activities_completed_by | uuid                        |           |          | 
 research_design_completed        | boolean                     |           |          | false
 research_design_completed_at     | timestamp with time zone    |           |          | 
 research_design_completed_by     | uuid                        |           |          | 
 calculations_completed           | boolean                     |           |          | false
 calculations_completed_at        | timestamp with time zone    |           |          | 
 calculations_completed_by        | uuid                        |           |          | 
 overall_completion_percentage    | integer                     |           |          | 0
 last_step_completed              | text                        |           |          | 
 completion_updated_at            | timestamp with time zone    |           |          | now()
Indexes:
    "rd_business_years_pkey" PRIMARY KEY, btree (id)
    "idx_rd_business_years_business_setup_completed" btree (business_setup_completed) WHERE business_setup_completed = true
    "idx_rd_business_years_business_year" btree (business_id, year)
    "idx_rd_business_years_calculations_completed" btree (calculations_completed) WHERE calculations_completed = true
    "idx_rd_business_years_completion_percentage" btree (overall_completion_percentage)
    "idx_rd_business_years_credits_locked" btree (credits_locked) WHERE credits_locked = true
    "idx_rd_business_years_research_activities_completed" btree (research_activities_completed) WHERE research_activities_completed = true
    "idx_rd_business_years_research_design_completed" btree (research_design_completed) WHERE research_design_completed = true
Foreign-key constraints:
    "rd_business_years_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    "rd_business_years_credits_locked_by_fkey" FOREIGN KEY (credits_locked_by) REFERENCES profiles(id) ON DELETE SET NULL
    "rd_business_years_documents_released_by_fkey" FOREIGN KEY (documents_released_by) REFERENCES profiles(id) ON DELETE SET NULL
    "rd_business_years_qc_approved_by_fkey" FOREIGN KEY (qc_approved_by) REFERENCES profiles(id) ON DELETE SET NULL
Referenced by:
    TABLE "rd_billable_time_summary" CONSTRAINT "rd_billable_time_summary_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_contractor_subcomponents" CONSTRAINT "rd_contractor_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_contractor_year_data" CONSTRAINT "rd_contractor_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_employee_subcomponents" CONSTRAINT "rd_employee_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_employee_year_data" CONSTRAINT "rd_employee_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_expenses" CONSTRAINT "rd_expenses_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_federal_credit" CONSTRAINT "rd_federal_credit_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_federal_credit_results" CONSTRAINT "rd_federal_credit_results_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_qc_document_controls" CONSTRAINT "rd_qc_document_controls_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_reports" CONSTRAINT "rd_reports_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE SET NULL
    TABLE "rd_roles" CONSTRAINT "rd_roles_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_selected_activities" CONSTRAINT "rd_selected_activities_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_selected_filter" CONSTRAINT "rd_selected_filter_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_selected_steps" CONSTRAINT "rd_selected_steps_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_selected_subcomponents" CONSTRAINT "rd_selected_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_signature_records" CONSTRAINT "rd_signature_records_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_state_proforma_data" CONSTRAINT "rd_state_proforma_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_state_proformas" CONSTRAINT "rd_state_proformas_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_supply_subcomponents" CONSTRAINT "rd_supply_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_supply_year_data" CONSTRAINT "rd_supply_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    TABLE "rd_support_documents" CONSTRAINT "rd_support_documents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Triggers:
    trigger_update_total_qre BEFORE INSERT OR UPDATE OF employee_qre, contractor_qre, supply_qre ON rd_business_years FOR EACH ROW EXECUTE FUNCTION update_total_qre()
    update_rd_business_years_credits_calculated_at BEFORE UPDATE OF federal_credit, state_credit ON rd_business_years FOR EACH ROW EXECUTE FUNCTION update_credits_calculated_at()

```

### Table: rd_research_categories
```sql
                       Table "public.rd_research_categories"
   Column    |           Type           | Collation | Nullable |      Default      
-------------+--------------------------+-----------+----------+-------------------
 id          | uuid                     |           | not null | gen_random_uuid()
 name        | text                     |           | not null | 
 created_at  | timestamp with time zone |           |          | now()
 updated_at  | timestamp with time zone |           |          | now()
 description | text                     |           |          | 
Indexes:
    "rd_research_categories_pkey" PRIMARY KEY, btree (id)
    "rd_research_categories_name_key" UNIQUE CONSTRAINT, btree (name)
    "unique_category_name" UNIQUE CONSTRAINT, btree (name)
Referenced by:
    TABLE "rd_areas" CONSTRAINT "rd_areas_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE CASCADE
    TABLE "rd_businesses" CONSTRAINT "rd_businesses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE SET NULL

```

### Table: rd_areas
```sql
                              Table "public.rd_areas"
   Column    |           Type           | Collation | Nullable |      Default      
-------------+--------------------------+-----------+----------+-------------------
 id          | uuid                     |           | not null | gen_random_uuid()
 name        | text                     |           | not null | 
 category_id | uuid                     |           | not null | 
 created_at  | timestamp with time zone |           |          | now()
 updated_at  | timestamp with time zone |           |          | now()
 description | text                     |           |          | 
Indexes:
    "rd_areas_pkey" PRIMARY KEY, btree (id)
    "unique_area_name_per_category" UNIQUE CONSTRAINT, btree (name, category_id)
Foreign-key constraints:
    "rd_areas_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_focuses" CONSTRAINT "rd_focuses_area_id_fkey" FOREIGN KEY (area_id) REFERENCES rd_areas(id) ON DELETE CASCADE

```

### Table: rd_focuses
```sql
                             Table "public.rd_focuses"
   Column    |           Type           | Collation | Nullable |      Default      
-------------+--------------------------+-----------+----------+-------------------
 id          | uuid                     |           | not null | gen_random_uuid()
 name        | text                     |           | not null | 
 area_id     | uuid                     |           | not null | 
 created_at  | timestamp with time zone |           |          | now()
 updated_at  | timestamp with time zone |           |          | now()
 description | text                     |           |          | 
Indexes:
    "rd_focuses_pkey" PRIMARY KEY, btree (id)
    "unique_focus_name_per_area" UNIQUE CONSTRAINT, btree (name, area_id)
Foreign-key constraints:
    "rd_focuses_area_id_fkey" FOREIGN KEY (area_id) REFERENCES rd_areas(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_research_activities" CONSTRAINT "rd_research_activities_focus_id_fkey" FOREIGN KEY (focus_id) REFERENCES rd_focuses(id) ON DELETE CASCADE

```

### Table: rd_research_activities
```sql
                            Table "public.rd_research_activities"
       Column        |            Type             | Collation | Nullable |      Default      
---------------------+-----------------------------+-----------+----------+-------------------
 id                  | uuid                        |           | not null | gen_random_uuid()
 title               | text                        |           | not null | 
 focus_id            | uuid                        |           | not null | 
 is_active           | boolean                     |           |          | true
 default_roles       | jsonb                       |           | not null | 
 default_steps       | jsonb                       |           | not null | 
 created_at          | timestamp with time zone    |           |          | now()
 updated_at          | timestamp with time zone    |           |          | now()
 focus               | text                        |           |          | 
 category            | text                        |           |          | 
 area                | text                        |           |          | 
 research_activity   | text                        |           |          | 
 subcomponent        | text                        |           |          | 
 phase               | text                        |           |          | 
 step                | text                        |           |          | 
 business_id         | uuid                        |           |          | 
 deactivated_at      | timestamp without time zone |           |          | 
 deactivation_reason | text                        |           |          | 
Indexes:
    "rd_research_activities_pkey" PRIMARY KEY, btree (id)
    "idx_rd_research_activities_business_id" btree (business_id)
    "idx_rd_research_activities_global" btree (id) WHERE business_id IS NULL
    "unique_activity_per_focus" UNIQUE CONSTRAINT, btree (title, focus_id)
Foreign-key constraints:
    "rd_research_activities_focus_id_fkey" FOREIGN KEY (focus_id) REFERENCES rd_focuses(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_expenses" CONSTRAINT "rd_expenses_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    TABLE "rd_procedure_research_links" CONSTRAINT "rd_procedure_research_links_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    TABLE "rd_research_steps" CONSTRAINT "rd_research_steps_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    TABLE "rd_selected_activities" CONSTRAINT "rd_selected_activities_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    TABLE "rd_selected_steps" CONSTRAINT "rd_selected_steps_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    TABLE "rd_selected_subcomponents" CONSTRAINT "rd_selected_subcomponents_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    TABLE "rd_subcomponents" CONSTRAINT "rd_subcomponents_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE

```

### Table: rd_employees
```sql
                            Table "public.rd_employees"
   Column    |           Type           | Collation | Nullable |      Default      
-------------+--------------------------+-----------+----------+-------------------
 id          | uuid                     |           | not null | gen_random_uuid()
 business_id | uuid                     |           | not null | 
 first_name  | text                     |           | not null | 
 role_id     | uuid                     |           |          | 
 is_owner    | boolean                  |           |          | false
 annual_wage | numeric(15,2)            |           | not null | 
 created_at  | timestamp with time zone |           |          | now()
 updated_at  | timestamp with time zone |           |          | now()
 last_name   | text                     |           |          | 
 user_id     | uuid                     |           |          | 
Indexes:
    "rd_employees_pkey" PRIMARY KEY, btree (id)
    "idx_rd_employees_user_id" btree (user_id)
Foreign-key constraints:
    "rd_employees_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    "rd_employees_role_id_fkey" FOREIGN KEY (role_id) REFERENCES rd_roles(id) ON DELETE CASCADE
    "rd_employees_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id)
Referenced by:
    TABLE "rd_employee_subcomponents" CONSTRAINT "rd_employee_subcomponents_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE
    TABLE "rd_employee_year_data" CONSTRAINT "rd_employee_year_data_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE
    TABLE "rd_expenses" CONSTRAINT "rd_expenses_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE

```

### Table: rd_contractors
```sql
                            Table "public.rd_contractors"
     Column     |           Type           | Collation | Nullable |      Default      
----------------+--------------------------+-----------+----------+-------------------
 id             | uuid                     |           | not null | gen_random_uuid()
 business_id    | uuid                     |           | not null | 
 name           | text                     |           | not null | 
 role           | text                     |           |          | 
 annual_cost    | numeric(10,2)            |           | not null | 
 created_at     | timestamp with time zone |           |          | now()
 updated_at     | timestamp with time zone |           |          | now()
 user_id        | uuid                     |           |          | 
 first_name     | text                     |           |          | 
 last_name      | text                     |           |          | 
 role_id        | uuid                     |           |          | 
 is_owner       | boolean                  |           |          | false
 amount         | numeric(15,2)            |           |          | 
 calculated_qre | numeric(15,2)            |           |          | 
Indexes:
    "rd_contractors_pkey" PRIMARY KEY, btree (id)
    "idx_rd_contractors_business_id" btree (business_id)
    "idx_rd_contractors_role_id" btree (role_id)
    "idx_rd_contractors_user_id" btree (user_id)
Foreign-key constraints:
    "rd_contractors_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    "rd_contractors_role_id_fkey" FOREIGN KEY (role_id) REFERENCES rd_roles(id) ON DELETE SET NULL
    "rd_contractors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id)
Referenced by:
    TABLE "rd_contractor_subcomponents" CONSTRAINT "rd_contractor_subcomponents_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES rd_contractors(id) ON DELETE CASCADE
    TABLE "rd_contractor_year_data" CONSTRAINT "rd_contractor_year_data_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES rd_contractors(id)
Policies:
    POLICY "Enable delete access for authenticated users" FOR DELETE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable insert access for authenticated users" FOR INSERT
      WITH CHECK ((auth.role() = 'authenticated'::text))
    POLICY "Enable read access for authenticated users" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable update access for authenticated users" FOR UPDATE
      USING ((auth.role() = 'authenticated'::text))

```

### Table: rd_supplies
```sql
                            Table "public.rd_supplies"
   Column    |           Type           | Collation | Nullable |      Default      
-------------+--------------------------+-----------+----------+-------------------
 id          | uuid                     |           | not null | gen_random_uuid()
 business_id | uuid                     |           | not null | 
 name        | text                     |           | not null | 
 description | text                     |           |          | 
 annual_cost | numeric(10,2)            |           | not null | 
 created_at  | timestamp with time zone |           |          | now()
 updated_at  | timestamp with time zone |           |          | now()
Indexes:
    "rd_supplies_pkey" PRIMARY KEY, btree (id)
    "idx_rd_supplies_business_id" btree (business_id)
Foreign-key constraints:
    "rd_supplies_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_supply_subcomponents" CONSTRAINT "rd_supply_subcomponents_supply_id_fkey" FOREIGN KEY (supply_id) REFERENCES rd_supplies(id) ON DELETE CASCADE
    TABLE "rd_supply_year_data" CONSTRAINT "rd_supply_year_data_supply_id_fkey" FOREIGN KEY (supply_id) REFERENCES rd_supplies(id) ON DELETE CASCADE
Policies:
    POLICY "Enable delete access for authenticated users" FOR DELETE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable insert access for authenticated users" FOR INSERT
      WITH CHECK ((auth.role() = 'authenticated'::text))
    POLICY "Enable read access for authenticated users" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable update access for authenticated users" FOR UPDATE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Users can delete their own supplies" FOR DELETE
      USING ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))))
    POLICY "Users can insert their own supplies" FOR INSERT
      WITH CHECK ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))))
    POLICY "Users can update their own supplies" FOR UPDATE
      USING ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))))
    POLICY "Users can view their own supplies" FOR SELECT
      USING ((EXISTS ( SELECT 1
   FROM businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))))
Triggers:
    set_updated_at_rd_supplies BEFORE UPDATE ON rd_supplies FOR EACH ROW EXECUTE FUNCTION set_updated_at()

```


## ADDITIONAL KEY TABLES SUMMARY

### rd_research_steps
- 11 columns including research_activity_id FK
- Links research activities to their constituent steps

### rd_research_subcomponents  
- 23 columns including step_id FK
- Contains detailed subcomponent definitions for each step

### rd_selected_* tables
- rd_selected_activities: Tracks which activities are selected for business years
- rd_selected_steps: Tracks which steps are selected 
- rd_selected_subcomponents: Tracks which subcomponents are selected (33 columns)
- rd_selected_filter: Business year filter settings

### Financial Calculation Tables
- rd_federal_credit: 32 columns for federal credit calculations
- rd_federal_credit_results: 27 columns for federal credit results
- rd_state_* tables: Various state-level calculations and proformas

### Supporting Tables
- rd_expenses: 28 columns for expense tracking
- rd_support_documents: Document management
- rd_signatures: Digital signature support
- rd_qc_document_controls: Quality control workflow

## CRITICAL DIFFERENCES TO NOTE FOR COMPARISON

1. **Column Count Variations**: Some tables have significantly different column counts
2. **Foreign Key Relationships**: Complex web of relationships centered around business_years
3. **Index Strategy**: Extensive indexing for performance, including partial indexes
4. **Row Level Security**: Many tables have RLS policies enabled
5. **Triggers**: Several tables have automated triggers for timestamps and calculations
6. **Check Constraints**: Business logic enforced at database level
7. **JSONB Usage**: Several tables use JSONB for flexible data storage

## SCHEMA COMPLEXITY METRICS

- **Total Tables**: 43 base tables (plus views)
- **Total Columns**: ~600+ across all tables
- **Foreign Key Relationships**: ~60+ FK constraints
- **Unique Constraints**: ~15+ unique constraints
- **Indexes**: ~100+ indexes including partial and functional indexes
- **RLS Policies**: ~20+ tables with row-level security
- **Triggers**: ~10+ automated triggers
- **Check Constraints**: ~15+ business rule constraints

This local database represents a mature, production-ready R&D credit calculation system with comprehensive audit trails, workflow management, and data integrity controls.

EOF < /dev/null