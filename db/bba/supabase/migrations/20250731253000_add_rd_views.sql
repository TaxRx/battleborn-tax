-- Add missing rd_* views from remote database
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: CREATE VIEW statements for rd_* views
-- =============================================================================

-- View 1/3
CREATE VIEW public.rd_activity_hierarchy AS
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
   FROM ((((public.rd_research_categories cat
     JOIN public.rd_areas area ON ((area.category_id = cat.id)))
     JOIN public.rd_focuses focus ON ((focus.area_id = area.id)))
     JOIN public.rd_research_activities act ON ((act.focus_id = focus.id)))
     JOIN public.rd_subcomponents sub ON ((sub.activity_id = act.id)))
  ORDER BY cat.name, area.name, focus.name, act.title, sub.step;

-- View 2/3
CREATE VIEW public.rd_client_progress_summary AS
 SELECT cb.id AS business_id,
    cb.name AS business_name,
    cb.client_id,
    p.full_name AS client_name,
    p.email AS client_email,
    tp.business_name AS tax_profile_business_name,
    by.year,
    by.business_setup_completed,
    by.research_activities_completed,
    by.research_design_completed,
    by.calculations_completed,
    by.qre_locked AS qres_completed,
    by.overall_completion_percentage,
    by.last_step_completed,
    by.completion_updated_at,
    by.qc_status
   FROM (((public.rd_businesses cb
     JOIN public.tax_profiles tp ON ((cb.client_id = tp.id)))
     LEFT JOIN public.profiles p ON ((tp.user_id = p.id)))
     LEFT JOIN public.rd_business_years by ON ((cb.id = by.business_id)))
  WHERE (by.year IS NOT NULL)
  ORDER BY p.full_name, cb.name, by.year DESC;

-- View 3/3
CREATE VIEW public.rd_federal_credit_latest AS
 SELECT rd_federal_credit.id,
    rd_federal_credit.business_year_id,
    rd_federal_credit.client_id,
    rd_federal_credit.research_activity_id,
    rd_federal_credit.research_activity_name,
    rd_federal_credit.direct_research_wages,
    rd_federal_credit.supplies_expenses,
    rd_federal_credit.contractor_expenses,
    rd_federal_credit.total_qre,
    rd_federal_credit.subcomponent_count,
    rd_federal_credit.subcomponent_groups,
    rd_federal_credit.applied_percent,
    rd_federal_credit.line_49f_description,
    rd_federal_credit.ai_generation_timestamp,
    rd_federal_credit.ai_prompt_used,
    rd_federal_credit.ai_response_raw,
    rd_federal_credit.federal_credit_amount,
    rd_federal_credit.federal_credit_percentage,
    rd_federal_credit.calculation_method,
    rd_federal_credit.industry_type,
    rd_federal_credit.focus_area,
    rd_federal_credit.general_description,
    rd_federal_credit.created_at,
    rd_federal_credit.updated_at,
    rd_federal_credit.created_by,
    rd_federal_credit.updated_by,
    rd_federal_credit.version,
    rd_federal_credit.is_latest,
    rd_federal_credit.previous_version_id,
    rd_federal_credit.calculation_timestamp,
    rd_federal_credit.data_snapshot,
    rd_federal_credit.notes
   FROM public.rd_federal_credit
  WHERE (rd_federal_credit.is_latest = true);

