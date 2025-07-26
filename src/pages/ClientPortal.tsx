import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Download, FileText, CheckCircle, Clock, AlertCircle, Eye, PenTool, User, Building2, Shield, Award, ChevronRight } from 'lucide-react';

// Create a separate supabase client instance for the portal
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // Import main authenticated client

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
  const { userId } = useParams<{ userId: string }>();
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
  const [juratText, setJuratText] = useState('');

  // Check for admin preview mode
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminPreview = searchParams.get('admin_preview') === 'true';
  const previewBusinessId = searchParams.get('business_id');
  const previewToken = searchParams.get('preview_token');

  console.log('🔍 [ClientPortal] Component loaded:', { 
    userId, 
    isAdminPreview, 
    previewBusinessId, 
    previewToken 
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
    if (!userId) {
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
      console.log('🔐 Checking authentication for userId:', userId);
      
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

      // Verify the authenticated user matches the requested userId
      if (session.user.id !== userId) {
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
            created_at,
            updated_at
          )
        `)
        .eq('client_id', session.user.id);

      if (businessError) {
        console.error('Error fetching client business data:', businessError);
        throw new Error('Could not load business data for this client.');
      }

      if (!clientBusinesses || clientBusinesses.length === 0) {
        throw new Error('No businesses found for this client.');
      }

      // 🎯 IMPROVED: Group by year and only include approved business years
      const approvedBusinessYears: { [year: number]: BusinessYear[] } = {};
      
      clientBusinesses.forEach(business => {
        business.rd_business_years?.forEach(businessYear => {
          // Only include years with approved QC status
          if (businessYear.qc_status === 'approved' || businessYear.qc_status === 'complete') {
            if (!approvedBusinessYears[businessYear.year]) {
              approvedBusinessYears[businessYear.year] = [];
            }
            approvedBusinessYears[businessYear.year].push({
              ...businessYear,
              business_name: business.name
            });
          }
        });
      });

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
      
      // Set the most recent year as selected
      if (transformedYears.length > 0) {
        setSelectedYear(transformedYears[0]);
      }

      // Load annual jurat signatures
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
          rd_business_years (
            id,
            year,
            gross_receipts,
            total_qre,
            qc_status,
            payment_received,
            documents_released,
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
      const approvedBusinessYears = clientBusiness.rd_business_years?.filter(
        by => by.qc_status === 'approved' || by.qc_status === 'complete'
      ) || [];

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

      // Convert to ApprovedYear format
      const transformedYears: ApprovedYear[] = Object.entries(yearGroups)
        .map(([year, businessYears]) => ({
          year: parseInt(year),
          business_years: businessYears,
          total_qre: businessYears.reduce((sum, by) => sum + (by.total_qre || 0), 0),
          jurat_signed: false,
          all_documents_released: businessYears.every(by => by.documents_released)
        }))
        .sort((a, b) => b.year - a.year);

      const transformedData: PortalData = {
        business_id: clientBusiness.id,
        business_name: clientBusiness.name,
        user_id: 'admin-preview',
      };

      setPortalData(transformedData);
      setApprovedYears(transformedYears);
      if (transformedYears.length > 0) {
        setSelectedYear(transformedYears[0]);
      }

      // Load annual jurat signatures for preview
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
    if (!portalData || years.length === 0) return;

    try {
      const client = getSupabaseClient();
      
      // Get all business years for this client and the specified years
      const { data: businessYearIds, error: businessYearError } = await client
        .from('rd_businesses')
        .select(`
          rd_business_years (
            id,
            year
          )
        `)
        .eq('client_id', portalData.user_id);

      if (businessYearError) throw businessYearError;

      const businessYearIdsByYear: { [year: number]: string[] } = {};
      businessYearIds?.forEach(business => {
        business.rd_business_years?.forEach(businessYear => {
          if (years.includes(businessYear.year)) {
            if (!businessYearIdsByYear[businessYear.year]) {
              businessYearIdsByYear[businessYear.year] = [];
            }
            businessYearIdsByYear[businessYear.year].push(businessYear.id);
          }
        });
      });

      // Get jurat signatures for all relevant business years
      const allBusinessYearIds = Object.values(businessYearIdsByYear).flat();
      
      if (allBusinessYearIds.length === 0) return;

      const { data: signatures, error } = await client
        .from('rd_signatures')
        .select('*, business_year_id')
        .in('business_year_id', allBusinessYearIds)
        .eq('signature_type', 'jurat')
        .order('signed_at', { ascending: false });

      if (error) throw error;

      // Group signatures by year and get the most recent for each year
      const signaturesByYear: { [year: number]: JuratSignature } = {};
      
      signatures?.forEach(signature => {
        // Find which year this business_year_id belongs to
        for (const [year, businessYearIds] of Object.entries(businessYearIdsByYear)) {
          if (businessYearIds.includes(signature.business_year_id)) {
            const yearNum = parseInt(year);
            if (!signaturesByYear[yearNum] || new Date(signature.signed_at) > new Date(signaturesByYear[yearNum].signed_at)) {
              signaturesByYear[yearNum] = {
                ...signature,
                year: yearNum
              };
            }
            break;
          }
        }
      });

      setJuratSignatures(Object.values(signaturesByYear));

      // Update approved years with jurat status
      setApprovedYears(prev => prev.map(year => ({
        ...year,
        jurat_signed: !!signaturesByYear[year.year]
      })));

    } catch (error) {
      console.error('Error loading annual jurat signatures:', error);
    }
  };

  useEffect(() => {
    validateSessionAndLoadData();
  }, [userId]);

  useEffect(() => {
    if (selectedYear) {
      loadDocumentStatus();
    }
  }, [selectedYear]);

  const loadDocumentStatus = async () => {
    if (!selectedYear) return;

    try {
      const documentTypes = ['research_report', 'filing_guide', 'allocation_report'];
      const client = getSupabaseClient();
      
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

        for (const businessYearId of businessYearIds) {
          try {
            const { data, error } = await client.rpc('check_document_release_eligibility', {
              p_business_year_id: businessYearId,
              p_document_type: docType
            });

            if (error) continue; // Skip if error for this business year

            const result = data[0];
            if (result.can_release) {
              canRelease = true;
              reason = 'Document approved for release';
            }
            if (result.jurat_signed) juratSigned = true;
            if (result.payment_received) paymentReceived = true;
            if (result.qc_approved) qcApproved = true;
          } catch (e) {
            console.warn(`Error checking ${docType} for business year ${businessYearId}:`, e);
          }
        }

        return {
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
      });

      const documentResults = await Promise.all(documentPromises);
      setDocuments(documentResults);

    } catch (error) {
      console.error('Error loading document status:', error);
    }
  };

  // 🎯 NEW: Sign annual jurat (for all business years in the selected year)
  const signAnnualJurat = async () => {
    if (!selectedYear || !signerInfo.name || !signerInfo.email) {
      alert('Please fill in all signer information');
      return;
    }

    try {
      const client = getSupabaseClient();
      
      // Sign jurat for all business years in the selected year
      const signaturePromises = selectedYear.business_years.map(async (businessYear) => {
        // Create a simple verification hash
        const verificationData = `${businessYear.id}-${signerInfo.name}-${signerInfo.email}-${Date.now()}`;
        const verificationHash = btoa(verificationData);

        return client
          .from('rd_signatures')
          .insert({
            business_year_id: businessYear.id,
            signature_type: 'jurat',
            signer_name: signerInfo.name,
            signer_title: signerInfo.title,
            signer_email: signerInfo.email,
            jurat_text: juratText,
            verification_hash: verificationHash,
            signature_data: {
              portal_token_id: portalData?.token_id,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              annual_signature: true,
              year: selectedYear.year
            }
          });
      });

      const results = await Promise.all(signaturePromises);
      
      // Check if any failed
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        throw new Error('Failed to sign jurat for some business years');
      }

      // Reload data
      await loadAnnualJuratSignatures([selectedYear.year]);
      await loadDocumentStatus();
      setShowJuratModal(false);

      alert('Annual jurat signed successfully for all applicable business years!');

    } catch (error) {
      console.error('Error signing annual jurat:', error);
      alert('Failed to sign jurat. Please try again.');
    }
  };

  const loadJuratSignatures = async () => {
    if (!selectedYear) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('rd_signatures')
        .select('*')
        .eq('business_year_id', selectedYear.id)
        .eq('signature_type', 'jurat')
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
      // Create a simple verification hash
      const verificationData = `${selectedYear.id}-${signerInfo.name}-${signerInfo.email}-${Date.now()}`;
      const verificationHash = btoa(verificationData);

      const client = getSupabaseClient();
      const { error } = await client
        .from('rd_signatures')
        .insert({
          business_year_id: selectedYear.id,
          signature_type: 'jurat',
          signer_name: signerInfo.name,
          signer_title: signerInfo.title,
          signer_email: signerInfo.email,
          jurat_text: juratText,
          verification_hash: verificationHash,
          signature_data: {
            portal_token_id: portalData?.token_id,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
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
      const { data, error } = await client
        .from('rd_reports')
        .select('generated_html, filing_guide')
        .eq('business_year_id', selectedYear.id)
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
                      <h2 className="text-2xl font-bold text-gray-900">{selectedYear.year} Tax Year</h2>
                      <p className="text-gray-600">R&D tax credit documentation and reports</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        ${selectedYear.total_qre.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Qualified Research Expenses</div>
                    </div>
                  </div>

                  {/* Business Years Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {selectedYear.business_years.map((businessYear) => (
                      <div key={businessYear.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="font-medium text-gray-900 mb-2">{businessYear.business_name}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">QRE:</span>
                            <span className="font-medium">${businessYear.total_qre?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gross Receipts:</span>
                            <span className="font-medium">${businessYear.gross_receipts?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${
                              businessYear.qc_status === 'complete' ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {businessYear.qc_status === 'complete' ? 'Complete' : 'Approved'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                                  <div><strong>Title:</strong> {currentYearSignature.signer_title}</div>
                                  <div><strong>Email:</strong> {currentYearSignature.signer_email}</div>
                                  <div><strong>Signed:</strong> {new Date(currentYearSignature.signed_at).toLocaleDateString()} at {new Date(currentYearSignature.signed_at).toLocaleTimeString()}</div>
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
                          Sign Jurat
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
                              <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all">
                                <Download className="w-4 h-4 inline mr-2" />
                                Download
                              </button>
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
              {/* Coverage Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">This signature covers:</h4>
                <div className="space-y-2">
                  {selectedYear?.business_years.map((by) => (
                    <div key={by.id} className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">{by.business_name}</span>
                      <span className="font-medium text-blue-900">${by.total_qre?.toLocaleString() || '0'} QRE</span>
                    </div>
                  ))}
                </div>
              </div>

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
                  onClick={signAnnualJurat}
                  disabled={!signerInfo.name || !signerInfo.email}
                  className="px-8 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <PenTool className="w-4 h-4 inline mr-2" />
                  Sign Annual Jurat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal; 