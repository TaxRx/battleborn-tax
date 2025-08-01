import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Settings, Share2, CheckCircle, Clock, AlertCircle, User, Calendar, DollarSign, Lock, Unlock, Upload, Save, Edit, Check, X, ExternalLink } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { FilingGuideModal } from '../../FilingGuide/FilingGuideModal';
import ResearchReportModal from '../../ResearchReport/ResearchReportModal';
import AllocationReportModal from '../../AllocationReport/AllocationReportModal';
import { qcService } from '../../../services/qcService';

interface ReportsStepProps {
  wizardState: any;
  onComplete: () => void;
  onPrevious: () => void;
}

interface QCDocumentControl {
  id: string;
  document_type: string;
  is_released: boolean;
  released_at: string | null;
  release_notes: string | null;
  requires_jurat: boolean;
  requires_payment: boolean;
  qc_reviewer: string | null;
  qc_reviewed_at: string | null;
  qc_review_notes: string | null;
}

interface BusinessYearData {
  qc_status: string;
  qc_approved_by: string | null;
  qc_approved_at: string | null;
  qc_notes: string | null;
  payment_received: boolean;
  payment_received_at: string | null;
  payment_amount: number | null;
  documents_released: boolean;
  documents_released_at: string | null;
}

interface PortalToken {
  id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  access_count: number;
}

