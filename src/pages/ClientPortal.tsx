import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Download, FileText, CheckCircle, Clock, AlertCircle, Eye, PenTool, User, Building2, Shield, Award, ChevronRight, XCircle } from 'lucide-react';

// Create a separate supabase client instance for the portal
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // Import main authenticated client
import { ExpenseDistributionChart } from '../modules/tax-calculator/components/common/ExpenseDistributionChart';
import SignaturePad from '../components/SignaturePad';
import ProgressTrackingService from '../modules/tax-calculator/services/progressTrackingService';
// Dynamic import for AllocationReportModal to avoid module resolution issues
// Force cache refresh with comment change

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase client for portal with auth enabled
const portalSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

interface PortalData {
  business_id: string;
  business_name: string;
  user_id: string;
  token_id?: string;
}

interface ApprovedYear {
  year: number;
  business_years: BusinessYear[];
  total_qre: number;
  jurat_signed: boolean;
  all_documents_released: boolean;
}

interface BusinessYear {
  id: string;
  year: number;
  qc_status: string;
  payment_received: boolean;
  documents_released: boolean;
  business_name: string;
  gross_receipts: number;
  total_qre: number;
  federal_credit: number;
  state_credit: number;
}

interface DocumentInfo {
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  can_release: boolean;
  reason?: string;
  jurat_signed?: boolean;
  payment_received?: boolean;
  qc_approved?: boolean;
}

interface JuratSignature {
  id: string;
  signer_name: string;
  signer_title: string;
  signer_email: string;
  signed_at: string;
  ip_address: string;
  jurat_text: string;
  year: number;
}

