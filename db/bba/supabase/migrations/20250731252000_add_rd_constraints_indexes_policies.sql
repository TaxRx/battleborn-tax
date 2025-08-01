-- Add missing constraints, indexes, and policies for rd_* tables
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: INDEXES for rd_* tables
-- =============================================================================

CREATE INDEX idx_billable_summary_activity ON public.rd_billable_time_summary USING btree (research_activity_id);
CREATE INDEX idx_billable_summary_business_year ON public.rd_billable_time_summary USING btree (business_year_id);
CREATE INDEX idx_document_links_contractor ON public.rd_document_links USING btree (contractor_id);
CREATE INDEX idx_document_links_doc ON public.rd_document_links USING btree (document_id);
CREATE INDEX idx_document_links_supply ON public.rd_document_links USING btree (supply_id);
CREATE INDEX idx_procedure_analysis_code ON public.rd_procedure_analysis USING btree (procedure_code);
CREATE INDEX idx_procedure_analysis_doc ON public.rd_procedure_analysis USING btree (document_id);
CREATE INDEX idx_procedure_links_activity ON public.rd_procedure_research_links USING btree (research_activity_id);
CREATE INDEX idx_procedure_links_status ON public.rd_procedure_research_links USING btree (status);
CREATE INDEX idx_rd_business_years_business_setup_completed ON public.rd_business_years USING btree (business_setup_completed) WHERE (business_setup_completed = true);
CREATE INDEX idx_rd_business_years_business_year ON public.rd_business_years USING btree (business_id, year);
CREATE INDEX idx_rd_business_years_calculations_completed ON public.rd_business_years USING btree (calculations_completed) WHERE (calculations_completed = true);
CREATE INDEX idx_rd_business_years_completion_percentage ON public.rd_business_years USING btree (overall_completion_percentage);
CREATE INDEX idx_rd_business_years_credits_locked ON public.rd_business_years USING btree (credits_locked) WHERE (credits_locked = true);
CREATE INDEX idx_rd_business_years_research_activities_completed ON public.rd_business_years USING btree (research_activities_completed) WHERE (research_activities_completed = true);
CREATE INDEX idx_rd_business_years_research_design_completed ON public.rd_business_years USING btree (research_design_completed) WHERE (research_design_completed = true);
CREATE INDEX idx_rd_businesses_category_id ON public.rd_businesses USING btree (category_id);
CREATE INDEX idx_rd_businesses_ein ON public.rd_businesses USING btree (ein) WHERE (ein IS NOT NULL);
CREATE INDEX idx_rd_businesses_github_token_exists ON public.rd_businesses USING btree (github_token) WHERE (github_token IS NOT NULL);
CREATE INDEX idx_rd_businesses_historical_data ON public.rd_businesses USING gin (historical_data);
CREATE INDEX idx_rd_client_portal_tokens_active ON public.rd_client_portal_tokens USING btree (business_id, is_active, expires_at) WHERE (is_active = true);
CREATE INDEX idx_rd_client_portal_tokens_business ON public.rd_client_portal_tokens USING btree (business_id);
CREATE INDEX idx_rd_client_portal_tokens_business_id ON public.rd_client_portal_tokens USING btree (business_id);
CREATE INDEX idx_rd_client_portal_tokens_token ON public.rd_client_portal_tokens USING btree (token);
CREATE INDEX idx_rd_contractor_subcomponents_business_year_id ON public.rd_contractor_subcomponents USING btree (business_year_id);
CREATE INDEX idx_rd_contractor_subcomponents_contractor_id ON public.rd_contractor_subcomponents USING btree (contractor_id);
CREATE INDEX idx_rd_contractor_subcomponents_subcomponent_id ON public.rd_contractor_subcomponents USING btree (subcomponent_id);
CREATE INDEX idx_rd_contractor_subcomponents_user_id ON public.rd_contractor_subcomponents USING btree (user_id);
CREATE INDEX idx_rd_contractor_year_data_business_year_id ON public.rd_contractor_year_data USING btree (business_year_id);
CREATE INDEX idx_rd_contractor_year_data_contractor_id ON public.rd_contractor_year_data USING btree (contractor_id);
CREATE INDEX idx_rd_contractor_year_data_user_id ON public.rd_contractor_year_data USING btree (user_id);
CREATE INDEX idx_rd_contractors_business_id ON public.rd_contractors USING btree (business_id);
CREATE INDEX idx_rd_contractors_role_id ON public.rd_contractors USING btree (role_id);
CREATE INDEX idx_rd_contractors_user_id ON public.rd_contractors USING btree (user_id);
CREATE INDEX idx_rd_employee_subcomponents_employee_id ON public.rd_employee_subcomponents USING btree (employee_id);
CREATE INDEX idx_rd_employee_subcomponents_subcomponent_id ON public.rd_employee_subcomponents USING btree (subcomponent_id);
CREATE INDEX idx_rd_employee_subcomponents_user_id ON public.rd_employee_subcomponents USING btree (user_id);
CREATE INDEX idx_rd_employee_year_data_employee_year ON public.rd_employee_year_data USING btree (employee_id, business_year_id);
CREATE INDEX idx_rd_employee_year_data_user_id ON public.rd_employee_year_data USING btree (user_id);
CREATE INDEX idx_rd_employees_user_id ON public.rd_employees USING btree (user_id);
CREATE INDEX idx_rd_expenses_business_year_id ON public.rd_expenses USING btree (business_year_id);
CREATE INDEX idx_rd_expenses_category ON public.rd_expenses USING btree (category);
CREATE INDEX idx_rd_expenses_employee_id ON public.rd_expenses USING btree (employee_id);
CREATE INDEX idx_rd_federal_credit_activity ON public.rd_federal_credit USING btree (research_activity_id);
CREATE INDEX idx_rd_federal_credit_business_year ON public.rd_federal_credit USING btree (business_year_id);
CREATE INDEX idx_rd_federal_credit_client ON public.rd_federal_credit USING btree (client_id);
CREATE INDEX idx_rd_federal_credit_created_at ON public.rd_federal_credit USING btree (created_at);
CREATE INDEX idx_rd_federal_credit_latest ON public.rd_federal_credit USING btree (is_latest) WHERE (is_latest = true);
CREATE INDEX idx_rd_federal_credit_results_business_year_id ON public.rd_federal_credit_results USING btree (business_year_id);
CREATE INDEX idx_rd_federal_credit_results_calculation_date ON public.rd_federal_credit_results USING btree (calculation_date);
CREATE INDEX idx_rd_qc_document_controls_business_year ON public.rd_qc_document_controls USING btree (business_year_id);
CREATE INDEX idx_rd_qc_document_controls_qc_approved_date ON public.rd_qc_document_controls USING btree (qc_approved_date) WHERE (qc_approved_date IS NOT NULL);
CREATE INDEX idx_rd_qc_document_controls_released ON public.rd_qc_document_controls USING btree (is_released);
CREATE INDEX idx_rd_qc_document_controls_type ON public.rd_qc_document_controls USING btree (document_type);
CREATE INDEX idx_rd_reports_business_year_type ON public.rd_reports USING btree (business_year_id, type);
CREATE INDEX idx_rd_reports_html_not_null ON public.rd_reports USING btree (business_year_id, type) WHERE (generated_html IS NOT NULL);
CREATE INDEX idx_rd_reports_qc_approved_at ON public.rd_reports USING btree (qc_approved_at) WHERE (qc_approved_at IS NOT NULL);
CREATE INDEX idx_rd_reports_state_gross_receipts ON public.rd_reports USING gin (state_gross_receipts);
CREATE INDEX idx_rd_research_activities_business_id ON public.rd_research_activities USING btree (business_id);
CREATE INDEX idx_rd_research_activities_global ON public.rd_research_activities USING btree (id) WHERE (business_id IS NULL);
CREATE INDEX idx_rd_research_steps_activity_id ON public.rd_research_steps USING btree (research_activity_id);
CREATE INDEX idx_rd_research_steps_activity_step_order ON public.rd_research_steps USING btree (research_activity_id, step_order);
CREATE INDEX idx_rd_research_steps_business_id ON public.rd_research_steps USING btree (business_id);
CREATE INDEX idx_rd_research_subcomponents_business_id ON public.rd_research_subcomponents USING btree (business_id);
CREATE INDEX idx_rd_research_subcomponents_step_id ON public.rd_research_subcomponents USING btree (step_id);
CREATE INDEX idx_rd_roles_business_year_id ON public.rd_roles USING btree (business_year_id);
CREATE INDEX idx_rd_roles_is_default ON public.rd_roles USING btree (is_default);
CREATE INDEX idx_rd_roles_type ON public.rd_roles USING btree (type);
CREATE UNIQUE INDEX idx_rd_roles_unique_default_per_year ON public.rd_roles USING btree (business_year_id, is_default) WHERE (is_default = true);
CREATE INDEX idx_rd_selected_activities_business_year_activity ON public.rd_selected_activities USING btree (business_year_id, activity_id);
CREATE INDEX idx_rd_selected_steps_activity ON public.rd_selected_steps USING btree (research_activity_id);
CREATE INDEX idx_rd_selected_steps_business_year ON public.rd_selected_steps USING btree (business_year_id);
CREATE INDEX idx_rd_selected_subcomponents_activity ON public.rd_selected_subcomponents USING btree (research_activity_id);
CREATE INDEX idx_rd_selected_subcomponents_business_year ON public.rd_selected_subcomponents USING btree (business_year_id);
CREATE INDEX idx_rd_selected_subcomponents_step ON public.rd_selected_subcomponents USING btree (step_id);
CREATE INDEX idx_rd_signature_records_business_year_id ON public.rd_signature_records USING btree (business_year_id);
CREATE INDEX idx_rd_signature_records_signed_at ON public.rd_signature_records USING btree (signed_at);
CREATE INDEX idx_rd_signatures_business_year ON public.rd_signatures USING btree (business_year_id);
CREATE INDEX idx_rd_signatures_signed_at ON public.rd_signatures USING btree (signed_at);
CREATE INDEX idx_rd_signatures_type ON public.rd_signatures USING btree (signature_type);
CREATE INDEX idx_rd_state_proforma_data_lookup ON public.rd_state_proforma_data USING btree (business_year_id, state_code, method);
CREATE INDEX idx_rd_supplies_business_id ON public.rd_supplies USING btree (business_id);
CREATE INDEX idx_rd_supply_subcomponents_business_year_id ON public.rd_supply_subcomponents USING btree (business_year_id);
CREATE INDEX idx_rd_supply_subcomponents_subcomponent_id ON public.rd_supply_subcomponents USING btree (subcomponent_id);
CREATE INDEX idx_rd_supply_subcomponents_supply_id ON public.rd_supply_subcomponents USING btree (supply_id);
CREATE INDEX idx_state_calculations_active ON public.rd_state_calculations USING btree (is_active);
CREATE INDEX idx_state_calculations_state ON public.rd_state_calculations USING btree (state);
CREATE UNIQUE INDEX idx_state_calculations_unique ON public.rd_state_calculations USING btree (state, start_year) WHERE (is_active = true);
CREATE INDEX idx_state_calculations_year ON public.rd_state_calculations USING btree (start_year, end_year);
CREATE INDEX idx_state_credit_configs_state_code ON public.rd_state_credit_configs USING btree (state_code);
CREATE INDEX idx_state_proforma_lines_state_proforma_id ON public.rd_state_proforma_lines USING btree (state_proforma_id);
CREATE INDEX idx_state_proformas_business_year ON public.rd_state_proformas USING btree (business_year_id);
CREATE INDEX idx_support_docs_business_year ON public.rd_support_documents USING btree (business_year_id);
CREATE INDEX idx_support_docs_status ON public.rd_support_documents USING btree (processing_status);
CREATE INDEX idx_support_docs_type ON public.rd_support_documents USING btree (document_type);
CREATE UNIQUE INDEX idx_unique_procedure_research_link ON public.rd_procedure_research_links USING btree (procedure_analysis_id, research_activity_id, subcomponent_id);

