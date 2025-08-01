# LOCAL DATABASE RD_* TABLES STRUCTURE REPORT
# Generated on Thu Jul 31 10:49:20 MDT 2025

## Table: rd_activity_hierarchy

### Detailed Structure
```
                          View "public.rd_activity_hierarchy"
        Column         | Type | Collation | Nullable | Default | Storage  | Description 
-----------------------+------+-----------+----------+---------+----------+-------------
 category              | text |           |          |         | extended | 
 area                  | text |           |          |         | extended | 
 focus                 | text |           |          |         | extended | 
 activity_title        | text |           |          |         | extended | 
 subcomponent_title    | text |           |          |         | extended | 
 phase                 | text |           |          |         | extended | 
 step                  | text |           |          |         | extended | 
 hint                  | text |           |          |         | extended | 
 general_description   | text |           |          |         | extended | 
 goal                  | text |           |          |         | extended | 
 hypothesis            | text |           |          |         | extended | 
 alternatives          | text |           |          |         | extended | 
 uncertainties         | text |           |          |         | extended | 
 developmental_process | text |           |          |         | extended | 
 primary_goal          | text |           |          |         | extended | 
 expected_outcome_type | text |           |          |         | extended | 
 cpt_codes             | text |           |          |         | extended | 
 cdt_codes             | text |           |          |         | extended | 
 alternative_paths     | text |           |          |         | extended | 
View definition:
 SELECT cat.name AS category,
    area.name AS area,
    focus.name AS focus,
    act.title AS activity_title,
    sub.title AS subcomponent_title,
    sub.phase,
    sub.step,
    sub.hint,
    sub.general_description,
    sub.goal,
    sub.hypothesis,
    sub.alternatives,
    sub.uncertainties,
    sub.developmental_process,
    sub.primary_goal,
    sub.expected_outcome_type,
    sub.cpt_codes,
    sub.cdt_codes,
    sub.alternative_paths
   FROM rd_research_categories cat
     JOIN rd_areas area ON area.category_id = cat.id
     JOIN rd_focuses focus ON focus.area_id = area.id
     JOIN rd_research_activities act ON act.focus_id = focus.id
     JOIN rd_subcomponents sub ON sub.activity_id = act.id
  ORDER BY cat.name, area.name, focus.name, act.title, sub.step;

```

## Table: rd_areas

### Detailed Structure
```
                                                                        Table "public.rd_areas"
   Column    |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target |                Description                 
-------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+--------------------------------------------
 id          | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 name        | text                     |           | not null |                   | extended |             |              | 
 category_id | uuid                     |           | not null |                   | plain    |             |              | 
 created_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 description | text                     |           |          |                   | extended |             |              | Optional description for the research area
Indexes:
    "rd_areas_pkey" PRIMARY KEY, btree (id)
    "unique_area_name_per_category" UNIQUE CONSTRAINT, btree (name, category_id)
Foreign-key constraints:
    "rd_areas_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_focuses" CONSTRAINT "rd_focuses_area_id_fkey" FOREIGN KEY (area_id) REFERENCES rd_areas(id) ON DELETE CASCADE
Access method: heap

```

## Table: rd_billable_time_summary

### Detailed Structure
```
                                                            Table "public.rd_billable_time_summary"
             Column             |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
--------------------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                             | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id               | uuid                        |           | not null |                   | plain    |             |              | 
 created_at                     | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at                     | timestamp without time zone |           |          | now()             | plain    |             |              | 
 research_activity_id           | text                        |           |          |                   | extended |             |              | 
 total_billed_units             | text                        |           |          |                   | extended |             |              | 
 percentage_variance            | text                        |           |          |                   | extended |             |              | 
 recommended_percentage         | text                        |           |          |                   | extended |             |              | 
 last_calculated                | text                        |           |          |                   | extended |             |              | 
 notes                          | text                        |           |          |                   | extended |             |              | 
 current_practice_percentage    | text                        |           |          |                   | extended |             |              | 
 calculated_billable_percentage | text                        |           |          |                   | extended |             |              | 
 calculation_source             | text                        |           |          |                   | extended |             |              | 
 subcomponent_id                | text                        |           |          |                   | extended |             |              | 
 total_billed_amount            | text                        |           |          |                   | extended |             |              | 
 total_procedures_count         | text                        |           |          |                   | extended |             |              | 
 estimated_total_time_hours     | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_billable_time_summary_pkey" PRIMARY KEY, btree (id)
    "idx_billable_summary_activity" btree (research_activity_id)
    "idx_billable_summary_business_year" btree (business_year_id)
    "idx_rd_billable_time_summary_business_year" btree (business_year_id)
Foreign-key constraints:
    "rd_billable_time_summary_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies:
    POLICY "Admin and client users can access R&D data"
      USING ((user_is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM (rd_business_years rby
     JOIN rd_businesses rb ON ((rby.business_id = rb.id)))
  WHERE ((rby.id = rd_billable_time_summary.business_year_id) AND user_has_client_access(auth.uid(), rb.client_id))))))
Access method: heap

```

## Table: rd_business_years

### Detailed Structure
```
                                                                                     Table "public.rd_business_years"
              Column              |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target |                     Description                      
----------------------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+------------------------------------------------------
 id                               | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 business_id                      | uuid                        |           | not null |                   | plain    |             |              | 
 year                             | integer                     |           | not null |                   | plain    |             |              | 
 gross_receipts                   | numeric(15,2)               |           | not null |                   | main     |             |              | 
 total_qre                        | numeric(15,2)               |           |          | 0                 | main     |             |              | 
 created_at                       | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 updated_at                       | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 qc_status                        | character varying(50)       |           |          | 'pending'::text   | extended |             |              | Quality control status (pending, approved, rejected)
 qc_approved_by                   | uuid                        |           |          |                   | plain    |             |              | User who approved the QC process
 qc_approved_at                   | timestamp without time zone |           |          |                   | plain    |             |              | Timestamp of QC approval
 qc_notes                         | text                        |           |          |                   | extended |             |              | Quality control review notes
 payment_received                 | boolean                     |           |          | false             | plain    |             |              | Whether payment has been received
 payment_received_at              | timestamp without time zone |           |          |                   | plain    |             |              | Timestamp of payment receipt
 payment_amount                   | numeric(15,2)               |           |          |                   | main     |             |              | Amount of payment received
 documents_released               | boolean                     |           |          | false             | plain    |             |              | Whether documents have been released to client
 documents_released_at            | timestamp without time zone |           |          |                   | plain    |             |              | Timestamp of document release
 documents_released_by            | uuid                        |           |          |                   | plain    |             |              | User who released the documents
 employee_qre                     | numeric(15,2)               |           |          | 0                 | main     |             |              | Qualified Research Expenses for employees
 contractor_qre                   | numeric(15,2)               |           |          | 0                 | main     |             |              | Qualified Research Expenses for contractors
 supply_qre                       | numeric(15,2)               |           |          | 0                 | main     |             |              | Qualified Research Expenses for supplies
 qre_locked                       | boolean                     |           |          | false             | plain    |             |              | Whether QRE calculations are locked
 federal_credit                   | numeric(15,2)               |           |          | 0                 | main     |             |              | Calculated federal R&D credit amount
 state_credit                     | numeric(15,2)               |           |          | 0                 | main     |             |              | Calculated state R&D credit amount
 credits_locked                   | boolean                     |           |          | false             | plain    |             |              | Whether credit calculations are locked
 credits_calculated_at            | timestamp with time zone    |           |          |                   | plain    |             |              | Timestamp of credit calculation
 credits_locked_by                | uuid                        |           |          |                   | plain    |             |              | User who locked the credit calculations
 credits_locked_at                | timestamp with time zone    |           |          |                   | plain    |             |              | Timestamp of credit lock
 business_setup_completed         | boolean                     |           |          | false             | plain    |             |              | 
 business_setup_completed_at      | timestamp with time zone    |           |          |                   | plain    |             |              | 
 business_setup_completed_by      | uuid                        |           |          |                   | plain    |             |              | 
 research_activities_completed    | boolean                     |           |          | false             | plain    |             |              | 
 research_activities_completed_at | timestamp with time zone    |           |          |                   | plain    |             |              | 
 research_activities_completed_by | uuid                        |           |          |                   | plain    |             |              | 
 research_design_completed        | boolean                     |           |          | false             | plain    |             |              | 
 research_design_completed_at     | timestamp with time zone    |           |          |                   | plain    |             |              | 
 research_design_completed_by     | uuid                        |           |          |                   | plain    |             |              | 
 calculations_completed           | boolean                     |           |          | false             | plain    |             |              | 
 calculations_completed_at        | timestamp with time zone    |           |          |                   | plain    |             |              | 
 calculations_completed_by        | uuid                        |           |          |                   | plain    |             |              | 
 overall_completion_percentage    | integer                     |           |          | 0                 | plain    |             |              | 
 last_step_completed              | text                        |           |          |                   | extended |             |              | 
 completion_updated_at            | timestamp with time zone    |           |          | now()             | plain    |             |              | 
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
Access method: heap

```

## Table: rd_businesses

### Detailed Structure
```
                                                                          Table "public.rd_businesses"
      Column       |           Type           | Collation | Nullable |       Default        | Storage  | Compression | Stats target |                Description                
-------------------+--------------------------+-----------+----------+----------------------+----------+-------------+--------------+-------------------------------------------
 id                | uuid                     |           | not null | gen_random_uuid()    | plain    |             |              | 
 client_id         | uuid                     |           | not null |                      | plain    |             |              | 
 name              | text                     |           | not null |                      | extended |             |              | 
 ein               | text                     |           |          |                      | extended |             |              | 
 entity_type       | entity_type              |           | not null | 'OTHER'::entity_type | plain    |             |              | 
 start_year        | integer                  |           | not null |                      | plain    |             |              | 
 domicile_state    | text                     |           | not null |                      | extended |             |              | 
 contact_info      | jsonb                    |           | not null |                      | extended |             |              | 
 is_controlled_grp | boolean                  |           |          | false                | plain    |             |              | 
 created_at        | timestamp with time zone |           |          | now()                | plain    |             |              | 
 updated_at        | timestamp with time zone |           |          | now()                | plain    |             |              | 
 historical_data   | jsonb                    |           | not null | '[]'::jsonb          | extended |             |              | 
 website           | text                     |           |          |                      | extended |             |              | Business website URL
 image_path        | text                     |           |          |                      | extended |             |              | Path to business logo/image
 naics             | character varying(10)    |           |          |                      | extended |             |              | NAICS industry classification code
 category_id       | uuid                     |           |          |                      | plain    |             |              | Reference to research category (optional)
 github_token      | text                     |           |          |                      | extended |             |              | GitHub integration token (optional)
 portal_email      | text                     |           |          |                      | extended |             |              | Client portal email address (optional)
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
Access method: heap

```

## Table: rd_client_portal_tokens

### Detailed Structure
```
                                                                  Table "public.rd_client_portal_tokens"
      Column      |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target |              Description              
------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+---------------------------------------
 id               | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 business_id      | uuid                        |           |          |                   | plain    |             |              | 
 token            | character varying(255)      |           |          |                   | extended |             |              | 
 expires_at       | timestamp without time zone |           |          |                   | plain    |             |              | 
 is_active        | boolean                     |           |          | true              | plain    |             |              | 
 created_at       | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at       | timestamp without time zone |           |          | now()             | plain    |             |              | 
 created_by       | uuid                        |           |          |                   | plain    |             |              | User who created the token (optional)
 access_count     | integer                     |           |          | 0                 | plain    |             |              | Number of times token has been used
 last_accessed_at | timestamp without time zone |           |          |                   | plain    |             |              | Timestamp of last token usage
 last_accessed_ip | inet                        |           |          |                   | main     |             |              | IP address of last token usage
Indexes:
    "rd_client_portal_tokens_pkey" PRIMARY KEY, btree (id)
    "idx_rd_client_portal_tokens_active" btree (business_id, is_active, expires_at) WHERE is_active = true
    "idx_rd_client_portal_tokens_business" btree (business_id)
    "idx_rd_client_portal_tokens_business_active" btree (business_id, is_active)
    "idx_rd_client_portal_tokens_business_id" btree (business_id)
    "idx_rd_client_portal_tokens_token" btree (token)
    "rd_client_portal_tokens_token_key" UNIQUE CONSTRAINT, btree (token)
Foreign-key constraints:
    "rd_client_portal_tokens_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
Policies:
    POLICY "Admin can manage portal tokens"
      USING (user_is_admin(auth.uid()))
Access method: heap

```

## Table: rd_contractor_subcomponents

### Detailed Structure
```
                                                       Table "public.rd_contractor_subcomponents"
            Column            |           Type           | Collation | Nullable |      Default      | Storage | Compression | Stats target | Description 
------------------------------+--------------------------+-----------+----------+-------------------+---------+-------------+--------------+-------------
 id                           | uuid                     |           | not null | gen_random_uuid() | plain   |             |              | 
 contractor_id                | uuid                     |           | not null |                   | plain   |             |              | 
 subcomponent_id              | uuid                     |           | not null |                   | plain   |             |              | 
 business_year_id             | uuid                     |           | not null |                   | plain   |             |              | 
 time_percentage              | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 applied_percentage           | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 is_included                  | boolean                  |           | not null | true              | plain   |             |              | 
 baseline_applied_percent     | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 practice_percentage          | numeric(5,2)             |           |          |                   | main    |             |              | 
 year_percentage              | numeric(5,2)             |           |          |                   | main    |             |              | 
 frequency_percentage         | numeric(5,2)             |           |          |                   | main    |             |              | 
 created_at                   | timestamp with time zone |           |          | now()             | plain   |             |              | 
 updated_at                   | timestamp with time zone |           |          | now()             | plain   |             |              | 
 user_id                      | uuid                     |           |          |                   | plain   |             |              | 
 baseline_practice_percentage | numeric                  |           |          |                   | main    |             |              | 
 baseline_time_percentage     | numeric                  |           |          |                   | main    |             |              | 
Indexes:
    "rd_contractor_subcomponents_pkey" PRIMARY KEY, btree (id)
    "idx_rd_contractor_subcomponents_business_year_id" btree (business_year_id)
    "idx_rd_contractor_subcomponents_contractor_id" btree (contractor_id)
    "idx_rd_contractor_subcomponents_subcomponent_id" btree (subcomponent_id)
    "idx_rd_contractor_subcomponents_user_id" btree (user_id)
    "rd_contractor_subcomponents_unique" UNIQUE CONSTRAINT, btree (contractor_id, subcomponent_id, business_year_id)
Foreign-key constraints:
    "rd_contractor_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_contractor_subcomponents_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES rd_contractors(id) ON DELETE CASCADE
    "rd_contractor_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
Policies (row security disabled):
    POLICY "Enable delete access for authenticated users" FOR DELETE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable insert access for authenticated users" FOR INSERT
      WITH CHECK ((auth.role() = 'authenticated'::text))
    POLICY "Enable read access for authenticated users" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable update access for authenticated users" FOR UPDATE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Users can delete their own contractor subcomponents" FOR DELETE
      USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))))
    POLICY "Users can insert their own contractor subcomponents" FOR INSERT
      WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))))
    POLICY "Users can update their own contractor subcomponents" FOR UPDATE
      USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))))
    POLICY "Users can view their own contractor subcomponents" FOR SELECT
      USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))))
Triggers:
    handle_rd_contractor_subcomponents_updated_at BEFORE UPDATE ON rd_contractor_subcomponents FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
Access method: heap

```

