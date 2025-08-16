import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
//   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
// };
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent, x-client-site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Expose-Headers': 'content-length, x-json',
  'Access-Control-Max-Age': '86400',
}

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
    console.log('OPTIONS request received');
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

    // Route: /rd-service/w2-upload
    if (pathname.includes('/w2-upload')) {
      return await handleW2Upload(req, supabase);
    }

    // Route: /rd-service/w2-process-batch (check this first!)
    if (pathname.includes('/w2-process-batch')) {
      return await handleW2ProcessBatch(req, supabase);
    }

    // Route: /rd-service/w2-process
    if (pathname.includes('/w2-process')) {
      return await handleW2Process(req, supabase);
    }

    // Route: /rd-service/w2-finalize
    if (pathname.includes('/w2-finalize')) {
      return await handleW2Finalize(req, supabase);
    }

    // Route: /rd-service/w2-data/:employeeId
    if (pathname.includes('/w2-data/')) {
      return await handleW2Data(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { ...1623, 'Content-Type': 'application/json' } 
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

// W-2 Upload Handler - Enhanced for multi-file support
async function handleW2Upload(req: Request, supabase: any): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const formData = await req.formData();
    
    // Support both single file ('file') and multiple files ('files')
    const singleFile = formData.get('file') as File;
    const multipleFiles = formData.getAll('files') as File[];
    const files = singleFile ? [singleFile] : multipleFiles;
    
    const businessYearId = formData.get('business_year_id') as string;
    const taxYear = parseInt(formData.get('tax_year') as string);

    if (files.length === 0 || !businessYearId || !taxYear) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: files, business_year_id, tax_year' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate files
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/tiff',
      'image/bmp'
    ];
    
    const uploadResults = [];
    const failedUploads = [];
    
    // Get the authenticated user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file size (50MB max)
        if (file.size > 52428800) {
          failedUploads.push({
            file_name: file.name,
            error: 'File size exceeds 50MB limit'
          });
          continue;
        }
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          failedUploads.push({
            file_name: file.name,
            error: 'Invalid file type. Allowed types: PDF, PNG, JPG, JPEG, WebP, TIFF, BMP'
          });
          continue;
        }
        
        // Generate unique file path
        const fileExtension = file.name.split('.').pop() || 'pdf';
        const fileName = `w2_${taxYear}_${Date.now()}_${i}.${fileExtension}`;
        const filePath = `${businessYearId}/${fileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('w2-documents')
          .upload(filePath, file, {
            contentType: file.type,
            duplex: 'half'
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          failedUploads.push({
            file_name: file.name,
            error: `Failed to upload file: ${uploadError.message}`
          });
          continue;
        }
        
        // Save document metadata to database
        const { data: documentData, error: documentError } = await supabase
          .from('rd_w2_documents')
          .insert({
            business_year_id: businessYearId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            tax_year: taxYear,
            upload_status: 'uploaded',
            uploaded_by: user?.id || null
          })
          .select()
          .single();

        if (documentError) {
          console.error('Database insert error:', documentError);
          
          // Clean up uploaded file on database error
          await supabase.storage
            .from('w2-documents')
            .remove([filePath]);

          failedUploads.push({
            file_name: file.name,
            error: `Failed to save document metadata: ${documentError.message}`
          });
          continue;
        }

        uploadResults.push({
          document_id: documentData.id,
          file_name: file.name,
          file_path: filePath,
          status: 'uploaded'
        });
        
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        failedUploads.push({
          file_name: file.name,
          error: `Processing error: ${error.message || 'Unknown error'}`
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        uploaded_documents: uploadResults,
        failed_uploads: failedUploads,
        total_files: files.length,
        successful_uploads: uploadResults.length,
        failed_count: failedUploads.length,
        message: `Successfully uploaded ${uploadResults.length} of ${files.length} files`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('W-2 Upload Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// W-2 Processing Handler (AI extraction)
async function handleW2Process(req: Request, supabase: any): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { document_id } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'document_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get document details
    const { data: document, error: documentError } = await supabase
      .from('rd_w2_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (documentError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found', details: documentError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update processing status
    await supabase
      .from('rd_w2_documents')
      .update({ 
        upload_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', document_id);

    // Check if we're running locally
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const isLocalhost = supabaseUrl.includes('localhost') || 
                       supabaseUrl.includes('127.0.0.1') || 
                       supabaseUrl.includes('kong');
    
    console.log('🔍 Environment detection:', {
      supabaseUrl,
      isLocalhost,
      containsLocalhost: supabaseUrl.includes('localhost'),
      contains127: supabaseUrl.includes('127.0.0.1'),
      containsKong: supabaseUrl.includes('kong')
    });

    let aiResult;
    
    if (isLocalhost) {
      // For localhost, we need to make the signed URL publicly accessible
      // Supabase local development doesn't support external access to signed URLs
      console.log('🏠 Running on localhost - using modified signed URL approach');
      
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('w2-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        await supabase
          .from('rd_w2_documents')
          .update({ 
            upload_status: 'failed',
            processing_error: 'Failed to generate signed URL for localhost'
          })
          .eq('id', document_id);

        return new Response(
          JSON.stringify({ error: 'Failed to generate signed URL', details: signedUrlError?.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // For localhost, we'll skip AI processing for now and return mock data
      console.log('⚠️ Localhost detected - skipping AI processing (returning mock multi-W2 data)');
      aiResult = {
        success: true,
        extracted_w2s: [
          {
            w2_index: 0,
            employer_name: "Mock Employer Inc",
            employee_name_on_w2: "Anna Bowdoin",
            box_1_wages: "50000.00",
            box_2_federal_tax_withheld: "7500.00",
            tax_year: document.tax_year,
            extraction_confidence: 0.95
          },
          {
            w2_index: 1,
            employer_name: "Mock Employer Inc",
            employee_name_on_w2: "Jane Smith",
            box_1_wages: "45000.00",
            box_2_federal_tax_withheld: "6750.00",
            tax_year: document.tax_year,
            extraction_confidence: 0.89
          }
        ],
        total_w2s_found: 2,
        confidence: 0.92,
        raw_response: { mock: true, reason: "localhost_development", multi_w2: true }
      };
      
    } else {
      // For production, use signed URL
      console.log('☁️ Running on production - using signed URL for file:', document.file_path);
      
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('w2-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      console.log('🔗 Signed URL result:', {
        success: !!signedUrlData?.signedUrl,
        url: signedUrlData?.signedUrl,
        error: signedUrlError?.message
      });

      if (signedUrlError || !signedUrlData?.signedUrl) {
        await supabase
          .from('rd_w2_documents')
          .update({ 
            upload_status: 'failed',
            processing_error: 'Failed to generate signed URL'
          })
          .eq('id', document_id);

        return new Response(
          JSON.stringify({ error: 'Failed to generate signed URL', details: signedUrlError?.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Process with Mistral AI using signed URL
      aiResult = await processW2WithAI(signedUrlData.signedUrl, false);
    }

    if (!aiResult.success) {
      await supabase
        .from('rd_w2_documents')
        .update({ 
          upload_status: 'failed',
          processing_error: aiResult.error,
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', document_id);

      return new Response(
        JSON.stringify({ error: 'AI processing failed', details: aiResult.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store extracted data in document for later employee matching
    // We don't save to rd_w2_extracted_data yet since we don't have employee_id
    const extractedDataForLater = {
      total_w2s_found: aiResult.total_w2s_found || aiResult.extracted_w2s?.length || 0,
      extraction_summary: {
        successful: aiResult.extracted_w2s?.length || 0,
        failed: 0,
        confidence_average: aiResult.confidence || 0.8
      },
      w2s: aiResult.extracted_w2s || [],
      extraction_model: 'mistral-small-latest',
      extraction_prompt_version: 'v2.0-multi-w2',
      raw_ai_response: aiResult.raw_response
    };

    // Update document status to processed and store extracted data
    await supabase
      .from('rd_w2_documents')
      .update({ 
        upload_status: 'processed',
        processing_completed_at: new Date().toISOString(),
        extracted_data: extractedDataForLater
      })
      .eq('id', document_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        document_id: document_id,
        status: 'completed',
        extracted_w2s: aiResult.extracted_w2s || [],
        total_w2s_found: aiResult.total_w2s_found || aiResult.extracted_w2s?.length || 0,
        confidence: aiResult.confidence,
        message: `W-2 document processed successfully - found ${aiResult.total_w2s_found || aiResult.extracted_w2s?.length || 0} W-2 forms`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('W-2 Processing Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// W-2 Batch Processing Handler
async function handleW2ProcessBatch(req: Request, supabase: any): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { document_ids, options = {} } = await req.json();

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'document_ids array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const maxConcurrent = options.max_concurrent || 3;
    const parallelProcessing = options.parallel_processing !== false;
    
    console.log(`🚀 Processing batch of ${document_ids.length} documents with max concurrency: ${maxConcurrent}`);

    const processingResults = [];

    if (parallelProcessing) {
      // Process documents in parallel with concurrency limit
      for (let i = 0; i < document_ids.length; i += maxConcurrent) {
        const batch = document_ids.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (documentId) => {
          try {
            // Get document details
            const { data: document, error: documentError } = await supabase
              .from('rd_w2_documents')
              .select('*')
              .eq('id', documentId)
              .single();

            if (documentError || !document) {
              return {
                document_id: documentId,
                status: 'failed',
                error: 'Document not found',
                extracted_w2s: []
              };
            }

            // Update processing status
            await supabase
              .from('rd_w2_documents')
              .update({ 
                upload_status: 'processing',
                processing_started_at: new Date().toISOString()
              })
              .eq('id', documentId);

            // Process with AI (using same logic as single processing)
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
            const isLocalhost = supabaseUrl.includes('localhost') || 
                               supabaseUrl.includes('127.0.0.1') || 
                               supabaseUrl.includes('kong');
            
            let aiResult;
            
            if (isLocalhost) {
              // Use mock data for localhost
              aiResult = {
                success: true,
                extracted_w2s: [
                  {
                    w2_index: 0,
                    employer_name: "Mock Employer Inc",
                    employee_name_on_w2: i === 0 ? "Anna Bowdoin" : `Mock Employee ${i + 1}`,
                    box_1_wages: "50000.00",
                    box_2_federal_tax_withheld: "7500.00",
                    tax_year: document.tax_year,
                    extraction_confidence: 0.95
                  }
                ],
                total_w2s_found: 1,
                confidence: 0.95,
                raw_response: { mock: true, reason: "localhost_batch_development" }
              };
            } else {
              // Generate signed URL and process with AI
              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('w2-documents')
                .createSignedUrl(document.file_path, 3600);

              if (signedUrlError || !signedUrlData?.signedUrl) {
                throw new Error('Failed to generate signed URL');
              }

              aiResult = await processW2WithAI(signedUrlData.signedUrl, false);
            }

            if (!aiResult.success) {
              // Update document status to failed
              await supabase
                .from('rd_w2_documents')
                .update({ 
                  upload_status: 'failed',
                  processing_error: aiResult.error,
                  processing_completed_at: new Date().toISOString()
                })
                .eq('id', documentId);

              return {
                document_id: documentId,
                status: 'failed',
                error: aiResult.error,
                extracted_w2s: []
              };
            }

            // Store extracted data
            const extractedDataForLater = {
              total_w2s_found: aiResult.total_w2s_found || aiResult.extracted_w2s?.length || 0,
              extraction_summary: {
                successful: aiResult.extracted_w2s?.length || 0,
                failed: 0,
                confidence_average: aiResult.confidence || 0.8
              },
              w2s: aiResult.extracted_w2s || [],
              extraction_model: 'mistral-small-latest',
              extraction_prompt_version: 'v2.0-multi-w2',
              raw_ai_response: aiResult.raw_response
            };

            await supabase
              .from('rd_w2_documents')
              .update({ 
                upload_status: 'processed',
                processing_completed_at: new Date().toISOString(),
                extracted_data: extractedDataForLater
              })
              .eq('id', documentId);

            return {
              document_id: documentId,
              status: 'completed',
              extracted_w2s: aiResult.extracted_w2s || [],
              total_w2s_found: aiResult.total_w2s_found || aiResult.extracted_w2s?.length || 0
            };

          } catch (error) {
            console.error(`Error processing document ${documentId}:`, error);
            
            // Update document status to failed
            await supabase
              .from('rd_w2_documents')
              .update({ 
                upload_status: 'failed',
                processing_error: error.message,
                processing_completed_at: new Date().toISOString()
              })
              .eq('id', documentId);

            return {
              document_id: documentId,
              status: 'failed',
              error: error.message,
              extracted_w2s: []
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        processingResults.push(...batchResults);
      }
    } else {
      // Process documents sequentially
      for (const documentId of document_ids) {
        // Similar logic but sequential - for now, use parallel approach
        // This can be implemented if needed for rate limiting
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processing_results: processingResults,
        total_processed: processingResults.length,
        successful: processingResults.filter(r => r.status === 'completed').length,
        failed: processingResults.filter(r => r.status === 'failed').length,
        message: `Batch processing completed: ${processingResults.filter(r => r.status === 'completed').length}/${processingResults.length} successful`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('W-2 Batch Processing Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// W-2 Data Retrieval Handler
async function handleW2Data(req: Request, supabase: any): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const employeeId = pathParts[pathParts.length - 1];

    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'employee_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get W-2 documents and extracted data for the employee
    const { data: w2Data, error: w2Error } = await supabase
      .from('rd_w2_documents')
      .select(`
        *,
        extracted_data:rd_w2_extracted_data(*)
      `)
      .eq('employee_id', employeeId)
      .order('tax_year', { ascending: false });

    if (w2Error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch W-2 data', details: w2Error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        employee_id: employeeId,
        rd_w2_documents: w2Data || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('W-2 Data Retrieval Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// AI Processing Function using Mistral
async function processW2WithAI(documentInput: string, isBase64: boolean = false): Promise<any> {
  try {
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    
    if (!mistralApiKey) {
      return { success: false, error: 'MISTRAL_API_KEY not configured' };
    }

    // Enhanced W-2 extraction prompt for multiple W-2s
    const w2ExtractionPrompt = `