-- =============================================================================
-- SECTION 2: Additional constraints (non-FK) for rd_* tables  
-- =============================================================================

ALTER TABLE ONLY public.rd_billable_time_summary
    ADD CONSTRAINT rd_billable_time_summary_business_year_id_research_activity_key UNIQUE (business_year_id, research_activity_id, subcomponent_id);
ALTER TABLE ONLY public.rd_client_portal_tokens
    ADD CONSTRAINT rd_client_portal_tokens_token_key UNIQUE (token);
ALTER TABLE ONLY public.rd_contractor_subcomponents
    ADD CONSTRAINT rd_contractor_subcomponents_unique UNIQUE (contractor_id, subcomponent_id, business_year_id);
ALTER TABLE ONLY public.rd_employee_subcomponents
    ADD CONSTRAINT rd_employee_subcomponents_unique UNIQUE (employee_id, subcomponent_id, business_year_id);
ALTER TABLE ONLY public.rd_federal_credit_results
    ADD CONSTRAINT rd_federal_credit_results_unique UNIQUE (business_year_id);
ALTER TABLE ONLY public.rd_qc_document_controls
    ADD CONSTRAINT rd_qc_document_controls_business_year_id_document_type_key UNIQUE (business_year_id, document_type);
ALTER TABLE ONLY public.rd_reports
    ADD CONSTRAINT rd_reports_business_year_type_unique UNIQUE (business_year_id, type);