## Table: rd_contractor_year_data

### Detailed Structure
```
                                                    Table "public.rd_contractor_year_data"
      Column      |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id               | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id | uuid                     |           | not null |                   | plain    |             |              | 
 name             | text                     |           | not null |                   | extended |             |              | 
 cost_amount      | numeric(15,2)            |           | not null |                   | main     |             |              | 
 applied_percent  | numeric(5,2)             |           | not null |                   | main     |             |              | 
 activity_link    | jsonb                    |           | not null |                   | extended |             |              | 
 created_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 contractor_id    | uuid                     |           |          |                   | plain    |             |              | 
 user_id          | uuid                     |           |          |                   | plain    |             |              | 
 activity_roles   | jsonb                    |           |          |                   | extended |             |              | 
 calculated_qre   | numeric                  |           |          |                   | main     |             |              | 
Indexes:
    "rd_contractor_year_data_pkey" PRIMARY KEY, btree (id)
    "idx_rd_contractor_year_data_business_year_id" btree (business_year_id)
    "idx_rd_contractor_year_data_contractor_id" btree (contractor_id)
    "idx_rd_contractor_year_data_user_id" btree (user_id)
Foreign-key constraints:
    "rd_contractor_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_contractor_year_data_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES rd_contractors(id)
Policies:
    POLICY "Allow all for dev"
      USING (true)
      WITH CHECK (true)
    POLICY "Users can delete their own contractor year data" FOR DELETE
      USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))))
    POLICY "Users can insert their own contractor year data" FOR INSERT
      WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))))
    POLICY "Users can update their own contractor year data" FOR UPDATE
      USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))))
    POLICY "Users can view their own contractor year data" FOR SELECT
      USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))))
Triggers:
    handle_rd_contractor_year_data_updated_at BEFORE UPDATE ON rd_contractor_year_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
Access method: heap

```

## Table: rd_contractors

### Detailed Structure
```
                                                       Table "public.rd_contractors"
     Column     |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
----------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id             | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_id    | uuid                     |           | not null |                   | plain    |             |              | 
 name           | text                     |           | not null |                   | extended |             |              | 
 role           | text                     |           |          |                   | extended |             |              | 
 annual_cost    | numeric(10,2)            |           | not null |                   | main     |             |              | 
 created_at     | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at     | timestamp with time zone |           |          | now()             | plain    |             |              | 
 user_id        | uuid                     |           |          |                   | plain    |             |              | 
 first_name     | text                     |           |          |                   | extended |             |              | 
 last_name      | text                     |           |          |                   | extended |             |              | 
 role_id        | uuid                     |           |          |                   | plain    |             |              | 
 is_owner       | boolean                  |           |          | false             | plain    |             |              | 
 amount         | numeric(15,2)            |           |          |                   | main     |             |              | 
 calculated_qre | numeric(15,2)            |           |          |                   | main     |             |              | 
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
Access method: heap

```

## Table: rd_document_links

### Detailed Structure
```
                                                           Table "public.rd_document_links"
        Column         |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-----------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                    | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 created_at            | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at            | timestamp without time zone |           |          | now()             | plain    |             |              | 
 allocation_percentage | text                        |           |          |                   | extended |             |              | 
 contractor_id         | text                        |           |          |                   | extended |             |              | 
 link_type             | text                        |           |          |                   | extended |             |              | 
 notes                 | text                        |           |          |                   | extended |             |              | 
 document_id           | text                        |           |          |                   | extended |             |              | 
 amount_allocated      | text                        |           |          |                   | extended |             |              | 
 supply_id             | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_document_links_pkey" PRIMARY KEY, btree (id)
    "idx_document_links_contractor" btree (contractor_id)
    "idx_document_links_doc" btree (document_id)
    "idx_document_links_supply" btree (supply_id)
Check constraints:
    "rd_document_links_link_type_check" CHECK (link_type = ANY (ARRAY['supply'::text, 'contractor'::text]))
    "valid_link" CHECK (link_type = 'supply'::text AND supply_id IS NOT NULL AND contractor_id IS NULL OR link_type = 'contractor'::text AND contractor_id IS NOT NULL AND supply_id IS NULL)
Policies (row security enabled): (none)
Access method: heap

```

## Table: rd_employee_subcomponents

### Detailed Structure
```
                                                        Table "public.rd_employee_subcomponents"
            Column            |           Type           | Collation | Nullable |      Default      | Storage | Compression | Stats target | Description 
------------------------------+--------------------------+-----------+----------+-------------------+---------+-------------+--------------+-------------
 id                           | uuid                     |           | not null | gen_random_uuid() | plain   |             |              | 
 employee_id                  | uuid                     |           | not null |                   | plain   |             |              | 
 subcomponent_id              | uuid                     |           | not null |                   | plain   |             |              | 
 business_year_id             | uuid                     |           | not null |                   | plain   |             |              | 
 time_percentage              | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 applied_percentage           | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 is_included                  | boolean                  |           | not null | true              | plain   |             |              | 
 baseline_applied_percent     | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 created_at                   | timestamp with time zone |           |          | now()             | plain   |             |              | 
 updated_at                   | timestamp with time zone |           |          | now()             | plain   |             |              | 
 practice_percentage          | numeric                  |           |          |                   | main    |             |              | 
 year_percentage              | numeric                  |           |          |                   | main    |             |              | 
 frequency_percentage         | numeric                  |           |          |                   | main    |             |              | 
 baseline_practice_percentage | numeric                  |           |          |                   | main    |             |              | 
 baseline_time_percentage     | numeric                  |           |          |                   | main    |             |              | 
 user_id                      | uuid                     |           |          |                   | plain   |             |              | 
Indexes:
    "rd_employee_subcomponents_pkey" PRIMARY KEY, btree (id)
    "idx_rd_employee_subcomponents_employee_id" btree (employee_id)
    "idx_rd_employee_subcomponents_subcomponent_id" btree (subcomponent_id)
    "idx_rd_employee_subcomponents_user_id" btree (user_id)
    "rd_employee_subcomponents_unique" UNIQUE CONSTRAINT, btree (employee_id, subcomponent_id, business_year_id)
Foreign-key constraints:
    "rd_employee_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_employee_subcomponents_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE
    "rd_employee_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
Policies:
    POLICY "Enable delete access for authenticated users" FOR DELETE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable insert access for authenticated users" FOR INSERT
      WITH CHECK ((auth.role() = 'authenticated'::text))
    POLICY "Enable read access for authenticated users" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable update access for authenticated users" FOR UPDATE
      USING ((auth.role() = 'authenticated'::text))
Access method: heap

```

## Table: rd_employee_year_data

### Detailed Structure
```
                                                                        Table "public.rd_employee_year_data"
      Column      |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target |                    Description                    
------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+---------------------------------------------------
 id               | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 employee_id      | uuid                     |           | not null |                   | plain    |             |              | 
 business_year_id | uuid                     |           | not null |                   | plain    |             |              | 
 applied_percent  | numeric(5,2)             |           | not null |                   | main     |             |              | 
 calculated_qre   | numeric(15,2)            |           | not null |                   | main     |             |              | 
 activity_roles   | jsonb                    |           | not null |                   | extended |             |              | 
 created_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 user_id          | uuid                     |           |          |                   | plain    |             |              | 
 type             | text                     |           |          |                   | extended |             |              | Employee year data type classification (optional)
Indexes:
    "rd_employee_year_data_pkey" PRIMARY KEY, btree (id)
    "idx_rd_employee_year_data_employee_year" btree (employee_id, business_year_id)
    "idx_rd_employee_year_data_user_id" btree (user_id)
Foreign-key constraints:
    "rd_employee_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_employee_year_data_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE
Access method: heap

```

## Table: rd_employees

### Detailed Structure
```
                                                       Table "public.rd_employees"
   Column    |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id          | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_id | uuid                     |           | not null |                   | plain    |             |              | 
 first_name  | text                     |           | not null |                   | extended |             |              | 
 role_id     | uuid                     |           |          |                   | plain    |             |              | 
 is_owner    | boolean                  |           |          | false             | plain    |             |              | 
 annual_wage | numeric(15,2)            |           | not null |                   | main     |             |              | 
 created_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 last_name   | text                     |           |          |                   | extended |             |              | 
 user_id     | uuid                     |           |          |                   | plain    |             |              | 
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
Access method: heap

```

## Table: rd_expenses

### Detailed Structure
```
                                                                   Table "public.rd_expenses"
               Column               |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------------------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                                 | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id                   | uuid                     |           | not null |                   | plain    |             |              | 
 research_activity_id               | uuid                     |           | not null |                   | plain    |             |              | 
 step_id                            | uuid                     |           | not null |                   | plain    |             |              | 
 subcomponent_id                    | uuid                     |           | not null |                   | plain    |             |              | 
 employee_id                        | uuid                     |           |          |                   | plain    |             |              | 
 contractor_id                      | uuid                     |           |          |                   | plain    |             |              | 
 supply_id                          | uuid                     |           |          |                   | plain    |             |              | 
 category                           | text                     |           | not null |                   | extended |             |              | 
 first_name                         | text                     |           |          |                   | extended |             |              | 
 last_name                          | text                     |           |          |                   | extended |             |              | 
 role_name                          | text                     |           |          |                   | extended |             |              | 
 supply_name                        | text                     |           |          |                   | extended |             |              | 
 research_activity_title            | text                     |           | not null |                   | extended |             |              | 
 research_activity_practice_percent | numeric(5,2)             |           | not null |                   | main     |             |              | 
 step_name                          | text                     |           | not null |                   | extended |             |              | 
 subcomponent_title                 | text                     |           | not null |                   | extended |             |              | 
 subcomponent_year_percent          | numeric(5,2)             |           | not null |                   | main     |             |              | 
 subcomponent_frequency_percent     | numeric(5,2)             |           | not null |                   | main     |             |              | 
 subcomponent_time_percent          | numeric(5,2)             |           | not null |                   | main     |             |              | 
 total_cost                         | numeric(10,2)            |           | not null |                   | main     |             |              | 
 applied_percent                    | numeric(5,2)             |           | not null |                   | main     |             |              | 
 baseline_applied_percent           | numeric(5,2)             |           | not null |                   | main     |             |              | 
 employee_practice_percent          | numeric(5,2)             |           |          |                   | main     |             |              | 
 employee_time_percent              | numeric(5,2)             |           |          |                   | main     |             |              | 
 notes                              | text                     |           |          |                   | extended |             |              | 
 created_at                         | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at                         | timestamp with time zone |           |          | now()             | plain    |             |              | 
Indexes:
    "rd_expenses_pkey" PRIMARY KEY, btree (id)
    "idx_rd_expenses_business_year_id" btree (business_year_id)
    "idx_rd_expenses_category" btree (category)
    "idx_rd_expenses_employee_id" btree (employee_id)
Check constraints:
    "rd_expenses_category_check" CHECK (category = ANY (ARRAY['Employee'::text, 'Contractor'::text, 'Supply'::text]))
Foreign-key constraints:
    "rd_expenses_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_expenses_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES rd_employees(id) ON DELETE CASCADE
    "rd_expenses_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    "rd_expenses_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
    "rd_expenses_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
Policies:
    POLICY "Enable delete access for authenticated users" FOR DELETE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable insert access for authenticated users" FOR INSERT
      WITH CHECK ((auth.role() = 'authenticated'::text))
    POLICY "Enable read access for authenticated users" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable update access for authenticated users" FOR UPDATE
      USING ((auth.role() = 'authenticated'::text))
Access method: heap

```

## Table: rd_federal_credit

### Detailed Structure
```
                                                             Table "public.rd_federal_credit"
          Column           |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
---------------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                        | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id          | uuid                        |           | not null |                   | plain    |             |              | 
 created_at                | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at                | timestamp without time zone |           |          | now()             | plain    |             |              | 
 supplies_expenses         | numeric(15,2)               |           |          |                   | main     |             |              | 
 research_activity_id      | text                        |           |          |                   | extended |             |              | 
 direct_research_wages     | numeric(15,2)               |           |          |                   | main     |             |              | 
 federal_credit_percentage | text                        |           |          |                   | extended |             |              | 
 contractor_expenses       | numeric(15,2)               |           |          |                   | main     |             |              | 
 notes                     | text                        |           |          |                   | extended |             |              | 
 ai_generation_timestamp   | text                        |           |          |                   | extended |             |              | 
 applied_percent           | numeric(5,2)                |           |          |                   | main     |             |              | 
 focus_area                | text                        |           |          |                   | extended |             |              | 
 federal_credit_amount     | text                        |           |          |                   | extended |             |              | 
 line_49f_description      | text                        |           |          |                   | extended |             |              | 
 is_latest                 | boolean                     |           |          |                   | plain    |             |              | 
 client_id                 | uuid                        |           |          |                   | plain    |             |              | 
 total_qre                 | text                        |           |          |                   | extended |             |              | 
 calculation_timestamp     | text                        |           |          |                   | extended |             |              | 
 subcomponent_groups       | text                        |           |          |                   | extended |             |              | 
 version                   | text                        |           |          |                   | extended |             |              | 
 subcomponent_count        | integer                     |           |          |                   | plain    |             |              | 
 ai_prompt_used            | text                        |           |          |                   | extended |             |              | 
 general_description       | text                        |           |          |                   | extended |             |              | 
 created_by                | text                        |           |          |                   | extended |             |              | 
 updated_by                | text                        |           |          |                   | extended |             |              | 
 research_activity_name    | text                        |           |          |                   | extended |             |              | 
 data_snapshot             | text                        |           |          |                   | extended |             |              | 
 previous_version_id       | text                        |           |          |                   | extended |             |              | 
 ai_response_raw           | text                        |           |          |                   | extended |             |              | 
 industry_type             | text                        |           |          |                   | extended |             |              | 
 calculation_method        | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_federal_credit_pkey" PRIMARY KEY, btree (id)
    "idx_rd_federal_credit_activity" btree (research_activity_id)
    "idx_rd_federal_credit_business_year" btree (business_year_id)
    "idx_rd_federal_credit_client" btree (client_id)
    "idx_rd_federal_credit_created_at" btree (created_at)
    "idx_rd_federal_credit_latest" btree (is_latest) WHERE is_latest = true
Check constraints:
    "valid_amounts" CHECK (direct_research_wages >= 0::numeric AND supplies_expenses >= 0::numeric AND contractor_expenses >= 0::numeric)
    "valid_percentages" CHECK (applied_percent >= 0::numeric AND applied_percent <= 100::numeric)
    "valid_subcomponent_count" CHECK (subcomponent_count >= 0)
Foreign-key constraints:
    "rd_federal_credit_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies:
    POLICY "Users can insert own rd_federal_credit" FOR INSERT
      WITH CHECK ((client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.created_by = auth.uid()))))
    POLICY "Users can update own rd_federal_credit" FOR UPDATE
      USING ((client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.created_by = auth.uid()))))
    POLICY "Users can view own rd_federal_credit" FOR SELECT
      USING ((client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.created_by = auth.uid()))))
Triggers:
    trigger_archive_rd_federal_credit_version AFTER INSERT ON rd_federal_credit FOR EACH ROW EXECUTE FUNCTION archive_rd_federal_credit_version()
    trigger_update_rd_federal_credit_updated_at BEFORE UPDATE ON rd_federal_credit FOR EACH ROW EXECUTE FUNCTION update_rd_federal_credit_updated_at()
Access method: heap

```