const ClientPortal: React.FC = () => {
  const { userId, clientId, businessId, token } = useParams<{ 
    userId?: string; 
    clientId?: string; 
    businessId?: string; 
    token?: string; 
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [approvedYears, setApprovedYears] = useState<ApprovedYear[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedYear, setSelectedYear] = useState<ApprovedYear | null>(null);
  
  // Annual jurat signature state variables
  const [juratSignatures, setJuratSignatures] = useState<JuratSignature[]>([]);
  const [showJuratModal, setShowJuratModal] = useState(false);
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    title: '',
    email: ''
  });
  const [signatureData, setSignatureData] = useState<string>('');
  const [juratText, setJuratText] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // QRE breakdown for expense distribution chart
  const [qreBreakdown, setQreBreakdown] = useState({
    employeeQRE: 0,
    contractorQRE: 0,
    supplyQRE: 0
  });

  // Document viewing modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentDocumentContent, setCurrentDocumentContent] = useState('');
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState('');
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [AllocationReportModalComponent, setAllocationReportModalComponent] = useState<React.ComponentType<any> | null>(null);

  // Check for admin preview mode and extract URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminPreview = searchParams.get('admin_preview') === 'true';
  const previewBusinessId = searchParams.get('business_id');
  const previewToken = searchParams.get('preview_token');
  const urlClientId = searchParams.get('client_id');

  // Determine the effective user ID (use clientId for magic link routes)
  const effectiveUserId = userId || clientId;
  
  console.log('🔍 [ClientPortal] Component loaded:', { 
    userId, 
    clientId,
    effectiveUserId,
    isAdminPreview, 
    previewBusinessId, 
    previewToken,
    urlClientId
  });

  // Get the appropriate supabase client based on mode
  const getSupabaseClient = () => {
    if (isAdminPreview) {
      // Use authenticated admin client for preview mode
      return supabase;
    }
    // Use portal client for normal client authentication
    return portalSupabase;
  };

  const validateSessionAndLoadData = async () => {
    // For admin preview mode, we don't need a valid userId - check for admin preview params instead
    if (!effectiveUserId && !(isAdminPreview && previewBusinessId && previewToken)) {
      setError('Invalid portal link');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 [ClientPortal] Starting validation process');
      
      // Handle admin preview mode
      if (isAdminPreview && previewBusinessId && previewToken) {
        console.log('👤 [ClientPortal] Admin preview mode detected');
        
        // Validate preview token (simple time-based validation)
        const tokenTime = parseInt(previewToken);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (now - tokenTime > fiveMinutes) {
          setError('Preview link has expired. Please generate a new preview link.');
          setLoading(false);
          return;
        }
        
        // Check if admin is properly authenticated for preview
        const { data: { session }, error: adminSessionError } = await supabase.auth.getSession();
        if (adminSessionError || !session?.user) {
          setError('Admin authentication required for preview mode.');
          setLoading(false);
          return;
        }
        
        console.log('🔐 [ClientPortal] Admin authenticated, proceeding with preview');
        
        // Load business data directly for admin preview
        await loadBusinessDataForPreview(previewBusinessId);
        return;
      }

      // Normal client authentication flow
      console.log('🔐 Checking authentication for effectiveUserId:', effectiveUserId);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await portalSupabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Failed to get session');
      }

      if (!session || !session.user) {
        setError('Please use the magic link provided by your advisor to access this portal.');
        setLoading(false);
        return;
      }

      // Verify the authenticated user matches the requested effectiveUserId
      if (session.user.id !== effectiveUserId) {
        throw new Error('Authenticated user does not match portal user. Please use your specific magic link.');
      }

      // Fetch business data based on the authenticated user's client_id
      const client = getSupabaseClient();
      
      // 🎯 IMPROVED: Only fetch business years with approved data
      const { data: clientBusinesses, error: businessError } = await client
        .from('rd_businesses')
        .select(`
          id,
          name,
          ein,
          rd_business_years (
            id,
            year,
            gross_receipts,
            total_qre,
            qc_status,
            payment_received,
            documents_released,
            federal_credit,
            state_credit,
            created_at,
            updated_at
          )
        `)
        .eq('client_id', urlClientId || session.user.id);

      if (businessError) {
        console.error('Error fetching client business data:', businessError);
        throw new Error('Could not load business data for this client.');
      }

      if (!clientBusinesses || clientBusinesses.length === 0) {
        throw new Error('No businesses found for this client.');
      }

      // 🎯 IMPROVED: Group by year and only include approved business years
      const approvedBusinessYears: { [year: number]: BusinessYear[] } = {};
      
      console.log('🔍 [ClientPortal] All client businesses:', clientBusinesses);
      
      clientBusinesses.forEach(business => {
        console.log(`🔍 [ClientPortal] Processing business: ${business.name}, business years:`, business.rd_business_years);
        
        business.rd_business_years?.forEach(businessYear => {
          console.log(`🔍 [ClientPortal] Business year ${businessYear.year} QC status:`, businessYear.qc_status);
          
          // Only include years with approved QC status (including ready_for_review)
          if (businessYear.qc_status === 'approved' || businessYear.qc_status === 'complete' || businessYear.qc_status === 'ready_for_review') {
            console.log(`✅ [ClientPortal] Including business year ${businessYear.year} (${businessYear.qc_status})`);
            
            if (!approvedBusinessYears[businessYear.year]) {
              approvedBusinessYears[businessYear.year] = [];
            }
            approvedBusinessYears[businessYear.year].push({
              ...businessYear,
              business_name: business.name
            });
          } else {
            console.log(`❌ [ClientPortal] Excluding business year ${businessYear.year} (${businessYear.qc_status})`);
          }
        });
      });
      
      console.log('📋 [ClientPortal] Final approvedBusinessYears:', approvedBusinessYears);

      // Convert to ApprovedYear format and sort by year descending
      const transformedYears: ApprovedYear[] = Object.entries(approvedBusinessYears)
        .map(([year, businessYears]) => ({
          year: parseInt(year),
          business_years: businessYears,
          total_qre: businessYears.reduce((sum, by) => sum + (by.total_qre || 0), 0),
          jurat_signed: false, // Will be updated after loading jurat signatures
          all_documents_released: businessYears.every(by => by.documents_released)
        }))
        .sort((a, b) => b.year - a.year);

      // Set the first business for portal data context
      const firstBusiness = clientBusinesses[0];
      const transformedData: PortalData = {
        business_id: firstBusiness.id,
        business_name: firstBusiness.name,
        user_id: session.user.id,
      };

      setPortalData(transformedData);
      setApprovedYears(transformedYears);
      setDocuments([]); // Documents will be loaded via loadDocumentStatus()
      
      console.log('📋 [ClientPortal] Regular client - transformedYears:', transformedYears);
      console.log('📊 [ClientPortal] Regular client - transformedYears length:', transformedYears.length);
      
      // Set the most recent year as selected
      if (transformedYears.length > 0) {
        console.log('✅ [ClientPortal] Regular client - setting selectedYear to:', transformedYears[0]);
        setSelectedYear(transformedYears[0]);
      } else {
        console.warn('⚠️ [ClientPortal] Regular client - no transformedYears found!');
      }

      // Load annual jurat signatures
      console.log('🔄 [ClientPortal] About to call loadAnnualJuratSignatures with years:', transformedYears.map(y => y.year));
      await loadAnnualJuratSignatures(transformedYears.map(y => y.year));

    } catch (err: any) {
      console.error('Authentication or data loading error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Load business data for admin preview (bypasses authentication)
  const loadBusinessDataForPreview = async (businessId: string) => {
    try {
      console.log('👀 [ClientPortal] Loading business data for admin preview:', businessId);
      
      // Use authenticated admin supabase client for preview (has proper permissions)
      const { data: clientBusiness, error: businessError } = await supabase
        .from('rd_businesses')
        .select(`
          id,
          name,
          ein,
          client_id,
          rd_business_years (
            id,
            year,
            gross_receipts,
            total_qre,
            qc_status,
            payment_received,
            documents_released,
            federal_credit,
            state_credit,
            created_at,
            updated_at
          )
        `)
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('❌ Error fetching business data for preview:', businessError);
        throw new Error(`Could not load business data for preview: ${businessError.message}`);
      }

      if (!clientBusiness) {
        throw new Error('Business not found for preview.');
      }

      // 🎯 IMPROVED: Only include approved business years for preview too
      console.log('🔍 [ClientPortal] All business years before filtering:', clientBusiness.rd_business_years);
      
      const approvedBusinessYears = clientBusiness.rd_business_years?.filter(
        by => by.qc_status === 'approved' || by.qc_status === 'complete' || by.qc_status === 'ready_for_review'
      ) || [];
      
      console.log('✅ [ClientPortal] Approved business years after filtering:', approvedBusinessYears);

      // Group by year
      const yearGroups: { [year: number]: BusinessYear[] } = {};
      approvedBusinessYears.forEach(businessYear => {
        if (!yearGroups[businessYear.year]) {
          yearGroups[businessYear.year] = [];
        }
        yearGroups[businessYear.year].push({
          ...businessYear,
          business_name: clientBusiness.name
        });
      });

      // Convert to ApprovedYear format with proper QRE calculation
      const transformedYears: ApprovedYear[] = Object.entries(yearGroups)
        .map(([year, businessYears]) => {
          const totalQre = businessYears.reduce((sum, by) => {
            // Use the QRE from the business year data, fallback to 0
            const qre = by.total_qre || by.calculated_qre || 0;
            return sum + qre;
          }, 0);
          
          console.log(`🔍 [ClientPortal] Year ${year} QRE calculation:`, {
            businessYears: businessYears.map(by => ({ 
              name: by.business_name, 
              total_qre: by.total_qre, 
              calculated_qre: by.calculated_qre 
            })),
            totalQre
          });

          return {
            year: parseInt(year),
            business_years: businessYears,
            total_qre: totalQre,
            jurat_signed: false,
            all_documents_released: businessYears.every(by => by.documents_released)
          };
        })
        .sort((a, b) => b.year - a.year);

      console.log('🔍 [ClientPortal] clientBusiness data:', {
        id: clientBusiness.id,
        name: clientBusiness.name,
        client_id: clientBusiness.client_id,
        business_years_count: clientBusiness.rd_business_years?.length
      });

      const transformedData: PortalData = {
        business_id: clientBusiness.id,
        business_name: clientBusiness.name,
        user_id: clientBusiness.client_id, // Use the actual client_id instead of 'admin-preview'
      };

      setPortalData(transformedData);
      setApprovedYears(transformedYears);
      
      console.log('📋 [ClientPortal] Admin preview - transformedYears:', transformedYears);
      console.log('📊 [ClientPortal] Admin preview - transformedYears length:', transformedYears.length);
      
      if (transformedYears.length > 0) {
        console.log('✅ [ClientPortal] Admin preview - setting selectedYear to:', transformedYears[0]);
        setSelectedYear(transformedYears[0]);
      } else {
        console.warn('⚠️ [ClientPortal] Admin preview - no transformedYears found!');
      }

      // Load annual jurat signatures for preview
      console.log('🔄 [ClientPortal] About to call loadAnnualJuratSignatures (admin preview) with years:', transformedYears.map(y => y.year));
      await loadAnnualJuratSignatures(transformedYears.map(y => y.year));

    } catch (err: any) {
      console.error('❌ Admin preview data loading error:', err);
      setError(err.message || 'Failed to load business data for preview.');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 NEW: Load annual jurat signatures instead of per-business-year
  const loadAnnualJuratSignatures = async (years: number[]) => {
    console.log('🎯 [ClientPortal] loadAnnualJuratSignatures called:', { 
      years, 
      hasSelectedYear: !!selectedYear, 
      selectedYearData: selectedYear?.year,
      businessYearsCount: selectedYear?.business_years?.length || 0
    });

    if (!selectedYear || years.length === 0) {
      console.log('⚠️ [ClientPortal] loadAnnualJuratSignatures early return:', { 
        hasSelectedYear: !!selectedYear, 
        yearsLength: years.length 
      });
      return;
    }

    try {
      const client = getSupabaseClient();
      
      // SIMPLIFIED: Just check for signatures directly using the business year IDs we already have
      const allBusinessYearIds = selectedYear.business_years.map(by => by.id);
      console.log('🔍 [ClientPortal] Checking signatures for business year IDs:', allBusinessYearIds);
      
      if (allBusinessYearIds.length === 0) return;

      const { data: signatures, error } = await client
        .from('rd_signature_records')
        .select('*')
        .in('business_year_id', allBusinessYearIds)
        .order('signed_at', { ascending: false });

      console.log('📊 [ClientPortal] Signature query result:', { 
        signatures, 
        error,
        queriedIds: allBusinessYearIds,
        clientType: isAdminPreview ? 'admin-supabase' : 'portal-supabase',
        authUser: client.auth?.user?.id || 'not-available'
      });

      if (error) {
        console.error('❌ [ClientPortal] Error loading signatures:', error);
        throw error;
      }

      // Group signatures by year and get the most recent for each year
      const signaturesByYear: { [year: number]: JuratSignature } = {};
      
      signatures?.forEach(signature => {
        // Find which year this business_year_id belongs to by looking at our selectedYear data
        const businessYear = selectedYear.business_years.find(by => by.id === signature.business_year_id);
        if (businessYear) {
          const yearNum = businessYear.year;
          if (!signaturesByYear[yearNum] || new Date(signature.signed_at) > new Date(signaturesByYear[yearNum].signed_at)) {
            signaturesByYear[yearNum] = {
              ...signature,
              year: yearNum
            };
          }
        }
      });

      console.log('📋 [ClientPortal] Signatures found by year:', signaturesByYear);
      console.log('📋 [ClientPortal] Current selectedYear.year:', selectedYear.year);
      console.log('📋 [ClientPortal] Signature exists for current year:', !!signaturesByYear[selectedYear.year]);
      console.log('🔍 [ClientPortal] All signature records found:', signatures?.map(s => ({
        id: s.id,
        business_year_id: s.business_year_id,
        signer_name: s.signer_name,
        signed_at: s.signed_at
      })));

      setJuratSignatures(Object.values(signaturesByYear));

      // Update approved years with jurat status
      setApprovedYears(prev => prev.map(year => ({
        ...year,
        jurat_signed: !!signaturesByYear[year.year]
      })));

      // IMPORTANT: Also update the selectedYear to reflect the signature
      if (selectedYear && signaturesByYear[selectedYear.year]) {
        console.log('✅ [ClientPortal] Updating selectedYear jurat_signed to true');
        setSelectedYear(prev => prev ? {
          ...prev,
          jurat_signed: true
        } : prev);
      } else {
        console.log('❌ [ClientPortal] No signature found for current year, keeping jurat_signed false');
      }

    } catch (error) {
      console.error('Error loading annual jurat signatures:', error);
    }
  };

  useEffect(() => {
    validateSessionAndLoadData();
  }, [effectiveUserId]);

  useEffect(() => {
    console.log('🔄 [ClientPortal] selectedYear useEffect triggered');
    console.log('🔍 [ClientPortal] selectedYear value:', selectedYear);
    console.log('🔍 [ClientPortal] selectedYear type:', typeof selectedYear);
    
    if (selectedYear) {
      console.log('✅ [ClientPortal] selectedYear exists, calling loadDocumentStatus and loadQREBreakdown');
      loadDocumentStatus();
      loadQREBreakdown();
      
      // CRITICAL: Load jurat signatures when selectedYear changes
      console.log('🔄 [ClientPortal] Calling loadAnnualJuratSignatures from selectedYear useEffect');
      loadAnnualJuratSignatures([selectedYear.year]);
    } else {
      console.warn('⚠️ [ClientPortal] selectedYear is null/undefined, not loading document status or QRE breakdown');
    }
  }, [selectedYear]);

  const loadDocumentStatus = async () => {
    console.log('🚀 [ClientPortal] loadDocumentStatus called');
    console.log('🔍 [ClientPortal] selectedYear:', selectedYear);
    
    if (!selectedYear) {
      console.warn('⚠️ [ClientPortal] No selectedYear, returning early');
      return;
    }

    console.log('✅ [ClientPortal] Starting document status loading process');
    console.log('📋 [ClientPortal] selectedYear details:', {
      id: selectedYear.id,
      year: selectedYear.year,
      business_years: selectedYear.business_years?.length || 0
    });

    try {
      const documentTypes = ['research_report', 'filing_guide', 'allocation_report'];
      const client = getSupabaseClient();
      
      console.log('🔧 [ClientPortal] Supabase client ready, processing document types:', documentTypes);
      
      // Check document status for all business years in the selected year
      const documentPromises = documentTypes.map(async (docType) => {
        // Check across all business years for this year
        const businessYearIds = selectedYear.business_years.map(by => by.id);
        
        // Get the most permissive release status across all business years for this year
        let canRelease = false;
        let reason = 'Document pending QC approval';
        let juratSigned = false;
        let paymentReceived = false;
        let qcApproved = false;

        console.log(`🔍 [ClientPortal] Checking ${docType} eligibility across ${businessYearIds.length} business years:`, businessYearIds);

        for (const businessYearId of businessYearIds) {
          try {
            console.log(`🔎 [ClientPortal] Checking ${docType} for business year: ${businessYearId}`);
            
            const { data, error } = await client.rpc('check_document_release_eligibility', {
              p_business_year_id: businessYearId,
              p_document_type: docType
            });

            console.log(`📊 [ClientPortal] ${docType} eligibility result for ${businessYearId}:`, { data, error });

            if (error) {
              console.warn(`❌ [ClientPortal] Error checking ${docType} for business year ${businessYearId}:`, error);
              continue; // Skip if error for this business year
            }

            const result = data[0];
            console.log(`🎯 [ClientPortal] ${docType} result details:`, {
              businessYearId,
              can_release: result.can_release,
              reason: result.reason,
              jurat_signed: result.jurat_signed,
              payment_received: result.payment_received,
              qc_approved: result.qc_approved
            });

            if (result.can_release) {
              canRelease = true;
              reason = 'Document approved for release';
              console.log(`✅ [ClientPortal] ${docType} approved for release in business year: ${businessYearId}`);
            }
            if (result.jurat_signed) juratSigned = true;
            if (result.payment_received) paymentReceived = true;
            if (result.qc_approved) qcApproved = true;
          } catch (e) {
            console.warn(`❌ [ClientPortal] Exception checking ${docType} for business year ${businessYearId}:`, e);
          }
        }

        const documentResult = {
          type: docType,
          title: getDocumentTitle(docType),
          description: getDocumentDescription(docType),
          icon: getDocumentIcon(docType),
          can_release: canRelease,
          reason: reason,
          jurat_signed: juratSigned,
          payment_received: paymentReceived,
          qc_approved: qcApproved
        };

        console.log(`📋 [ClientPortal] Final ${docType} document result:`, documentResult);
        return documentResult;
      });

      const documentResults = await Promise.all(documentPromises);
      console.log('🎯 [ClientPortal] All document results:', documentResults);
      console.log('🎯 [ClientPortal] Available documents (can_release=true):', 
        documentResults.filter(doc => doc.can_release).map(doc => doc.type)
      );
      setDocuments(documentResults);

    } catch (error) {
      console.error('Error loading document status:', error);
    }
  };

  // 🎯 NEW: Sign annual jurat with signature parameter (to avoid state timing issues)
  const signAnnualJuratWithSignature = async (signature: string) => {
    if (!selectedYear || !signerInfo.name || !signerInfo.email) {
      alert('Please fill in all signer information');
      return;
    }

    if (!juratText || juratText.trim().length === 0) {
      alert('Jurat text is required. Please wait for the text to load or refresh the page.');
      return;
    }

    try {
      const client = getSupabaseClient();
      
      console.log('🚀 [ClientPortal] Starting jurat signing process with direct signature');
      console.log('📋 [ClientPortal] Business years to sign:', selectedYear.business_years.length);
      console.log('👤 [ClientPortal] Signer info:', {
        name: signerInfo.name,
        title: signerInfo.title,
        email: signerInfo.email
      });
      console.log('📄 [ClientPortal] Jurat text length:', juratText.length);
      console.log('🔗 [ClientPortal] Using client type:', isAdminPreview ? 'admin-supabase' : 'portal-supabase');

      // Validate signature data before proceeding (using parameter, not state)
      if (!signature || signature.length < 1000) {
        console.error('❌ [ClientPortal] Signature validation failed:', {
          hasSignature: !!signature,
          signatureLength: signature?.length || 0,
          isValid: signature && signature.length >= 1000
        });
        alert('Invalid or missing signature. Please create a proper signature using the signature pad.');
        return;
      }

      console.log('✅ [ClientPortal] Signature validation passed:', {
        hasSignature: !!signature,
        signatureLength: signature.length,
        startsWithData: signature.startsWith('data:'),
        isPNG: signature.includes('data:image/png')
      });



      // Sign jurat for each business year sequentially to get better error info
      const results = [];
      
      for (let i = 0; i < selectedYear.business_years.length; i++) {
        const businessYear = selectedYear.business_years[i];
        
        try {
          console.log(`🔄 [ClientPortal] Processing business year ${i + 1}/${selectedYear.business_years.length}:`, {
            id: businessYear.id,
            business_name: businessYear.business_name
          });

          // Create a simple verification hash
          const verificationData = `${businessYear.id}-${signerInfo.name}-${signerInfo.email}-${Date.now()}`;
          const verificationHash = btoa(verificationData);

          // Get client IP address (fallback to localhost due to CSP restrictions)
          let clientIP = '127.0.0.1';
          // Note: External IP lookup blocked by CSP, using localhost for now

          const insertData = {
            business_year_id: businessYear.id,
            signer_name: signerInfo.name,
            signer_title: signerInfo.title,
            signer_email: signerInfo.email,
            signature_image: signature,
            ip_address: clientIP,
            signed_at: new Date().toISOString(),
            jurat_text: juratText
          };

          console.log(`📝 [ClientPortal] Insert data for ${businessYear.business_name}:`, insertData);

          const result = await client
            .from('rd_signature_records')
            .insert(insertData);

          console.log(`✅ [ClientPortal] Insert result for ${businessYear.business_name}:`, result);
          results.push(result);

        } catch (error) {
          console.error(`❌ [ClientPortal] Error inserting signature for ${businessYear.business_name}:`, error);
          results.push({ error });
        }
      }
      
      // Check if any failed with detailed error logging
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('🚨 [ClientPortal] Jurat signing errors:', errors);
        errors.forEach((error, index) => {
          console.error(`❌ [ClientPortal] Error ${index + 1}:`, error.error);
        });
        throw new Error(`Failed to sign jurat for ${errors.length} business year(s). Check console for details.`);
      }

      // 🔗 AUTO-SYNC: Update jurat milestone for all signed business years
      for (const businessYear of selectedYear.business_years) {
        await ProgressTrackingService.syncJuratMilestone(businessYear.id, true);
      }

      // Reload data
      await loadAnnualJuratSignatures([selectedYear.year]);
      await loadDocumentStatus();
      setShowJuratModal(false);

      alert('Annual jurat signed successfully for all applicable business years!');

    } catch (error) {
      console.error('Error signing annual jurat:', error);
      alert('Error signing jurat. Please try again.');
    }
  };

  // 🎯 Legacy: Sign annual jurat (using state-based signature)
  const signAnnualJurat = async () => {
    if (!signatureData || signatureData.length < 1000) {
      alert('Please create a signature first using the signature pad.');
      return;
    }
    await signAnnualJuratWithSignature(signatureData);
  };

  const loadJuratSignatures = async () => {
    if (!selectedYear) return;

    try {
      const client = getSupabaseClient();
      
      // Get business year IDs
      const businessYearIds = selectedYear.business_years.map(by => by.id);
      if (businessYearIds.length === 0) return;

      const { data, error } = await client
        .from('rd_signature_records')
        .select('*')
        .in('business_year_id', businessYearIds)
        .order('signed_at', { ascending: false });

      if (error) throw error;
      setJuratSignatures(data || []);

    } catch (error) {
      console.error('Error loading jurat signatures:', error);
    }
  };

  const signJurat = async () => {
    if (!selectedYear || !signerInfo.name || !signerInfo.email) {
      alert('Please fill in all signer information');
      return;
    }

    try {
      const client = getSupabaseClient();
      
      // Get the first business year ID
      const businessYearId = selectedYear.business_years[0]?.id;
      if (!businessYearId) {
        alert('No business year data available');
        return;
      }

      const { error } = await client
        .from('rd_signature_records')
        .insert({
          business_year_id: businessYearId,
          signer_name: signerInfo.name,
          signature_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5TaWduZWQgZWxlY3Ryb25pY2FsbHk8L3RleHQ+PC9zdmc+',
          ip_address: '127.0.0.1',
          signed_at: new Date().toISOString(),
          jurat_text: juratText
        });

      if (error) throw error;

      // Reload data
      await loadJuratSignatures();
      await loadDocumentStatus();
      setShowJuratModal(false);

      alert('Jurat signed successfully!');

    } catch (error) {
      console.error('Error signing jurat:', error);
      alert('Failed to sign jurat. Please try again.');
    }
  };

  const downloadDocument = async (documentType: string) => {
    if (!selectedYear) return;

    try {
      // Check if document can be downloaded
      const doc = documents.find(d => d.type === documentType);
      if (!doc?.can_release) {
        alert(`Document cannot be downloaded: ${doc?.reason || 'Unknown reason'}`);
        return;
      }

      // Get the document from rd_reports table
      const client = getSupabaseClient();
      
      // Get the first business year ID (or handle multiple business years)
      const businessYearId = selectedYear.business_years[0]?.id;
      if (!businessYearId) {
        alert('No business year data available');
        return;
      }

      console.log('📄 [ClientPortal] Downloading document:', {
        documentType,
        businessYearId,
        businessYearCount: selectedYear.business_years.length
      });

      const { data, error } = await client
        .from('rd_reports')
        .select('generated_html, filing_guide')
        .eq('business_year_id', businessYearId)
        .eq('type', documentType === 'research_report' ? 'RESEARCH_SUMMARY' : 'FILING_GUIDE')
        .single();

      if (error) throw error;

      if (!data) {
        alert('Document not found');
        return;
      }

      // Get the HTML content based on document type
      let htmlContent = '';
      if (documentType === 'research_report' && data.generated_html) {
        htmlContent = data.generated_html;
      } else if (documentType === 'filing_guide' && data.filing_guide) {
        htmlContent = data.filing_guide;
      } else {
        alert('Document content not available');
        return;
      }

      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getDocumentTitle(documentType)}_${selectedYear.year}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  // View document in browser (read-only)
  const viewDocument = async (documentType: string) => {
    if (!selectedYear) return;

    try {
      // Check if document can be viewed
      const doc = documents.find(d => d.type === documentType);
      if (!doc?.can_release) {
        alert(`Document cannot be viewed: ${doc?.reason || 'Unknown reason'}`);
        return;
      }

      // Handle allocation report differently - use the dedicated modal
      if (documentType === 'allocation_report') {
        // Temporary: Simple alert until caching issues resolve
        alert('Allocation Report temporarily unavailable - cache clearing in progress');
        return;
      }

      // Get the document from rd_reports table
      const client = getSupabaseClient();
      
      // Get the first business year ID (or handle multiple business years)
      const businessYearId = selectedYear.business_years[0]?.id;
      if (!businessYearId) {
        alert('No business year data available');
        return;
      }

      console.log('👁️ [ClientPortal] Viewing document:', {
        documentType,
        businessYearId,
        businessYearCount: selectedYear.business_years.length
      });

      const { data, error } = await client
        .from('rd_reports')
        .select('generated_html, filing_guide')
        .eq('business_year_id', businessYearId)
        .eq('type', documentType === 'research_report' ? 'RESEARCH_SUMMARY' : 'FILING_GUIDE')
        .single();

      if (error) throw error;

      if (!data) {
        alert('Document not found');
        return;
      }

      // Get the HTML content based on document type
      let htmlContent = '';
      if (documentType === 'research_report' && data.generated_html) {
        htmlContent = data.generated_html;
      } else if (documentType === 'filing_guide' && data.filing_guide) {
        htmlContent = data.filing_guide;
      } else {
        alert('Document content not available');
        return;
      }

      // Show the EXACT saved document in a modal
      setCurrentDocumentContent(htmlContent);
      setCurrentDocumentTitle(`${getDocumentTitle(documentType)} - ${selectedYear.year}`);
      setShowDocumentModal(true);

    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document');
    }
  };

  // Helper functions for document display
  const getDocumentTitle = (type: string): string => {
    switch (type) {
      case 'research_report': return 'Research Report';
      case 'filing_guide': return 'Filing Guide';
      case 'allocation_report': return 'Allocation Report';
      default: return type;
    }
  };

  const getDocumentDescription = (type: string): string => {
    switch (type) {
      case 'research_report': return 'Detailed documentation of research activities and qualified expenses';
      case 'filing_guide': return 'Step-by-step guide for claiming R&D tax credits on your return';
      case 'allocation_report': return 'Expense allocation breakdown and supporting calculations';
      default: return 'Document description';
    }
  };

  const getDocumentIcon = (type: string): React.ComponentType<{ className?: string }> => {
    switch (type) {
      case 'research_report': return FileText;
      case 'filing_guide': return CheckCircle;
      case 'allocation_report': return Building2;
      default: return FileText;
    }
  };

  // Load QRE breakdown data for expense distribution chart
  const loadQREBreakdown = async () => {
    if (!selectedYear) {
      setQreBreakdown({ employeeQRE: 0, contractorQRE: 0, supplyQRE: 0 });
      return;
    }

    try {
      const client = getSupabaseClient();
      const businessYearIds = selectedYear.business_years.map(by => by.id);
      
      // Load employee QRE
      const { data: employees } = await client
        .from('rd_employee_year_data')
        .select('calculated_qre')
        .in('business_year_id', businessYearIds);
      
      const employeeQRE = employees?.reduce((sum, emp) => sum + (emp.calculated_qre || 0), 0) || 0;

      // Load contractor QRE
      const { data: contractors } = await client
        .from('rd_contractor_year_data')
        .select('calculated_qre')
        .in('business_year_id', businessYearIds);
      
      const contractorQRE = contractors?.reduce((sum, cont) => sum + (cont.calculated_qre || 0), 0) || 0;

      // Load supply QRE from rd_supply_subcomponents (use amount_applied)
      const { data: supplies } = await client
        .from('rd_supply_subcomponents')
        .select('amount_applied')
        .in('business_year_id', businessYearIds);
      
      const supplyQRE = supplies?.reduce((sum, supply) => sum + (supply.amount_applied || 0), 0) || 0;

      console.log('📊 [ClientPortal] QRE Breakdown loaded:', {
        employeeQRE,
        contractorQRE, 
        supplyQRE,
        total: employeeQRE + contractorQRE + supplyQRE
      });

      setQreBreakdown({
        employeeQRE,
        contractorQRE,
        supplyQRE
      });

    } catch (error) {
      console.error('Error loading QRE breakdown:', error);
      setQreBreakdown({ employeeQRE: 0, contractorQRE: 0, supplyQRE: 0 });
    }
  };

  // Set default jurat text
  useEffect(() => {
    setJuratText(`Annual Jurat and Attestation of R&D Tax Credit Documentation - ${selectedYear?.year || new Date().getFullYear()}

I, the undersigned, hereby declare under penalty of perjury that:

I have reviewed the information submitted through the Direct Research platform related to my business's qualification and participation in research and development activities for the purposes of claiming the federal and applicable state R&D tax credits under Internal Revenue Code §41 and related Treasury Regulations for the tax year ${selectedYear?.year || new Date().getFullYear()}.

To the best of my knowledge and belief, all facts, statements, data, time allocations, and supporting information provided for the ${selectedYear?.year || new Date().getFullYear()} tax year are true, correct, and complete.

I understand that the documentation and data submitted will be used to calculate tax credits that may be claimed on my federal and/or state tax returns and that knowingly submitting false or misleading information may subject me to penalties under federal and state law.

I further affirm that I am authorized to sign on behalf of the business entity and that I take full responsibility for the accuracy of the submission for the ${selectedYear?.year || new Date().getFullYear()} tax year.

This annual signature covers all business entities and research activities for the ${selectedYear?.year || new Date().getFullYear()} tax year.`);
  }, [selectedYear?.year]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Portal</h3>
            <p className="text-gray-600">Accessing your R&D tax credit information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (approvedYears.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Data</h3>
            <p className="text-gray-600 mb-4">
              You don't have any years with approved data available for review yet. 
              Please contact your advisor for updates on your R&D tax credit analysis.
            </p>
            <div className="text-sm text-gray-500">
              Only years with completed QC approval will appear in this portal.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">R&D Tax Credit Portal</h1>
                <p className="text-gray-600">{portalData?.business_name}</p>
              </div>
            </div>
            
            {isAdminPreview && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
                <div className="flex items-center text-yellow-800">
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Admin Preview Mode</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Year Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Approved Years</h2>
                <p className="text-blue-100 text-sm">Years with approved data</p>
              </div>
              
              <div className="p-2">
                {approvedYears.map((year) => {
                  const isSelected = selectedYear?.year === year.year;
                  const currentYearSignature = juratSignatures.find(sig => sig.year === year.year);
                  
                  return (
                    <button
                      key={year.year}
                      onClick={() => setSelectedYear(year)}
                      className={`w-full p-4 text-left rounded-lg mb-2 transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-md' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{year.year}</div>
                          <div className="text-sm text-gray-600">
                            {year.business_years.length} business{year.business_years.length !== 1 ? 'es' : ''}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            ${year.total_qre.toLocaleString()} QRE
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          {year.jurat_signed ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span className="text-xs">Signed</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-yellow-600">
                              <PenTool className="w-4 h-4 mr-1" />
                              <span className="text-xs">Pending</span>
                            </div>
                          )}
                          
                          {year.all_documents_released && (
                            <div className="flex items-center text-blue-600">
                              <Award className="w-4 h-4 mr-1" />
                              <span className="text-xs">Complete</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <ChevronRight className="w-5 h-5 text-blue-600 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedYear && (
              <div className="space-y-8">
                {/* Year Overview */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedYear.year} Tax Year - {selectedYear.business_years[0]?.business_name || 'Business Name'}
                      </h2>
                      <p className="text-gray-600">R&D tax credit documentation and reports</p>
                    </div>
                  </div>

                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* QRE Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-blue-900">Total QRE</h3>
                          <div className="text-2xl font-bold text-blue-600">
                            ${(qreBreakdown.employeeQRE + qreBreakdown.contractorQRE + qreBreakdown.supplyQRE).toLocaleString()}
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Federal Credit Card */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-green-900">Federal Credit</h3>
                          <div className="text-2xl font-bold text-green-600">
                            ${(selectedYear.business_years.reduce((sum, by) => sum + (by.federal_credit || 0), 0)).toLocaleString()}
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* State Credit Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-purple-900">State Credit</h3>
                          <div className="text-2xl font-bold text-purple-600">
                            ${(selectedYear.business_years.reduce((sum, by) => sum + (by.state_credit || 0), 0)).toLocaleString()}
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QRE Distribution Full Width */}
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <ExpenseDistributionChart
                        employeeQRE={qreBreakdown.employeeQRE}
                        contractorQRE={qreBreakdown.contractorQRE}
                        supplyQRE={qreBreakdown.supplyQRE}
                        title="QRE Distribution"
                        variant="light"
                      />
                    </div>
                  </div>

                  {/* Annual Jurat Section */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <PenTool className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Annual Jurat & Attestation</h3>
                          <p className="text-gray-600">Required annual signature for {selectedYear.year} tax year</p>
                        </div>
                      </div>
                      
                      {(() => {
                        const currentYearSignature = juratSignatures.find(sig => sig.year === selectedYear.year);
                        return currentYearSignature ? (
                          <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Signature Required</span>
                          </div>
                        );
                      })()}
                    </div>

                    {(() => {
                      const currentYearSignature = juratSignatures.find(sig => sig.year === selectedYear.year);
                      
                      if (currentYearSignature) {
                        return (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-green-900 mb-2">Annual Attestation Completed</h4>
                                <div className="space-y-2 text-sm text-green-800">
                                  <div><strong>Signatory:</strong> {currentYearSignature.signer_name}</div>
                                  {currentYearSignature.signer_title && <div><strong>Title:</strong> {currentYearSignature.signer_title}</div>}
                                  {currentYearSignature.signer_email && <div><strong>Email:</strong> {currentYearSignature.signer_email}</div>}
                                  <div><strong>Signed:</strong> {new Date(currentYearSignature.signed_at).toLocaleDateString()} at {new Date(currentYearSignature.signed_at).toLocaleTimeString()}</div>
                                  <div><strong>IP Address:</strong> {currentYearSignature.ip_address}</div>
                                  <div><strong>Coverage:</strong> All business entities for {selectedYear.year} tax year</div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <div className="text-center mb-6">
                              <PenTool className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                              <h4 className="text-lg font-semibold text-yellow-900 mb-2">Annual Jurat Required</h4>
                              <p className="text-yellow-800 mb-4">
                                An annual jurat signature is required to access your {selectedYear.year} tax year documents.
                                This single signature covers all business entities for the {selectedYear.year} tax year.
                              </p>
                              <div className="bg-white rounded-lg p-4 mb-4 text-left">
                                <h5 className="font-medium text-gray-900 mb-2">What this covers:</h5>
                                <ul className="space-y-1 text-sm text-gray-700">
                                  {selectedYear.business_years.map((by, index) => (
                                    <li key={by.id} className="flex items-center">
                                      <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                                      {by.business_name} - ${by.total_qre?.toLocaleString() || '0'} QRE
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <button
                                onClick={() => setShowJuratModal(true)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg font-medium"
                              >
                                Sign Annual Jurat for {selectedYear.year}
                              </button>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {/* Jurat Section */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Jurat & Attestation</h2>
                      {juratSignatures.length > 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <PenTool className="w-4 h-4 mr-1" />
                          Signature Required
                        </span>
                      )}
                    </div>

                    {juratSignatures.length > 0 ? (
                      <div className="space-y-3">
                        {juratSignatures.map((signature) => (
                          <div key={signature.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-green-900">{signature.signer_name}</p>
                                <p className="text-sm text-green-700">{signature.signer_title}</p>
                                <p className="text-sm text-green-700">{signature.signer_email}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-green-700">
                                  Signed: {new Date(signature.signed_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <PenTool className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                          A jurat signature is required to access certain documents.
                        </p>
                        <button
                          onClick={() => setShowJuratModal(true)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Digital Signature
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Documents Section */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Available Documents</h3>
                        <p className="text-gray-600">{selectedYear.year} tax year documentation</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {documents.map((doc) => {
                        const IconComponent = doc.icon;
                        
                        return (
                          <div key={doc.type} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                doc.can_release 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                                <p className="text-sm text-gray-600">{doc.description}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">QC Approved:</span>
                                <span className={doc.qc_approved ? 'text-green-600' : 'text-gray-500'}>
                                  {doc.qc_approved ? 'Yes' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Jurat Signed:</span>
                                <span className={doc.jurat_signed ? 'text-green-600' : 'text-gray-500'}>
                                  {doc.jurat_signed ? 'Yes' : 'Required'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Payment:</span>
                                <span className={doc.payment_received ? 'text-green-600' : 'text-gray-500'}>
                                  {doc.payment_received ? 'Received' : 'Pending'}
                                </span>
                              </div>
                            </div>

                            {doc.can_release ? (
                              (() => {
                                // Determine if all documents are ready for download
                                const allDocumentsReady = documents.every(d => d.can_release && d.qc_approved);
                                const paymentReceived = doc.payment_received;
                                
                                // Research Report: View-only until all documents ready
                                if (doc.type === 'research_report') {
                                  if (allDocumentsReady && paymentReceived) {
                                    return (
                                      <button 
                                        onClick={() => downloadDocument(doc.type)}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                                      >
                                        <Download className="w-4 h-4 inline mr-2" />
                                        Download
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <button 
                                        onClick={() => viewDocument(doc.type)}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                                      >
                                        <FileText className="w-4 h-4 inline mr-2" />
                                        View
                                      </button>
                                    );
                                  }
                                }
                                
                                // Filing Guide: Download after payment
                                if (doc.type === 'filing_guide') {
                                  if (paymentReceived) {
                                    return (
                                      <button 
                                        onClick={() => downloadDocument(doc.type)}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                                      >
                                        <Download className="w-4 h-4 inline mr-2" />
                                        Download
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <div className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center text-sm">
                                        Payment required for download
                                      </div>
                                    );
                                  }
                                }
                                
                                // Allocation Report: View-only (always)
                                if (doc.type === 'allocation_report') {
                                  return (
                                    <button 
                                      onClick={() => viewDocument(doc.type)}
                                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                                    >
                                      <FileText className="w-4 h-4 inline mr-2" />
                                      View
                                    </button>
                                  );
                                }
                                
                                // Default: Download if available
                                return (
                                  <button 
                                    onClick={() => downloadDocument(doc.type)}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                                  >
                                    <Download className="w-4 h-4 inline mr-2" />
                                    Download
                                  </button>
                                );
                              })()
                            ) : (
                              <div className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center text-sm">
                                {doc.reason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                                 </div>
               </div>
             )}
           </div>
         </div>
       </div>

      {/* Annual Jurat Modal */}
      {showJuratModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white">
              <h3 className="text-xl font-semibold">Annual Jurat & Attestation - {selectedYear?.year}</h3>
              <p className="text-orange-100">Legal attestation for all business entities in {selectedYear?.year}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Coverage Summary - Removed as requested */}

              {/* Jurat Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Jurat Text for {selectedYear?.year}
                </label>
                <textarea
                  value={juratText}
                  onChange={(e) => setJuratText(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  readOnly
                />
              </div>

              {/* Signer Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={signerInfo.name}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title/Position *
                  </label>
                  <input
                    type="text"
                    value={signerInfo.title}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., CEO, CFO, Owner"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={signerInfo.email}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={() => setShowJuratModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!signerInfo.name || !signerInfo.email) {
                      alert('Please fill in your name and email before signing');
                      return;
                    }
                    setShowSignaturePad(true);
                  }}
                  disabled={!signerInfo.name || !signerInfo.email}
                  className="px-8 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <PenTool className="w-4 h-4 inline mr-2" />
                  Create Digital Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewing Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-semibold">{currentDocumentTitle}</h3>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div 
                className="h-full w-full overflow-y-auto px-4 py-2"
                dangerouslySetInnerHTML={{ __html: currentDocumentContent }}
                style={{
                  minHeight: '100%'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Allocation Report Modal - Temporarily disabled for cache clearing */}

      {/* Signature Pad Modal */}
      <SignaturePad
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={async (signature) => {
          console.log('🖋️ [ClientPortal] Received signature from pad:', {
            dataLength: signature.length,
            startsWithPNG: signature.startsWith('data:image/png'),
            isValid: signature.length > 1000
          });
          
          // Validate signature before proceeding
          if (!signature || signature.length < 1000) {
            alert('Invalid or missing signature. Please create a proper signature using the signature pad.');
            return;
          }
          
          setSignatureData(signature);
          setShowSignaturePad(false);
          setShowJuratModal(false);
          
          // Call signAnnualJurat with the signature directly to avoid state timing issues
          await signAnnualJuratWithSignature(signature);
        }}
        title="Annual Jurat Digital Signature"
      />
    </div>
  );
};

export default ClientPortal; 