ALTER TABLE ONLY public.rd_research_categories
    ADD CONSTRAINT rd_research_categories_name_key UNIQUE (name);
ALTER TABLE ONLY public.rd_selected_filter
    ADD CONSTRAINT rd_selected_filter_business_year_id_key UNIQUE (business_year_id);
ALTER TABLE ONLY public.rd_selected_steps
    ADD CONSTRAINT rd_selected_steps_business_year_id_step_id_key UNIQUE (business_year_id, step_id);
ALTER TABLE ONLY public.rd_selected_subcomponents
    ADD CONSTRAINT rd_selected_subcomponents_business_year_id_subcomponent_id_key UNIQUE (business_year_id, subcomponent_id);
ALTER TABLE ONLY public.rd_state_credit_configs
    ADD CONSTRAINT rd_state_credit_configs_state_code_key UNIQUE (state_code);
ALTER TABLE ONLY public.rd_state_proforma_data
    ADD CONSTRAINT rd_state_proforma_data_business_year_id_state_code_method_key UNIQUE (business_year_id, state_code, method);
ALTER TABLE ONLY public.rd_state_proformas
    ADD CONSTRAINT rd_state_proformas_business_year_id_state_code_key UNIQUE (business_year_id, state_code);
ALTER TABLE ONLY public.rd_supply_subcomponents
    ADD CONSTRAINT rd_supply_subcomponents_unique UNIQUE (supply_id, subcomponent_id, business_year_id);