You are a tax document processing assistant. Extract all relevant information from this document that may contain one or more W-2 tax forms and return it as a JSON array.

SCAN THE ENTIRE DOCUMENT FOR ALL W-2 FORMS and extract information for EACH W-2 found.

Return format - JSON ARRAY (even if only one W-2 is found):
[
  {
    "w2_index": 0,
    "tax_year": "YYYY",
    "employer_name": "Employer Name",
    "employer_ein": "XX-XXXXXXX",
    "employer_address_street": "Street Address",
    "employer_address_city": "City",
    "employer_address_state": "State",
    "employer_address_zip": "ZIP Code",
    "employee_name_on_w2": "Employee Full Name",
    "employee_ssn": "XXX-XX-XXXX",
    "employee_address_street": "Street Address", 
    "employee_address_city": "City",
    "employee_address_state": "State",
    "employee_address_zip": "ZIP Code",
    "box_1_wages": "0.00",
    "box_2_federal_tax_withheld": "0.00",
    "box_3_social_security_wages": "0.00",
    "box_4_social_security_tax_withheld": "0.00",
    "box_5_medicare_wages": "0.00",
    "box_6_medicare_tax_withheld": "0.00",
    "box_7_social_security_tips": "0.00",
    "box_8_allocated_tips": "0.00",
    "box_9_verification_code": "",
    "box_10_dependent_care_benefits": "0.00",
    "box_11_nonqualified_plans": "0.00",
    "box_12_codes": [
      {
        "code": "A",
        "amount": "0.00"
      }
    ],
    "box_13_statutory_employee": false,
    "box_13_retirement_plan": false,
    "box_13_third_party_sick_pay": false,
    "box_14_other": [
      {
        "description": "Description",
        "amount": "0.00"
      }
    ],
    "state_and_local": [
      {
        "state": "State Code",
        "state_wages": "0.00",
        "state_tax_withheld": "0.00",
        "locality": "Locality Name",
        "local_wages": "0.00",
        "local_tax_withheld": "0.00"
      }
    ]
  }
]