## Table: rd_federal_credit_results

### Detailed Structure
```
                                                        Table "public.rd_federal_credit_results"
           Column           |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
----------------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                         | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id           | uuid                     |           | not null |                   | plain    |             |              | 
 standard_credit            | numeric(15,2)            |           |          |                   | main     |             |              | 
 standard_adjusted_credit   | numeric(15,2)            |           |          |                   | main     |             |              | 
 standard_base_percentage   | numeric(5,4)             |           |          |                   | main     |             |              | 
 standard_fixed_base_amount | numeric(15,2)            |           |          |                   | main     |             |              | 
 standard_incremental_qre   | numeric(15,2)            |           |          |                   | main     |             |              | 
 standard_is_eligible       | boolean                  |           |          | false             | plain    |             |              | 
 standard_missing_data      | jsonb                    |           |          |                   | extended |             |              | 
 asc_credit                 | numeric(15,2)            |           |          |                   | main     |             |              | 
 asc_adjusted_credit        | numeric(15,2)            |           |          |                   | main     |             |              | 
 asc_avg_prior_qre          | numeric(15,2)            |           |          |                   | main     |             |              | 
 asc_incremental_qre        | numeric(15,2)            |           |          |                   | main     |             |              | 
 asc_is_startup             | boolean                  |           |          | false             | plain    |             |              | 
 asc_missing_data           | jsonb                    |           |          |                   | extended |             |              | 
 selected_method            | text                     |           |          |                   | extended |             |              | 
 use_280c                   | boolean                  |           |          | false             | plain    |             |              | 
 corporate_tax_rate         | numeric(5,4)             |           |          | 0.21              | main     |             |              | 
 total_federal_credit       | numeric(15,2)            |           |          |                   | main     |             |              | 
 total_state_credits        | numeric(15,2)            |           |          |                   | main     |             |              | 
 total_credits              | numeric(15,2)            |           |          |                   | main     |             |              | 
 calculation_date           | timestamp with time zone |           |          | now()             | plain    |             |              | 
 qre_breakdown              | jsonb                    |           |          |                   | extended |             |              | 
 historical_data            | jsonb                    |           |          |                   | extended |             |              | 
 state_credits              | jsonb                    |           |          |                   | extended |             |              | 
 created_at                 | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at                 | timestamp with time zone |           |          | now()             | plain    |             |              | 
Indexes:
    "rd_federal_credit_results_pkey" PRIMARY KEY, btree (id)
    "idx_rd_federal_credit_results_business_year_id" btree (business_year_id)
    "idx_rd_federal_credit_results_calculation_date" btree (calculation_date)
    "rd_federal_credit_results_unique" UNIQUE CONSTRAINT, btree (business_year_id)
Check constraints:
    "rd_federal_credit_results_selected_method_check" CHECK (selected_method = ANY (ARRAY['standard'::text, 'asc'::text]))
Foreign-key constraints:
    "rd_federal_credit_results_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies:
    POLICY "Users can delete their own federal credit results" FOR DELETE
      USING ((auth.uid() IS NOT NULL))
    POLICY "Users can insert their own federal credit results" FOR INSERT
      WITH CHECK ((auth.uid() IS NOT NULL))
    POLICY "Users can update their own federal credit results" FOR UPDATE
      USING ((auth.uid() IS NOT NULL))
    POLICY "Users can view their own federal credit results" FOR SELECT
      USING ((auth.uid() IS NOT NULL))
Triggers:
    handle_rd_federal_credit_results_updated_at BEFORE UPDATE ON rd_federal_credit_results FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
Access method: heap

```

## Table: rd_focuses

### Detailed Structure
```
                                                                        Table "public.rd_focuses"
   Column    |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target |                 Description                 
-------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+---------------------------------------------
 id          | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 name        | text                     |           | not null |                   | extended |             |              | 
 area_id     | uuid                     |           | not null |                   | plain    |             |              | 
 created_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 description | text                     |           |          |                   | extended |             |              | Optional description for the research focus
Indexes:
    "rd_focuses_pkey" PRIMARY KEY, btree (id)
    "unique_focus_name_per_area" UNIQUE CONSTRAINT, btree (name, area_id)
Foreign-key constraints:
    "rd_focuses_area_id_fkey" FOREIGN KEY (area_id) REFERENCES rd_areas(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_research_activities" CONSTRAINT "rd_research_activities_focus_id_fkey" FOREIGN KEY (focus_id) REFERENCES rd_focuses(id) ON DELETE CASCADE
Access method: heap

```

## Table: rd_procedure_analysis

### Detailed Structure
```
                                                         Table "public.rd_procedure_analysis"
        Column         |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-----------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                    | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 created_at            | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at            | timestamp without time zone |           |          | now()             | plain    |             |              | 
 frequency_annual      | text                        |           |          |                   | extended |             |              | 
 raw_data              | text                        |           |          |                   | extended |             |              | 
 procedure_category    | text                        |           |          |                   | extended |             |              | 
 document_id           | text                        |           |          |                   | extended |             |              | 
 billed_amount         | text                        |           |          |                   | extended |             |              | 
 procedure_code        | text                        |           |          |                   | extended |             |              | 
 extraction_method     | text                        |           |          |                   | extended |             |              | 
 ai_confidence_score   | numeric(3,2)                |           |          |                   | main     |             |              | 
 billed_units          | text                        |           |          |                   | extended |             |              | 
 procedure_description | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_procedure_analysis_pkey" PRIMARY KEY, btree (id)
    "idx_procedure_analysis_code" btree (procedure_code)
    "idx_procedure_analysis_doc" btree (document_id)
Check constraints:
    "rd_procedure_analysis_ai_confidence_score_check" CHECK (ai_confidence_score >= 0::numeric AND ai_confidence_score <= 1::numeric)
    "rd_procedure_analysis_extraction_method_check" CHECK (extraction_method = ANY (ARRAY['ai'::text, 'manual'::text]))
Referenced by:
    TABLE "rd_procedure_research_links" CONSTRAINT "rd_procedure_research_links_procedure_analysis_id_fkey" FOREIGN KEY (procedure_analysis_id) REFERENCES rd_procedure_analysis(id) ON DELETE CASCADE
Policies (row security enabled): (none)
Access method: heap

```

## Table: rd_procedure_research_links

### Detailed Structure
```
                                                          Table "public.rd_procedure_research_links"
            Column             |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-------------------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                            | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 procedure_analysis_id         | uuid                        |           | not null |                   | plain    |             |              | 
 research_activity_id          | uuid                        |           | not null |                   | plain    |             |              | 
 created_at                    | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at                    | timestamp without time zone |           |          | now()             | plain    |             |              | 
 allocation_percentage         | numeric(5,2)                |           | not null |                   | main     |             |              | 
 approval_notes                | text                        |           |          |                   | extended |             |              | 
 manual_override               | boolean                     |           |          | false             | plain    |             |              | 
 estimated_research_time_hours | numeric(10,2)               |           |          |                   | main     |             |              | 
 status                        | text                        |           |          | 'pending'::text   | extended |             |              | 
 subcomponent_id               | uuid                        |           |          |                   | plain    |             |              | 
 ai_reasoning                  | text                        |           |          |                   | extended |             |              | 
 ai_confidence_score           | numeric(3,2)                |           |          |                   | main     |             |              | 
 approved_by                   | uuid                        |           |          |                   | plain    |             |              | 
Indexes:
    "rd_procedure_research_links_pkey" PRIMARY KEY, btree (id)
    "idx_procedure_links_activity" btree (research_activity_id)
    "idx_procedure_links_status" btree (status)
    "idx_unique_procedure_research_link" UNIQUE, btree (procedure_analysis_id, research_activity_id, subcomponent_id)
Check constraints:
    "rd_procedure_research_links_ai_confidence_score_check" CHECK (ai_confidence_score >= 0::numeric AND ai_confidence_score <= 1::numeric)
    "rd_procedure_research_links_allocation_percentage_check" CHECK (allocation_percentage > 0::numeric AND allocation_percentage <= 100::numeric)
    "rd_procedure_research_links_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'modified'::text]))
Foreign-key constraints:
    "rd_procedure_research_links_procedure_analysis_id_fkey" FOREIGN KEY (procedure_analysis_id) REFERENCES rd_procedure_analysis(id) ON DELETE CASCADE
    "rd_procedure_research_links_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
Policies (row security enabled): (none)
Access method: heap

```

## Table: rd_qc_document_controls

### Detailed Structure
```
                                                         Table "public.rd_qc_document_controls"
         Column          |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-------------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                      | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id        | uuid                        |           | not null |                   | plain    |             |              | 
 document_type           | character varying(50)       |           | not null |                   | extended |             |              | 
 created_at              | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at              | timestamp without time zone |           |          | now()             | plain    |             |              | 
 qc_reviewer             | text                        |           |          |                   | extended |             |              | 
 is_released             | text                        |           |          |                   | extended |             |              | 
 released_by             | text                        |           |          |                   | extended |             |              | 
 qc_approver_name        | text                        |           |          |                   | extended |             |              | 
 released_at             | timestamp without time zone |           |          |                   | plain    |             |              | 
 qc_review_notes         | text                        |           |          |                   | extended |             |              | 
 qc_approver_credentials | text                        |           |          |                   | extended |             |              | 
 qc_reviewed_at          | timestamp without time zone |           |          |                   | plain    |             |              | 
 release_notes           | text                        |           |          |                   | extended |             |              | 
 qc_approver_ip_address  | text                        |           |          |                   | extended |             |              | 
 qc_approved_date        | text                        |           |          |                   | extended |             |              | 
 requires_payment        | text                        |           |          |                   | extended |             |              | 
 requires_jurat          | boolean                     |           |          | false             | plain    |             |              | 
Indexes:
    "rd_qc_document_controls_pkey" PRIMARY KEY, btree (id)
    "idx_rd_qc_document_controls_business_year" btree (business_year_id)
    "idx_rd_qc_document_controls_qc_approved_date" btree (qc_approved_date) WHERE qc_approved_date IS NOT NULL
    "idx_rd_qc_document_controls_released" btree (is_released)
    "idx_rd_qc_document_controls_type" btree (document_type)
Foreign-key constraints:
    "rd_qc_document_controls_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies:
    POLICY "Admin can manage QC controls"
      USING (user_is_admin(auth.uid()))
Access method: heap

```

## Table: rd_reports

### Detailed Structure
```
                                                                           Table "public.rd_reports"
        Column        |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target |               Description                
----------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+------------------------------------------
 id                   | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_id          | uuid                     |           |          |                   | plain    |             |              | 
 business_year_id     | uuid                     |           |          |                   | plain    |             |              | 
 type                 | rd_report_type           |           | not null |                   | plain    |             |              | 
 generated_text       | text                     |           | not null |                   | extended |             |              | 
 editable_text        | text                     |           |          |                   | extended |             |              | 
 ai_version           | text                     |           | not null |                   | extended |             |              | 
 locked               | boolean                  |           |          | false             | plain    |             |              | 
 created_at           | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at           | timestamp with time zone |           |          | now()             | plain    |             |              | 
 generated_html       | text                     |           |          |                   | extended |             |              | HTML version of generated report content
 filing_guide         | text                     |           |          |                   | extended |             |              | Filing guide content for the report
 state_gross_receipts | jsonb                    |           |          | '{}'::jsonb       | extended |             |              | State gross receipts amount
 qc_approved_by       | text                     |           |          |                   | extended |             |              | User who performed QC approval
 qc_approved_at       | timestamp with time zone |           |          |                   | plain    |             |              | Timestamp of QC approval
 qc_approver_ip       | text                     |           |          |                   | extended |             |              | IP address of QC approver
Indexes:
    "rd_reports_pkey" PRIMARY KEY, btree (id)
    "idx_rd_reports_business_year_type" btree (business_year_id, type)
    "idx_rd_reports_html_not_null" btree (business_year_id, type) WHERE generated_html IS NOT NULL
    "idx_rd_reports_qc_approved_at" btree (qc_approved_at) WHERE qc_approved_at IS NOT NULL
    "idx_rd_reports_state_gross_receipts" gin (state_gross_receipts)
Foreign-key constraints:
    "rd_reports_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE SET NULL
    "rd_reports_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE SET NULL
Policies (row security disabled):
    POLICY "Enable delete access for authenticated users" FOR DELETE
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable insert access for authenticated users" FOR INSERT
      WITH CHECK ((auth.role() = 'authenticated'::text))
    POLICY "Enable read access for authenticated users" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable update access for authenticated users" FOR UPDATE
      USING ((auth.role() = 'authenticated'::text))
Triggers:
    update_rd_reports_updated_at BEFORE UPDATE ON rd_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
Access method: heap

```

## Table: rd_research_activities

### Detailed Structure
```
                                                       Table "public.rd_research_activities"
       Column        |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
---------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                  | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 title               | text                        |           | not null |                   | extended |             |              | 
 focus_id            | uuid                        |           | not null |                   | plain    |             |              | 
 is_active           | boolean                     |           |          | true              | plain    |             |              | 
 default_roles       | jsonb                       |           | not null |                   | extended |             |              | 
 default_steps       | jsonb                       |           | not null |                   | extended |             |              | 
 created_at          | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 updated_at          | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 focus               | text                        |           |          |                   | extended |             |              | 
 category            | text                        |           |          |                   | extended |             |              | 
 area                | text                        |           |          |                   | extended |             |              | 
 research_activity   | text                        |           |          |                   | extended |             |              | 
 subcomponent        | text                        |           |          |                   | extended |             |              | 
 phase               | text                        |           |          |                   | extended |             |              | 
 step                | text                        |           |          |                   | extended |             |              | 
 business_id         | uuid                        |           |          |                   | plain    |             |              | 
 deactivated_at      | timestamp without time zone |           |          |                   | plain    |             |              | 
 deactivation_reason | text                        |           |          |                   | extended |             |              | 
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
Access method: heap

```

## Table: rd_research_categories

### Detailed Structure
```
                                                                   Table "public.rd_research_categories"
   Column    |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target |                  Description                   
-------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+------------------------------------------------
 id          | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 name        | text                     |           | not null |                   | extended |             |              | 
 created_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 description | text                     |           |          |                   | extended |             |              | Optional description for the research category
Indexes:
    "rd_research_categories_pkey" PRIMARY KEY, btree (id)
    "rd_research_categories_name_key" UNIQUE CONSTRAINT, btree (name)
    "unique_category_name" UNIQUE CONSTRAINT, btree (name)
Referenced by:
    TABLE "rd_areas" CONSTRAINT "rd_areas_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE CASCADE
    TABLE "rd_businesses" CONSTRAINT "rd_businesses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES rd_research_categories(id) ON DELETE SET NULL
Access method: heap

```

## Table: rd_research_raw

