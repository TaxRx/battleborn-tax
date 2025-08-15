import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RDReportData {
  business_year: {
    id: string;
    year: number;
    business_id: string;
    research_design_completed: boolean;
    qre_locked: boolean;
    calculations_completed: boolean;
    created_at: string;
    updated_at: string;
  };
  business: {
    id: string;
    name: string;
    ein?: string;
    client_id: string;
    entity_type: string;
    domicile_state: string;
    contact_info: any;
    created_at: string;
  };
  client: {
    id: string;
    full_name: string;
    email: string;
  };
  rd_business: {
    id: string;
    name: string;
    ein?: string;
    client_id: string;
    entity_type: string;
    domicile_state: string;
    contact_info: any;
    created_at: string;
  };
  research_activities: Array<{
    id: string;
    title: string;
    focus_id: string;
    default_roles: any;
    default_steps: any;
    selected_config: {
      id: string;
      business_year_id: string;
      activity_id: string;
      practice_percent: number;
      selected_roles: any;
      config: any;
      research_guidelines: any;
      is_enabled: boolean;
      activity_title_snapshot?: string;
      activity_category_snapshot?: string;
    };
    practice_percent: number;
    selected_roles: any;
    research_guidelines: any;
    subcomponents: Array<{
      id: string;
      title: string;
      description: string;
      research_activity_id: string;
      selected_config: any;
      steps: Array<{
        id: string;
        name: string;
        description: string;
        research_activity_id: string;
        step_order: number;
        default_time_percentage: number;
        selected_config: any;
      }>;
    }>;
  }>;
  research_roles: Array<{
    id: string;
    business_id: string;
    business_year_id: string;
    name: string;
    parent_id?: string;
    is_default: boolean;
    baseline_applied_percent?: number;
    created_at: string;
  }>;
  employee_allocations: Array<{
    id: string;
    rd_business_year_id: string;
    employee_name: string;
    employee_role: string;
    total_hours: number;
    rd_hours: number;
    hourly_wage: number;
    total_wages: number;
    rd_wages: number;
    created_at: string;
    updated_at: string;
  }>;
  supply_allocations: Array<{
    id: string;
    rd_business_year_id: string;
    supply_name: string;
    supply_description: string;
    total_cost: number;
    rd_cost: number;
    allocation_percentage: number;
    created_at: string;
    updated_at: string;
  }>;
  calculations: {
    total_qre_wages: number;
    total_qre_supplies: number;
    total_qre_amount: number;
    federal_credit_amount: number;
    state_credit_amount: number;
    total_credit_amount: number;
    calculated_at: string;
  } | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const pathname = url.pathname;

    // Route: /rd-service/rd-report-data
    if (pathname.includes('/rd-report-data')) {
      return await handleRDReportData(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('RD Service Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleRDReportData(req: Request, supabase: any): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const url = new URL(req.url);
  const businessYearId = url.searchParams.get('business_year_id');

  if (!businessYearId) {
    return new Response(
      JSON.stringify({ error: 'business_year_id parameter is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // 1. Get the business year record
    const { data: businessYear, error: businessYearError } = await supabase
      .from('rd_business_years')
      .select('*')
      .eq('id', businessYearId)
      .single();

    if (businessYearError || !businessYear) {
      return new Response(
        JSON.stringify({ error: 'Business year not found', details: businessYearError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Get the RD business record
    const { data: rdBusiness, error: rdBusinessError } = await supabase
      .from('rd_businesses')
      .select('*')
      .eq('id', businessYear.business_id)
      .single();

    if (rdBusinessError || !rdBusiness) {
      return new Response(
        JSON.stringify({ error: 'RD business not found', details: rdBusinessError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. The business record is the same as rdBusiness since we only have rd_businesses table
    const business = rdBusiness;

    // 4. Get the client record
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email')
      .eq('id', rdBusiness.client_id)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Client not found', details: clientError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 5. Get research roles hierarchy for this business year
    const { data: researchRoles, error: rolesError } = await supabase
      .from('rd_roles')
      .select('*')
      .eq('business_year_id', businessYearId)
      .order('name');

    if (rolesError) {
      console.error('Error fetching research roles:', rolesError);
    }

    // 6. Get research activities via rd_selected_activities linked to business_year_id
    const { data: selectedActivities, error: selectedActivitiesError } = await supabase
      .from('rd_selected_activities')
      .select(`
        *,
        activity:rd_research_activities (
          id,
          title,
          focus_id,
          default_roles,
          default_steps
        )
      `)
      .eq('business_year_id', businessYearId)
      .eq('is_enabled', true);

    if (selectedActivitiesError) {
      console.error('Error fetching selected activities:', selectedActivitiesError);
    }

    // 6a. Get selected subcomponents for this business year
    const { data: selectedSubcomponents, error: selectedSubcomponentsError } = await supabase
      .from('rd_selected_subcomponents')
      .select(`
        *,
        subcomponent:rd_research_subcomponents (
          id,
          title,
          description,
          research_activity_id
        )
      `)
      .eq('business_year_id', businessYearId)
      .eq('is_enabled', true);

    if (selectedSubcomponentsError) {
      console.error('Error fetching selected subcomponents:', selectedSubcomponentsError);
    }

    // 6b. Get selected steps for this business year
    const { data: selectedSteps, error: selectedStepsError } = await supabase
      .from('rd_selected_steps')
      .select(`
        *,
        step:rd_research_steps (
          id,
          name,
          description,
          research_activity_id,
          step_order,
          default_time_percentage
        )
      `)
      .eq('business_year_id', businessYearId)
      .eq('is_enabled', true);

    if (selectedStepsError) {
      console.error('Error fetching selected steps:', selectedStepsError);
    }

    // 6c. Build comprehensive research activities structure
    const researchActivities = (selectedActivities || []).map(selectedActivity => {
      const activity = selectedActivity.activity;
      
      // Find subcomponents for this activity
      const activitySubcomponents = (selectedSubcomponents || [])
        .filter(sc => sc.subcomponent?.research_activity_id === activity?.id)
        .map(sc => ({
          ...sc.subcomponent,
          selected_config: sc,
          steps: (selectedSteps || [])
            .filter(ss => ss.step?.research_activity_id === activity?.id)
            .map(ss => ({
              ...ss.step,
              selected_config: ss
            }))
        }));

      return {
        ...activity,
        selected_config: selectedActivity,
        practice_percent: selectedActivity.practice_percent,
        selected_roles: selectedActivity.selected_roles,
        research_guidelines: selectedActivity.research_guidelines,
        subcomponents: activitySubcomponents
      };
    });

    // 7. Get employee allocations
    const { data: employeeAllocations, error: employeeError } = await supabase
      .from('rd_employee_year_data')
      .select('*')
      .eq('business_year_id', businessYearId);

    if (employeeError) {
      console.error('Error fetching employee allocations:', employeeError);
    }

    // 8. Get supply allocations
    const { data: supplyAllocations, error: supplyError } = await supabase
      .from('rd_supply_year_data')
      .select('*')
      .eq('business_year_id', businessYearId);

    if (supplyError) {
      console.error('Error fetching supply allocations:', supplyError);
    }

    // 9. Calculate totals for QRE amounts and credits
    const calculations = calculateRDCredits(employeeAllocations || [], supplyAllocations || []);

    // 10. Build comprehensive report data structure
    const reportData: RDReportData = {
      business_year: businessYear,
      business: business,
      client: client,
      rd_business: rdBusiness,
      research_activities: researchActivities || [],
      research_roles: researchRoles || [],
      employee_allocations: employeeAllocations || [],
      supply_allocations: supplyAllocations || [],
      calculations: calculations
    };

    return new Response(
      JSON.stringify(reportData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating RD report data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate report data', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

function calculateRDCredits(employeeAllocations: any[], supplyAllocations: any[]) {
  // Calculate total QRE wages
  const totalQREWages = employeeAllocations.reduce((sum, emp) => sum + (emp.rd_wages || 0), 0);
  
  // Calculate total QRE supplies
  const totalQRESupplies = supplyAllocations.reduce((sum, supply) => sum + (supply.rd_cost || 0), 0);
  
  // Calculate total QRE amount
  const totalQREAmount = totalQREWages + totalQRESupplies;
  
  // Federal credit calculation (typically 20% for small businesses, 14% for others)
  // For simplicity, using 20% - this could be made configurable based on business size
  const federalCreditAmount = totalQREAmount * 0.20;
  
  // State credit amount (varies by state - this would need to be configurable)
  // For now, using a placeholder calculation
  const stateCreditAmount = totalQREAmount * 0.05; // 5% as example
  
  const totalCreditAmount = federalCreditAmount + stateCreditAmount;

  return {
    total_qre_wages: totalQREWages,
    total_qre_supplies: totalQRESupplies,
    total_qre_amount: totalQREAmount,
    federal_credit_amount: federalCreditAmount,
    state_credit_amount: stateCreditAmount,
    total_credit_amount: totalCreditAmount,
    calculated_at: new Date().toISOString()
  };
}