ALTER TABLE ONLY public.rd_research_activities
    ADD CONSTRAINT unique_activity_per_focus UNIQUE (title, focus_id);
ALTER TABLE ONLY public.rd_areas
    ADD CONSTRAINT unique_area_name_per_category UNIQUE (name, category_id);
ALTER TABLE ONLY public.rd_research_categories
    ADD CONSTRAINT unique_category_name UNIQUE (name);
ALTER TABLE ONLY public.rd_focuses
    ADD CONSTRAINT unique_focus_name_per_area UNIQUE (name, area_id);

-- =============================================================================
-- SECTION 3: Row Level Security (RLS) policies for rd_* tables
-- =============================================================================
-- Note: Some policies reference profiles.is_admin which may be text or boolean
-- Using ::text casting to safely handle both data types

CREATE POLICY "Admin can manage QC controls" ON public.rd_qc_document_controls USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin::text = 'true'))))));
CREATE POLICY "Admin can manage all signature records" ON public.rd_signature_records USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
CREATE POLICY "Admin can manage portal tokens" ON public.rd_client_portal_tokens USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin::text = 'true'))))));
CREATE POLICY "Admin can view all signatures" ON public.rd_signatures FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin::text = 'true'))))));
CREATE POLICY "Allow all for authenticated" ON public.rd_selected_filter USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Allow all for dev" ON public.rd_contractor_year_data USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to create signatures" ON public.rd_signature_records FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Allow authenticated users to view signatures" ON public.rd_signature_records FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Allow read access to rd_research_steps" ON public.rd_research_steps FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Allow read access to rd_research_subcomponents" ON public.rd_research_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Anyone can create signatures via portal" ON public.rd_signatures FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractor_subcomponents FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_contractors FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_employee_subcomponents FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_expenses FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_reports FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable delete access for authenticated users" ON public.rd_supplies FOR DELETE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_steps FOR DELETE USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Enable delete for authenticated users" ON public.rd_research_subcomponents FOR DELETE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.rd_selected_steps FOR DELETE USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_contractors FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_employee_subcomponents FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_expenses FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_reports FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable insert access for authenticated users" ON public.rd_supplies FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_steps FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Enable insert for authenticated users" ON public.rd_research_subcomponents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.rd_selected_steps FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Enable read access for all users" ON public.rd_research_steps FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.rd_research_subcomponents FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.rd_selected_steps FOR SELECT USING (true);
CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractor_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable read access for authenticated users" ON public.rd_contractors FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable read access for authenticated users" ON public.rd_employee_subcomponents FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable read access for authenticated users" ON public.rd_expenses FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable read access for authenticated users" ON public.rd_reports FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable read access for authenticated users" ON public.rd_supplies FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractor_subcomponents FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable update access for authenticated users" ON public.rd_contractors FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable update access for authenticated users" ON public.rd_employee_subcomponents FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable update access for authenticated users" ON public.rd_expenses FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable update access for authenticated users" ON public.rd_reports FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable update access for authenticated users" ON public.rd_supplies FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Enable update for authenticated users" ON public.rd_research_steps FOR UPDATE USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Enable update for authenticated users" ON public.rd_research_subcomponents FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON public.rd_selected_steps FOR UPDATE USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can delete their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR DELETE USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
CREATE POLICY "Users can delete their own contractor year data" ON public.rd_contractor_year_data FOR DELETE USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
CREATE POLICY "Users can delete their own federal credit results" ON public.rd_federal_credit_results FOR DELETE USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can delete their own state pro forma data" ON public.rd_state_proforma_data FOR DELETE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
CREATE POLICY "Users can delete their own supplies" ON public.rd_supplies FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can delete their own supply subcomponents" ON public.rd_supply_subcomponents FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can delete their own supply year data" ON public.rd_supply_year_data FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));
CREATE POLICY "Users can insert own rd_federal_credit" ON public.rd_federal_credit FOR INSERT WITH CHECK ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
CREATE POLICY "Users can insert their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
CREATE POLICY "Users can insert their own contractor year data" ON public.rd_contractor_year_data FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
CREATE POLICY "Users can insert their own federal credit results" ON public.rd_federal_credit_results FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can insert their own state pro forma data" ON public.rd_state_proforma_data FOR INSERT WITH CHECK ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
CREATE POLICY "Users can insert their own supplies" ON public.rd_supplies FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can insert their own supply subcomponents" ON public.rd_supply_subcomponents FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can insert their own supply year data" ON public.rd_supply_year_data FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));
CREATE POLICY "Users can update own rd_federal_credit" ON public.rd_federal_credit FOR UPDATE USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
CREATE POLICY "Users can update their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR UPDATE USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
CREATE POLICY "Users can update their own contractor year data" ON public.rd_contractor_year_data FOR UPDATE USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
CREATE POLICY "Users can update their own federal credit results" ON public.rd_federal_credit_results FOR UPDATE USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can update their own state pro forma data" ON public.rd_state_proforma_data FOR UPDATE USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
CREATE POLICY "Users can update their own supplies" ON public.rd_supplies FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can update their own supply subcomponents" ON public.rd_supply_subcomponents FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can update their own supply year data" ON public.rd_supply_year_data FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));
CREATE POLICY "Users can view own rd_federal_credit" ON public.rd_federal_credit FOR SELECT USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.created_by = auth.uid()))));
CREATE POLICY "Users can view their own contractor subcomponents" ON public.rd_contractor_subcomponents FOR SELECT USING ((auth.uid() IN ( SELECT rd_contractor_subcomponents.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_subcomponents.business_year_id))));
CREATE POLICY "Users can view their own contractor year data" ON public.rd_contractor_year_data FOR SELECT USING ((auth.uid() IN ( SELECT rd_contractor_year_data.user_id
   FROM public.rd_business_years
  WHERE (rd_business_years.id = rd_contractor_year_data.business_year_id))));
CREATE POLICY "Users can view their own federal credit results" ON public.rd_federal_credit_results FOR SELECT USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can view their own state pro forma data" ON public.rd_state_proforma_data FOR SELECT USING ((business_year_id IN ( SELECT business_years.id
   FROM public.business_years
  WHERE (business_years.business_id IN ( SELECT rd_businesses.id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id = auth.uid()))))));
CREATE POLICY "Users can view their own supplies" ON public.rd_supplies FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((rd_supplies.business_id = businesses.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can view their own supply subcomponents" ON public.rd_supply_subcomponents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.rd_supplies
     JOIN public.businesses ON ((rd_supplies.business_id = businesses.id)))
  WHERE ((rd_supply_subcomponents.supply_id = rd_supplies.id) AND (businesses.client_id = auth.uid())))));
CREATE POLICY "Users can view their own supply year data" ON public.rd_supply_year_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.rd_business_years
  WHERE ((rd_business_years.id = rd_supply_year_data.business_year_id) AND (rd_business_years.business_id IN ( SELECT rd_business_years.business_id
           FROM public.rd_businesses
          WHERE (rd_businesses.client_id IN ( SELECT clients.id
                   FROM public.clients
                  WHERE (rd_businesses.client_id = auth.uid())))))))));