### Detailed Structure
```
                                                          Table "public.rd_research_raw"
        Column         |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-----------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                    | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 category              | text                     |           |          |                   | extended |             |              | 
 area                  | text                     |           |          |                   | extended |             |              | 
 focus                 | text                     |           |          |                   | extended |             |              | 
 research_activity     | text                     |           |          |                   | extended |             |              | 
 subcomponent          | text                     |           |          |                   | extended |             |              | 
 phase                 | text                     |           |          |                   | extended |             |              | 
 step                  | text                     |           |          |                   | extended |             |              | 
 hint                  | text                     |           |          |                   | extended |             |              | 
 general_description   | text                     |           |          |                   | extended |             |              | 
 goal                  | text                     |           |          |                   | extended |             |              | 
 hypothesis            | text                     |           |          |                   | extended |             |              | 
 alternatives          | text                     |           |          |                   | extended |             |              | 
 uncertainties         | text                     |           |          |                   | extended |             |              | 
 developmental_process | text                     |           |          |                   | extended |             |              | 
 primary_goal          | text                     |           |          |                   | extended |             |              | 
 expected_outcome_type | text                     |           |          |                   | extended |             |              | 
 cpt_codes             | text                     |           |          |                   | extended |             |              | 
 cdt_codes             | text                     |           |          |                   | extended |             |              | 
 alternative_paths     | text                     |           |          |                   | extended |             |              | 
 uploaded_at           | timestamp with time zone |           |          | now()             | plain    |             |              | 
Indexes:
    "rd_research_raw_pkey" PRIMARY KEY, btree (id)
Access method: heap

```

## Table: rd_research_steps

### Detailed Structure
```
                                                          Table "public.rd_research_steps"
        Column        |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
----------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                   | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 research_activity_id | uuid                        |           | not null |                   | plain    |             |              | 
 name                 | character varying(255)      |           | not null |                   | extended |             |              | 
 description          | text                        |           |          |                   | extended |             |              | 
 step_order           | integer                     |           | not null |                   | plain    |             |              | 
 created_at           | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 updated_at           | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 business_id          | uuid                        |           |          |                   | plain    |             |              | 
 deactivated_at       | timestamp without time zone |           |          |                   | plain    |             |              | 
 is_active            | text                        |           |          |                   | extended |             |              | 
 deactivation_reason  | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_research_steps_pkey" PRIMARY KEY, btree (id)
    "idx_rd_research_steps_activity_id" btree (research_activity_id)
    "idx_rd_research_steps_activity_step_order" btree (research_activity_id, step_order)
    "idx_rd_research_steps_business_id" btree (business_id)
Foreign-key constraints:
    "rd_research_steps_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_expenses" CONSTRAINT "rd_expenses_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
    TABLE "rd_research_subcomponents" CONSTRAINT "rd_research_subcomponents_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
    TABLE "rd_selected_steps" CONSTRAINT "rd_selected_steps_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
    TABLE "rd_selected_subcomponents" CONSTRAINT "rd_selected_subcomponents_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
Policies:
    POLICY "Allow read access to rd_research_steps" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable delete for authenticated users" FOR DELETE
      USING ((auth.uid() IS NOT NULL))
    POLICY "Enable insert for authenticated users" FOR INSERT
      WITH CHECK ((auth.uid() IS NOT NULL))
    POLICY "Enable read access for all users" FOR SELECT
      USING (true)
    POLICY "Enable update for authenticated users" FOR UPDATE
      USING ((auth.uid() IS NOT NULL))
Access method: heap

```

## Table: rd_research_subcomponents

### Detailed Structure
```
                                                       Table "public.rd_research_subcomponents"
        Column         |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-----------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                    | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 step_id               | uuid                        |           | not null |                   | plain    |             |              | 
 name                  | character varying(255)      |           | not null |                   | extended |             |              | 
 description           | text                        |           |          |                   | extended |             |              | 
 subcomponent_order    | integer                     |           | not null |                   | plain    |             |              | 
 created_at            | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 updated_at            | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 hint                  | text                        |           |          |                   | extended |             |              | 
 general_description   | text                        |           |          |                   | extended |             |              | 
 goal                  | text                        |           |          |                   | extended |             |              | 
 hypothesis            | text                        |           |          |                   | extended |             |              | 
 alternatives          | text                        |           |          |                   | extended |             |              | 
 uncertainties         | text                        |           |          |                   | extended |             |              | 
 developmental_process | text                        |           |          |                   | extended |             |              | 
 primary_goal          | text                        |           |          |                   | extended |             |              | 
 expected_outcome_type | text                        |           |          |                   | extended |             |              | 
 cpt_codes             | text                        |           |          |                   | extended |             |              | 
 cdt_codes             | text                        |           |          |                   | extended |             |              | 
 alternative_paths     | text                        |           |          |                   | extended |             |              | 
 business_id           | uuid                        |           |          |                   | plain    |             |              | 
 deactivated_at        | timestamp without time zone |           |          |                   | plain    |             |              | 
 is_active             | text                        |           |          |                   | extended |             |              | 
 deactivation_reason   | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_research_subcomponents_pkey" PRIMARY KEY, btree (id)
    "idx_rd_research_subcomponents_business_id" btree (business_id)
    "idx_rd_research_subcomponents_step_id" btree (step_id)
Foreign-key constraints:
    "rd_research_subcomponents_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
Referenced by:
    TABLE "rd_contractor_subcomponents" CONSTRAINT "rd_contractor_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
    TABLE "rd_employee_subcomponents" CONSTRAINT "rd_employee_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
    TABLE "rd_expenses" CONSTRAINT "rd_expenses_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
    TABLE "rd_selected_subcomponents" CONSTRAINT "rd_selected_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
    TABLE "rd_supply_subcomponents" CONSTRAINT "rd_supply_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
Policies:
    POLICY "Allow read access to rd_research_subcomponents" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
    POLICY "Enable delete for authenticated users" FOR DELETE
      USING (true)
    POLICY "Enable insert for authenticated users" FOR INSERT
      WITH CHECK (true)
    POLICY "Enable read access for all users" FOR SELECT
      USING (true)
    POLICY "Enable update for authenticated users" FOR UPDATE
      USING (true)
Access method: heap

```

## Table: rd_roles

### Detailed Structure
```
                                                                            Table "public.rd_roles"
          Column          |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target |             Description              
--------------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+--------------------------------------
 id                       | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_id              | uuid                     |           | not null |                   | plain    |             |              | 
 name                     | text                     |           | not null |                   | extended |             |              | 
 parent_id                | uuid                     |           |          |                   | plain    |             |              | 
 is_default               | boolean                  |           |          | false             | plain    |             |              | 
 business_year_id         | uuid                     |           |          |                   | plain    |             |              | 
 baseline_applied_percent | numeric                  |           |          |                   | main     |             |              | 
 type                     | text                     |           |          |                   | extended |             |              | Role type classification (optional)
 description              | text                     |           |          |                   | extended |             |              | Role description text (optional)
 created_at               | timestamp with time zone |           |          | now()             | plain    |             |              | Timestamp when role was created
 updated_at               | timestamp with time zone |           |          | now()             | plain    |             |              | Timestamp when role was last updated
Indexes:
    "rd_roles_pkey" PRIMARY KEY, btree (id)
    "idx_rd_roles_business_year_id" btree (business_year_id)
    "idx_rd_roles_is_default" btree (is_default)
    "idx_rd_roles_type" btree (type)
    "idx_rd_roles_unique_default_per_year" UNIQUE, btree (business_year_id, is_default) WHERE is_default = true
Foreign-key constraints:
    "rd_roles_business_id_fkey" FOREIGN KEY (business_id) REFERENCES rd_businesses(id) ON DELETE CASCADE
    "rd_roles_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_roles_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES rd_roles(id) ON DELETE SET NULL
Referenced by:
    TABLE "rd_contractors" CONSTRAINT "rd_contractors_role_id_fkey" FOREIGN KEY (role_id) REFERENCES rd_roles(id) ON DELETE SET NULL
    TABLE "rd_employees" CONSTRAINT "rd_employees_role_id_fkey" FOREIGN KEY (role_id) REFERENCES rd_roles(id) ON DELETE CASCADE
    TABLE "rd_roles" CONSTRAINT "rd_roles_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES rd_roles(id) ON DELETE SET NULL
Triggers:
    update_rd_roles_updated_at BEFORE UPDATE ON rd_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
Access method: heap

```

## Table: rd_selected_activities

### Detailed Structure
```
                                                         Table "public.rd_selected_activities"
           Column           |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
----------------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                         | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id           | uuid                     |           | not null |                   | plain    |             |              | 
 activity_id                | uuid                     |           | not null |                   | plain    |             |              | 
 practice_percent           | numeric(5,2)             |           | not null |                   | main     |             |              | 
 selected_roles             | jsonb                    |           | not null |                   | extended |             |              | 
 config                     | jsonb                    |           | not null |                   | extended |             |              | 
 created_at                 | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at                 | timestamp with time zone |           |          | now()             | plain    |             |              | 
 research_guidelines        | jsonb                    |           |          |                   | extended |             |              | 
 is_enabled                 | boolean                  |           | not null | true              | plain    |             |              | 
 activity_title_snapshot    | text                     |           |          |                   | extended |             |              | 
 activity_category_snapshot | text                     |           |          |                   | extended |             |              | 
Indexes:
    "rd_selected_activities_pkey" PRIMARY KEY, btree (id)
    "idx_rd_selected_activities_business_year_activity" btree (business_year_id, activity_id)
Foreign-key constraints:
    "rd_selected_activities_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    "rd_selected_activities_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Access method: heap

```

## Table: rd_selected_filter

### Detailed Structure
```
                                                        Table "public.rd_selected_filter"
       Column        |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
---------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                  | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id    | uuid                     |           | not null |                   | plain    |             |              | 
 selected_categories | text[]                   |           |          | '{}'::text[]      | extended |             |              | 
 selected_areas      | text[]                   |           |          | '{}'::text[]      | extended |             |              | 
 selected_focuses    | text[]                   |           |          | '{}'::text[]      | extended |             |              | 
 created_at          | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at          | timestamp with time zone |           |          | now()             | plain    |             |              | 
Indexes:
    "rd_selected_filter_pkey" PRIMARY KEY, btree (id)
    "rd_selected_filter_business_year_id_key" UNIQUE CONSTRAINT, btree (business_year_id)
Foreign-key constraints:
    "rd_selected_filter_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies:
    POLICY "Allow all for authenticated"
      USING ((auth.uid() IS NOT NULL))
Access method: heap

```

## Table: rd_selected_steps

### Detailed Structure
```
                                                        Table "public.rd_selected_steps"
        Column        |           Type           | Collation | Nullable |      Default      | Storage | Compression | Stats target | Description 
----------------------+--------------------------+-----------+----------+-------------------+---------+-------------+--------------+-------------
 id                   | uuid                     |           | not null | gen_random_uuid() | plain   |             |              | 
 business_year_id     | uuid                     |           | not null |                   | plain   |             |              | 
 research_activity_id | uuid                     |           | not null |                   | plain   |             |              | 
 step_id              | uuid                     |           | not null |                   | plain   |             |              | 
 time_percentage      | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 applied_percentage   | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 created_at           | timestamp with time zone |           |          | now()             | plain   |             |              | 
 updated_at           | timestamp with time zone |           |          | now()             | plain   |             |              | 
 non_rd_percentage    | numeric(5,2)             |           |          | 0                 | main    |             |              | 
Indexes:
    "rd_selected_steps_pkey" PRIMARY KEY, btree (id)
    "idx_rd_selected_steps_activity" btree (research_activity_id)
    "idx_rd_selected_steps_business_year" btree (business_year_id)
    "rd_selected_steps_business_year_id_step_id_key" UNIQUE CONSTRAINT, btree (business_year_id, step_id)
Check constraints:
    "rd_selected_steps_non_rd_percentage_check" CHECK (non_rd_percentage >= 0::numeric AND non_rd_percentage <= 100::numeric)
Foreign-key constraints:
    "rd_selected_steps_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_selected_steps_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    "rd_selected_steps_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
Policies:
    POLICY "Enable delete for authenticated users only" FOR DELETE
      USING ((auth.uid() IS NOT NULL))
    POLICY "Enable insert for authenticated users only" FOR INSERT
      WITH CHECK ((auth.uid() IS NOT NULL))
    POLICY "Enable read access for all users" FOR SELECT
      USING (true)
    POLICY "Enable update for authenticated users only" FOR UPDATE
      USING ((auth.uid() IS NOT NULL))
Access method: heap

```

## Table: rd_selected_subcomponents

### Detailed Structure
```
                                                        Table "public.rd_selected_subcomponents"
           Column           |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
----------------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                         | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id           | uuid                     |           | not null |                   | plain    |             |              | 
 research_activity_id       | uuid                     |           | not null |                   | plain    |             |              | 
 step_id                    | uuid                     |           | not null |                   | plain    |             |              | 
 subcomponent_id            | uuid                     |           | not null |                   | plain    |             |              | 
 frequency_percentage       | numeric(5,2)             |           | not null | 0                 | main     |             |              | 
 year_percentage            | numeric(5,2)             |           | not null | 0                 | main     |             |              | 
 start_month                | integer                  |           | not null | 1                 | plain    |             |              | 
 start_year                 | integer                  |           | not null |                   | plain    |             |              | 
 selected_roles             | jsonb                    |           | not null | '[]'::jsonb       | extended |             |              | 
 non_rd_percentage          | numeric(5,2)             |           | not null | 0                 | main     |             |              | 
 approval_data              | jsonb                    |           |          |                   | extended |             |              | 
 created_at                 | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at                 | timestamp with time zone |           |          | now()             | plain    |             |              | 
 hint                       | text                     |           |          |                   | extended |             |              | 
 general_description        | text                     |           |          |                   | extended |             |              | 
 goal                       | text                     |           |          |                   | extended |             |              | 
 hypothesis                 | text                     |           |          |                   | extended |             |              | 
 alternatives               | text                     |           |          |                   | extended |             |              | 
 uncertainties              | text                     |           |          |                   | extended |             |              | 
 developmental_process      | text                     |           |          |                   | extended |             |              | 
 primary_goal               | text                     |           |          |                   | extended |             |              | 
 expected_outcome_type      | text                     |           |          |                   | extended |             |              | 
 cpt_codes                  | text                     |           |          |                   | extended |             |              | 
 cdt_codes                  | text                     |           |          |                   | extended |             |              | 
 alternative_paths          | text                     |           |          |                   | extended |             |              | 
 applied_percentage         | numeric                  |           |          |                   | main     |             |              | 
 time_percentage            | numeric                  |           |          |                   | main     |             |              | 
 user_notes                 | text                     |           |          |                   | extended |             |              | 
 step_name                  | text                     |           |          |                   | extended |             |              | 
 subcomponent_name_snapshot | text                     |           |          |                   | extended |             |              | 
 practice_percent           | numeric(5,2)             |           |          | 0                 | main     |             |              | 
 step_name_snapshot         | text                     |           |          |                   | extended |             |              | 
Indexes:
    "rd_selected_subcomponents_pkey" PRIMARY KEY, btree (id)
    "idx_rd_selected_subcomponents_activity" btree (research_activity_id)
    "idx_rd_selected_subcomponents_business_year" btree (business_year_id)
    "idx_rd_selected_subcomponents_step" btree (step_id)
    "rd_selected_subcomponents_business_year_id_subcomponent_id_key" UNIQUE CONSTRAINT, btree (business_year_id, subcomponent_id)
Foreign-key constraints:
    "rd_selected_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_selected_subcomponents_research_activity_id_fkey" FOREIGN KEY (research_activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
    "rd_selected_subcomponents_step_id_fkey" FOREIGN KEY (step_id) REFERENCES rd_research_steps(id) ON DELETE CASCADE
    "rd_selected_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
Triggers:
    trigger_safe_update_practice_percent AFTER INSERT ON rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION safe_update_selected_subcomponent_practice_percent()
    trigger_update_step_name AFTER INSERT ON rd_selected_subcomponents FOR EACH ROW EXECUTE FUNCTION update_selected_subcomponent_step_name()
Access method: heap

```

