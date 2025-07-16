import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Download, FileText, CheckCircle, Clock, AlertCircle, Eye, PenTool, User, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PortalData {
  business_id: string;
  business_name: string;
  token_id: string;
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
  icon: React.ComponentType<any>;
  can_release: boolean;
  reason: string;
  jurat_signed: boolean;
  payment_received: boolean;
  qc_approved: boolean;
}

interface JuratSignature {
  id: string;
  business_year_id: string;
  signer_name: string;
  signer_title: string;
  signer_email: string;
  signed_at: string;
  jurat_text: string;
}

const ClientPortal: React.FC = () => {
  const { businessId, token } = useParams<{ businessId: string; token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [businessYears, setBusinessYears] = useState<BusinessYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<BusinessYear | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [juratSignatures, setJuratSignatures] = useState<JuratSignature[]>([]);
  const [showJuratModal, setShowJuratModal] = useState(false);
  const [juratText, setJuratText] = useState('');
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    title: '',
    email: ''
  });

  // Default jurat text
  const defaultJuratText = `Jurat and Attestation of R&D Tax Credit Documentation

I, the undersigned, hereby declare under penalty of perjury that:

I have reviewed the information submitted through the Direct Research platform (or associated systems) related to my business's qualification and participation in research and development activities for the purposes of claiming the federal and applicable state R&D tax credits under Internal Revenue Code §41 and related Treasury Regulations.

To the best of my knowledge and belief, all facts, statements, data, time allocations, and supporting information provided are true, correct, and complete.

I understand that the documentation and data submitted will be used to calculate tax credits that may be claimed on my federal and/or state tax returns and that knowingly submitting false or misleading information may subject me to penalties under federal and state law.

I further affirm that I am authorized to sign on behalf of the business entity and that I take full responsibility for the accuracy of the submission.`;

  useEffect(() => {
    validateTokenAndLoadData();
  }, [businessId, token]);

  useEffect(() => {
    if (selectedYear) {
      loadDocumentStatus();
      loadJuratSignatures();
    }
  }, [selectedYear]);

  const validateTokenAndLoadData = async () => {
    if (!businessId || !token) {
      setError('Invalid portal link');
      setLoading(false);
      return;
    }

    try {
      // Validate token and get portal data
      const { data, error } = await supabase.rpc('validate_portal_token', {
        p_token: token,
        p_ip_address: null // In a real app, you'd pass the client IP
      });

      if (error) throw error;

      if (!data || data.length === 0 || !data[0].is_valid) {
        setError('Invalid or expired portal link');
        setLoading(false);
        return;
      }

      const portalInfo = data[0];
      setPortalData({
        business_id: portalInfo.business_id,
        business_name: portalInfo.business_name,
        token_id: portalInfo.token_id
      });

      // Load business years
      const { data: years, error: yearsError } = await supabase
        .from('rd_business_years')
        .select('id, year, qc_status, payment_received, documents_released')
        .eq('business_id', portalInfo.business_id)
        .in('qc_status', ['ready_for_review', 'approved', 'complete'])
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;

      setBusinessYears(years || []);
      if (years && years.length > 0) {
        setSelectedYear(years[0]);
      }

      setJuratText(defaultJuratText);

    } catch (error) {
      console.error('Error validating token:', error);
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentStatus = async () => {
    if (!selectedYear) return;

    try {
      const documentTypes = ['research_report', 'filing_guide', 'allocation_report'];
      const documentPromises = documentTypes.map(async (docType) => {
        const { data, error } = await supabase.rpc('check_document_release_eligibility', {
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
      const { data, error } = await supabase
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

      const { error } = await supabase
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
      const { data, error } = await supabase
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
    </div>
  );
};

export default ClientPortal; 