CRITICAL INSTRUCTIONS:
1. ALWAYS return a JSON ARRAY, even for single W-2
2. Add w2_index field starting from 0 for each W-2 found
3. Extract information exactly as it appears on each form
4. Convert all monetary amounts to string format with 2 decimal places
5. Use "0.00" for empty or missing monetary fields
6. Use empty strings for missing text fields
7. Use false for unchecked checkboxes
8. Return ONLY raw JSON - NO markdown formatting, NO code blocks, NO backticks, NO explanations
9. Your response must start with [ and end with ] - nothing else
10. If no W-2s are found, return empty array: []

Return the result as a pure JSON ARRAY with no additional formatting or text.
`;

    let userContent;
    
    if (isBase64) {
      // For base64 data (localhost), use image_url format
      userContent = [
        {
          type: "text",
          text: "Extract all relevant information from this W2 tax document and return it as a pure JSON object with no markdown formatting, code blocks, or explanations. Start your response with { and end with }."
        },
        {
          type: "image_url",
          image_url: {
            url: documentInput
          }
        }
      ];
    } else {
      // For signed URLs (production), use document_url format
      userContent = [
        {
          type: "text",
          text: "Extract all relevant information from this W2 tax document and return it as a pure JSON object with no markdown formatting, code blocks, or explanations. Start your response with { and end with }."
        },
        {
          type: "document_url",
          documentUrl: documentInput
        }
      ];
    }

    const requestBody = {
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: w2ExtractionPrompt
        },
        {
          role: "user",
          content: userContent
        }
      ]
    };

    console.log('📤 Sending request to Mistral API:', {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      userContentType: isBase64 ? 'base64' : 'url',
      userContentLength: userContent.length,
      hasApiKey: !!mistralApiKey
    });

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ Mistral API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorBody
      });
      return { 
        success: false, 
        error: `Mistral API error: ${response.status} ${response.statusText}`,
        details: errorBody
      };
    }

    const apiResult = await response.json();
    const aiResponse = apiResult.choices?.[0]?.message?.content || '';

    // Parse the AI response
    let extractedData;
    try {
      // Clean the response to remove any markdown formatting
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      cleanedResponse = cleanedResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      cleanedResponse = cleanedResponse.replace(/^\uFEFF/, '');

      extractedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return { 
        success: false, 
        error: 'Failed to parse AI response as JSON',
        raw_response: aiResponse 
      };
    }

    // Ensure extractedData is an array
    const extractedW2s = Array.isArray(extractedData) ? extractedData : [extractedData];
    
    return {
      success: true,
      extracted_w2s: extractedW2s,
      total_w2s_found: extractedW2s.length,
      confidence: 0.85, // Default confidence score
      raw_response: apiResult
    };

  } catch (error) {
    console.error('AI Processing Error:', error);
    return { 
      success: false, 
      error: error.message,
      raw_response: null 
    };
  }
}

// Handle W-2 finalization (save matched employee data with upsert)
async function handleW2Finalize(req: Request, supabase: any): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { finalizations } = await req.json();
    console.log('W2 Finalize request:', { finalizations });

    if (!finalizations || !Array.isArray(finalizations)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: finalizations array required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = [];
    const errors = [];

    // Process each finalization
    for (const finalization of finalizations) {
      try {
        const {
          document_id,
          w2_index,
          employee_id,
          action,
          new_employee_data,
          w2_data
        } = finalization;

        let finalEmployeeId = employee_id;

        // Step 1: Handle employee creation if needed
        if (action === 'create_new_employee' && new_employee_data) {
          console.log('Creating new employee:', new_employee_data);
          
          // First, get the business_id from the business_year
          const { data: businessYear, error: businessYearError } = await supabase
            .from('rd_business_years')
            .select('business_id')
            .eq('id', w2_data.business_year_id)
            .single();

          if (businessYearError || !businessYear) {
            console.error('Error getting business from business year:', businessYearError);
            errors.push({
              document_id,
              w2_index,
              error: `Failed to get business for new employee: ${businessYearError?.message}`,
              employee_data: new_employee_data
            });
            continue;
          }

          // Create the employee record (business association, not year-specific)
          const { data: newEmployee, error: employeeError } = await supabase
            .from('rd_employees')
            .insert({
              business_id: businessYear.business_id,
              name: new_employee_data.name,
              role: new_employee_data.role || 'Employee',
              email: new_employee_data.email || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (employeeError) {
            console.error('Error creating employee:', employeeError);
            errors.push({
              document_id,
              w2_index,
              error: `Failed to create employee: ${employeeError.message}`,
              employee_data: new_employee_data
            });
            continue;
          }

          finalEmployeeId = newEmployee.id;
          console.log('✅ Created new employee with ID:', finalEmployeeId);

          // Create the employee/year link immediately for new employees
          console.log('Creating employee/year link for new employee:', finalEmployeeId);
          
          const annualWage = w2_data.box_1_wages ? parseFloat(w2_data.box_1_wages.toString().replace(/[,$]/g, '')) : 0;
          
          // Update the employee record with the annual wage from W-2
          const { error: employeeUpdateError } = await supabase
            .from('rd_employees')
            .update({ 
              annual_wage: annualWage,
              updated_at: new Date().toISOString()
            })
            .eq('id', finalEmployeeId);

          if (employeeUpdateError) {
            console.error('Error updating employee annual wage:', employeeUpdateError);
            // Continue with year data creation even if wage update fails
          } else {
            console.log('✅ Updated new employee annual wage from W-2:', annualWage);
          }
          
          const { data: yearData, error: yearDataError } = await supabase
            .from('rd_employee_year_data')
            .insert({
              employee_id: finalEmployeeId,
              business_year_id: w2_data.business_year_id,
              applied_percent: 0, // Default to 0%, user can adjust later
              calculated_qre: 0, // Will be calculated when user sets R&D percentage
              activity_roles: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (yearDataError) {
            console.error('Error creating employee year data for new employee:', yearDataError);
            errors.push({
              document_id,
              w2_index,
              error: `Failed to create employee/year link: ${yearDataError.message}`,
              employee_data: new_employee_data
            });
            continue;
          }

          console.log('✅ Created employee/year link for new employee:', yearData.id);
        }

        // Step 2: Ensure existing employee is linked to the business year (skip for newly created employees)
        if (finalEmployeeId && action !== 'create_new_employee') {
          console.log('Ensuring existing employee is linked to business year:', finalEmployeeId);
          
          // Check if employee already has a year record, if not create one
          const { data: existingYearData, error: yearCheckError } = await supabase
            .from('rd_employee_year_data')
            .select('id')
            .eq('employee_id', finalEmployeeId)
            .eq('business_year_id', w2_data.business_year_id)
            .single();

          if (yearCheckError && yearCheckError.code !== 'PGRST116') {
            // PGRST116 is "not found" error, which is expected for new employee/year links
            console.error('Error checking employee year data:', yearCheckError);
          }

          if (!existingYearData) {
            // Create employee year data record to link employee to this business year
            console.log('Creating employee/year link for existing employee:', finalEmployeeId, 'in year:', w2_data.business_year_id);
            
            // Update the employee record with the annual wage from W-2
            const annualWage = w2_data.box_1_wages ? parseFloat(w2_data.box_1_wages.toString().replace(/[,$]/g, '')) : 0;
            const { error: employeeUpdateError } = await supabase
              .from('rd_employees')
              .update({ 
                annual_wage: annualWage,
                updated_at: new Date().toISOString()
              })
              .eq('id', finalEmployeeId);

            if (employeeUpdateError) {
              console.error('Error updating employee annual wage:', employeeUpdateError);
              // Continue with year data creation even if wage update fails
            } else {
              console.log('✅ Updated existing employee annual wage from W-2:', annualWage);
            }
            
            const { data: yearData, error: yearDataError } = await supabase
              .from('rd_employee_year_data')
              .insert({
                employee_id: finalEmployeeId,
                business_year_id: w2_data.business_year_id,
                applied_percent: 0, // Default to 0%, user can adjust later
                calculated_qre: 0, // Will be calculated when user sets R&D percentage
                activity_roles: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (yearDataError) {
              console.error('Error creating employee year data:', yearDataError);
              // Continue with W-2 data creation even if year link fails
            } else {
              console.log('✅ Created employee/year link for existing employee:', yearData.id);
            }
          } else {
            console.log('✅ Existing employee already linked to this business year');
            
            // Update the annual wage if we have W-2 data
            if (w2_data.box_1_wages) {
              const annualWage = parseFloat(w2_data.box_1_wages.toString().replace(/[,$]/g, ''));
              const { error: updateError } = await supabase
                .from('rd_employees')
                .update({ 
                  annual_wage: annualWage,
                  updated_at: new Date().toISOString()
                })
                .eq('id', finalEmployeeId);

              if (updateError) {
                console.error('Error updating employee annual wage:', updateError);
              } else {
                console.log('✅ Updated employee annual wage from W-2:', annualWage);
              }
            }
          }
        }

        // Step 3: Upsert W-2 extracted data
        if (finalEmployeeId) {
          console.log('Upserting W-2 data for employee:', finalEmployeeId);
          
          const w2ExtractedData = {
            w2_document_id: document_id,
            employee_id: finalEmployeeId,
            business_year_id: w2_data.business_year_id,
            tax_year: w2_data.tax_year || new Date().getFullYear(),
            
            // Employer information
            employer_name: w2_data.employer_name || null,
            employer_ein: w2_data.employer_ein || null,
            
            // Employee information from W-2
            employee_name_on_w2: w2_data.employee_name_on_w2,
            
            // Box information (convert strings to proper decimal format)
            box_1_wages: w2_data.box_1_wages ? parseFloat(w2_data.box_1_wages.toString().replace(/[,$]/g, '')) : null,
            box_2_federal_tax_withheld: w2_data.box_2_federal_tax_withheld ? parseFloat(w2_data.box_2_federal_tax_withheld.toString().replace(/[,$]/g, '')) : null,
            box_3_social_security_wages: w2_data.box_3_social_security_wages ? parseFloat(w2_data.box_3_social_security_wages.toString().replace(/[,$]/g, '')) : null,
            box_4_social_security_tax_withheld: w2_data.box_4_social_security_tax_withheld ? parseFloat(w2_data.box_4_social_security_tax_withheld.toString().replace(/[,$]/g, '')) : null,
            box_5_medicare_wages: w2_data.box_5_medicare_wages ? parseFloat(w2_data.box_5_medicare_wages.toString().replace(/[,$]/g, '')) : null,
            box_6_medicare_tax_withheld: w2_data.box_6_medicare_tax_withheld ? parseFloat(w2_data.box_6_medicare_tax_withheld.toString().replace(/[,$]/g, '')) : null,
            
            // Additional box data
            box_7_social_security_tips: w2_data.box_7_social_security_tips ? parseFloat(w2_data.box_7_social_security_tips.toString().replace(/[,$]/g, '')) : null,
            box_8_allocated_tips: w2_data.box_8_allocated_tips ? parseFloat(w2_data.box_8_allocated_tips.toString().replace(/[,$]/g, '')) : null,
            box_10_dependent_care_benefits: w2_data.box_10_dependent_care_benefits ? parseFloat(w2_data.box_10_dependent_care_benefits.toString().replace(/[,$]/g, '')) : null,
            box_11_nonqualified_plans: w2_data.box_11_nonqualified_plans ? parseFloat(w2_data.box_11_nonqualified_plans.toString().replace(/[,$]/g, '')) : null,
            
            // JSON fields
            box_12_codes: w2_data.box_12_codes || null,
            box_14_other: w2_data.box_14_other || null,
            state_and_local: w2_data.state_and_local || null,
            
            // AI extraction metadata
            extraction_confidence: w2_data.confidence || w2_data.extraction_confidence || 0.8,
            extraction_model: 'mistral-large-latest',
            raw_ai_response: w2_data,
            
            // Timestamps
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Use upsert with the unique constraint (employee_id, business_year_id)
          const { data: upsertedData, error: upsertError } = await supabase
            .from('rd_w2_extracted_data')
            .upsert(w2ExtractedData, {
              onConflict: 'employee_id,business_year_id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (upsertError) {
            console.error('Error upserting W-2 data:', upsertError);
            errors.push({
              document_id,
              w2_index,
              employee_id: finalEmployeeId,
              error: `Failed to save W-2 data: ${upsertError.message}`,
              w2_data: w2ExtractedData
            });
            continue;
          }

          console.log('Successfully upserted W-2 data:', upsertedData.id);
          
          results.push({
            document_id,
            w2_index,
            employee_id: finalEmployeeId,
            w2_extracted_data_id: upsertedData.id,
            action_taken: action,
            success: true
          });
        } else {
          errors.push({
            document_id,
            w2_index,
            error: 'No employee ID provided and failed to create new employee',
            finalization
          });
        }

      } catch (finalizationError) {
        console.error('Error processing finalization:', finalizationError);
        errors.push({
          document_id: finalization.document_id,
          w2_index: finalization.w2_index,
          error: finalizationError.message,
          finalization
        });
      }
    }

    // Return results
    const response = {
      success: errors.length === 0,
      processed_count: results.length,
      error_count: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('W2 Finalize response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: errors.length === 0 ? 200 : 207, // 207 Multi-Status for partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('W2 Finalize error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        processed_count: 0,
        error_count: 1
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}