const ReportsStep: React.FC<ReportsStepProps> = ({ wizardState, onComplete, onPrevious }) => {
  const [isFilingGuideOpen, setIsFilingGuideOpen] = useState(false);
  const [isResearchReportOpen, setIsResearchReportOpen] = useState(false);
  const [showAllocationReport, setShowAllocationReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qcControls, setQCControls] = useState<QCDocumentControl[]>([]);
  const [businessYearData, setBusinessYearData] = useState<BusinessYearData | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingControl, setEditingControl] = useState<string | null>(null);
  const [showJuratModal, setShowJuratModal] = useState(false);
  
  // QC Notes and editing states
  const [qcNotes, setQcNotes] = useState<{ [key: string]: string }>({});
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [releaseToggles, setReleaseToggles] = useState<{ [key: string]: boolean }>({});
  
  // Jurat document management
  const [juratUploaded, setJuratUploaded] = useState(false);
  const [juratUploadDate, setJuratUploadDate] = useState<string | null>(null);
  const [juratNotes, setJuratNotes] = useState('');
  const [editingJuratNotes, setEditingJuratNotes] = useState(false);

  // Default jurat text
  const [juratText, setJuratText] = useState(`Jurat and Attestation of R&D Tax Credit Documentation

I, the undersigned, hereby declare under penalty of perjury that:

I have reviewed the information submitted through the Direct Research platform (or associated systems) related to my business's qualification and participation in research and development activities for the purposes of claiming the federal and applicable state R&D tax credits under Internal Revenue Code §41 and related Treasury Regulations.

To the best of my knowledge and belief, all facts, statements, data, time allocations, and supporting information provided are true, correct, and complete.

I understand that the documentation and data submitted will be used to calculate tax credits that may be claimed on my federal and/or state tax returns and that knowingly submitting false or misleading information may subject me to penalties under federal and state law.

I further affirm that I am authorized to sign on behalf of the business entity and that I take full responsibility for the accuracy of the submission.`);

  // Check if user is admin and load data
  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        // Check user type
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          setIsAdmin(profile?.is_admin || false);
        }

        // Load QC controls and business year data
        if (wizardState.selectedYear?.id) {
          await loadReportsData();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminAndLoadData();
  }, [wizardState.selectedYear?.id]);

  const loadReportsData = async () => {
    if (!wizardState.selectedYear?.id) return;

    setLoading(true);
    try {
      // Load QC document controls
      const { data: controls, error: controlsError } = await supabase
        .from('rd_qc_document_controls')
        .select('*')
        .eq('business_year_id', wizardState.selectedYear.id);

      if (controlsError) throw controlsError;
      const controlsData = controls || [];
      setQCControls(controlsData);
      
      // Initialize notes and toggle states
      const notesState: { [key: string]: string } = {};
      const toggleState: { [key: string]: boolean } = {};
      
      controlsData.forEach(control => {
        notesState[control.document_type] = control.qc_review_notes || '';
        toggleState[control.document_type] = control.is_released;
      });
      
      setQcNotes(notesState);
      setReleaseToggles(toggleState);

      // Load business year data
      const { data: businessYear, error: businessYearError } = await supabase
        .from('rd_business_years')
        .select('qc_status, qc_approved_by, qc_approved_at, qc_notes, payment_received, payment_received_at, payment_amount, documents_released, documents_released_at')
        .eq('id', wizardState.selectedYear.id)
        .single();

      if (businessYearError) throw businessYearError;
      setBusinessYearData(businessYear);

      // Magic Links are generated on-demand, no need to load from database

      // Check for signed jurat
      const { data: signatures, error: sigError } = await supabase
        .from('rd_signatures')
        .select('*')
        .eq('business_year_id', wizardState.selectedYear.id)
        .eq('signature_type', 'jurat')
        .order('signed_at', { ascending: false })
        .limit(1);

      if (!sigError && signatures && signatures.length > 0) {
        setJuratUploaded(true);
        setJuratUploadDate(signatures[0].signed_at);
      }

    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save QC notes for a document type
  const saveQCNotes = async (documentType: string) => {
    try {
      setLoading(true);
      
      await supabase
        .from('rd_qc_document_controls')
        .update({
          qc_review_notes: qcNotes[documentType],
          qc_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('business_year_id', wizardState.selectedYear.id)
        .eq('document_type', documentType);

      setEditingNotes(prev => ({ ...prev, [documentType]: false }));
      await loadReportsData();
    } catch (error) {
      console.error('Error saving QC notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle document release status
  const toggleRelease = async (documentType: string) => {
    try {
      setLoading(true);
      const newStatus = !releaseToggles[documentType];
      
      await supabase
        .from('rd_qc_document_controls')
        .update({
          is_released: newStatus,
          released_at: newStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('business_year_id', wizardState.selectedYear.id)
        .eq('document_type', documentType);

      setReleaseToggles(prev => ({ ...prev, [documentType]: newStatus }));
      await loadReportsData();
    } catch (error) {
      console.error('Error toggling release status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save Jurat notes
  const saveJuratNotes = async () => {
    try {
      setLoading(true);
      
      // Update or create jurat control record
      const { error } = await supabase
        .from('rd_qc_document_controls')
        .upsert({
          business_year_id: wizardState.selectedYear.id,
          document_type: 'jurat',
          qc_review_notes: juratNotes,
          qc_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setEditingJuratNotes(false);
      await loadReportsData();
    } catch (error) {
      console.error('Error saving jurat notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (documentType: string) => {
    const control = qcControls.find(c => c.document_type === documentType);
    const isReleased = releaseToggles[documentType];
    
    if (isReleased) {
      return { icon: CheckCircle, text: 'Released', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else {
      return { icon: Clock, text: 'Pending Review', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
  };

  const generateMagicLink = async () => {
    if (!wizardState.business?.id) return;

    try {
      setLoading(true);
      const magicLinkUrl = await qcService.generateMagicLink(wizardState.business.id);
      setMagicLink(magicLinkUrl);
    } catch (error) {
      console.error('Error generating magic link:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMagicLinkUrl = () => {
    return magicLink || '';
  };

  // Preview client portal for admin
  const previewClientPortal = async () => {
    if (!wizardState.business?.client_id) {
      console.error('No client ID found for business');
      return;
    }

    try {
      // Open client portal in new tab with admin preview parameters
      const adminPreviewParams = new URLSearchParams({
        admin_preview: 'true',
        business_id: wizardState.business.id,
        preview_token: Date.now().toString() // Simple timestamp token for preview verification
      });
      
      const portalUrl = `${window.location.origin}/client-portal/${wizardState.business.client_id}?${adminPreviewParams.toString()}`;
      console.log('🔍 [ReportsStep] Opening admin preview:', portalUrl);
      
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening client portal preview:', error);
    }
  };

  if (loading && !qcControls.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Document Management & QC Controls</h2>
        <p className="text-gray-600">Manage document quality control, release status, and client portal access</p>
      </div>

      {isAdmin && (
        <>
          {/* Primary QC Controls Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
              <Settings className="mr-2" size={20} />
              Quality Control Dashboard
            </h3>

            {/* Document Cards with QC Controls */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Research Report QC */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="text-blue-600 mr-3" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-900">Research Report</h4>
                      <p className="text-sm text-gray-600">Available when ready for review</p>
                    </div>
                  </div>
                  {(() => {
                    const status = getDocumentStatus('research_report');
                    return (
                      <div className={`flex items-center px-3 py-1 rounded-full ${status.bgColor}`}>
                        <status.icon className={`mr-1 ${status.color}`} size={16} />
                        <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Release Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Release to Client</span>
                  <button
                    onClick={() => toggleRelease('research_report')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      releaseToggles['research_report'] ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        releaseToggles['research_report'] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* QC Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">QC Notes</label>
                    {editingNotes['research_report'] ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveQCNotes('research_report')}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingNotes(prev => ({ ...prev, research_report: false }))}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingNotes(prev => ({ ...prev, research_report: true }))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  
                  {editingNotes['research_report'] ? (
                    <textarea
                      value={qcNotes['research_report'] || ''}
                      onChange={(e) => setQcNotes(prev => ({ ...prev, research_report: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      rows={3}
                      placeholder="Add QC review notes..."
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 min-h-[2.5rem]">
                      {qcNotes['research_report'] || 'No notes added'}
                    </div>
                  )}
                </div>

                {/* Release Date */}
                {releaseToggles['research_report'] && (
                  <div className="mt-3 text-xs text-gray-600">
                    Released: {qcControls.find(c => c.document_type === 'research_report')?.released_at 
                      ? new Date(qcControls.find(c => c.document_type === 'research_report')!.released_at!).toLocaleString()
                      : 'Just now'}
                  </div>
                )}
              </div>

              {/* Filing Guide QC */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="text-purple-600 mr-3" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-900">Filing Guide</h4>
                      <p className="text-sm text-gray-600">Available after jurat + QC + payment</p>
                    </div>
                  </div>
                  {(() => {
                    const status = getDocumentStatus('filing_guide');
                    return (
                      <div className={`flex items-center px-3 py-1 rounded-full ${status.bgColor}`}>
                        <status.icon className={`mr-1 ${status.color}`} size={16} />
                        <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Release Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Release to Client</span>
                  <button
                    onClick={() => toggleRelease('filing_guide')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      releaseToggles['filing_guide'] ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        releaseToggles['filing_guide'] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* QC Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">QC Notes</label>
                    {editingNotes['filing_guide'] ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveQCNotes('filing_guide')}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingNotes(prev => ({ ...prev, filing_guide: false }))}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingNotes(prev => ({ ...prev, filing_guide: true }))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  
                  {editingNotes['filing_guide'] ? (
                    <textarea
                      value={qcNotes['filing_guide'] || ''}
                      onChange={(e) => setQcNotes(prev => ({ ...prev, filing_guide: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      rows={3}
                      placeholder="Add QC review notes..."
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 min-h-[2.5rem]">
                      {qcNotes['filing_guide'] || 'No notes added'}
                    </div>
                  )}
                </div>

                {/* Release Date */}
                {releaseToggles['filing_guide'] && (
                  <div className="mt-3 text-xs text-gray-600">
                    Released: {qcControls.find(c => c.document_type === 'filing_guide')?.released_at 
                      ? new Date(qcControls.find(c => c.document_type === 'filing_guide')!.released_at!).toLocaleString()
                      : 'Just now'}
                  </div>
                )}
              </div>
            </div>

            {/* Jurat Document Management Section */}
            <div className="mt-6 bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="text-orange-600 mr-3" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-900">Signed Jurat Document</h4>
                    <p className="text-sm text-gray-600">Client attestation and signature storage</p>
                  </div>
                </div>
                <div className={`flex items-center px-3 py-1 rounded-full ${
                  juratUploaded ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  {juratUploaded ? (
                    <>
                      <CheckCircle className="mr-1 text-green-600" size={16} />
                      <span className="text-sm font-medium text-green-600">Signed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="mr-1 text-gray-600" size={16} />
                      <span className="text-sm font-medium text-gray-600">Awaiting Signature</span>
                    </>
                  )}
                </div>
              </div>

              {juratUploaded && juratUploadDate && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <Calendar className="mr-2" size={16} />
                    <span className="text-sm font-medium">
                      Signed on: {new Date(juratUploadDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Jurat QC Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Jurat Review Notes</label>
                  {editingJuratNotes ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={saveJuratNotes}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingJuratNotes(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingJuratNotes(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
                
                {editingJuratNotes ? (
                  <textarea
                    value={juratNotes}
                    onChange={(e) => setJuratNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    rows={3}
                    placeholder="Add notes about jurat signature review..."
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 min-h-[2.5rem]">
                    {juratNotes || 'No review notes added'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Portal Management */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Share2 className="mr-2" size={20} />
              Client Portal Management
            </h3>

            {magicLink ? (
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Magic Link URL</span>
                  <span className="text-xs text-gray-500">
                    One-time access link
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={getMagicLinkUrl()}
                    readOnly
                    className="flex-1 p-2 text-sm border border-gray-300 rounded bg-gray-50"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(getMagicLinkUrl())}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Generate a new secure access link for the client
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={previewClientPortal}
                      disabled={!wizardState.business?.client_id}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Preview client portal as admin"
                    >
                      <ExternalLink size={14} />
                      Preview Portal
                    </button>
                    <button
                      onClick={generateMagicLink}
                      disabled={loading}
                      className="px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating...' : 'Generate New Link'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={generateMagicLink}
                  disabled={loading}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share2 className="mx-auto mb-2" size={24} />
                  {loading ? 'Generating...' : 'Generate Client Portal Access'}
                </button>
                
                <div className="flex justify-center">
                  <button
                    onClick={previewClientPortal}
                    disabled={!wizardState.business?.client_id}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Preview client portal as admin"
                  >
                    <ExternalLink size={16} />
                    Preview Client Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

             {/* Document Preview Cards (Always Visible) */}
       <div className="grid md:grid-cols-3 gap-6">
         {/* Research Report Card */}
         <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <FileText className="text-blue-600 mr-3" size={24} />
               <div>
                 <h3 className="font-semibold text-gray-900">Research Report</h3>
                 <p className="text-sm text-gray-600">Comprehensive R&D documentation</p>
               </div>
             </div>
           </div>

           <div className="space-y-3">
             <button
               onClick={() => setIsResearchReportOpen(true)}
               className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
             >
               <Eye className="mr-2" size={16} />
               Preview Report
             </button>
           </div>
         </div>

         {/* Filing Guide Card */}
         <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <FileText className="text-purple-600 mr-3" size={24} />
               <div>
                 <h3 className="font-semibold text-gray-900">Filing Guide</h3>
                 <p className="text-sm text-gray-600">Tax credit claiming instructions</p>
               </div>
             </div>
           </div>

           <div className="space-y-3">
             <button
               onClick={() => setIsFilingGuideOpen(true)}
               className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
             >
               <Eye className="mr-2" size={16} />
               Preview Guide
             </button>
           </div>
         </div>

         {/* Allocation Report Card */}
         <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <FileText className="text-green-600 mr-3" size={24} />
               <div>
                 <h3 className="font-semibold text-gray-900">Allocation Report</h3>
                 <p className="text-sm text-gray-600">Detailed QRE breakdown and analysis</p>
               </div>
             </div>
           </div>

           <div className="space-y-3">
             <button
               onClick={() => setShowAllocationReport(true)}
               className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
             >
               <Eye className="mr-2" size={16} />
               View Allocation Report
             </button>
           </div>
         </div>
       </div>

       {/* Additional Reports Section */}
       <div className="grid md:grid-cols-2 gap-6">
         {/* CSV Export Card */}
         <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <Download className="text-emerald-600 mr-3" size={24} />
               <div>
                 <h3 className="font-semibold text-gray-900">Data Export</h3>
                 <p className="text-sm text-gray-600">Export calculation data and QRE details in CSV format</p>
               </div>
             </div>
           </div>

           <div className="space-y-3">
             <button
               className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
             >
               <Download className="mr-2" size={16} />
               Export CSV
             </button>
           </div>
         </div>

         {/* Jurat Status Card */}
         <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <User className="text-orange-600 mr-3" size={24} />
               <div>
                 <h3 className="font-semibold text-gray-900">Client Jurat</h3>
                 <p className="text-sm text-gray-600">Client attestation and signature status</p>
               </div>
             </div>
             <div className={`flex items-center px-3 py-1 rounded-full ${
               juratUploaded ? 'bg-green-50' : 'bg-gray-50'
             }`}>
               {juratUploaded ? (
                 <>
                   <CheckCircle className="mr-1 text-green-600" size={16} />
                   <span className="text-sm font-medium text-green-600">Signed</span>
                 </>
               ) : (
                 <>
                   <Clock className="mr-1 text-gray-600" size={16} />
                   <span className="text-sm font-medium text-gray-600">Pending</span>
                 </>
               )}
             </div>
           </div>

           {juratUploaded && juratUploadDate && (
             <div className="text-sm text-gray-600 mb-3">
               Signed: {new Date(juratUploadDate).toLocaleDateString()}
             </div>
           )}

           <div className="space-y-3">
             <button
               onClick={() => setShowJuratModal(true)}
               className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
             >
               <FileText className="mr-2" size={16} />
               View Jurat Details
             </button>
           </div>
         </div>
       </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Complete Setup
        </button>
      </div>

      {/* Modals */}
      {isFilingGuideOpen && (
        <FilingGuideModal
          isOpen={isFilingGuideOpen}
          onClose={() => setIsFilingGuideOpen(false)}
          businessData={wizardState.business}
          selectedYear={wizardState.selectedYear}
          calculations={wizardState.calculations}
          selectedMethod={wizardState.selectedMethod}
          debugData={wizardState.debugData}
        />
      )}

      {isResearchReportOpen && (
        <ResearchReportModal
          isOpen={isResearchReportOpen}
          onClose={() => setIsResearchReportOpen(false)}
          businessData={wizardState.business}
          selectedYear={wizardState.selectedYear}
          calculations={wizardState.calculations}
          selectedMethod={wizardState.selectedMethod}
          debugData={wizardState.debugData}
        />
      )}

      {showAllocationReport && (
        <AllocationReportModal
          isOpen={showAllocationReport}
          onClose={() => setShowAllocationReport(false)}
          businessData={wizardState.business}
          selectedYear={wizardState.selectedYear}
          calculations={wizardState.calculations}
        />
      )}
    </div>
  );
};

export default ReportsStep; 