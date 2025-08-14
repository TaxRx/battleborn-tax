import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Calendar, Download, FileText, CheckCircle, Clock, AlertCircle, Eye, PenTool, User, Building2, Shield, Award, ChevronRight, XCircle, Users, Sliders, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CurrentRDView } from '../modules/current-rd/CurrentRDView';

// Create a separate supabase client instance for the portal
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // Import main authenticated client
import useAuthStore from '../store/authStore';
import { ExpenseDistributionChart } from '../modules/tax-calculator/components/common/ExpenseDistributionChart';
import SignaturePad from '../components/SignaturePad';
import { ProgressTrackingService } from '../modules/tax-calculator/services/progressTrackingService';
import BusinessSelector from '../components/BusinessSelector';
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

interface Business {
  id: string;
  name: string;
  ein: string;
  client_id: string;
}

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
  jurat_signed: boolean | undefined;
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
  const [searchParams] = useSearchParams();
  const { clientId } = useParams<{ clientId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Business selection state
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  
  // Auth store for logout
  const { logout: authLogout } = useAuthStore();
  
  // Admin preview support - check both URL path and query parameters
  const isLegacyAdminPreview = !!(clientId && (searchParams.get('business_id') || searchParams.get('preview_token')));
  const isQueryAdminPreview = searchParams.get('admin_preview') === 'true';
  const isAdminPreview = isLegacyAdminPreview || isQueryAdminPreview;
  const previewBusinessId = searchParams.get('business_id') || '';
  const previewToken = searchParams.get('preview_token') || '';

  // DETAILED DEBUG LOGGING FOR REDIRECT INVESTIGATION
  console.log('🚀 [ClientPortal] COMPONENT MOUNTING - FULL URL DEBUG:', {
    fullUrl: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    host: window.location.host,
    origin: window.location.origin
  });
  
  console.log('🚀 [ClientPortal] ROUTE AND QUERY PARAMS:', {
    clientId,
    isLegacyAdminPreview,
    isQueryAdminPreview,
    isAdminPreview,
    previewBusinessId,
    previewToken,
    allParams: Object.fromEntries(searchParams)
  });
  
  console.log('🚀 [ClientPortal] QUERY PARAMETERS:', {
    searchString: window.location.search,
    allSearchParams: Object.fromEntries(new URLSearchParams(window.location.search))
  });
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [approvedYears, setApprovedYears] = useState<ApprovedYear[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  // Databank: locked years with credits and released docs
  const [databankYears, setDatabankYears] = useState<ApprovedYear[]>([]);
  const [expandedDatabank, setExpandedDatabank] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<'dashboard' | 'databank' | 'current-rd'>('dashboard');
  const [databankRelease, setDatabankRelease] = useState<Record<string, { research_report: boolean; filing_guide: boolean; allocation_report: boolean }>>({});
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
  const [dashboardTiles, setDashboardTiles] = useState<any | null>(null);
  const [showRoleDesignations, setShowRoleDesignations] = useState(false);
  const [roleDesignationRows, setRoleDesignationRows] = useState<any[]>([]);
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [allocationRow, setAllocationRow] = useState<any | null>(null);
  const [allocationActivities, setAllocationActivities] = useState<any[]>([]);
  const [allocationValues, setAllocationValues] = useState<Record<string, number>>({});
  const [roleRequestInfo, setRoleRequestInfo] = useState<{ hasRequest: boolean; completed: boolean } | null>(null);
  const upsertClientRequest = async (byId: string, type: 'roles' | 'subcomponents', status: 'client_in_progress' | 'client_completed') => {
    try {
      const client = getSupabaseClient();
      const { data: existing } = await client
        .from('rd_client_requests')
        .select('id,status')
        .eq('business_year_id', byId)
        .eq('type', type)
        .maybeSingle();
      if (existing?.id) {
        const changes: any = { status };
        if (status === 'client_completed') changes.client_completed_at = new Date().toISOString();
        await client.from('rd_client_requests').update(changes).eq('id', existing.id);
      } else {
        const payload: any = { business_year_id: byId, type, status };
        if (status === 'client_completed') payload.client_completed_at = new Date().toISOString();
        await client.from('rd_client_requests').insert(payload);
      }
    } catch (e) {
      // ignore quietly if registry not present
      console.warn('registry upsert failed', e);
    }
  };

  console.log('🔍 [ClientPortal] Component loaded:', { 
    clientId,
    isLegacyAdminPreview,
    isAdminPreview, 
    previewBusinessId, 
    previewToken,
    selectedBusinessId: selectedBusiness?.id,
    availableBusinessesCount: availableBusinesses.length
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
    console.log('🔍 [ClientPortal] VALIDATION STARTING - Checking requirements:', {
      isAdminPreview,
      previewBusinessId,
      previewToken,
      hasAdminPreviewParams: !!(isAdminPreview && previewBusinessId && previewToken)
    });
    
    // For admin preview mode, check for required preview parameters
    if (isAdminPreview) {
      if (!previewBusinessId || !previewToken) {
        console.error('❌ [ClientPortal] ADMIN PREVIEW VALIDATION FAILED - Missing parameters:', {
          previewBusinessId,
          previewToken,
          fullUrl: window.location.href
        });
        setError('Invalid admin preview link - missing required parameters');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('🔐 [ClientPortal] Starting validation process');
      
      // Handle admin preview mode
      if (isAdminPreview && previewBusinessId && previewToken) {
        const previewType = isLegacyAdminPreview ? 'Legacy URL format' : 'Query parameter format';
        console.log(`👤 [ClientPortal] Admin preview mode detected (${previewType}):`);
        
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

      // Normal client authentication flow - user must be authenticated
      console.log('🔐 [ClientPortal] AUTHENTICATION CHECK - Starting client authentication flow:', {
        currentUrl: window.location.href
      });
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await portalSupabase.auth.getSession();
      
      console.log('🔐 [ClientPortal] AUTHENTICATION RESULT:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        sessionUserId: session?.user?.id,
        sessionError: sessionError?.message,
        userEmail: session?.user?.email
      });
      
      if (sessionError) {
        console.error('❌ [ClientPortal] SESSION ERROR:', sessionError);
        throw new Error('Failed to get session');
      }

      if (!session || !session.user) {
        console.error('❌ [ClientPortal] NO SESSION OR USER - Authentication required:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          reason: 'User must authenticate via magic link',
          currentUrl: window.location.href
        });
        setError('Please use the magic link provided by your advisor to access this portal.');
        setLoading(false);
        return;
      }

      // User is authenticated, proceed to load their business data
      console.log('✅ [ClientPortal] User authenticated successfully:', {
        userId: session.user.id,
        email: session.user.email
      });
      
      console.log('✅ [ClientPortal] AUTHENTICATION SUCCESS - User verified, proceeding to load data');

      // Fetch user's profile to get account_id
      const client = getSupabaseClient();
      
      const { data: userProfile, error: profileError } = await client
        .from('profiles')
        .select('account_id')
        .eq('id', session.user.id)
        .single();
        
      if (profileError || !userProfile?.account_id) {
        console.error('❌ [ClientPortal] Error fetching user profile:', profileError);
        throw new Error('Could not load user profile information.');
      }
      
      console.log('🔍 [ClientPortal] User profile loaded:', {
        userId: session.user.id,
        accountId: userProfile.account_id
      });
      
      // Fetch all businesses associated with user's account_id via clients table
      const { data: clientBusinesses, error: businessError } = await client
        .from('clients')
        .select(`
          id,
          account_id,
          rd_businesses (
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
          )
        `)
        .eq('account_id', userProfile.account_id);

      if (businessError) {
        console.error('Error fetching client business data:', businessError);
        throw new Error('Could not load business data for this client.');
      }

      if (!clientBusinesses || clientBusinesses.length === 0) {
        throw new Error('No businesses found for this account.');
      }

      // Flatten all businesses from all clients in this account
      const allBusinesses: Business[] = [];
      clientBusinesses.forEach(client => {
        if (client.rd_businesses) {
          client.rd_businesses.forEach(business => {
            allBusinesses.push({
              id: business.id,
              name: business.name,
              ein: business.ein,
              client_id: business.client_id
            });
          });
        }
      });
      
      console.log('🔍 [ClientPortal] All businesses for account:', allBusinesses);
      
      if (allBusinesses.length === 0) {
        throw new Error('No businesses found for this account.');
      }
      
      // Set available businesses and select first one by default
      setAvailableBusinesses(allBusinesses);
      
      const defaultBusiness = allBusinesses[0];
      setSelectedBusiness(defaultBusiness);
      
      console.log('🔍 [ClientPortal] Default business selected:', defaultBusiness);
      
      // Find the selected business data with years
      const selectedBusinessData = clientBusinesses
        .flatMap(client => client.rd_businesses || [])
        .find(business => business.id === defaultBusiness.id);
        
      if (!selectedBusinessData) {
        throw new Error('Selected business data not found.');
      }

      // Process business years for the selected business only
      const approvedBusinessYears: { [year: number]: BusinessYear[] } = {};
      
      console.log('🔍 [ClientPortal] Selected business data:', selectedBusinessData);
      
      console.log(`🔍 [ClientPortal] Processing business: ${selectedBusinessData.name}, business years:`, selectedBusinessData.rd_business_years);
      
      selectedBusinessData.rd_business_years?.forEach(businessYear => {
        console.log(`🔍 [ClientPortal] Business year ${businessYear.year} QC status:`, businessYear.qc_status);
        
        // Only include years with approved QC status (including ready_for_review)
        if (businessYear.qc_status === 'approved' || businessYear.qc_status === 'complete' || businessYear.qc_status === 'ready_for_review') {
          console.log(`✅ [ClientPortal] Including business year ${businessYear.year} (${businessYear.qc_status})`);
          
          if (!approvedBusinessYears[businessYear.year]) {
            approvedBusinessYears[businessYear.year] = [];
          }
          approvedBusinessYears[businessYear.year].push({
            ...businessYear,
            business_name: selectedBusinessData.name
          });
        } else {
          console.log(`❌ [ClientPortal] Excluding business year ${businessYear.year} (${businessYear.qc_status})`);
        }
      });
      
      console.log('📋 [ClientPortal] Final approvedBusinessYears:', approvedBusinessYears);

      // Convert to ApprovedYear format and sort by year descending
      const transformedYears: ApprovedYear[] = Object.entries(approvedBusinessYears)
        .map(([year, businessYears]) => ({
          year: parseInt(year),
          business_years: businessYears,
          total_qre: businessYears.reduce((sum, by) => sum + (by.total_qre || 0), 0),
          jurat_signed: undefined, // Will be updated after loading jurat signatures
          all_documents_released: businessYears.every(by => by.documents_released)
        }))
        .sort((a, b) => b.year - a.year);

      // Set the selected business for portal data context
      const transformedData: PortalData = {
        business_id: selectedBusinessData.id,
        business_name: selectedBusinessData.name,
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
            jurat_signed: undefined,
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
      
      // Set business selector state for admin preview
      const previewBusiness: Business = {
        id: clientBusiness.id,
        name: clientBusiness.name,
        ein: clientBusiness.ein,
        client_id: clientBusiness.client_id
      };
      setAvailableBusinesses([previewBusiness]);
      setSelectedBusiness(previewBusiness);
      
      console.log('🔍 [ClientPortal] Admin preview - business selector set:', previewBusiness);
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

  // Handle business selection changes
  const handleBusinessChange = async (business: Business) => {
    console.log('🔄 [ClientPortal] Business selection changed:', {
      previousBusiness: selectedBusiness?.name,
      newBusiness: business.name,
      businessId: business.id
    });
    
    setSelectedBusiness(business);
    setLoading(true);
    setError(null);
    
    try {
      // Get the authenticated session
      const { data: { session } } = await portalSupabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User session not found');
      }
      
      // Fetch the business data with years for the selected business
      const client = getSupabaseClient();
      const { data: businessData, error: businessError } = await client
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
        .eq('id', business.id)
        .single();
        
      if (businessError || !businessData) {
        throw new Error('Failed to load business data');
      }
      
      // Process business years for the selected business
      const approvedBusinessYears: { [year: number]: BusinessYear[] } = {};
      
      businessData.rd_business_years?.forEach(businessYear => {
        if (businessYear.qc_status === 'approved' || businessYear.qc_status === 'complete' || businessYear.qc_status === 'ready_for_review') {
          if (!approvedBusinessYears[businessYear.year]) {
            approvedBusinessYears[businessYear.year] = [];
          }
          approvedBusinessYears[businessYear.year].push({
            ...businessYear,
            business_name: businessData.name
          });
        }
      });
      
      // Convert to ApprovedYear format and sort by year descending
      const transformedYears: ApprovedYear[] = Object.entries(approvedBusinessYears)
        .map(([year, businessYears]) => ({
          year: parseInt(year),
          business_years: businessYears,
          total_qre: businessYears.reduce((sum, by) => sum + (by.total_qre || 0), 0),
          jurat_signed: undefined,
          all_documents_released: businessYears.every(by => by.documents_released)
        }))
        .sort((a, b) => b.year - a.year);
      
      // Update portal data
      const transformedData: PortalData = {
        business_id: businessData.id,
        business_name: businessData.name,
        user_id: session.user.id,
      };
      
      setPortalData(transformedData);
      setApprovedYears(transformedYears);
      setDocuments([]);
      
      // Set the most recent year as selected
      if (transformedYears.length > 0) {
        setSelectedYear(transformedYears[0]);
      } else {
        setSelectedYear(null);
      }
      
      // Load annual jurat signatures for new business
      await loadAnnualJuratSignatures(transformedYears.map(y => y.year));
      
    } catch (err: any) {
      console.error('Error changing business:', err);
      setError(err.message || 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    console.log('Logout clicked - starting logout process...');
    try {
      // Don't wait for Supabase signOut - do it in background
      console.log('Calling supabase.auth.signOut() (not waiting)...');
      supabase.auth.signOut().catch(error => console.error('Supabase signOut error:', error));
      
      console.log('Calling authLogout()...');
      // Clear auth store state
      authLogout();
      console.log('Clearing storage...');
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      console.log('Navigating to /login...');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 [ClientPortal] USEEFFECT TRIGGERED - Component mounted/dependencies changed:', {
      dependencies: { isAdminPreview, previewBusinessId, previewToken, clientId },
      currentUrl: window.location.href,
      allUrlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
      willStartValidation: true
    });
    validateSessionAndLoadData();
  }, [isAdminPreview, previewBusinessId, previewToken, clientId]);

  useEffect(() => {
    console.log('🔄 [ClientPortal] selectedYear useEffect triggered');
    console.log('🔍 [ClientPortal] selectedYear value:', selectedYear);
    console.log('🔍 [ClientPortal] selectedYear type:', typeof selectedYear);
    
    if (selectedYear) {
      console.log('✅ [ClientPortal] selectedYear exists, calling loadDocumentStatus and loadQREBreakdown');
      loadDocumentStatus();
      loadQREBreakdown();
      loadDashboardTiles();
      loadRoleRequestStatus();
      
      // Only load jurat signatures if we haven't checked them for this year yet
      // This prevents the circular dependency issue
      if (selectedYear.jurat_signed === undefined) {
        console.log('🔄 [ClientPortal] Calling loadAnnualJuratSignatures for unchecked year');
        loadAnnualJuratSignatures([selectedYear.year]);
      } else {
        console.log('🔍 [ClientPortal] Jurat status already known, skipping signature check');
      }
    } else {
      console.warn('⚠️ [ClientPortal] selectedYear is null/undefined, not loading document status or QRE breakdown');
    }
  }, [selectedYear?.year, selectedYear?.id]); // Use stable primitive values instead of the whole object

  const loadDashboardTiles = async () => {
    if (!selectedYear || !portalData?.business_id) return;
    const client = getSupabaseClient();
    const firstById = selectedYear.business_years?.[0]?.id;
    if (!firstById) return;
    const { data } = await client
      .from('rd_client_portal_dashboard')
      .select('*')
      .eq('business_id', portalData.business_id)
      .eq('business_year_id', firstById)
      .maybeSingle();
    setDashboardTiles(data || null);
  };

  // Load Databank years (credits_locked = true) grouped by year for this business
  const loadDatabankYears = async () => {
    try {
      if (!portalData?.business_id) return;
      const client = getSupabaseClient();
      let sourceYears: ApprovedYear[] = [];
      if (approvedYears && approvedYears.length > 0) {
        // Use the same years shown in the Approved Years sidebar (already sorted desc)
        sourceYears = [...approvedYears].sort((a, b) => b.year - a.year);
      } else {
        // Fallback to querying locked years directly
        const { data: bys } = await client
          .from('rd_business_years')
          .select('id, year, business_id, federal_credit, state_credit, credits_locked')
          .eq('business_id', portalData.business_id)
          .eq('credits_locked', true)
          .order('year', { ascending: false });
        const grouped = (bys || []).reduce((map: Record<number, any[]>, by: any) => {
          if (!map[by.year]) map[by.year] = [];
          map[by.year].push({ ...by, business_name: portalData?.business_name || '' });
          return map;
        }, {});
        sourceYears = Object.entries(grouped).map(([year, arr]) => ({
          year: parseInt(year, 10),
          business_years: arr as any,
          total_qre: 0,
          jurat_signed: undefined,
          all_documents_released: false,
        })).sort((a, b) => b.year - a.year);
      }

      setDatabankYears(sourceYears);

      // Build release map per BY and docType
      const byIds: string[] = sourceYears.flatMap(y => (y.business_years || []).map((by: any) => by.id)).filter(Boolean);
      const docTypes: Array<'research_report' | 'filing_guide' | 'allocation_report'> = ['research_report', 'filing_guide', 'allocation_report'];
      const releaseMap: Record<string, { research_report: boolean; filing_guide: boolean; allocation_report: boolean }> = {};
      for (const byId of byIds) {
        releaseMap[byId] = { research_report: false, filing_guide: false, allocation_report: false };
        for (const dt of docTypes) {
          try {
            const { data, error } = await client.rpc('check_document_release_eligibility', {
              p_business_year_id: byId,
              p_document_type: dt
            });
            if (!error && Array.isArray(data) && data[0]) {
              releaseMap[byId][dt] = !!data[0].can_release;
            }
          } catch {}
        }
      }
      setDatabankRelease(releaseMap);
    } catch {
      setDatabankYears([]);
    }
  };

  useEffect(() => {
    loadDatabankYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalData?.business_id, approvedYears]);

  const toggleDatabankYear = (year: number) => {
    setExpandedDatabank(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const viewDocumentForBusinessYear = async (businessYearId: string, documentType: string, yearLabel: number | string) => {
    try {
      const client = getSupabaseClient();
      let queryType = documentType === 'filing_guide' ? 'FILING_GUIDE' : 'RESEARCH_SUMMARY';
      const { data, error } = await client
        .from('rd_reports')
        .select('generated_html, filing_guide, allocation_report, type, created_at, updated_at, id, business_id, ai_version, locked')
        .eq('business_year_id', businessYearId)
        .eq('type', queryType)
        .single();
      if (error) throw error;
      let htmlContent = '';
      if (documentType === 'research_report') htmlContent = data.generated_html || '';
      else if (documentType === 'filing_guide') htmlContent = data.filing_guide || '';
      else if (documentType === 'allocation_report') htmlContent = data.allocation_report || '';
      if (!htmlContent) { alert('Document content not available'); return; }
      setCurrentDocumentContent(htmlContent);
      setCurrentDocumentTitle(`${getDocumentTitle(documentType)} - ${yearLabel}`);
      setShowDocumentModal(true);
    } catch (e) {
      console.error('Error viewing document for BY:', e);
      alert('Failed to load document');
    }
  };

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
            } else {
              // Update reason with the specific reason from database function
              reason = result.reason;
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
      console.log('🔄 [ClientPortal] Starting jurat milestone sync for business years:', selectedYear.business_years.map(by => ({ id: by.id, name: by.business_name })));
      for (const businessYear of selectedYear.business_years) {
        console.log(`🔄 [ClientPortal] Syncing jurat milestone for business year: ${businessYear.id} (${businessYear.business_name})`);
        await ProgressTrackingService.syncJuratMilestone(businessYear.id, true);
        console.log(`✅ [ClientPortal] Successfully synced jurat milestone for: ${businessYear.id}`);
      }
      console.log('✅ [ClientPortal] Completed all jurat milestone syncs');

      // Reload data
      console.log('🔄 [ClientPortal] Starting data reload - loadAnnualJuratSignatures');
      await loadAnnualJuratSignatures([selectedYear.year]);
      console.log('✅ [ClientPortal] Completed loadAnnualJuratSignatures');
      
      console.log('🔄 [ClientPortal] Starting data reload - loadDocumentStatus');
      await loadDocumentStatus();
      console.log('✅ [ClientPortal] Completed loadDocumentStatus');
      
      console.log('🔄 [ClientPortal] Setting showJuratModal to false');
      setShowJuratModal(false);
      console.log('✅ [ClientPortal] Completed setShowJuratModal(false)');

      alert('Annual jurat signed successfully for all applicable business years!');

    } catch (error) {
      console.error('❌ [ClientPortal] DETAILED ERROR in signAnnualJuratWithSignature:', {
        message: error?.message || 'No error message',
        name: error?.name || 'Unknown error type',
        stack: error?.stack || 'No stack trace',
        fullError: error,
        errorString: String(error),
        selectedYear: selectedYear ? { year: selectedYear.year, businessYearCount: selectedYear.business_years?.length } : 'No selected year'
      });
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

      // Gate downloads behind Filing Guide release (except for the Filing Guide itself)
      const filingGuideDoc = documents.find(d => d.type === 'filing_guide');
      const isFilingGuideReleased = !!filingGuideDoc?.can_release;
      if (documentType !== 'filing_guide' && !isFilingGuideReleased) {
        alert('Downloads are enabled only after the Filing Guide is released. You may still view released documents.');
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

      // Allocation reports will be handled in the normal flow below
      console.log('📊 [ClientPortal] Loading document:', documentType);

      // Get the document from rd_reports table
      const client = getSupabaseClient();
      
      // Get the first business year ID (or handle multiple business years)
      console.log('🔍 [ClientPortal] selectedYear structure for viewDocument:', {
        hasSelectedYear: !!selectedYear,
        year: selectedYear?.year,
        hasBusinessYears: !!selectedYear?.business_years,
        businessYearsLength: selectedYear?.business_years?.length || 0,
        firstBusinessYear: selectedYear?.business_years?.[0]
      });
      
      console.log('🔍 [ClientPortal] portalData for viewDocument:', {
        hasPortalData: !!portalData,
        businessId: portalData?.business_id,
        businessName: portalData?.business_name
      });
      
      const businessYearId = selectedYear.business_years?.[0]?.id;
      if (!businessYearId) {
        console.error('❌ [ClientPortal] No business year ID found in viewDocument', {
          selectedYear: selectedYear,
          businessYears: selectedYear?.business_years
        });
        alert('No business year data available. Please refresh the page and try again.');
        return;
      }
      
      console.log('✅ [ClientPortal] Using business year ID:', businessYearId);

      console.log('👁️ [ClientPortal] Viewing document:', {
        documentType,
        businessYearId,
        businessYearCount: selectedYear.business_years.length
      });

      // COMPREHENSIVE DEBUGGING: Let's see what's actually in the database
      console.log('🔍 [ClientPortal] DEBUGGING: Checking all reports for this business year...');
      const { data: allReports } = await client
        .from('rd_reports')
        .select('*')
        .eq('business_year_id', businessYearId);
      
      console.log('📊 [ClientPortal] All reports in database:', allReports);
      console.log('📊 [ClientPortal] Business data:', { businessId: portalData?.business_id, businessYearId });
      
      if (allReports) {
        allReports.forEach((report, index) => {
          console.log(`📄 [ClientPortal] Report ${index + 1}:`, {
            id: report.id,
            type: report.type,
            business_id: report.business_id,
            business_year_id: report.business_year_id,
            hasGeneratedHtml: !!report.generated_html,
            generatedHtmlLength: report.generated_html?.length || 0,
            hasFilingGuide: !!report.filing_guide,
            filingGuideLength: report.filing_guide?.length || 0,
            hasAllocationReport: false, // Deprecated: allocation reports now use ALLOCATION_SUMMARY type
            allocationReportLength: 0, // Deprecated: allocation reports now use generated_html column
            created_at: report.created_at,
            updated_at: report.updated_at,
            htmlPreview: report.generated_html?.substring(0, 200) + '...' || 'None'
          });
        });
      }

      // Query logic: Different document types use specific enum types
      // - research_report: type='RESEARCH_SUMMARY' with content in generated_html column
      // - allocation_report: type='ALLOCATION_SUMMARY' with content in generated_html column  
      // - filing_guide: type='FILING_GUIDE' with content in filing_guide column
      
      // Simplified logic: use standard type-based lookup for all document types
       const queryType = documentType === 'filing_guide' ? 'FILING_GUIDE' : 
                        documentType === 'allocation_report' ? 'ALLOCATION_SUMMARY' :
                        'RESEARCH_SUMMARY';

       console.log('🔍 [ClientPortal] Executing query:', {
         table: 'rd_reports',
         businessYearId,
         queryType,
         documentType,
         selectFields: 'generated_html, filing_guide, type, created_at, updated_at, id, business_id, ai_version, locked'
       });

       // Fetch all candidate rows. Preference NOW: latest updated_at row first
       // (explicitly prefer the most recently saved cached guide),
       // then fall back to the richest content if needed.
       const listResult = await client
         .from('rd_reports')
         .select('generated_html, filing_guide, type, created_at, updated_at, id, business_id, ai_version, locked')
         .eq('business_year_id', businessYearId)
         .eq('type', queryType)
         .order('updated_at', { ascending: false });

       let data = null as any;
       let preferredGuideHtml: string | null = null;
       let error = listResult.error;
       if (!error) {
         const rows = listResult.data || [];
         if (documentType === 'filing_guide') {
           // First try the most recent row (index 0)
           const latest = rows[0] || null;
           if (latest && (latest.filing_guide || latest.generated_html)) {
             data = latest;
             preferredGuideHtml = latest.filing_guide || latest.generated_html || null;
           } else {
             // Fallback to richest content across rows
             let winner: any = null;
             let winnerLen = -1;
             rows.forEach(r => {
               const fgLen = r.filing_guide?.length || 0;
               const ghLen = r.generated_html?.length || 0;
               if (fgLen > winnerLen) { winner = r; winnerLen = fgLen; preferredGuideHtml = r.filing_guide || null; }
               if (ghLen > winnerLen) { winner = r; winnerLen = ghLen; preferredGuideHtml = r.generated_html || null; }
             });
             data = winner;
           }
         } else {
           data = rows[0] || null;
         }
         if (!data) error = { code: 'PGRST116', message: 'not found' } as any;
       }

      // If that fails and we have business context, try with business_id as well
      if (error?.code === 'PGRST116' && portalData?.business_id) {
        console.log('🔄 [ClientPortal] Retrying query with business_id context');
        
        // Use same simplified query logic for retry
         const retryResult = await client
           .from('rd_reports')
           .select('generated_html, filing_guide, type, created_at, updated_at, id, business_id, ai_version, locked')
           .eq('business_year_id', businessYearId)
           .eq('business_id', portalData.business_id)
           .eq('type', queryType)
           .order('updated_at', { ascending: false });
         const rows = retryResult.data || [];
         if (documentType === 'filing_guide') {
           let winner: any = null;
           let winnerLen = -1;
           rows.forEach(r => {
             const fgLen = r.filing_guide?.length || 0;
             const ghLen = r.generated_html?.length || 0;
             if (fgLen > winnerLen) { winner = r; winnerLen = fgLen; preferredGuideHtml = r.filing_guide || null; }
             if (ghLen > winnerLen) { winner = r; winnerLen = ghLen; preferredGuideHtml = r.generated_html || null; }
           });
           data = winner;
         } else {
           data = rows[0] || null;
         }
         error = retryResult.error || (!data ? { code: 'PGRST116', message: 'not found' } as any : null);
        
        if (!retryResult.error) {
          data = retryResult.data;
          error = retryResult.error;
          console.log('✅ [ClientPortal] Successfully found report with business_id context');
        }
      }

      console.log('📄 [ClientPortal] Document query result:', {
        error,
        data: data ? {
          id: data.id,
          type: data.type,
          business_id: data.business_id,
          business_year_id: data.business_year_id,
          hasGeneratedHtml: !!data.generated_html,
          hasFilingGuide: !!data.filing_guide,
          hasAllocationReport: false, // Deprecated: allocation reports now use ALLOCATION_SUMMARY type
          generatedHtmlLength: data.generated_html?.length || 0,
          filingGuideLength: data.filing_guide?.length || 0,
          allocationReportLength: 0, // Deprecated: allocation reports now use generated_html column
          created_at: data.created_at,
          updated_at: data.updated_at,
          htmlPreview: data.generated_html?.substring(0, 200) + '...' || 'None',
          generatedHtmlValue: data.generated_html,
          ai_version: data.ai_version,
          locked: data.locked
        } : null
      });

      if (error) {
        console.error('❌ [ClientPortal] Error fetching document:', error);
        alert(`Error loading document: ${error.message}`);
        return;
      }

      if (!data) {
        alert('Document not found');
        return;
      }

      // Get the HTML content based on document type
      let htmlContent = '';
      
      try {
        console.log('🔍 [ClientPortal] Processing document type:', documentType);
        
        if (documentType === 'research_report') {
        console.log('🔍 [ClientPortal] Research report detailed analysis:', {
          hasGeneratedHtml: !!data.generated_html,
          generatedHtmlType: typeof data.generated_html,
          generatedHtmlLength: data.generated_html?.length || 0,
          generatedHtmlIsNull: data.generated_html === null,
          generatedHtmlIsUndefined: data.generated_html === undefined,
          generatedHtmlIsEmptyString: data.generated_html === '',
          allDataKeys: Object.keys(data),
          businessYearId: data.business_year_id,
          reportId: data.id
        });
        
        if (data.generated_html) {
          htmlContent = data.generated_html;
          console.log('✅ [ClientPortal] Using generated_html for research report');
          
          // DIAGNOSTIC: Check if we accidentally got allocation report content
          if (htmlContent.includes('ALLOCATION REPORT') || htmlContent.includes('Allocation Report')) {
            console.error('🚨 [ClientPortal] CRITICAL: Research report contains allocation report content!');
            console.log('📄 [ClientPortal] Content sample:', htmlContent.substring(0, 500));
            
            // Provide options to fix the issue
            const userChoice = confirm(
              'ERROR: The Research Report contains incorrect content (Allocation Report data).\n\n' +
              'Click OK to automatically clear the corrupted data (you can regenerate the correct report in the R&D Wizard).\n' +
              'Click Cancel to close this dialog and manually regenerate the report.'
            );
            
            if (userChoice) {
              // Clear the corrupted data
              try {
                await client
                  .from('rd_reports')
                  .update({ generated_html: null })
                  .eq('business_year_id', businessYearId)
                  .eq('type', 'RESEARCH_SUMMARY');
                
                console.log('✅ [ClientPortal] Corrupted research report data cleared');
                alert('Corrupted data has been cleared. Please go to R&D Wizard > Calculations step > Research Report button to generate the correct report.');
              } catch (error) {
                console.error('❌ [ClientPortal] Failed to clear corrupted data:', error);
                alert('Failed to clear corrupted data. Please contact support or manually regenerate the report in the R&D Wizard.');
              }
            } else {
              alert('Please go to R&D Wizard > Calculations step > Research Report button to regenerate the correct report.');
            }
            return;
          } else if (htmlContent.includes('Research Report') || htmlContent.includes('RESEARCH REPORT') || htmlContent.includes('report-main-content')) {
            console.log('✅ [ClientPortal] Content appears to be correct research report');
          } else {
            console.warn('⚠️ [ClientPortal] Content type unclear, contains neither research nor allocation markers');
            console.log('📄 [ClientPortal] Content sample for debugging:', htmlContent.substring(0, 500));
            
            // Also check for very short content which indicates corruption
            if (htmlContent.length < 1000) {
              console.warn('⚠️ [ClientPortal] Research report content is suspiciously short, may be corrupted');
              alert('The Research Report appears to be incomplete or corrupted. Please contact your advisor for assistance.');
              return;
            }
          }
        } else {
          console.warn('⚠️ [ClientPortal] No generated_html found for research report');
          console.log('🔍 [ClientPortal] Research report record exists but generated_html is missing:', {
            reportId: data.id,
            businessYearId: data.business_year_id,
            type: data.type,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            aiVersion: data.ai_version,
            locked: data.locked,
            hasAnyContent: !!(data.generated_html || data.filing_guide)
          });
          
          alert(
            'Research Report is not available for viewing at this time.\n\n' +
            'The report record exists but the content is missing. This may be because:\n' +
            '• The report generation was interrupted\n' +
            '• The report needs to be regenerated\n' +
            '• There was a technical issue with the report data\n\n' +
            'Please contact your advisor to regenerate the report in the R&D Wizard.'
          );
          return;
        }
      } else if (documentType === 'allocation_report') {
        // Allocation reports now use generated_html column with ALLOCATION_SUMMARY type
        console.log('🔍 [ClientPortal] Allocation report content check:', {
          hasContent: !!data.generated_html,
          contentType: typeof data.generated_html,
          contentLength: data.generated_html?.length || 0
        });
        
        if (data.generated_html) {
          htmlContent = data.generated_html;
          console.log('✅ [ClientPortal] Using generated_html column for allocation report');
        } else {
          console.warn('⚠️ [ClientPortal] No allocation report content found');
          alert(
            'Allocation Report is not available for viewing at this time.\n\n' +
            'This may be because:\n' +
            '• The report is still being processed\n' +
            '• The report has not been released to clients yet\n' +
            '• There was a technical issue with the report data\n\n' +
            'Please contact your advisor for assistance.'
          );
          return;
        }
      } else if (documentType === 'filing_guide') {
        if (preferredGuideHtml) {
          htmlContent = preferredGuideHtml;
          console.log('✅ [ClientPortal] Using preferred guide HTML (richest)');
        } else if (data.filing_guide || data.generated_html) {
          htmlContent = data.filing_guide || data.generated_html || '';
          console.log('✅ [ClientPortal] Using available guide HTML from record');
        } else {
          console.warn('⚠️ [ClientPortal] No filing guide HTML found');
          alert('Filing guide content not available. The guide may not have been generated yet.');
          return;
        }
      } else {
        alert('Unknown document type');
        return;
      }
      
      } catch (contentError) {
        console.error('❌ [ClientPortal] Error processing document content:', contentError);
        alert(`Error processing document content: ${contentError.message || 'Unknown error'}`);
        return;
      }

      // Validate HTML content before showing
      if (!htmlContent || htmlContent.trim() === '') {
        console.error('❌ [ClientPortal] HTML content is empty or invalid');
        alert('Document content is empty or corrupted. Please contact your advisor for assistance.');
        return;
      }
      
      // Check for weird characters that might cause issues (BOM, null bytes, etc.)
      if (htmlContent.includes('\ufeff')) {
        console.warn('⚠️ [ClientPortal] HTML content contains BOM character, cleaning...');
        htmlContent = htmlContent.replace(/\ufeff/g, '');
      }
      
      // Remove any null bytes or other problematic characters
      htmlContent = htmlContent.replace(/\0/g, '');
      
      // Trim the content to remove leading/trailing whitespace that might contain problematic chars
      htmlContent = htmlContent.trim();
      
      console.log('✅ [ClientPortal] Validated HTML content:', {
        length: htmlContent.length,
        startsWithDoctype: htmlContent.trim().toLowerCase().startsWith('<!doctype'),
        preview: htmlContent.substring(0, 100) + '...'
      });

      // Enhance HTML for client portal rendering: ensure Tailwind utilities are present,
      // disable interactivity, expand AI/Section G text areas, enforce font, and default Technique/NAICS
      const enhanceHtmlForPortal = (html: string, opts?: { naics?: string }): string => {
        const naicsSafe = (opts?.naics || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        const headInject = `\n<!-- Portal Enhancements -->\n<script src=\"https://cdn.tailwindcss.com\"></script>\n<style>
          /* Read-only mode for client portal */
          .filing-guide-document input,
          .filing-guide-document select,
          .filing-guide-document button,
          .filing-guide-document textarea {
            pointer-events: none !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }
          /* Preserve table and layout styles inside iframe */
          .filing-guide-document table { width: 100%; border-collapse: collapse; }
          .filing-guide-document th, .filing-guide-document td { padding: 8px; }
          /* Expand Section G AI text and any large narrative fields */
          .filing-guide-document textarea,
          .filing-guide-document .ai-text,
          .filing-guide-document .aiDescription {
            min-height: 240px !important;
            white-space: pre-wrap !important;
            display: block !important;
          }
          /* Enforce font everywhere */
          .filing-guide-document, .filing-guide-document * { font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif !important; }
          .summary-amount, .summary-total { font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif !important; }
          /* Calculation Specifics essentials (backup styles for cached HTML saved before CSS inlining) */
          .calculation-specifics-table { width: 100%; margin: 0 0 16px 0; }
          .filing-guide-table { width: 100%; border-collapse: collapse; font-size: 11pt; }
          .filing-guide-table th { background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-weight: 600; color: #2d3748; }
          .filing-guide-table td { border: 1px solid #e2e8f0; padding: 10px; vertical-align: top; font-size: 10pt; }
          .activity-chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .activity-chip { display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600; color: #fff; }
          .subcomponent-count-chip { display: inline-block; padding: 2px 6px; background: #e2e8f0; border-radius: 9999px; font-size: 10px; color: #4a5568; }
          .applied-percentage-bar { display: flex; align-items: center; gap: 8px; }
          .bar-container { flex: 1; height: 12px; background: #f7fafc; border-radius: 4px; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 4px; }
          .bar-fill.high { background: #10b981; }
          .bar-fill.medium { background: #f59e0b; }
          .bar-fill.low { background: #ef4444; }
          .percentage-text { font-size: 10px; font-weight: 700; color: #2d3748; min-width: 32px; text-align: right; }
          /* Ensure long content does not clip */
          .filing-guide-document { overflow: visible !important; }
        </style>
        <script>
          document.addEventListener('DOMContentLoaded', function () {
            try {
              // Default Section G component type selects to the saved value if present (data-selected), otherwise Technique
              document.querySelectorAll('.filing-guide-document select').forEach(function (sel) {
                var current = (sel.getAttribute('data-selected') || sel.value || '').trim();
                var hasTechnique = Array.from(sel.options || []).some(function (o) { return /Technique/i.test(o.text || o.value || ''); });
                if (current) {
                  var match = Array.from(sel.options || []).find(function (o) { return (o.value || o.text || '').toLowerCase() === current.toLowerCase(); });
                  if (match) sel.value = match.value || match.text;
                } else if (hasTechnique) {
                  var opt = Array.from(sel.options || []).find(function (o) { return /Technique/i.test(o.text || o.value || ''); });
                  if (opt) sel.value = opt.value;
                }
              });

              // Fill NAICS inputs if empty and labeled as NAICS (49b)
              var naics = '${naicsSafe}';
              if (naics) {
                document.querySelectorAll('.filing-guide-document input').forEach(function (inp) {
                  var nearLabel = inp.closest('td') && inp.closest('td').previousElementSibling;
                  var labelTxt = nearLabel ? (nearLabel.textContent || '') : '';
                  var name = (inp.getAttribute('name') || '') + ' ' + (inp.id || '');
                  if (!inp.value && (/naics/i.test(labelTxt) || /naics/i.test(name))) {
                    inp.value = naics;
                  }
                });
              }
            } catch (e) { /* no-op */ }
          });
        </script>`;
        try {
          if (html.includes('</head>')) {
            return html.replace('</head>', `${headInject}\n</head>`);
          }
          if (html.includes('<head>')) {
            return html.replace('<head>', `<head>${headInject}`);
          }
          // If no head tag, prepend a basic head
          return `<!DOCTYPE html><html><head>${headInject}</head><body>${html}</body></html>`;
        } catch {
          return html;
        }
      };

      // Fetch NAICS for this business (for 49(b) display in portal if missing in cached HTML)
      let businessNaics = '';
      try {
        if (portalData?.business_id) {
          const client = getSupabaseClient();
          const { data: biz } = await client
            .from('rd_businesses')
            .select('naics, naics_code')
            .eq('id', portalData.business_id)
            .single();
          businessNaics = biz?.naics || biz?.naics_code || '';
        }
      } catch {}

      // Show the EXACT saved document in a modal with portal enhancements
      setCurrentDocumentContent(enhanceHtmlForPortal(htmlContent, { naics: businessNaics }));
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

  // Lightweight component for Data Requests list
  const DataRequestsList: React.FC<{ getSupabaseClient: typeof getSupabaseClient; onSelect: (yr: any) => void }> = ({ getSupabaseClient, onSelect }) => {
    const [requestYears, setRequestYears] = useState<ApprovedYear[]>([]);
    useEffect(() => {
      (async () => {
        try {
          const client = getSupabaseClient();
          // Find all BY with client_visible requests and not approved
          const { data: reqs } = await client
            .from('rd_employee_role_designations')
            .select('business_year_id, business_id')
            .eq('client_visible', true)
            .neq('status', 'applied')
            .eq('business_id', portalData?.business_id || '');
          const byIds = Array.from(new Set((reqs || []).map(r => r.business_year_id).filter(Boolean)));
          if (byIds.length === 0) { setRequestYears([]); return; }
          const { data: bys } = await client
            .from('rd_business_years')
            .select('id, year, business_id')
            .in('id', byIds)
            .eq('business_id', portalData?.business_id || '');
          const grouped = (bys || []).reduce((map: Record<number, any[]>, by: any) => {
            if (!map[by.year]) map[by.year] = [];
            map[by.year].push({ ...by, business_name: portalData?.business_name || '' });
            return map;
          }, {});
          const list: ApprovedYear[] = Object.entries(grouped).map(([year, arr]) => ({
            year: parseInt(year, 10),
            business_years: arr as any,
            total_qre: 0,
            jurat_signed: undefined,
            all_documents_released: false,
          })).sort((a,b) => b.year - a.year);
          setRequestYears(list);
        } catch (e) {
          setRequestYears([]);
        }
      })();
    }, []);

    if (requestYears.length === 0) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Data Requests</h2>
          <p className="text-orange-100 text-sm">Years needing your input</p>
        </div>
        <div className="p-2">
          {requestYears.map((year) => (
            <button
              key={`req-${year.year}`}
              onClick={() => onSelect(year)}
              className={`w-full p-4 text-left rounded-lg mb-2 transition-all hover:bg-gray-50 border-2 border-transparent`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{year.year}</div>
                  <div className="text-sm text-gray-600">{year.business_years.length} business{year.business_years.length !== 1 ? 'es' : ''}</div>
                  <div className="text-sm font-medium text-amber-600">Role Designations Requested</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const InProgressList: React.FC<{ getSupabaseClient: typeof getSupabaseClient; onSelect: (yr: any) => void }> = ({ getSupabaseClient, onSelect }) => {
    const [years, setYears] = useState<ApprovedYear[]>([]);
    useEffect(() => {
      (async () => {
        try {
          const client = getSupabaseClient();
          const { data: reqs } = await client
            .from('rd_client_requests')
            .select('business_year_id, status')
            .in('status', ['client_in_progress','client_completed']);
          const byIds = Array.from(new Set((reqs || []).map(r => r.business_year_id).filter(Boolean)));
          if (byIds.length === 0) { setYears([]); return; }
          const { data: bys } = await client
            .from('rd_business_years')
            .select('id, year, business_id')
            .in('id', byIds)
            .eq('business_id', portalData?.business_id || '');
          const grouped = (bys || []).reduce((map: Record<number, any[]>, by: any) => {
            if (!map[by.year]) map[by.year] = [];
            map[by.year].push({ ...by, business_name: portalData?.business_name || '' });
            return map;
          }, {});
          const list: ApprovedYear[] = Object.entries(grouped).map(([year, arr]) => ({
            year: parseInt(year, 10),
            business_years: arr as any,
            total_qre: 0,
            jurat_signed: undefined,
            all_documents_released: false,
          })).sort((a,b) => b.year - a.year);
          setYears(list);
        } catch {
          setYears([]);
        }
      })();
    }, []);

    if (years.length === 0) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">In Progress</h2>
          <p className="text-cyan-100 text-sm">We’re reviewing your data</p>
        </div>
        <div className="p-2">
          {years.map((year) => (
            <button
              key={`prog-${year.year}`}
              onClick={() => onSelect(year)}
              className={`w-full p-4 text-left rounded-lg mb-2 transition-all hover:bg-gray-50 border-2 border-transparent`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{year.year}</div>
                  <div className="text-sm text-gray-600">{year.business_years.length} business{year.business_years.length !== 1 ? 'es' : ''}</div>
                  <div className="text-sm font-medium text-sky-600">Submitted / Under Review</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Role Designations (client view)
  const openRoleDesignations = async () => {
    try {
      const client = getSupabaseClient();
      // Prefer selected year BY, else find most recent requested/visible BY for this business
      let byId = selectedYear?.business_years?.[0]?.id || null;
      if (!byId) {
        const { data: anyReq } = await client
          .from('rd_employee_role_designations')
          .select('business_year_id, requested_at')
          .eq('client_visible', true)
          .order('requested_at', { ascending: false })
          .limit(1);
        byId = anyReq?.[0]?.business_year_id || null;
        if (!byId) return;
      }
      console.log('🔍 [Portal] Loading role designations for BY:', byId);
      const { data } = await client
        .from('rd_employee_role_designations_portal')
        .select('*')
        .eq('business_year_id', byId);
      console.log('📊 [Portal] Role designations rows:', data?.length || 0);
      setRoleDesignationRows(data || []);
      // Load role options for this year
      const { data: roles } = await client
        .from('rd_roles')
        .select('id,name,business_year_id,baseline_applied_percent')
        .eq('business_id', portalData?.business_id || '')
        .or(`business_year_id.is.null,business_year_id.eq.${byId}`)
        .order('name');
      console.log('📊 [Portal] Role options loaded:', roles?.length || 0);
      const opts = [{ id: null, name: 'N/A', baseline_applied_percent: null }, ...(roles || [])];
      setRoleOptions(opts);
      setShowRoleDesignations(true);
    } catch (e) {
      console.error('Failed to load role designations for portal:', e);
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

  const loadRoleRequestStatus = async () => {
    try {
      const client = getSupabaseClient();
      const byId = selectedYear?.business_years?.[0]?.id;
      if (!byId) { setRoleRequestInfo(null); return; }
      const { data } = await client
        .from('rd_employee_role_designations')
        .select('id, client_visible, client_completed_at')
        .eq('business_year_id', byId);
      if (!data || data.length === 0) { setRoleRequestInfo({ hasRequest: false, completed: false }); return; }
      const visible = data.filter(r => r.client_visible);
      const hasRequest = visible.length > 0;
      const completed = hasRequest && visible.every(r => !!r.client_completed_at);
      setRoleRequestInfo({ hasRequest, completed });
    } catch {
      setRoleRequestInfo(null);
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
              onClick={() => {
                console.error('🔴 [ClientPortal] NAVIGATE TO HOME TRIGGERED - User clicked Return Home button:', {
                  currentError: error,
                  currentUrl: window.location.href,
                  allUrlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
                  routerParams: { clientId },
                  reason: 'User manually clicked Return Home due to error'
                });
                navigate('/');
              }}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create a component for the "No Approved Data" message to use in main content
  const NoApprovedDataMessage = () => (
    <div className="lg:col-span-3">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Data</h3>
          <p className="text-gray-600 mb-4">
            {availableBusinesses.length > 1 
              ? "This business doesn't have any approved data yet. Try selecting a different business from the sidebar, or contact your advisor for updates."
              : "You don't have any years with approved data available for review yet. Please contact your advisor for updates on your R&D tax credit analysis."
            }
          </p>
          <div className="text-sm text-gray-500">
            Only years with completed QC approval will appear in this portal.
          </div>
          {availableBusinesses.length > 1 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Tip:</strong> Use the business selector in the sidebar to switch between your businesses.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Global styles to fix Table of Contents positioning in modal */}
      <style>{`
        .document-content-container .filing-guide-toc,
        .document-content-container [data-toc],
        .document-content-container .table-of-contents,
        .document-content-container .toc-sidebar {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          transform: none !important;
          z-index: auto !important;
          max-width: 100% !important;
        }
        
        /* Ensure the ToC container doesn't overflow */
        .document-content-container {
          contain: layout style !important;
        }
        
        /* Force any absolutely positioned elements within the document to be contained */
        .document-content-container * {
          max-width: 100% !important;
        }
        
        .document-content-container .filing-guide-toc {
          display: block !important;
          visibility: visible !important;
        }
      `}</style>
      
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
            
            <div className="flex items-center space-x-4">
              {isAdminPreview && (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
                  <div className="flex items-center text-yellow-800">
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Admin Preview Mode</span>
                  </div>
                </div>
              )}
              
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Sidebar - Business & Year Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Business Selector */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <BusinessSelector
                businesses={availableBusinesses}
                selectedBusiness={selectedBusiness}
                onBusinessChange={handleBusinessChange}
                loading={loading && availableBusinesses.length === 0}
              />
            </div>
            
            {/* Year Selection */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Approved Years</h2>
                <p className="text-blue-100 text-sm">Years with approved data</p>
              </div>
              
              <div className="p-2">
                {approvedYears.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="text-gray-500 mb-2">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">No Approved Years</p>
                    <p className="text-xs text-gray-500">
                      Contact your account rep to approve years for review
                    </p>
                  </div>
                ) : (
                  approvedYears.map((year) => {
                  const isSelected = selectedYear?.year === year.year;
                  const currentYearSignature = juratSignatures.find(sig => sig.year === year.year);
                  
                  return (
                    <button
                      key={year.year}
                      onClick={() => {
                        setSelectedYear(year);
                        setViewMode('dashboard');
                      }}
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

                          {/* Requested/Submitted Chips for this selected year */}
                          {selectedYear?.year === year.year && roleRequestInfo?.hasRequest && !roleRequestInfo.completed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800">Requested</span>
                          )}
                          {selectedYear?.year === year.year && roleRequestInfo?.completed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">Submitted</span>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <ChevronRight className="w-5 h-5 text-blue-600 mt-2" />
                      )}
                    </button>
                  );
                })
                )}
              </div>
            </div>

            {/* Data Requests (non-approved years with client-visible requests) */}
            <DataRequestsList getSupabaseClient={getSupabaseClient} onSelect={(yr) => setSelectedYear(yr)} />

            {/* In Progress (info requested and client has started or submitted) */}
            <InProgressList getSupabaseClient={getSupabaseClient} onSelect={(yr) => setSelectedYear(yr)} />

            {/* Databank (sidebar entry only) */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Databank</h2>
                  <p className="text-indigo-100 text-sm">Locked credits and released documents</p>
                </div>
                <button
                  onClick={() => setViewMode('databank')}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-sm"
                >
                  Open
                </button>
              </div>
            </div>

              {/* Current R&D Access (shown directly below Databank) */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Current R&D</h2>
                    <p className="text-indigo-100 text-sm">Activities, steps, and selected subcomponents</p>
                  </div>
                  <button
                    onClick={() => setViewMode('current-rd')}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-sm"
                  >
                    Open
                  </button>
                </div>
              </div>

              {/* Contact Us */}
              <div className="mt-6 p-4 rounded-xl border bg-white">
                <div className="text-sm text-gray-900 font-semibold mb-1">Contact Us</div>
                <div className="text-sm text-gray-700">admin@directresearchlabs.com</div>
                <div className="text-sm text-gray-700 mb-2">(801) 318-5097</div>
                <a
                  href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2xBuPPNIslKqcljDBcF3w8JmkOpby5840NlDTgyM5V8ZUAAHpZaR5ojHqA5NpXzswb2rydS7Tp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm hover:from-emerald-600 hover:to-green-700"
                >
                  Schedule with us
                </a>
              </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {viewMode === 'databank' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Databank</h1>
                    <p className="text-gray-600">Approved credits and released documents for {portalData?.business_name}</p>
                  </div>
                  <button
                    onClick={() => setViewMode('dashboard')}
                    className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                  >
                    Back to Year View
                  </button>
                </div>

                {(() => {
                  const allBY = databankYears.flatMap(y => y.business_years as any[]);
                  const totalFederal = Math.round(allBY.reduce((s, by: any) => s + (by.federal_credit || 0), 0));
                  const totalState = Math.round(allBY.reduce((s, by: any) => s + (by.state_credit || 0), 0));
                  const totalCredits = totalFederal + totalState;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl border p-5 bg-gradient-to-br from-green-50 to-white">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Total Federal</div>
                        <div className="text-2xl font-semibold text-green-700">${totalFederal.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl border p-5 bg-gradient-to-br from-purple-50 to-white">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Total State</div>
                        <div className="text-2xl font-semibold text-purple-700">${totalState.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl border p-5 bg-gradient-to-br from-indigo-50 to-white">
                        <div className="text-xs uppercase tracking-wide text-gray-500">All Credits</div>
                        <div className="text-2xl font-semibold text-indigo-700">${totalCredits.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 space-y-3">
                  {databankYears.map((yr) => {
                    const totalFederal = Math.round(yr.business_years.reduce((s: number, b: any) => s + (b.federal_credit || 0), 0));
                    const totalState = Math.round(yr.business_years.reduce((s: number, b: any) => s + (b.state_credit || 0), 0));
                    return (
                      <div key={`db-main-${yr.year}`} className="rounded-xl border p-5 bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">Tax Year {yr.year}</div>
                            <div className="text-sm text-gray-600">Federal ${totalFederal.toLocaleString()} • State ${totalState.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {yr.business_years.map((by: any) => {
                            const rel = databankRelease[by.id] || { research_report: false, filing_guide: false, allocation_report: false };
                            const commonBtn = 'px-3 py-1 rounded text-sm transition-colors';
                            return (
                            <div key={`db-main-${yr.year}-${by.id}`} className="rounded-lg border p-3">
                              <div className="text-sm text-gray-700 mb-2">{by.business_name}</div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => rel.research_report && viewDocumentForBusinessYear(by.id, 'research_report', yr.year)}
                                    disabled={!rel.research_report}
                                    className={`${commonBtn} ${rel.research_report ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                  >Research Report</button>
                                  <button
                                    onClick={() => rel.filing_guide && viewDocumentForBusinessYear(by.id, 'filing_guide', yr.year)}
                                    disabled={!rel.filing_guide}
                                    className={`${commonBtn} ${rel.filing_guide ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                  >Filing Guide</button>
                                  <button
                                    onClick={() => rel.allocation_report && viewDocumentForBusinessYear(by.id, 'allocation_report', yr.year)}
                                    disabled={!rel.allocation_report}
                                    className={`${commonBtn} ${rel.allocation_report ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                  >Allocation</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : viewMode === 'current-rd' ? (
              <CurrentRDView
                getSupabaseClient={getSupabaseClient}
                portalData={portalData}
                businessYearId={selectedYear?.business_years?.[0]?.id || null}
                yearLabel={selectedYear?.year}
              />
            ) :  approvedYears.length === 0 ? (
              <NoApprovedDataMessage /> ) : selectedYear && (
              <div className="space-y-8">
                {/* Dashboard Tiles */}
                {dashboardTiles && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="text-sm text-gray-500">Ready for Review</div>
                      <div className={`text-xl font-bold ${dashboardTiles.ready_for_review ? 'text-emerald-600' : 'text-gray-400'}`}>{dashboardTiles.ready_for_review ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="text-sm text-gray-500">Jurat Required</div>
                      <div className={`text-xl font-bold ${dashboardTiles.jurat_required ? 'text-red-600' : 'text-gray-400'}`}>{dashboardTiles.jurat_required ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="text-sm text-gray-500">Role Designations Needed</div>
                      <div className={`text-xl font-bold ${dashboardTiles.role_designations_needed ? 'text-indigo-600' : 'text-gray-400'}`}>{dashboardTiles.role_designations_needed ? 'Yes' : 'No'}</div>
                      {dashboardTiles.role_designations_needed && (
                        <button onClick={() => openRoleDesignations()} className="text-xs text-indigo-600 underline mt-2">Open</button>
                      )}
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="text-sm text-gray-500">Subcomponent Review</div>
                      <div className={`text-xl font-bold ${dashboardTiles.subcomponent_review_recommended ? 'text-amber-600' : 'text-gray-400'}`}>{dashboardTiles.subcomponent_review_recommended ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                )}
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
                            ${Math.round(selectedYear.business_years.reduce((sum, by) => sum + (by.federal_credit || 0), 0)).toLocaleString()}
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
                            ${Math.round(selectedYear.business_years.reduce((sum, by) => sum + (by.state_credit || 0), 0)).toLocaleString()}
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
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">What this covers</h5>
                    {roleRequestInfo?.hasRequest && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleRequestInfo.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {roleRequestInfo.completed ? 'Submitted' : 'Requested'}
                      </span>
                    )}
                  </div>
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

                    {/* Payment Required Notice */}
                    {documents.some(doc => !doc.payment_received) && (
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-amber-800 mb-1">Payment Required</h4>
                            <p className="text-sm text-amber-700">
                              Some documents require payment to be completed before they can be accessed. 
                              Please contact your account manager to finalize payment and billing arrangements.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {documents.map((doc) => {
                        const IconComponent = doc.icon;
                        const filingGuideDoc = documents.find(d => d.type === 'filing_guide');
                        const isFilingGuideReleased = !!filingGuideDoc?.can_release;

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

                            {(doc.type === 'filing_guide' ? (documents.find(d => d.type === 'filing_guide')?.can_release) : doc.can_release) ? (
                              (() => {
                                // Determine if all documents are ready and if Filing Guide is released
                                const allDocumentsReady = documents.every(d => d.can_release && d.qc_approved);
                                const paymentReceived = doc.payment_received;
                                
                                // Research Report: only downloadable after Filing Guide released
                                if (doc.type === 'research_report') {
                                  if (isFilingGuideReleased && allDocumentsReady && paymentReceived) {
                                    return (
                                      <button 
                                        onClick={() => viewDocument(doc.type)}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                                      >
                                        <FileText className="w-4 h-4 inline mr-2" />
                                        View
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
                                
                                // Filing Guide: View full guide in modal instead of download; ensure released toggle is true
                                if (doc.type === 'filing_guide') {
                                  return (
                                    <button 
                                      onClick={() => viewDocument('filing_guide')}
                                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                                    >
                                      <FileText className="w-4 h-4 inline mr-2" />
                                      View
                                    </button>
                                  );
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
                                
                                // Default: always View in portal
                                return (
                                  <button 
                                    onClick={() => viewDocument(doc.type)}
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                                  >
                                    <FileText className="w-4 h-4 inline mr-2" />
                                    View
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
              <iframe
                srcDoc={currentDocumentContent}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'white'
                }}
                title="Document Content"
              />
            </div>
          </div>
        </div>
      )}

      {/* Role Designations Modal */}
      {showRoleDesignations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center"><Users className="w-5 h-5 mr-2"/>Employee Role Designations</h3>
              <button onClick={() => setShowRoleDesignations(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">Assign roles and adjust participation for your employees. Changes here are saved for your advisor to review and apply.</p>
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      const client = getSupabaseClient();
                      const byId = selectedYear?.business_years?.[0]?.id;
                      if (!byId) return;
                      await client
                        .from('rd_employee_role_designations')
                        .update({ client_completed_at: new Date().toISOString(), status: 'client_updated' })
                        .eq('business_year_id', byId)
                        .eq('client_visible', true);
                      // registry mirror
                      await upsertClientRequest(byId, 'roles', 'client_completed');
                      toast.success('Thanks! Your updates have been marked complete. Your advisor will be notified.');
                      setShowRoleDesignations(false);
                      await loadRoleRequestStatus();
                    } catch (e) {
                      toast.error('Failed to mark complete');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >Mark Complete</button>
              </div>
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">First Name</th>
                      <th className="px-3 py-2 text-left">Last Name</th>
                      <th className="px-3 py-2 text-right">Wage</th>
                      <th className="px-3 py-2 text-left">Role (optional)</th>
                      <th className="px-3 py-2 text-left">Applied %</th>
                      <th className="px-3 py-2 text-left">Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleDesignationRows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2">{r.first_name}</td>
                        <td className="px-3 py-2">{r.last_name}</td>
                        <td className="px-3 py-2 text-right">${r.annual_wage?.toLocaleString?.() || r.annual_wage}</td>
                        <td className="px-3 py-2">
                          <select
                            className="border rounded px-2 py-1 w-48"
                            defaultValue={r.role_id || ''}
                            onChange={async (e) => {
                              const client = getSupabaseClient();
                              const roleId = e.target.value || null;
                              const opt = roleOptions.find(ro => String(ro.id) === String(roleId));
                              const roleName = opt?.name || null;
                              const baseline = typeof opt?.baseline_applied_percent === 'number' ? opt?.baseline_applied_percent : null;
                              await client
                                .from('rd_employee_role_designations')
                                .update({ role_id: roleId, role_name: roleName, applied_percent: baseline })
                                .eq('id', r.id);
                            }}
                          >
                              {roleOptions.map(opt => (
                                <option key={String(opt.id)} value={opt.id || ''}>
                                  {opt.name}{typeof opt.baseline_applied_percent === 'number' ? ` (${Number(opt.baseline_applied_percent).toFixed(2)}%)` : ''}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {/* Progress bar with inline editing via slider */}
                          <div className="flex items-center gap-3 w-64">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, Math.max(0, r.applied_percent || 0))}%` }} />
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              defaultValue={r.applied_percent ?? 0}
                              onMouseUp={async (e) => {
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                const client = getSupabaseClient();
                                await client
                                  .from('rd_employee_role_designations')
                                  .update({ applied_percent: val, status: 'client_updated' })
                                  .eq('id', r.id);
                                // Update local
                                setRoleDesignationRows(prev => prev.map(row => row.id === r.id ? { ...row, applied_percent: val } : row));
                                // Mark in-progress in registry
                                const byId = selectedYear?.business_years?.[0]?.id;
                                if (byId) await upsertClientRequest(byId, 'roles', 'client_in_progress');
                              }}
                            />
                            <div className="text-xs text-gray-700 w-10 text-right">{Math.round(r.applied_percent || 0)}%</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => {
                              setAllocationRow(r);
                              const alloc = (r.activity_allocations || {}) as Record<string, number>;
                              // Initialize from existing allocation or baseline
                              if (alloc && Object.keys(alloc).length > 0) {
                                setAllocationValues(alloc);
                              } else {
                                const baseline = Math.max(0, Math.round(r.applied_percent || 0));
                                setAllocationValues({ __baseline: baseline } as any);
                              }
                              // Load activities list
                              (async () => {
                                const client = getSupabaseClient();
                                const { data: acts } = await client
                                  .from('rd_selected_activities')
                                  .select('activity_id, research_activity:activity_id(id,title)')
                                  .eq('business_year_id', selectedYear.business_years[0]?.id || '');
                                const arr = (acts || []).map(a => ({ id: a.research_activity?.id, title: a.research_activity?.title })).filter(a => a.id);
                                setAllocationActivities(arr);
                                // If no prior alloc, seed equally across activities up to baseline (use r.applied_percent if undefined)
                                const seededBaseline = (allocationValues as any).__baseline !== undefined ? (allocationValues as any).__baseline : Math.max(0, Math.round(r.applied_percent || 0));
                                if (arr.length > 0 && seededBaseline > 0) {
                                  const baseline = seededBaseline;
                                  const each = arr.length ? Math.floor(baseline / arr.length) : 0;
                                  const remainder = arr.length ? baseline - each * arr.length : 0;
                                  const seeded: Record<string, number> = {};
                                  arr.forEach((act, idx) => { seeded[act.id] = each + (idx < remainder ? 1 : 0); });
                                  setAllocationValues(seeded);
                                }
                              })();
                            }}
                            className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {roleDesignationRows.length === 0 && (
                      <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No entries available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-sm text-gray-500">Note: Activity sliders are simplified and will be finalized by your advisor.</div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Allocation Modal */}
      {allocationRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center"><Sliders className="w-5 h-5 mr-2"/>Allocation - {allocationRow.first_name} {allocationRow.last_name}</h3>
              <button onClick={() => setAllocationRow(null)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-600">Adjust research activity allocations. The sum of sliders cannot exceed the Applied % ({Math.round(allocationRow.applied_percent || 0)}%).</p>
              <div className="space-y-4">
                {allocationActivities.map((act) => {
                  const current = allocationValues[act.id] || 0;
                  const total = Object.values(allocationValues).reduce((s, v) => s + (v || 0), 0);
                  const remaining = Math.max(0, (allocationRow.applied_percent || 0) - (total - current));
                  return (
                    <div key={act.id} className="flex items-center gap-4">
                      <div className="w-48 text-sm text-gray-800">{act.title}</div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={current}
                        onChange={(e) => {
                          const val = Math.min(remaining, parseInt(e.target.value, 10));
                          setAllocationValues(prev => ({ ...prev, [act.id]: val }));
                        }}
                        className="flex-1"
                      />
                      <div className="w-12 text-right text-sm">{Math.round(current)}%</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setAllocationRow(null)} className="px-4 py-2 rounded border">Cancel</button>
                <button
                  onClick={async () => {
                    const client = getSupabaseClient();
                    await client
                      .from('rd_employee_role_designations')
                      .update({ activity_allocations: allocationValues, status: 'client_updated' })
                      .eq('id', allocationRow.id);
                    setAllocationRow(null);
                  }}
                  className="px-4 py-2 rounded bg-indigo-600 text-white"
                >Save</button>
              </div>
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
    </>
  );
};

export default ClientPortal; 