-- public.rd_client_portal_dashboard source

CREATE OR REPLACE VIEW public.rd_client_portal_dashboard
AS SELECT bys.id AS business_year_id,
    bys.business_id,
    bys.year,
    (EXISTS ( SELECT 1
           FROM rd_reports r
          WHERE r.business_year_id = bys.id AND r.qc_approved_at IS NOT NULL)) AS ready_for_review,
    (EXISTS ( SELECT 1
           FROM rd_reports r
          WHERE r.business_year_id = bys.id AND r.qc_approved_at IS NOT NULL)) AND NOT (EXISTS ( SELECT 1
           FROM rd_signature_records s
          WHERE s.business_year_id = bys.id AND s.signed_at IS NOT NULL)) AS jurat_required,
    (EXISTS ( SELECT 1
           FROM rd_employee_role_designations d
          WHERE d.business_year_id = bys.id AND d.client_visible = true AND (d.status = ANY (ARRAY['requested'::text, 'client_updated'::text])))) AS role_designations_needed,
    false AS subcomponent_review_recommended
   FROM rd_business_years bys;