## Table: rd_signature_records

### Detailed Structure
```
                                                     Table "public.rd_signature_records"
      Column      |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id               | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id | uuid                     |           | not null |                   | plain    |             |              | 
 signer_name      | text                     |           | not null |                   | extended |             |              | 
 signed_at        | timestamp with time zone |           | not null |                   | plain    |             |              | 
 created_at       | timestamp with time zone |           | not null | now()             | plain    |             |              | 
 updated_at       | timestamp with time zone |           | not null | now()             | plain    |             |              | 
 signature_image  | text                     |           |          |                   | extended |             |              | 
 jurat_text       | text                     |           |          |                   | extended |             |              | 
 ip_address       | text                     |           | not null |                   | extended |             |              | 
 signer_title     | text                     |           |          |                   | extended |             |              | 
 signer_email     | text                     |           |          |                   | extended |             |              | 
Indexes:
    "rd_signature_records_pkey" PRIMARY KEY, btree (id)
    "idx_rd_signature_records_business_year_id" btree (business_year_id)
    "idx_rd_signature_records_signed_at" btree (signed_at)
Foreign-key constraints:
    "rd_signature_records_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies:
    POLICY "Admin can manage all signature records"
      USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))
    POLICY "Allow authenticated users to create signatures" FOR INSERT
      WITH CHECK ((auth.role() = 'authenticated'::text))
    POLICY "Allow authenticated users to view signatures" FOR SELECT
      USING ((auth.role() = 'authenticated'::text))
Access method: heap

```

## Table: rd_signatures

### Detailed Structure
```
                                                          Table "public.rd_signatures"
      Column      |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id               | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 created_at       | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at       | timestamp with time zone    |           |          | now()             | plain    |             |              | 
 business_year_id | text                        |           |          |                   | extended |             |              | 
 signature_type   | text                        |           |          |                   | extended |             |              | 
 signature_data   | text                        |           |          |                   | extended |             |              | 
 signed_at        | timestamp without time zone |           |          |                   | plain    |             |              | 
 ip_address       | inet                        |           |          |                   | main     |             |              | 
 signed_by        | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_signatures_pkey" PRIMARY KEY, btree (id)
    "idx_rd_signatures_business_year" btree (business_year_id)
    "idx_rd_signatures_signed_at" btree (signed_at)
    "idx_rd_signatures_type" btree (signature_type)
Policies:
    POLICY "Admin can view all signatures" FOR SELECT
      USING (user_is_admin(auth.uid()))
    POLICY "Anyone can create signatures via portal" FOR INSERT
      WITH CHECK (true)
Access method: heap

```

## Table: rd_state_calculations

### Detailed Structure
```
                                                      Table "public.rd_state_calculations"
       Column        |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
---------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                  | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 state               | character varying(2)     |           | not null |                   | extended |             |              | 
 calculation_method  | text                     |           | not null |                   | extended |             |              | 
 refundable          | text                     |           |          |                   | extended |             |              | 
 carryforward        | text                     |           |          |                   | extended |             |              | 
 eligible_entities   | text[]                   |           |          |                   | extended |             |              | 
 calculation_formula | text                     |           | not null |                   | extended |             |              | 
 special_notes       | text                     |           |          |                   | extended |             |              | 
 start_year          | numeric                  |           | not null |                   | main     |             |              | 
 end_year            | numeric                  |           |          |                   | main     |             |              | 
 is_active           | boolean                  |           |          | true              | plain    |             |              | 
 created_at          | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at          | timestamp with time zone |           |          | now()             | plain    |             |              | 
 formula_correct     | text                     |           |          |                   | extended |             |              | 
Indexes:
    "rd_state_calculations_pkey" PRIMARY KEY, btree (id)
    "idx_state_calculations_active" btree (is_active)
    "idx_state_calculations_state" btree (state)
    "idx_state_calculations_unique" UNIQUE, btree (state, start_year) WHERE is_active = true
    "idx_state_calculations_year" btree (start_year, end_year)
Triggers:
    update_rd_state_calculations_updated_at BEFORE UPDATE ON rd_state_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
Access method: heap

```

## Table: rd_state_calculations_full

### Detailed Structure
```
                                                       Table "public.rd_state_calculations_full"
          Column           |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
---------------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                        | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 created_at                | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at                | timestamp with time zone |           |          | now()             | plain    |             |              | 
 refundable                | text                     |           |          |                   | extended |             |              | 
 state                     | text                     |           |          |                   | extended |             |              | 
 additional_credit_formula | text                     |           |          |                   | extended |             |              | 
 end_year                  | text                     |           |          |                   | extended |             |              | 
 eligible_entities         | text                     |           |          |                   | extended |             |              | 
 carryforward              | text                     |           |          |                   | extended |             |              | 
 calculation_method        | text                     |           |          |                   | extended |             |              | 
 alternative_info          | text                     |           |          |                   | extended |             |              | 
 formula_correct           | text                     |           |          |                   | extended |             |              | 
 standard_info             | text                     |           |          |                   | extended |             |              | 
 start_year                | text                     |           |          |                   | extended |             |              | 
 alternate_credit_formula  | text                     |           |          |                   | extended |             |              | 
 other_info                | text                     |           |          |                   | extended |             |              | 
 special_notes             | text                     |           |          |                   | extended |             |              | 
 standard_credit_formula   | text                     |           |          |                   | extended |             |              | 
Indexes:
    "rd_state_calculations_full_pkey" PRIMARY KEY, btree (id)
Policies (row security enabled): (none)
Access method: heap

```

## Table: rd_state_credit_configs

### Detailed Structure
```
                                                  Table "public.rd_state_credit_configs"
   Column   |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id         | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 state_code | character varying(2)        |           | not null |                   | extended |             |              | 
 created_at | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at | timestamp without time zone |           |          | now()             | plain    |             |              | 
 config     | jsonb                       |           | not null | '{}'::jsonb       | extended |             |              | 
Indexes:
    "rd_state_credit_configs_pkey" PRIMARY KEY, btree (id)
    "idx_state_credit_configs_state_code" btree (state_code)
Policies (row security enabled): (none)
Access method: heap

```

## Table: rd_state_proforma_data

### Detailed Structure
```
                                                    Table "public.rd_state_proforma_data"
      Column      |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id               | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id | uuid                     |           | not null |                   | plain    |             |              | 
 state_code       | character varying(2)     |           | not null |                   | extended |             |              | 
 created_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 method           | text                     |           |          |                   | extended |             |              | 
 data             | text                     |           |          |                   | extended |             |              | 
Indexes:
    "rd_state_proforma_data_pkey" PRIMARY KEY, btree (id)
    "idx_rd_state_proforma_data_lookup" btree (business_year_id, state_code, method)
Check constraints:
    "rd_state_proforma_data_method_check" CHECK (method = ANY (ARRAY['standard'::character varying::text, 'alternative'::character varying::text]))
Foreign-key constraints:
    "rd_state_proforma_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies:
    POLICY "Users can delete their own state pro forma data" FOR DELETE
      USING ((business_year_id IN ( SELECT business_years.id
   FROM business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))))
    POLICY "Users can insert their own state pro forma data" FOR INSERT
      WITH CHECK ((business_year_id IN ( SELECT business_years.id
   FROM business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))))
    POLICY "Users can update their own state pro forma data" FOR UPDATE
      USING ((business_year_id IN ( SELECT business_years.id
   FROM business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))))
    POLICY "Users can view their own state pro forma data" FOR SELECT
      USING ((business_year_id IN ( SELECT business_years.id
   FROM business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))))
Triggers:
    trigger_update_rd_state_proforma_data_updated_at BEFORE UPDATE ON rd_state_proforma_data FOR EACH ROW EXECUTE FUNCTION update_rd_state_proforma_data_updated_at()
Access method: heap

```

## Table: rd_state_proforma_lines

### Detailed Structure
```
                                                       Table "public.rd_state_proforma_lines"
       Column        |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
---------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                  | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 line_number         | character varying(10)       |           | not null |                   | extended |             |              | 
 created_at          | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at          | timestamp without time zone |           |          | now()             | plain    |             |              | 
 state_proforma_id   | text                        |           |          |                   | extended |             |              | 
 description         | text                        |           |          |                   | extended |             |              | 
 line_type           | text                        |           |          |                   | extended |             |              | 
 is_editable         | text                        |           |          |                   | extended |             |              | 
 sort_order          | text                        |           |          |                   | extended |             |              | 
 amount              | text                        |           |          |                   | extended |             |              | 
 calculation_formula | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_state_proforma_lines_pkey" PRIMARY KEY, btree (id)
    "idx_state_proforma_lines_state_proforma_id" btree (state_proforma_id)
Policies (row security enabled): (none)
Access method: heap

```

## Table: rd_state_proformas

### Detailed Structure
```
                                                        Table "public.rd_state_proformas"
      Column      |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id               | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id | uuid                        |           | not null |                   | plain    |             |              | 
 state_code       | character varying(2)        |           | not null |                   | extended |             |              | 
 created_at       | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at       | timestamp without time zone |           |          | now()             | plain    |             |              | 
 total_credit     | text                        |           |          |                   | extended |             |              | 
 config           | text                        |           |          |                   | extended |             |              | 
Indexes:
    "rd_state_proformas_pkey" PRIMARY KEY, btree (id)
    "idx_state_proformas_business_year" btree (business_year_id)
Foreign-key constraints:
    "rd_state_proformas_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies (row security enabled): (none)
Access method: heap

```

## Table: rd_subcomponents

### Detailed Structure
```
                                                          Table "public.rd_subcomponents"
        Column         |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-----------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                    | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 activity_id           | uuid                     |           | not null |                   | plain    |             |              | 
 title                 | text                     |           | not null |                   | extended |             |              | 
 phase                 | text                     |           | not null |                   | extended |             |              | 
 step                  | text                     |           |          |                   | extended |             |              | 
 hint                  | text                     |           |          |                   | extended |             |              | 
 created_at            | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at            | timestamp with time zone |           |          | now()             | plain    |             |              | 
 general_description   | text                     |           |          |                   | extended |             |              | 
 goal                  | text                     |           |          |                   | extended |             |              | 
 hypothesis            | text                     |           |          |                   | extended |             |              | 
 alternatives          | text                     |           |          |                   | extended |             |              | 
 uncertainties         | text                     |           |          |                   | extended |             |              | 
 developmental_process | text                     |           |          |                   | extended |             |              | 
 primary_goal          | text                     |           |          |                   | extended |             |              | 
 expected_outcome_type | text                     |           |          |                   | extended |             |              | 
 cpt_codes             | text                     |           |          |                   | extended |             |              | 
 cdt_codes             | text                     |           |          |                   | extended |             |              | 
 alternative_paths     | text                     |           |          |                   | extended |             |              | 
Indexes:
    "rd_subcomponents_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "rd_subcomponents_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES rd_research_activities(id) ON DELETE CASCADE
Access method: heap

```

## Table: rd_supplies

### Detailed Structure
```
                                                       Table "public.rd_supplies"
   Column    |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id          | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_id | uuid                     |           | not null |                   | plain    |             |              | 
 name        | text                     |           | not null |                   | extended |             |              | 
 description | text                     |           |          |                   | extended |             |              | 
 annual_cost | numeric(10,2)            |           | not null |                   | main     |             |              | 
 created_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at  | timestamp with time zone |           |          | now()             | plain    |             |              | 
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
Access method: heap

```

## Table: rd_supply_subcomponents

### Detailed Structure
```
                                                    Table "public.rd_supply_subcomponents"
       Column       |           Type           | Collation | Nullable |      Default      | Storage | Compression | Stats target | Description 
--------------------+--------------------------+-----------+----------+-------------------+---------+-------------+--------------+-------------
 id                 | uuid                     |           | not null | gen_random_uuid() | plain   |             |              | 
 supply_id          | uuid                     |           | not null |                   | plain   |             |              | 
 subcomponent_id    | uuid                     |           | not null |                   | plain   |             |              | 
 business_year_id   | uuid                     |           | not null |                   | plain   |             |              | 
 applied_percentage | numeric(5,2)             |           | not null | 0                 | main    |             |              | 
 is_included        | boolean                  |           | not null | true              | plain   |             |              | 
 created_at         | timestamp with time zone |           |          | now()             | plain   |             |              | 
 updated_at         | timestamp with time zone |           |          | now()             | plain   |             |              | 
 amount_applied     | numeric                  |           |          |                   | main    |             |              | 
Indexes:
    "rd_supply_subcomponents_pkey" PRIMARY KEY, btree (id)
    "idx_rd_supply_subcomponents_business_year_id" btree (business_year_id)
    "idx_rd_supply_subcomponents_subcomponent_id" btree (subcomponent_id)
    "idx_rd_supply_subcomponents_supply_id" btree (supply_id)
    "rd_supply_subcomponents_unique" UNIQUE CONSTRAINT, btree (supply_id, subcomponent_id, business_year_id)
Foreign-key constraints:
    "rd_supply_subcomponents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_supply_subcomponents_subcomponent_id_fkey" FOREIGN KEY (subcomponent_id) REFERENCES rd_research_subcomponents(id) ON DELETE CASCADE
    "rd_supply_subcomponents_supply_id_fkey" FOREIGN KEY (supply_id) REFERENCES rd_supplies(id) ON DELETE CASCADE
Policies (row security disabled):
    POLICY "Users can delete their own supply subcomponents" FOR DELETE
      USING ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))))
    POLICY "Users can insert their own supply subcomponents" FOR INSERT
      WITH CHECK ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))))
    POLICY "Users can update their own supply subcomponents" FOR UPDATE
      USING ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))))
    POLICY "Users can view their own supply subcomponents" FOR SELECT
      USING ((EXISTS ( SELECT 1
   FROM (rd_supplies
     JOIN businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))))
Triggers:
    handle_rd_supply_subcomponents_updated_at BEFORE UPDATE ON rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
    set_updated_at_rd_supply_subcomponents BEFORE UPDATE ON rd_supply_subcomponents FOR EACH ROW EXECUTE FUNCTION set_updated_at()
Access method: heap

```

## Table: rd_supply_year_data

