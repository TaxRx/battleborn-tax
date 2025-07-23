import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Download, FileText, CheckCircle, Clock, AlertCircle, Eye, PenTool, User, Building2 } from 'lucide-react';

// Create a separate supabase client instance for the portal
import { createClient } from '@supabase/supabase-js';

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
}

interface BusinessYear {
  id: string;
  year: number;
  qc_status: string;
  payment_received: boolean;
  documents_released: boolean;
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
}

const ClientPortal: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [businessYears, setBusinessYears] = useState<BusinessYear[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedYear, setSelectedYear] = useState<BusinessYear | null>(null);

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
      const { data: clientBusiness, error: businessError } = await portalSupabase
        .from('rd_businesses')
        .select(`
          id,
          name,
          client_id,
          rd_business_years (
            id,
            year,
            gross_receipts,
            total_qre,
            final_credit_amount,
            jurat_signed_at,
            jurat_signed_by,
            jurat_signature_image_path
          ),
          rd_documents (
            id,
            file_name,
            file_path,
            document_type,
            uploaded_at
          )
        `)
        .eq('client_id', session.user.id) // Assuming client_id in rd_businesses matches auth.users.id
        .single();

      if (businessError) {
        console.error('Error fetching client business data:', businessError);
        throw new Error('Could not load business data for this client.');
      }

      if (!clientBusiness) {
        throw new Error('No business found for this client.');
      }

      // Transform data to match PortalData interface
      const transformedData: PortalData = {
        business_id: clientBusiness.id,
        business_name: clientBusiness.name,
        user_id: session.user.id, // Ensure user_id is set
      };

      setPortalData(transformedData);
      setBusinessYears(clientBusiness.rd_business_years || []);
      setDocuments(clientBusiness.rd_documents || []);
      if (clientBusiness.rd_business_years.length > 0) {
        setSelectedYear(clientBusiness.rd_business_years[0]);
      }

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
      
      // Use regular supabase client to fetch business data
      const { data: clientBusiness, error: businessError } = await portalSupabase
        .from('rd_businesses')
        .select(`
          id,
          name,
          client_id,
          rd_business_years (
            id,
            year,
            gross_receipts,
            total_qre,
            final_credit_amount,
            jurat_signed_at,
            jurat_signed_by,
            jurat_signature_image_path
          ),
          rd_documents (
            id,
            file_name,
            file_path,
            document_type,
            uploaded_at
          )
        `)
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('❌ Error fetching business data for preview:', businessError);
        throw new Error('Could not load business data for preview.');
      }

      if (!clientBusiness) {
        throw new Error('Business not found for preview.');
      }

      console.log('✅ [ClientPortal] Business data loaded for admin preview');

      // Transform data to match PortalData interface
      const transformedData: PortalData = {
        business_id: clientBusiness.id,
        business_name: clientBusiness.name,
        user_id: userId, // Use the current user's ID for preview
      };

      setPortalData(transformedData);
      setBusinessYears(clientBusiness.rd_business_years || []);
      setDocuments(clientBusiness.rd_documents || []);
      if (clientBusiness.rd_business_years.length > 0) {
        setSelectedYear(clientBusiness.rd_business_years[0]);
      }

    } catch (err: any) {
      console.error('❌ Admin preview data loading error:', err);
      setError(err.message || 'Failed to load business data for preview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateSessionAndLoadData();
  }, [userId]);

  useEffect(() => {
    if (selectedYear) {
      loadDocumentStatus();
      loadJuratSignatures();
    }
  }, [selectedYear]);

  const loadDocumentStatus = async () => {
    if (!selectedYear) return;

    try {
      const documentTypes = ['research_report', 'filing_guide', 'allocation_report'];
      const documentPromises = documentTypes.map(async (docType) => {
        const { data, error } = await portalSupabase.rpc('check_document_release_eligibility', {
          p_business_year_id: selectedYear.id,
          p_document_type: docType
        });

        if (error) throw error;

        const result = data[0];
        return {
          type: docType,
          title: getDocumentTitle(docType),
          description: getDocumentDescription(docType),
          icon: getDocumentIcon(docType),
          can_release: result.can_release,
          reason: result.reason,
          jurat_signed: result.jurat_signed,
          payment_received: result.payment_received,
          qc_approved: result.qc_approved
        };
      });

      const documentResults = await Promise.all(documentPromises);
      setDocuments(documentResults);

    } catch (error) {
      console.error('Error loading document status:', error);
    }
  };

  const loadJuratSignatures = async () => {
    if (!selectedYear) return;

    try {
      const { data, error } = await portalSupabase
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

      const { error } = await portalSupabase
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
      const { data, error } = await portalSupabase
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

  const getDocumentTitle = (type: string): string => {
    switch (type) {
      case 'research_report': return 'Research Report';
      case 'filing_guide': return 'Filing Guide';
      case 'allocation_report': return 'Allocation Report';
      default: return 'Document';
    }
  };

  const getDocumentDescription = (type: string): string => {
    switch (type) {
      case 'research_report': return 'Comprehensive clinical practice guideline report';
      case 'filing_guide': return 'Federal R&D Credit filing guide with pro formas';
      case 'allocation_report': return 'Detailed allocation breakdown (Coming Soon)';
      default: return 'Document description';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'research_report': return FileText;
      case 'filing_guide': return FileText;
      case 'allocation_report': return FileText;
      default: return FileText;
    }
  };

  const getStatusBadge = (doc: DocumentInfo) => {
    if (doc.can_release) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
          🔍 ADMIN PREVIEW MODE - This is how the client portal appears to clients
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading portal data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            {!isAdminPreview && (
              <button
                onClick={() => navigate('/')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Return to Home
              </button>
            )}
          </div>
        ) : portalData ? (
          <>
            {/* Header */}
            <div className="bg-white shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Direct Research Portal</h1>
                      <p className="text-gray-600">{portalData?.business_name}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Secure Document Access
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Year Selector */}
              <div className="bg-white rounded-lg shadow mb-8 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Tax Year</h2>
                {businessYears.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {businessYears.map((year) => (
                      <button
                        key={year.id}
                        onClick={() => setSelectedYear(year)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedYear?.id === year.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Calendar className="w-4 h-4 inline mr-2" />
                        {year.year}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No tax years available for document access.</p>
                )}
              </div>

              {selectedYear && (
                <>
                  {/* Jurat Section */}
                  <div className="bg-white rounded-lg shadow mb-8 p-6">
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
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Documents</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {documents.map((doc) => {
                        const Icon = doc.icon;
                        return (
                          <div key={doc.type} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <Icon className="w-8 h-8 text-blue-600" />
                              {getStatusBadge(doc)}
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                            <p className="text-gray-600 mb-4">{doc.description}</p>
                            
                            {doc.can_release ? (
                              <button
                                onClick={() => downloadDocument(doc.type)}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            ) : (
                              <div className="w-full bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-center">
                                {doc.reason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Jurat Modal */}
            {showJuratModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Jurat & Attestation</h3>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Jurat Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jurat Text
                      </label>
                      <textarea
                        value={juratText}
                        onChange={(e) => setJuratText(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={signerInfo.title}
                          onChange={(e) => setSignerInfo(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Your title/position"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="your.email@company.com"
                        />
                      </div>
                    </div>

                    {/* Legal Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Legal Notice</p>
                          <p>
                            By signing this jurat, you are declaring under penalty of perjury that all 
                            information provided is true and accurate. False statements may subject you 
                            to criminal and civil penalties.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowJuratModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={signJurat}
                      disabled={!signerInfo.name || !signerInfo.email}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Sign Jurat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Portal Data Found</h2>
            <p className="text-gray-600 mb-6">
              It seems the portal data for this user is not available. Please contact your administrator.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPortal; 