### Detailed Structure
```
                                                      Table "public.rd_supply_year_data"
      Column      |           Type           | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
------------------+--------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id               | uuid                     |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id | uuid                     |           | not null |                   | plain    |             |              | 
 name             | text                     |           | not null |                   | extended |             |              | 
 cost_amount      | numeric(15,2)            |           | not null |                   | main     |             |              | 
 applied_percent  | numeric(5,2)             |           | not null |                   | main     |             |              | 
 activity_link    | jsonb                    |           | not null |                   | extended |             |              | 
 created_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 updated_at       | timestamp with time zone |           |          | now()             | plain    |             |              | 
 supply_id        | uuid                     |           |          |                   | plain    |             |              | 
 calculated_qre   | numeric(15,2)            |           |          |                   | main     |             |              | 
Indexes:
    "rd_supply_year_data_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "rd_supply_year_data_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
    "rd_supply_year_data_supply_id_fkey" FOREIGN KEY (supply_id) REFERENCES rd_supplies(id) ON DELETE CASCADE
Policies (row security disabled):
    POLICY "Users can delete their own supply year data" FOR DELETE
      USING ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))))
    POLICY "Users can insert their own supply year data" FOR INSERT
      WITH CHECK ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))))
    POLICY "Users can update their own supply year data" FOR UPDATE
      USING ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))))
    POLICY "Users can view their own supply year data" FOR SELECT
      USING ((EXISTS ( SELECT 1
   FROM rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))))
Triggers:
    handle_rd_supply_year_data_updated_at BEFORE UPDATE ON rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
    set_updated_at_rd_supply_year_data BEFORE UPDATE ON rd_supply_year_data FOR EACH ROW EXECUTE FUNCTION set_updated_at()
Access method: heap

```

## Table: rd_support_documents

### Detailed Structure
```
                                                       Table "public.rd_support_documents"
      Column       |            Type             | Collation | Nullable |      Default      | Storage  | Compression | Stats target | Description 
-------------------+-----------------------------+-----------+----------+-------------------+----------+-------------+--------------+-------------
 id                | uuid                        |           | not null | gen_random_uuid() | plain    |             |              | 
 business_year_id  | uuid                        |           | not null |                   | plain    |             |              | 
 created_at        | timestamp without time zone |           |          | now()             | plain    |             |              | 
 updated_at        | timestamp without time zone |           |          | now()             | plain    |             |              | 
 document_type     | text                        |           |          |                   | extended |             |              | 
 uploaded_by       | text                        |           |          |                   | extended |             |              | 
 file_name         | text                        |           |          |                   | extended |             |              | 
 file_path         | text                        |           |          |                   | extended |             |              | 
 notes             | text                        |           |          |                   | extended |             |              | 
 ai_analysis       | text                        |           |          |                   | extended |             |              | 
 mime_type         | text                        |           |          |                   | extended |             |              | 
 upload_date       | text                        |           |          |                   | extended |             |              | 
 processing_status | text                        |           |          |                   | extended |             |              | 
 metadata          | text                        |           |          |                   | extended |             |              | 
 file_size         | bigint                      |           |          |                   | plain    |             |              | 
Indexes:
    "rd_support_documents_pkey" PRIMARY KEY, btree (id)
    "idx_support_docs_business_year" btree (business_year_id)
    "idx_support_docs_status" btree (processing_status)
    "idx_support_docs_type" btree (document_type)
Check constraints:
    "rd_support_documents_document_type_check" CHECK (document_type = ANY (ARRAY['invoice'::text, '1099'::text, 'procedure_report'::text]))
    "rd_support_documents_processing_status_check" CHECK (processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'manual_review'::text]))
Foreign-key constraints:
    "rd_support_documents_business_year_id_fkey" FOREIGN KEY (business_year_id) REFERENCES rd_business_years(id) ON DELETE CASCADE
Policies (row security enabled): (none)
Access method: heap

```


# SUMMARY OF ALL CONSTRAINTS

## Primary Keys
```
         table_name          |         constraint_name          | columns 
-----------------------------+----------------------------------+---------
 rd_areas                    | rd_areas_pkey                    | id
 rd_billable_time_summary    | rd_billable_time_summary_pkey    | id
 rd_business_years           | rd_business_years_pkey           | id
 rd_businesses               | rd_businesses_pkey               | id
 rd_client_portal_tokens     | rd_client_portal_tokens_pkey     | id
 rd_contractor_subcomponents | rd_contractor_subcomponents_pkey | id
 rd_contractor_year_data     | rd_contractor_year_data_pkey     | id
 rd_contractors              | rd_contractors_pkey              | id
 rd_document_links           | rd_document_links_pkey           | id
 rd_employee_subcomponents   | rd_employee_subcomponents_pkey   | id
 rd_employee_year_data       | rd_employee_year_data_pkey       | id
 rd_employees                | rd_employees_pkey                | id
 rd_expenses                 | rd_expenses_pkey                 | id
 rd_federal_credit           | rd_federal_credit_pkey           | id
 rd_federal_credit_results   | rd_federal_credit_results_pkey   | id
 rd_focuses                  | rd_focuses_pkey                  | id
 rd_procedure_analysis       | rd_procedure_analysis_pkey       | id
 rd_procedure_research_links | rd_procedure_research_links_pkey | id
 rd_qc_document_controls     | rd_qc_document_controls_pkey     | id
 rd_reports                  | rd_reports_pkey                  | id
 rd_research_activities      | rd_research_activities_pkey      | id
 rd_research_categories      | rd_research_categories_pkey      | id
 rd_research_raw             | rd_research_raw_pkey             | id
 rd_research_steps           | rd_research_steps_pkey           | id
 rd_research_subcomponents   | rd_research_subcomponents_pkey   | id
 rd_roles                    | rd_roles_pkey                    | id
 rd_selected_activities      | rd_selected_activities_pkey      | id
 rd_selected_filter          | rd_selected_filter_pkey          | id
 rd_selected_steps           | rd_selected_steps_pkey           | id
 rd_selected_subcomponents   | rd_selected_subcomponents_pkey   | id
 rd_signature_records        | rd_signature_records_pkey        | id
 rd_signatures               | rd_signatures_pkey               | id
 rd_state_calculations       | rd_state_calculations_pkey       | id
 rd_state_calculations_full  | rd_state_calculations_full_pkey  | id
 rd_state_credit_configs     | rd_state_credit_configs_pkey     | id
 rd_state_proforma_data      | rd_state_proforma_data_pkey      | id
 rd_state_proforma_lines     | rd_state_proforma_lines_pkey     | id
 rd_state_proformas          | rd_state_proformas_pkey          | id
 rd_subcomponents            | rd_subcomponents_pkey            | id
 rd_supplies                 | rd_supplies_pkey                 | id
 rd_supply_subcomponents     | rd_supply_subcomponents_pkey     | id
 rd_supply_year_data         | rd_supply_year_data_pkey         | id
 rd_support_documents        | rd_support_documents_pkey        | id
(43 rows)

```

## Foreign Keys
```
        source_table         |     source_column     |       target_table        | target_column |                    constraint_name                     
-----------------------------+-----------------------+---------------------------+---------------+--------------------------------------------------------
 rd_areas                    | category_id           | rd_research_categories    | id            | rd_areas_category_id_fkey
 rd_billable_time_summary    | business_year_id      | rd_business_years         | id            | rd_billable_time_summary_business_year_id_fkey
 rd_business_years           | business_id           | rd_businesses             | id            | rd_business_years_business_id_fkey
 rd_business_years           | credits_locked_by     | profiles                  | id            | rd_business_years_credits_locked_by_fkey
 rd_business_years           | documents_released_by | profiles                  | id            | rd_business_years_documents_released_by_fkey
 rd_business_years           | qc_approved_by        | profiles                  | id            | rd_business_years_qc_approved_by_fkey
 rd_businesses               | category_id           | rd_research_categories    | id            | rd_businesses_category_id_fkey
 rd_businesses               | client_id             | clients                   | id            | rd_businesses_client_id_fkey
 rd_client_portal_tokens     | business_id           | rd_businesses             | id            | rd_client_portal_tokens_business_id_fkey
 rd_contractor_subcomponents | business_year_id      | rd_business_years         | id            | rd_contractor_subcomponents_business_year_id_fkey
 rd_contractor_subcomponents | contractor_id         | rd_contractors            | id            | rd_contractor_subcomponents_contractor_id_fkey
 rd_contractor_subcomponents | subcomponent_id       | rd_research_subcomponents | id            | rd_contractor_subcomponents_subcomponent_id_fkey
 rd_contractor_year_data     | business_year_id      | rd_business_years         | id            | rd_contractor_year_data_business_year_id_fkey
 rd_contractor_year_data     | contractor_id         | rd_contractors            | id            | rd_contractor_year_data_contractor_id_fkey
 rd_contractors              | business_id           | rd_businesses             | id            | rd_contractors_business_id_fkey
 rd_contractors              | role_id               | rd_roles                  | id            | rd_contractors_role_id_fkey
 rd_contractors              | user_id               | profiles                  | id            | rd_contractors_user_id_fkey
 rd_employee_subcomponents   | business_year_id      | rd_business_years         | id            | rd_employee_subcomponents_business_year_id_fkey
 rd_employee_subcomponents   | employee_id           | rd_employees              | id            | rd_employee_subcomponents_employee_id_fkey
 rd_employee_subcomponents   | subcomponent_id       | rd_research_subcomponents | id            | rd_employee_subcomponents_subcomponent_id_fkey
 rd_employee_year_data       | business_year_id      | rd_business_years         | id            | rd_employee_year_data_business_year_id_fkey
 rd_employee_year_data       | employee_id           | rd_employees              | id            | rd_employee_year_data_employee_id_fkey
 rd_employees                | business_id           | rd_businesses             | id            | rd_employees_business_id_fkey
 rd_employees                | role_id               | rd_roles                  | id            | rd_employees_role_id_fkey
 rd_employees                | user_id               | profiles                  | id            | rd_employees_user_id_fkey
 rd_expenses                 | business_year_id      | rd_business_years         | id            | rd_expenses_business_year_id_fkey
 rd_expenses                 | employee_id           | rd_employees              | id            | rd_expenses_employee_id_fkey
 rd_expenses                 | research_activity_id  | rd_research_activities    | id            | rd_expenses_research_activity_id_fkey
 rd_expenses                 | step_id               | rd_research_steps         | id            | rd_expenses_step_id_fkey
 rd_expenses                 | subcomponent_id       | rd_research_subcomponents | id            | rd_expenses_subcomponent_id_fkey
 rd_federal_credit           | business_year_id      | rd_business_years         | id            | rd_federal_credit_business_year_id_fkey
 rd_federal_credit_results   | business_year_id      | rd_business_years         | id            | rd_federal_credit_results_business_year_id_fkey
 rd_focuses                  | area_id               | rd_areas                  | id            | rd_focuses_area_id_fkey
 rd_procedure_research_links | procedure_analysis_id | rd_procedure_analysis     | id            | rd_procedure_research_links_procedure_analysis_id_fkey
 rd_procedure_research_links | research_activity_id  | rd_research_activities    | id            | rd_procedure_research_links_research_activity_id_fkey
 rd_qc_document_controls     | business_year_id      | rd_business_years         | id            | rd_qc_document_controls_business_year_id_fkey
 rd_reports                  | business_id           | rd_businesses             | id            | rd_reports_business_id_fkey
 rd_reports                  | business_year_id      | rd_business_years         | id            | rd_reports_business_year_id_fkey
 rd_research_activities      | focus_id              | rd_focuses                | id            | rd_research_activities_focus_id_fkey
 rd_research_steps           | research_activity_id  | rd_research_activities    | id            | rd_research_steps_research_activity_id_fkey
 rd_research_subcomponents   | step_id               | rd_research_steps         | id            | rd_research_subcomponents_step_id_fkey
 rd_roles                    | business_id           | rd_businesses             | id            | rd_roles_business_id_fkey
 rd_roles                    | business_year_id      | rd_business_years         | id            | rd_roles_business_year_id_fkey
 rd_roles                    | parent_id             | rd_roles                  | id            | rd_roles_parent_id_fkey
 rd_selected_activities      | activity_id           | rd_research_activities    | id            | rd_selected_activities_activity_id_fkey
 rd_selected_activities      | business_year_id      | rd_business_years         | id            | rd_selected_activities_business_year_id_fkey
 rd_selected_filter          | business_year_id      | rd_business_years         | id            | rd_selected_filter_business_year_id_fkey
 rd_selected_steps           | business_year_id      | rd_business_years         | id            | rd_selected_steps_business_year_id_fkey
 rd_selected_steps           | research_activity_id  | rd_research_activities    | id            | rd_selected_steps_research_activity_id_fkey
 rd_selected_steps           | step_id               | rd_research_steps         | id            | rd_selected_steps_step_id_fkey
 rd_selected_subcomponents   | business_year_id      | rd_business_years         | id            | rd_selected_subcomponents_business_year_id_fkey
 rd_selected_subcomponents   | research_activity_id  | rd_research_activities    | id            | rd_selected_subcomponents_research_activity_id_fkey
 rd_selected_subcomponents   | step_id               | rd_research_steps         | id            | rd_selected_subcomponents_step_id_fkey
 rd_selected_subcomponents   | subcomponent_id       | rd_research_subcomponents | id            | rd_selected_subcomponents_subcomponent_id_fkey
 rd_signature_records        | business_year_id      | rd_business_years         | id            | rd_signature_records_business_year_id_fkey
 rd_state_proforma_data      | business_year_id      | rd_business_years         | id            | rd_state_proforma_data_business_year_id_fkey
 rd_state_proformas          | business_year_id      | rd_business_years         | id            | rd_state_proformas_business_year_id_fkey
 rd_subcomponents            | activity_id           | rd_research_activities    | id            | rd_subcomponents_activity_id_fkey
 rd_supplies                 | business_id           | rd_businesses             | id            | rd_supplies_business_id_fkey
 rd_supply_subcomponents     | business_year_id      | rd_business_years         | id            | rd_supply_subcomponents_business_year_id_fkey
 rd_supply_subcomponents     | subcomponent_id       | rd_research_subcomponents | id            | rd_supply_subcomponents_subcomponent_id_fkey
 rd_supply_subcomponents     | supply_id             | rd_supplies               | id            | rd_supply_subcomponents_supply_id_fkey
 rd_supply_year_data         | business_year_id      | rd_business_years         | id            | rd_supply_year_data_business_year_id_fkey
 rd_supply_year_data         | supply_id             | rd_supplies               | id            | rd_supply_year_data_supply_id_fkey
 rd_support_documents        | business_year_id      | rd_business_years         | id            | rd_support_documents_business_year_id_fkey
(65 rows)

```

## Unique Constraints
```
         table_name          |                        constraint_name                         |                     columns                      
-----------------------------+----------------------------------------------------------------+--------------------------------------------------
 rd_areas                    | unique_area_name_per_category                                  | name, category_id
 rd_client_portal_tokens     | rd_client_portal_tokens_token_key                              | token
 rd_contractor_subcomponents | rd_contractor_subcomponents_unique                             | contractor_id, subcomponent_id, business_year_id
 rd_employee_subcomponents   | rd_employee_subcomponents_unique                               | employee_id, subcomponent_id, business_year_id
 rd_federal_credit_results   | rd_federal_credit_results_unique                               | business_year_id
 rd_focuses                  | unique_focus_name_per_area                                     | name, area_id
 rd_research_activities      | unique_activity_per_focus                                      | title, focus_id
 rd_research_categories      | rd_research_categories_name_key                                | name
 rd_research_categories      | unique_category_name                                           | name
 rd_selected_filter          | rd_selected_filter_business_year_id_key                        | business_year_id
 rd_selected_steps           | rd_selected_steps_business_year_id_step_id_key                 | business_year_id, step_id
 rd_selected_subcomponents   | rd_selected_subcomponents_business_year_id_subcomponent_id_key | business_year_id, subcomponent_id
 rd_supply_subcomponents     | rd_supply_subcomponents_unique                                 | supply_id, subcomponent_id, business_year_id
(13 rows)

```

## All Indexes
```
 schemaname |          tablename          |                           indexname                            |                                                                                       indexdef                                                                                        
------------+-----------------------------+----------------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 public     | rd_areas                    | rd_areas_pkey                                                  | CREATE UNIQUE INDEX rd_areas_pkey ON public.rd_areas USING btree (id)
 public     | rd_areas                    | unique_area_name_per_category                                  | CREATE UNIQUE INDEX unique_area_name_per_category ON public.rd_areas USING btree (name, category_id)
 public     | rd_billable_time_summary    | idx_billable_summary_activity                                  | CREATE INDEX idx_billable_summary_activity ON public.rd_billable_time_summary USING btree (research_activity_id)
 public     | rd_billable_time_summary    | idx_billable_summary_business_year                             | CREATE INDEX idx_billable_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id)
 public     | rd_billable_time_summary    | idx_rd_billable_time_summary_business_year                     | CREATE INDEX idx_rd_billable_time_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id)
 public     | rd_billable_time_summary    | rd_billable_time_summary_pkey                                  | CREATE UNIQUE INDEX rd_billable_time_summary_pkey ON public.rd_billable_time_summary USING btree (id)
 public     | rd_business_years           | idx_rd_business_years_business_setup_completed                 | CREATE INDEX idx_rd_business_years_business_setup_completed ON public.rd_business_years USING btree (business_setup_completed) WHERE (business_setup_completed = true)
 public     | rd_business_years           | idx_rd_business_years_business_year                            | CREATE INDEX idx_rd_business_years_business_year ON public.rd_business_years USING btree (business_id, year)
 public     | rd_business_years           | idx_rd_business_years_calculations_completed                   | CREATE INDEX idx_rd_business_years_calculations_completed ON public.rd_business_years USING btree (calculations_completed) WHERE (calculations_completed = true)
 public     | rd_business_years           | idx_rd_business_years_completion_percentage                    | CREATE INDEX idx_rd_business_years_completion_percentage ON public.rd_business_years USING btree (overall_completion_percentage)
 public     | rd_business_years           | idx_rd_business_years_credits_locked                           | CREATE INDEX idx_rd_business_years_credits_locked ON public.rd_business_years USING btree (credits_locked) WHERE (credits_locked = true)
 public     | rd_business_years           | idx_rd_business_years_research_activities_completed            | CREATE INDEX idx_rd_business_years_research_activities_completed ON public.rd_business_years USING btree (research_activities_completed) WHERE (research_activities_completed = true)
 public     | rd_business_years           | idx_rd_business_years_research_design_completed                | CREATE INDEX idx_rd_business_years_research_design_completed ON public.rd_business_years USING btree (research_design_completed) WHERE (research_design_completed = true)
 public     | rd_business_years           | rd_business_years_pkey                                         | CREATE UNIQUE INDEX rd_business_years_pkey ON public.rd_business_years USING btree (id)
 public     | rd_businesses               | idx_rd_businesses_category_id                                  | CREATE INDEX idx_rd_businesses_category_id ON public.rd_businesses USING btree (category_id)
 public     | rd_businesses               | idx_rd_businesses_ein                                          | CREATE INDEX idx_rd_businesses_ein ON public.rd_businesses USING btree (ein) WHERE (ein IS NOT NULL)
 public     | rd_businesses               | idx_rd_businesses_github_token_exists                          | CREATE INDEX idx_rd_businesses_github_token_exists ON public.rd_businesses USING btree (github_token) WHERE (github_token IS NOT NULL)
 public     | rd_businesses               | idx_rd_businesses_historical_data                              | CREATE INDEX idx_rd_businesses_historical_data ON public.rd_businesses USING gin (historical_data)
 public     | rd_businesses               | rd_businesses_pkey                                             | CREATE UNIQUE INDEX rd_businesses_pkey ON public.rd_businesses USING btree (id)
 public     | rd_client_portal_tokens     | idx_rd_client_portal_tokens_active                             | CREATE INDEX idx_rd_client_portal_tokens_active ON public.rd_client_portal_tokens USING btree (business_id, is_active, expires_at) WHERE (is_active = true)
 public     | rd_client_portal_tokens     | idx_rd_client_portal_tokens_business                           | CREATE INDEX idx_rd_client_portal_tokens_business ON public.rd_client_portal_tokens USING btree (business_id)
 public     | rd_client_portal_tokens     | idx_rd_client_portal_tokens_business_active                    | CREATE INDEX idx_rd_client_portal_tokens_business_active ON public.rd_client_portal_tokens USING btree (business_id, is_active)
 public     | rd_client_portal_tokens     | idx_rd_client_portal_tokens_business_id                        | CREATE INDEX idx_rd_client_portal_tokens_business_id ON public.rd_client_portal_tokens USING btree (business_id)
 public     | rd_client_portal_tokens     | idx_rd_client_portal_tokens_token                              | CREATE INDEX idx_rd_client_portal_tokens_token ON public.rd_client_portal_tokens USING btree (token)
 public     | rd_client_portal_tokens     | rd_client_portal_tokens_pkey                                   | CREATE UNIQUE INDEX rd_client_portal_tokens_pkey ON public.rd_client_portal_tokens USING btree (id)
 public     | rd_client_portal_tokens     | rd_client_portal_tokens_token_key                              | CREATE UNIQUE INDEX rd_client_portal_tokens_token_key ON public.rd_client_portal_tokens USING btree (token)
 public     | rd_contractor_subcomponents | idx_rd_contractor_subcomponents_business_year_id               | CREATE INDEX idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents USING btree (business_year_id)
 public     | rd_contractor_subcomponents | idx_rd_contractor_subcomponents_contractor_id                  | CREATE INDEX idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents USING btree (contractor_id)
 public     | rd_contractor_subcomponents | idx_rd_contractor_subcomponents_subcomponent_id                | CREATE INDEX idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents USING btree (subcomponent_id)
 public     | rd_contractor_subcomponents | idx_rd_contractor_subcomponents_user_id                        | CREATE INDEX idx_rd_contractor_subcomponents_user_id ON public.rd_contractor_subcomponents USING btree (user_id)
 public     | rd_contractor_subcomponents | rd_contractor_subcomponents_pkey                               | CREATE UNIQUE INDEX rd_contractor_subcomponents_pkey ON public.rd_contractor_subcomponents USING btree (id)
 public     | rd_contractor_subcomponents | rd_contractor_subcomponents_unique                             | CREATE UNIQUE INDEX rd_contractor_subcomponents_unique ON public.rd_contractor_subcomponents USING btree (contractor_id, subcomponent_id, business_year_id)
 public     | rd_contractor_year_data     | idx_rd_contractor_year_data_business_year_id                   | CREATE INDEX idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data USING btree (business_year_id)
 public     | rd_contractor_year_data     | idx_rd_contractor_year_data_contractor_id                      | CREATE INDEX idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data USING btree (contractor_id)
 public     | rd_contractor_year_data     | idx_rd_contractor_year_data_user_id                            | CREATE INDEX idx_rd_contractor_year_data_user_id ON public.rd_contractor_year_data USING btree (user_id)
 public     | rd_contractor_year_data     | rd_contractor_year_data_pkey                                   | CREATE UNIQUE INDEX rd_contractor_year_data_pkey ON public.rd_contractor_year_data USING btree (id)
 public     | rd_contractors              | idx_rd_contractors_business_id                                 | CREATE INDEX idx_rd_contractors_business_id ON public.rd_contractors USING btree (business_id)
 public     | rd_contractors              | idx_rd_contractors_role_id                                     | CREATE INDEX idx_rd_contractors_role_id ON public.rd_contractors USING btree (role_id)
 public     | rd_contractors              | idx_rd_contractors_user_id                                     | CREATE INDEX idx_rd_contractors_user_id ON public.rd_contractors USING btree (user_id)
 public     | rd_contractors              | rd_contractors_pkey                                            | CREATE UNIQUE INDEX rd_contractors_pkey ON public.rd_contractors USING btree (id)
 public     | rd_document_links           | idx_document_links_contractor                                  | CREATE INDEX idx_document_links_contractor ON public.rd_document_links USING btree (contractor_id)
 public     | rd_document_links           | idx_document_links_doc                                         | CREATE INDEX idx_document_links_doc ON public.rd_document_links USING btree (document_id)
 public     | rd_document_links           | idx_document_links_supply                                      | CREATE INDEX idx_document_links_supply ON public.rd_document_links USING btree (supply_id)
 public     | rd_document_links           | rd_document_links_pkey                                         | CREATE UNIQUE INDEX rd_document_links_pkey ON public.rd_document_links USING btree (id)
 public     | rd_employee_subcomponents   | idx_rd_employee_subcomponents_employee_id                      | CREATE INDEX idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents USING btree (employee_id)
 public     | rd_employee_subcomponents   | idx_rd_employee_subcomponents_subcomponent_id                  | CREATE INDEX idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents USING btree (subcomponent_id)
 public     | rd_employee_subcomponents   | idx_rd_employee_subcomponents_user_id                          | CREATE INDEX idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents USING btree (user_id)
 public     | rd_employee_subcomponents   | rd_employee_subcomponents_pkey                                 | CREATE UNIQUE INDEX rd_employee_subcomponents_pkey ON public.rd_employee_subcomponents USING btree (id)
 public     | rd_employee_subcomponents   | rd_employee_subcomponents_unique                               | CREATE UNIQUE INDEX rd_employee_subcomponents_unique ON public.rd_employee_subcomponents USING btree (employee_id, subcomponent_id, business_year_id)
 public     | rd_employee_year_data       | idx_rd_employee_year_data_employee_year                        | CREATE INDEX idx_rd_employee_year_data_employee_year ON public.rd_employee_year_data USING btree (employee_id, business_year_id)
 public     | rd_employee_year_data       | idx_rd_employee_year_data_user_id                              | CREATE INDEX idx_rd_employee_year_data_user_id ON public.rd_employee_year_data USING btree (user_id)
 public     | rd_employee_year_data       | rd_employee_year_data_pkey                                     | CREATE UNIQUE INDEX rd_employee_year_data_pkey ON public.rd_employee_year_data USING btree (id)
 public     | rd_employees                | idx_rd_employees_user_id                                       | CREATE INDEX idx_rd_employees_user_id ON public.rd_employees USING btree (user_id)
 public     | rd_employees                | rd_employees_pkey                                              | CREATE UNIQUE INDEX rd_employees_pkey ON public.rd_employees USING btree (id)
 public     | rd_expenses                 | idx_rd_expenses_business_year_id                               | CREATE INDEX idx_rd_expenses_business_year_id ON public.rd_expenses USING btree (business_year_id)
 public     | rd_expenses                 | idx_rd_expenses_category                                       | CREATE INDEX idx_rd_expenses_category ON public.rd_expenses USING btree (category)
 public     | rd_expenses                 | idx_rd_expenses_employee_id                                    | CREATE INDEX idx_rd_expenses_employee_id ON public.rd_expenses USING btree (employee_id)
 public     | rd_expenses                 | rd_expenses_pkey                                               | CREATE UNIQUE INDEX rd_expenses_pkey ON public.rd_expenses USING btree (id)
 public     | rd_federal_credit           | idx_rd_federal_credit_activity                                 | CREATE INDEX idx_rd_federal_credit_activity ON public.rd_federal_credit USING btree (research_activity_id)
 public     | rd_federal_credit           | idx_rd_federal_credit_business_year                            | CREATE INDEX idx_rd_federal_credit_business_year ON public.rd_federal_credit USING btree (business_year_id)
 public     | rd_federal_credit           | idx_rd_federal_credit_client                                   | CREATE INDEX idx_rd_federal_credit_client ON public.rd_federal_credit USING btree (client_id)
 public     | rd_federal_credit           | idx_rd_federal_credit_created_at                               | CREATE INDEX idx_rd_federal_credit_created_at ON public.rd_federal_credit USING btree (created_at)
 public     | rd_federal_credit           | idx_rd_federal_credit_latest                                   | CREATE INDEX idx_rd_federal_credit_latest ON public.rd_federal_credit USING btree (is_latest) WHERE (is_latest = true)
 public     | rd_federal_credit           | rd_federal_credit_pkey                                         | CREATE UNIQUE INDEX rd_federal_credit_pkey ON public.rd_federal_credit USING btree (id)
 public     | rd_federal_credit_results   | idx_rd_federal_credit_results_business_year_id                 | CREATE INDEX idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results USING btree (business_year_id)
 public     | rd_federal_credit_results   | idx_rd_federal_credit_results_calculation_date                 | CREATE INDEX idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results USING btree (calculation_date)
 public     | rd_federal_credit_results   | rd_federal_credit_results_pkey                                 | CREATE UNIQUE INDEX rd_federal_credit_results_pkey ON public.rd_federal_credit_results USING btree (id)
 public     | rd_federal_credit_results   | rd_federal_credit_results_unique                               | CREATE UNIQUE INDEX rd_federal_credit_results_unique ON public.rd_federal_credit_results USING btree (business_year_id)
 public     | rd_focuses                  | rd_focuses_pkey                                                | CREATE UNIQUE INDEX rd_focuses_pkey ON public.rd_focuses USING btree (id)
 public     | rd_focuses                  | unique_focus_name_per_area                                     | CREATE UNIQUE INDEX unique_focus_name_per_area ON public.rd_focuses USING btree (name, area_id)
 public     | rd_procedure_analysis       | idx_procedure_analysis_code                                    | CREATE INDEX idx_procedure_analysis_code ON public.rd_procedure_analysis USING btree (procedure_code)
 public     | rd_procedure_analysis       | idx_procedure_analysis_doc                                     | CREATE INDEX idx_procedure_analysis_doc ON public.rd_procedure_analysis USING btree (document_id)
 public     | rd_procedure_analysis       | rd_procedure_analysis_pkey                                     | CREATE UNIQUE INDEX rd_procedure_analysis_pkey ON public.rd_procedure_analysis USING btree (id)
 public     | rd_procedure_research_links | idx_procedure_links_activity                                   | CREATE INDEX idx_procedure_links_activity ON public.rd_procedure_research_links USING btree (research_activity_id)
 public     | rd_procedure_research_links | idx_procedure_links_status                                     | CREATE INDEX idx_procedure_links_status ON public.rd_procedure_research_links USING btree (status)
 public     | rd_procedure_research_links | idx_unique_procedure_research_link                             | CREATE UNIQUE INDEX idx_unique_procedure_research_link ON public.rd_procedure_research_links USING btree (procedure_analysis_id, research_activity_id, subcomponent_id)
 public     | rd_procedure_research_links | rd_procedure_research_links_pkey                               | CREATE UNIQUE INDEX rd_procedure_research_links_pkey ON public.rd_procedure_research_links USING btree (id)
 public     | rd_qc_document_controls     | idx_rd_qc_document_controls_business_year                      | CREATE INDEX idx_rd_qc_document_controls_business_year ON public.rd_qc_document_controls USING btree (business_year_id)
 public     | rd_qc_document_controls     | idx_rd_qc_document_controls_qc_approved_date                   | CREATE INDEX idx_rd_qc_document_controls_qc_approved_date ON public.rd_qc_document_controls USING btree (qc_approved_date) WHERE (qc_approved_date IS NOT NULL)
 public     | rd_qc_document_controls     | idx_rd_qc_document_controls_released                           | CREATE INDEX idx_rd_qc_document_controls_released ON public.rd_qc_document_controls USING btree (is_released)
 public     | rd_qc_document_controls     | idx_rd_qc_document_controls_type                               | CREATE INDEX idx_rd_qc_document_controls_type ON public.rd_qc_document_controls USING btree (document_type)
 public     | rd_qc_document_controls     | rd_qc_document_controls_pkey                                   | CREATE UNIQUE INDEX rd_qc_document_controls_pkey ON public.rd_qc_document_controls USING btree (id)
 public     | rd_reports                  | idx_rd_reports_business_year_type                              | CREATE INDEX idx_rd_reports_business_year_type ON public.rd_reports USING btree (business_year_id, type)
 public     | rd_reports                  | idx_rd_reports_html_not_null                                   | CREATE INDEX idx_rd_reports_html_not_null ON public.rd_reports USING btree (business_year_id, type) WHERE (generated_html IS NOT NULL)
 public     | rd_reports                  | idx_rd_reports_qc_approved_at                                  | CREATE INDEX idx_rd_reports_qc_approved_at ON public.rd_reports USING btree (qc_approved_at) WHERE (qc_approved_at IS NOT NULL)
 public     | rd_reports                  | idx_rd_reports_state_gross_receipts                            | CREATE INDEX idx_rd_reports_state_gross_receipts ON public.rd_reports USING gin (state_gross_receipts)
 public     | rd_reports                  | rd_reports_pkey                                                | CREATE UNIQUE INDEX rd_reports_pkey ON public.rd_reports USING btree (id)
 public     | rd_research_activities      | idx_rd_research_activities_business_id                         | CREATE INDEX idx_rd_research_activities_business_id ON public.rd_research_activities USING btree (business_id)
 public     | rd_research_activities      | idx_rd_research_activities_global                              | CREATE INDEX idx_rd_research_activities_global ON public.rd_research_activities USING btree (id) WHERE (business_id IS NULL)
 public     | rd_research_activities      | rd_research_activities_pkey                                    | CREATE UNIQUE INDEX rd_research_activities_pkey ON public.rd_research_activities USING btree (id)
 public     | rd_research_activities      | unique_activity_per_focus                                      | CREATE UNIQUE INDEX unique_activity_per_focus ON public.rd_research_activities USING btree (title, focus_id)
 public     | rd_research_categories      | rd_research_categories_name_key                                | CREATE UNIQUE INDEX rd_research_categories_name_key ON public.rd_research_categories USING btree (name)
 public     | rd_research_categories      | rd_research_categories_pkey                                    | CREATE UNIQUE INDEX rd_research_categories_pkey ON public.rd_research_categories USING btree (id)
 public     | rd_research_categories      | unique_category_name                                           | CREATE UNIQUE INDEX unique_category_name ON public.rd_research_categories USING btree (name)
 public     | rd_research_raw             | rd_research_raw_pkey                                           | CREATE UNIQUE INDEX rd_research_raw_pkey ON public.rd_research_raw USING btree (id)
 public     | rd_research_steps           | idx_rd_research_steps_activity_id                              | CREATE INDEX idx_rd_research_steps_activity_id ON public.rd_research_steps USING btree (research_activity_id)
 public     | rd_research_steps           | idx_rd_research_steps_activity_step_order                      | CREATE INDEX idx_rd_research_steps_activity_step_order ON public.rd_research_steps USING btree (research_activity_id, step_order)
 public     | rd_research_steps           | idx_rd_research_steps_business_id                              | CREATE INDEX idx_rd_research_steps_business_id ON public.rd_research_steps USING btree (business_id)
 public     | rd_research_steps           | rd_research_steps_pkey                                         | CREATE UNIQUE INDEX rd_research_steps_pkey ON public.rd_research_steps USING btree (id)
 public     | rd_research_subcomponents   | idx_rd_research_subcomponents_business_id                      | CREATE INDEX idx_rd_research_subcomponents_business_id ON public.rd_research_subcomponents USING btree (business_id)
 public     | rd_research_subcomponents   | idx_rd_research_subcomponents_step_id                          | CREATE INDEX idx_rd_research_subcomponents_step_id ON public.rd_research_subcomponents USING btree (step_id)
 public     | rd_research_subcomponents   | rd_research_subcomponents_pkey                                 | CREATE UNIQUE INDEX rd_research_subcomponents_pkey ON public.rd_research_subcomponents USING btree (id)
 public     | rd_roles                    | idx_rd_roles_business_year_id                                  | CREATE INDEX idx_rd_roles_business_year_id ON public.rd_roles USING btree (business_year_id)
 public     | rd_roles                    | idx_rd_roles_is_default                                        | CREATE INDEX idx_rd_roles_is_default ON public.rd_roles USING btree (is_default)
 public     | rd_roles                    | idx_rd_roles_type                                              | CREATE INDEX idx_rd_roles_type ON public.rd_roles USING btree (type)
 public     | rd_roles                    | idx_rd_roles_unique_default_per_year                           | CREATE UNIQUE INDEX idx_rd_roles_unique_default_per_year ON public.rd_roles USING btree (business_year_id, is_default) WHERE (is_default = true)
 public     | rd_roles                    | rd_roles_pkey                                                  | CREATE UNIQUE INDEX rd_roles_pkey ON public.rd_roles USING btree (id)
 public     | rd_selected_activities      | idx_rd_selected_activities_business_year_activity              | CREATE INDEX idx_rd_selected_activities_business_year_activity ON public.rd_selected_activities USING btree (business_year_id, activity_id)
 public     | rd_selected_activities      | rd_selected_activities_pkey                                    | CREATE UNIQUE INDEX rd_selected_activities_pkey ON public.rd_selected_activities USING btree (id)
 public     | rd_selected_filter          | rd_selected_filter_business_year_id_key                        | CREATE UNIQUE INDEX rd_selected_filter_business_year_id_key ON public.rd_selected_filter USING btree (business_year_id)
 public     | rd_selected_filter          | rd_selected_filter_pkey                                        | CREATE UNIQUE INDEX rd_selected_filter_pkey ON public.rd_selected_filter USING btree (id)
 public     | rd_selected_steps           | idx_rd_selected_steps_activity                                 | CREATE INDEX idx_rd_selected_steps_activity ON public.rd_selected_steps USING btree (research_activity_id)
 public     | rd_selected_steps           | idx_rd_selected_steps_business_year                            | CREATE INDEX idx_rd_selected_steps_business_year ON public.rd_selected_steps USING btree (business_year_id)
 public     | rd_selected_steps           | rd_selected_steps_business_year_id_step_id_key                 | CREATE UNIQUE INDEX rd_selected_steps_business_year_id_step_id_key ON public.rd_selected_steps USING btree (business_year_id, step_id)
 public     | rd_selected_steps           | rd_selected_steps_pkey                                         | CREATE UNIQUE INDEX rd_selected_steps_pkey ON public.rd_selected_steps USING btree (id)
 public     | rd_selected_subcomponents   | idx_rd_selected_subcomponents_activity                         | CREATE INDEX idx_rd_selected_subcomponents_activity ON public.rd_selected_subcomponents USING btree (research_activity_id)
 public     | rd_selected_subcomponents   | idx_rd_selected_subcomponents_business_year                    | CREATE INDEX idx_rd_selected_subcomponents_business_year ON public.rd_selected_subcomponents USING btree (business_year_id)
 public     | rd_selected_subcomponents   | idx_rd_selected_subcomponents_step                             | CREATE INDEX idx_rd_selected_subcomponents_step ON public.rd_selected_subcomponents USING btree (step_id)
 public     | rd_selected_subcomponents   | rd_selected_subcomponents_business_year_id_subcomponent_id_key | CREATE UNIQUE INDEX rd_selected_subcomponents_business_year_id_subcomponent_id_key ON public.rd_selected_subcomponents USING btree (business_year_id, subcomponent_id)
 public     | rd_selected_subcomponents   | rd_selected_subcomponents_pkey                                 | CREATE UNIQUE INDEX rd_selected_subcomponents_pkey ON public.rd_selected_subcomponents USING btree (id)
 public     | rd_signature_records        | idx_rd_signature_records_business_year_id                      | CREATE INDEX idx_rd_signature_records_business_year_id ON public.rd_signature_records USING btree (business_year_id)
 public     | rd_signature_records        | idx_rd_signature_records_signed_at                             | CREATE INDEX idx_rd_signature_records_signed_at ON public.rd_signature_records USING btree (signed_at)
 public     | rd_signature_records        | rd_signature_records_pkey                                      | CREATE UNIQUE INDEX rd_signature_records_pkey ON public.rd_signature_records USING btree (id)
 public     | rd_signatures               | idx_rd_signatures_business_year                                | CREATE INDEX idx_rd_signatures_business_year ON public.rd_signatures USING btree (business_year_id)
 public     | rd_signatures               | idx_rd_signatures_signed_at                                    | CREATE INDEX idx_rd_signatures_signed_at ON public.rd_signatures USING btree (signed_at)
 public     | rd_signatures               | idx_rd_signatures_type                                         | CREATE INDEX idx_rd_signatures_type ON public.rd_signatures USING btree (signature_type)
 public     | rd_signatures               | rd_signatures_pkey                                             | CREATE UNIQUE INDEX rd_signatures_pkey ON public.rd_signatures USING btree (id)
 public     | rd_state_calculations       | idx_state_calculations_active                                  | CREATE INDEX idx_state_calculations_active ON public.rd_state_calculations USING btree (is_active)
 public     | rd_state_calculations       | idx_state_calculations_state                                   | CREATE INDEX idx_state_calculations_state ON public.rd_state_calculations USING btree (state)
 public     | rd_state_calculations       | idx_state_calculations_unique                                  | CREATE UNIQUE INDEX idx_state_calculations_unique ON public.rd_state_calculations USING btree (state, start_year) WHERE (is_active = true)
 public     | rd_state_calculations       | idx_state_calculations_year                                    | CREATE INDEX idx_state_calculations_year ON public.rd_state_calculations USING btree (start_year, end_year)
 public     | rd_state_calculations       | rd_state_calculations_pkey                                     | CREATE UNIQUE INDEX rd_state_calculations_pkey ON public.rd_state_calculations USING btree (id)
 public     | rd_state_calculations_full  | rd_state_calculations_full_pkey                                | CREATE UNIQUE INDEX rd_state_calculations_full_pkey ON public.rd_state_calculations_full USING btree (id)
 public     | rd_state_credit_configs     | idx_state_credit_configs_state_code                            | CREATE INDEX idx_state_credit_configs_state_code ON public.rd_state_credit_configs USING btree (state_code)
 public     | rd_state_credit_configs     | rd_state_credit_configs_pkey                                   | CREATE UNIQUE INDEX rd_state_credit_configs_pkey ON public.rd_state_credit_configs USING btree (id)
 public     | rd_state_proforma_data      | idx_rd_state_proforma_data_lookup                              | CREATE INDEX idx_rd_state_proforma_data_lookup ON public.rd_state_proforma_data USING btree (business_year_id, state_code, method)
 public     | rd_state_proforma_data      | rd_state_proforma_data_pkey                                    | CREATE UNIQUE INDEX rd_state_proforma_data_pkey ON public.rd_state_proforma_data USING btree (id)
 public     | rd_state_proforma_lines     | idx_state_proforma_lines_state_proforma_id                     | CREATE INDEX idx_state_proforma_lines_state_proforma_id ON public.rd_state_proforma_lines USING btree (state_proforma_id)
 public     | rd_state_proforma_lines     | rd_state_proforma_lines_pkey                                   | CREATE UNIQUE INDEX rd_state_proforma_lines_pkey ON public.rd_state_proforma_lines USING btree (id)
 public     | rd_state_proformas          | idx_state_proformas_business_year                              | CREATE INDEX idx_state_proformas_business_year ON public.rd_state_proformas USING btree (business_year_id)
 public     | rd_state_proformas          | rd_state_proformas_pkey                                        | CREATE UNIQUE INDEX rd_state_proformas_pkey ON public.rd_state_proformas USING btree (id)
 public     | rd_subcomponents            | rd_subcomponents_pkey                                          | CREATE UNIQUE INDEX rd_subcomponents_pkey ON public.rd_subcomponents USING btree (id)
 public     | rd_supplies                 | idx_rd_supplies_business_id                                    | CREATE INDEX idx_rd_supplies_business_id ON public.rd_supplies USING btree (business_id)
 public     | rd_supplies                 | rd_supplies_pkey                                               | CREATE UNIQUE INDEX rd_supplies_pkey ON public.rd_supplies USING btree (id)
 public     | rd_supply_subcomponents     | idx_rd_supply_subcomponents_business_year_id                   | CREATE INDEX idx_rd_supply_subcomponents_business_year_id ON public.rd_supply_subcomponents USING btree (business_year_id)
 public     | rd_supply_subcomponents     | idx_rd_supply_subcomponents_subcomponent_id                    | CREATE INDEX idx_rd_supply_subcomponents_subcomponent_id ON public.rd_supply_subcomponents USING btree (subcomponent_id)
 public     | rd_supply_subcomponents     | idx_rd_supply_subcomponents_supply_id                          | CREATE INDEX idx_rd_supply_subcomponents_supply_id ON public.rd_supply_subcomponents USING btree (supply_id)
 public     | rd_supply_subcomponents     | rd_supply_subcomponents_pkey                                   | CREATE UNIQUE INDEX rd_supply_subcomponents_pkey ON public.rd_supply_subcomponents USING btree (id)
 public     | rd_supply_subcomponents     | rd_supply_subcomponents_unique                                 | CREATE UNIQUE INDEX rd_supply_subcomponents_unique ON public.rd_supply_subcomponents USING btree (supply_id, subcomponent_id, business_year_id)
 public     | rd_supply_year_data         | rd_supply_year_data_pkey                                       | CREATE UNIQUE INDEX rd_supply_year_data_pkey ON public.rd_supply_year_data USING btree (id)
 public     | rd_support_documents        | idx_support_docs_business_year                                 | CREATE INDEX idx_support_docs_business_year ON public.rd_support_documents USING btree (business_year_id)
 public     | rd_support_documents        | idx_support_docs_status                                        | CREATE INDEX idx_support_docs_status ON public.rd_support_documents USING btree (processing_status)
 public     | rd_support_documents        | idx_support_docs_type                                          | CREATE INDEX idx_support_docs_type ON public.rd_support_documents USING btree (document_type)
 public     | rd_support_documents        | rd_support_documents_pkey                                      | CREATE UNIQUE INDEX rd_support_documents_pkey ON public.rd_support_documents USING btree (id)
(154 rows)

```
