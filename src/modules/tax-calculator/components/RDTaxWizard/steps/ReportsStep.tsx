import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Settings, Share2, CheckCircle, Clock, AlertCircle, User, Calendar, DollarSign, Lock, Unlock, Upload, Save, Edit, Check, X, ExternalLink, PenTool, Building2, MapPin, Mail, Shield } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { FilingGuideModal } from '../../FilingGuide/FilingGuideModal';
import ResearchReportModal from '../../ResearchReport/ResearchReportModal';
import AllocationReportModal from '../../AllocationReport/AllocationReportModal';
import BillingReportModal from '../../BillingReport/BillingReportModal';
import SignatureCapture from '../../SignatureCapture/SignatureCapture';
import { qcService } from '../../../services/qcService';
import { RDCalculationsService } from '../../../services/rdCalculationsService';
import { StateProFormaCalculationService } from '../../../services/stateProFormaCalculationService';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportsStepProps {
  wizardState: any;
  onComplete: () => void;
  onPrevious: () => void;
  reportGenerationDates?: {
    research_report?: string;
    allocation_report?: string;
  };
  onReportGenerated?: () => void;
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

const ReportsStep: React.FC<ReportsStepProps> = ({ 
  wizardState, 
  onComplete, 
  onPrevious, 
  reportGenerationDates = {}, 
  onReportGenerated 
}) => {
  // 📊 Helper function to format generation date chip
  const formatGenerationDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Generated';
    }
  };

  // Save Allocation Report by opening the modal (which now has its own save button)
  const saveAllocationReport = async () => {
    // Open the allocation report modal where user can use the "Save to DB" button
    setShowAllocationReport(true);
    toast('Please use the "Save to DB" button in the Allocation Report modal to save the full report.', {
      duration: 4000,
      icon: 'ℹ️'
    });
  };

  const [isFilingGuideOpen, setIsFilingGuideOpen] = useState(false);
  const [isResearchReportOpen, setIsResearchReportOpen] = useState(false);
  const [showAllocationReport, setShowAllocationReport] = useState(false);
  const [showBillingReport, setShowBillingReport] = useState(false);
  const [loading, setLoading] = useState(false);

  const [qcControls, setQCControls] = useState<QCDocumentControl[]>([]);
  const [businessYearData, setBusinessYearData] = useState<BusinessYearData | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingControl, setEditingControl] = useState<string | null>(null);
  const [showJuratModal, setShowJuratModal] = useState(false);
  
  // Payment status toggle (Filing Guide) – defaults to false unless set in DB
  const togglePaymentReceived = async (value: boolean) => {
    try {
      const yearId = wizardState.selectedYear?.id;
      if (!yearId) return;
      setLoading(true);
      const { error } = await supabase
        .from('rd_business_years')
        .update({ 
          payment_received: value, 
          payment_received_at: value ? new Date().toISOString() : null 
        })
        .eq('id', yearId);
      if (error) {
        console.error('Error updating payment_received:', error);
        toast.error('Failed to update payment status');
      } else {
        setBusinessYearData(prev => prev ? { 
          ...prev, 
          payment_received: value, 
          payment_received_at: value ? new Date().toISOString() : null 
        } : prev);
        toast.success(value ? 'Marked as paid' : 'Marked as unpaid');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Year selector state
  const [availableYears, setAvailableYears] = useState<Array<{id: string, year: number}>>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>(wizardState.selectedYear?.id || '');
  const [selectedBillingYearIds, setSelectedBillingYearIds] = useState<string[]>(wizardState.selectedYear?.id ? [wizardState.selectedYear.id] : []);
  const [includeStateCreditsForBilling, setIncludeStateCreditsForBilling] = useState<boolean>(true);
  
  // Jurat signature state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<any>(null);
  const [editingJurat, setEditingJurat] = useState(false);
  const [showJuratPreview, setShowJuratPreview] = useState(false);
  
  // QC Notes and editing states
  const [qcNotes, setQcNotes] = useState<{ [key: string]: string }>({});
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [releaseToggles, setReleaseToggles] = useState<{ [key: string]: boolean }>({});
  
  // QC Approver Modal states
  const [showQCApproverModal, setShowQCApproverModal] = useState(false);
  const [pendingToggleType, setPendingToggleType] = useState<string | null>(null);
  const [qcApproverForm, setQcApproverForm] = useState({
    name: '',
    credentials: '',
    password: ''
  });
  
  // Jurat document management
  const [juratUploaded, setJuratUploaded] = useState(false);
  const [juratUploadDate, setJuratUploadDate] = useState<string | null>(null);
  const [juratNotes, setJuratNotes] = useState('');
  const [editingJuratNotes, setEditingJuratNotes] = useState(false);
  const [showSignedJuratModal, setShowSignedJuratModal] = useState(false);
  const [signedJuratData, setSignedJuratData] = useState<any>(null);

  // Credit Management states - EXACT same as CalculationStep
  const [federalCredit, setFederalCredit] = useState<number>(0);
  const [stateCredit, setStateCredit] = useState<number>(0);
  const [creditsLocked, setCreditsLocked] = useState<boolean>(false);
  const [creditsCalculatedAt, setCreditsCalculatedAt] = useState<string | null>(null);
  const [editingCredits, setEditingCredits] = useState<boolean>(false);
  
  // Portal Email Management states
  const [portalEmail, setPortalEmail] = useState<string>('');
  const [editingPortalEmail, setEditingPortalEmail] = useState<boolean>(false);
  const [loadingPortalEmail, setLoadingPortalEmail] = useState<boolean>(false);
  const [loadingCredits, setLoadingCredits] = useState<boolean>(false);

  // Profiles management state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // EXACT same method selection as CalculationStep
  const [selectedMethod, setSelectedMethod] = useState<'standard' | 'asc'>('asc');
  const [selectedStateMethod, setSelectedStateMethod] = useState<string>('Standard');
  const [enableStateCredits, setEnableStateCredits] = useState(true);
  const [results, setResults] = useState<any>(null);

  // Default jurat text
  const [juratText, setJuratText] = useState(`R&D Credit Review Statement and Jurat
I, the undersigned, hereby confirm that I have reviewed the summary of research activities and the associated time and expense allocations provided as part of the R&D tax credit study prepared for my business.

To the best of my knowledge and belief, the information I provided during the study is accurate and complete. I understand that these materials are used to support the calculation of a federal and/or state research credit, and that any estimates or time allocations are based on reasonable methods, including sample-based studies and professional judgment where applicable.

I acknowledge that I had the opportunity to review and revise the report prior to finalization, and I approve its use for tax reporting purposes.`);

  // Year selection is handled by the footer dropdown - no local year loading needed

  // Reload QC data when wizard year changes
  useEffect(() => {
    if (wizardState.selectedYear?.id) {
      loadReportsData();
    }
  }, [wizardState.selectedYear?.id]);

  // Check if user is admin and load data
  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        // Check user type
        console.log('🔍 [ReportsStep] Checking admin status...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 [ReportsStep] User:', user);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          console.log('🔍 [ReportsStep] Profile:', profile);
          setIsAdmin(profile?.role === 'admin' || false);
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

  // Load profiles for this client's account
  useEffect(() => {
    if (wizardState.business?.client_id) {
      loadProfiles();
    }
  }, [wizardState.business?.client_id]);

  // Initialize QC controls if they don't exist
  const initializeQCControls = async (yearId: string) => {
    if (!yearId) return;

    const documentTypes = [
      { type: 'research_report', requires_jurat: false, requires_payment: false },
      { type: 'filing_guide', requires_jurat: true, requires_payment: true },
      { type: 'allocation_report', requires_jurat: false, requires_payment: false }
    ];

    for (const doc of documentTypes) {
      // ✅ FIX: Only insert new records, don't overwrite existing ones
      const { error } = await supabase
        .from('rd_qc_document_controls')
        .upsert({
          business_year_id: yearId,
          document_type: doc.type,
          requires_jurat: doc.requires_jurat,
          requires_payment: doc.requires_payment,
          is_released: false
        }, { 
          onConflict: 'business_year_id,document_type',
          ignoreDuplicates: true  // ✅ Don't overwrite existing records!
        });

      if (error) {
        console.error(`Error initializing QC control for ${doc.type}:`, error);
      }
    }
  };

  const loadReportsData = async () => {
    const yearIdToLoad = wizardState.selectedYear?.id;
    if (!yearIdToLoad) return;

    console.log('🆔 LOAD Business Year ID:', yearIdToLoad);
    console.log('🔍 wizardState.selectedYear?.id:', wizardState.selectedYear?.id);

    setLoading(true);
    try {
      // First, ensure QC controls exist
      await initializeQCControls(yearIdToLoad);

      // Load QC document controls
      const { data: controls, error: controlsError } = await supabase
        .from('rd_qc_document_controls')
        .select('*')
        .eq('business_year_id', yearIdToLoad);

      if (controlsError) throw controlsError;
      const controlsData = controls || [];
      setQCControls(controlsData);
      
      // Initialize notes and toggle states
      const notesState: { [key: string]: string } = {};
      const toggleState: { [key: string]: boolean } = {};
      
      console.log('🔍 [loadReportsData] Processing controls data:', controlsData);
      
      controlsData.forEach(control => {
        notesState[control.document_type] = control.qc_review_notes || '';
        toggleState[control.document_type] = control.is_released;
        console.log(`📊 [loadReportsData] ${control.document_type}:`, {
          is_released: control.is_released,
          qc_approver_name: control.qc_approver_name,
          qc_approved_date: control.qc_approved_date,
          released_at: control.released_at
        });
      });
      
      console.log('🎯 [loadReportsData] Final toggle state being set:', toggleState);
      
      setQcNotes(notesState);
      setReleaseToggles(toggleState);

      // Load business year data including credit information
      const { data: businessYear, error: businessYearError } = await supabase
        .from('rd_business_years')
        .select('qc_status, qc_approved_by, qc_approved_at, qc_notes, payment_received, payment_received_at, payment_amount, documents_released, documents_released_at, federal_credit, state_credit, credits_locked, credits_calculated_at')
        .eq('id', yearIdToLoad)
        .single();

      if (businessYearError) throw businessYearError;
      setBusinessYearData(businessYear);

      // Load credit management data - ONLY load from database if locked, otherwise show 0
      if (businessYear) {
        // Always load lock status first
        setCreditsLocked(businessYear.credits_locked || false);
        setCreditsCalculatedAt(businessYear.credits_calculated_at);
        
        // ONLY load credit values if they are locked (QC verified)
        if (businessYear.credits_locked) {
          // Credits are locked - load saved QC verified values from database
          console.log('🔒 Credits are LOCKED - loading QC verified values from database:', {
            federal: businessYear.federal_credit,
            state: businessYear.state_credit
          });
          setFederalCredit(businessYear.federal_credit || 0);
          setStateCredit(businessYear.state_credit || 0);
        } else {
          // Credits not locked - show 0 until user clicks "Load from Wizard"
          console.log('🔄 Credits NOT locked - displaying 0 until Load from Wizard is clicked');
          setFederalCredit(0);
          setStateCredit(0);
        }
      }

      // Magic Links are generated on-demand, no need to load from database

      // Check for signed jurat - Updated to use rd_signature_records table
      const { data: signatures, error: sigError } = await supabase
        .from('rd_signature_records')
        .select('*')
        .eq('business_year_id', yearIdToLoad)
        .order('signed_at', { ascending: false })
        .limit(1);

      console.log('🔍 [ReportsStep] Checking for jurat signatures:', {
        yearIdToLoad,
        signatures,
        sigError,
        foundSignatures: signatures?.length || 0
      });

      if (!sigError && signatures && signatures.length > 0) {
        console.log('✅ [ReportsStep] Jurat signature found:', signatures[0]);
        setJuratUploaded(true);
        setJuratUploadDate(signatures[0].signed_at);
        setSignedJuratData(signatures[0]);
      } else {
        console.log('❌ [ReportsStep] No jurat signatures found');
        setJuratUploaded(false);
        setJuratUploadDate(null);
        setSignedJuratData(null);
      }

      // Load portal email override
      await loadPortalEmail();

    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save QC notes for a document type
  const saveQCNotes = async (documentType: string) => {
    const yearIdToSave = wizardState.selectedYear?.id;
    if (!yearIdToSave) return;
    
    try {
      setLoading(true);
      
      await supabase
        .from('rd_qc_document_controls')
        .update({
          qc_review_notes: qcNotes[documentType],
          qc_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('business_year_id', yearIdToSave)
        .eq('document_type', documentType);

      setEditingNotes(prev => ({ ...prev, [documentType]: false }));
      await loadReportsData();
    } catch (error) {
      console.error('Error saving QC notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load from Wizard - Get actual calculated values from wizard state
  const loadCalculatedCreditsFromWizard = async () => {
    console.log('🔍 [Load from Wizard] Loading REAL calculated values from wizard...');
    
    try {
      const yearId = wizardState.selectedYear?.id;
      if (!yearId) {
        console.error('❌ [Load from Wizard] No year ID available');
        return;
      }

      // Get Federal Credit from RDCalculationsService (same as Calculations page)
      const federalResults = await RDCalculationsService.calculateCredits(yearId);
      const selectedMethod = wizardState.selectedMethod || 'asc';
      
      let calculatedFederalCredit = 0;
      if (selectedMethod === 'asc' && federalResults.federalCredits?.asc) {
        calculatedFederalCredit = federalResults.federalCredits.asc.adjustedCredit || federalResults.federalCredits.asc.credit || 0;
      } else if (selectedMethod === 'standard' && federalResults.federalCredits?.standard) {
        calculatedFederalCredit = federalResults.federalCredits.standard.adjustedCredit || federalResults.federalCredits.standard.credit || 0;
      }

      // Get State Credit using same method as Calculations page
      const businessState = wizardState.business?.domicile_state || wizardState.business?.contact_info?.state || wizardState.business?.state || 'CA';
      const stateResults = await StateProFormaCalculationService.getAllStateCreditsFromProForma(yearId, businessState);
      const calculatedStateCredit = stateResults.total || 0;

      // Update the credit values
      setFederalCredit(calculatedFederalCredit);
      setStateCredit(calculatedStateCredit);
      
      console.log('✅ [Load from Wizard] Loaded REAL calculated values:', {
        federal: calculatedFederalCredit,
        state: calculatedStateCredit,
        federalMethod: selectedMethod,
        businessState,
        source: 'Calculated from wizard using same services as Calculations page'
      });

    } catch (error) {
      console.error('❌ [Load from Wizard] Error loading calculated values:', error);
      
      // Fallback to 0 values if calculation fails
      setFederalCredit(0);
      setStateCredit(0);
    }
  };

  const saveCreditValues = async () => {
    const yearId = wizardState.selectedYear?.id;
    if (!yearId) return;

    try {
      setLoadingCredits(true);
      
      console.log('💾 [Credit Management] Saving credit values to rd_business_years:', {
        yearId,
        federal_credit: federalCredit,
        state_credit: stateCredit,
        total: federalCredit + stateCredit
      });

      const updateData = {
        federal_credit: federalCredit,
        state_credit: stateCredit,
        credits_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('rd_business_years')
        .update(updateData)
        .eq('id', yearId)
        .select('federal_credit, state_credit, credits_calculated_at, credits_locked');

      if (error) {
        console.error('❌ Database error saving credits:', error);
        throw error;
      }

      console.log('✅ [Credit Management] Credit values saved successfully to database:', data);

      // Reload data to get updated timestamps and verify save
      await loadReportsData();
      
      setEditingCredits(false);
      console.log('🎉 Credit values saved and will appear in Client Portal when locked');
      
    } catch (error) {
      console.error('❌ Error saving credit values:', error);
      alert(`Failed to save credit values: ${error.message}`);
    } finally {
      setLoadingCredits(false);
    }
  };

  const toggleCreditsLock = async () => {
    const yearId = wizardState.selectedYear?.id;
    if (!yearId) return;

    try {
      setLoadingCredits(true);
      
      const newLockedState = !creditsLocked;
      
      console.log('🔒 [Credit Management] Toggling credits lock:', {
        currentState: creditsLocked,
        newState: newLockedState,
        currentCredits: { federal: federalCredit, state: stateCredit },
        yearId
      });

      const updateData: any = {
        credits_locked: newLockedState,
        updated_at: new Date().toISOString()
      };

      if (newLockedState) {
        // Locking - save current credit values and set lock metadata
        updateData.federal_credit = federalCredit;
        updateData.state_credit = stateCredit;
        updateData.credits_calculated_at = new Date().toISOString();
        updateData.credits_locked_at = new Date().toISOString();
        updateData.credits_locked_by = wizardState.user?.id;
        
        console.log('🔒 LOCKING credits - saving current values to database:', {
          federal_credit: federalCredit,
          state_credit: stateCredit
        });
      } else {
        // Unlocking - clear lock timestamp and user (keep credit values)
        updateData.credits_locked_at = null;
        updateData.credits_locked_by = null;
        
        console.log('🔓 UNLOCKING credits - keeping values but removing lock');
      }

      const { data, error } = await supabase
        .from('rd_business_years')
        .update(updateData)
        .eq('id', yearId)
        .select('credits_locked, federal_credit, state_credit, credits_locked_at');

      if (error) {
        console.error('❌ Database error toggling lock:', error);
        throw error;
      }

      console.log('✅ [Credit Management] Credits lock toggled successfully:', data);

      setCreditsLocked(newLockedState);
      
      // Reload data to get updated metadata
      await loadReportsData();
      
      if (newLockedState) {
        console.log('🎉 Credits are now LOCKED and will appear in Client Portal');
      } else {
        console.log('🔄 Credits are now UNLOCKED and can be updated from Calculations section');
      }
      
    } catch (error) {
      console.error('❌ Error toggling credits lock:', error);
      alert(`Failed to toggle credits lock: ${error.message}`);
    } finally {
      setLoadingCredits(false);
    }
  };

  // Generate HTML report content
  const generateReportHTML = async (documentType: string): Promise<string> => {
    try {
      // This is a simplified HTML generation - you can expand this based on your needs
      const businessName = wizardState.business?.business_name || 'Business';
      const year = wizardState.selectedYear?.year || new Date().getFullYear();
      
      // Get current R&D calculations and data
      const { data: calculations, error: calcError } = await supabase
        .from('rd_federal_credit_results')
        .select('*')
        .eq('business_year_id', wizardState.selectedYear?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (calcError) {
        console.error('Error fetching calculations:', calcError);
      }

      const calcData = calculations?.[0] || {};
      
      let htmlContent = '';
      
      if (documentType === 'research_report') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>R&D Research Report - ${businessName} - ${year}</title>
            <style>
              body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .section { margin-bottom: 30px; }
              .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
              .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .summary-table th { background-color: #f5f5f5; font-weight: bold; }
              .amount { text-align: right; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Research & Development Tax Credit Report</h1>
              <h2>${businessName}</h2>
              <h3>Tax Year ${year}</h3>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h2>Executive Summary</h2>
              <p>This report documents the qualified research activities and expenses for ${businessName} during the ${year} tax year, supporting the federal and state R&D tax credit claims.</p>
            </div>
            
            <div class="section">
              <h2>Federal Credit Summary</h2>
              <table class="summary-table">
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
                <tr>
                  <td>Qualified Research Expenses (QRE)</td>
                  <td class="amount">$${(calcData.total_qre || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Federal R&D Credit</td>
                  <td class="amount">$${(calcData.total_credit || 0).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <h2>QC Approval</h2>
              <p><strong>Approved by:</strong> [QC Approver Name]</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Status:</strong> Approved for Release</p>
            </div>
          </body>
          </html>
        `;
      } else if (documentType === 'filing_guide') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Filing Guide - ${businessName} - ${year}</title>
            <style>
              body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .section { margin-bottom: 30px; }
              .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
              .checklist { list-style-type: none; padding: 0; }
              .checklist li { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #007cba; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>R&D Tax Credit Filing Guide</h1>
              <h2>${businessName}</h2>
              <h3>Tax Year ${year}</h3>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h2>Filing Instructions</h2>
              <p>This guide provides step-by-step instructions for claiming your R&D tax credits on your federal and state tax returns.</p>
            </div>
            
            <div class="section">
              <h2>Required Forms and Filing Steps</h2>
              <ul class="checklist">
                <li>✓ Complete Form 6765 - Credit for Increasing Research Activities</li>
                <li>✓ Attach supporting documentation for qualified research expenses</li>
                <li>✓ Include state-specific forms if applicable</li>
                <li>✓ Maintain detailed records for potential audit</li>
              </ul>
            </div>
            
            <div class="section">
              <h2>Credit Amounts</h2>
              <p><strong>Federal R&D Credit:</strong> $${(calcData.total_credit || 0).toLocaleString()}</p>
              <p><strong>Total QRE:</strong> $${(calcData.total_qre || 0).toLocaleString()}</p>
            </div>
          </body>
          </html>
        `;
      } else if (documentType === 'allocation_report') {
        // Generate a basic allocation report - this will be improved to integrate with AllocationReportModal later
        htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Allocation Report - ${businessName} - ${year}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                font-size: 14px;
                line-height: 1.6; 
                color: #1f2937;
                background: white;
                margin: 40px;
              }
              .header { 
                background: linear-gradient(135deg, #10b981 0%, #047857 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
              .header h2 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
              .header p { font-size: 14px; opacity: 0.9; }
              .section { margin-bottom: 30px; }
              .section h2 { 
                color: #1f2937; 
                font-size: 20px;
                font-weight: 600;
                border-bottom: 2px solid #10b981; 
                padding-bottom: 8px;
                margin-bottom: 16px;
              }
              .allocation-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              .allocation-table th, .allocation-table td { 
                border: 1px solid #e5e7eb; 
                padding: 12px 16px; 
                text-align: left; 
              }
              .allocation-table th { 
                background-color: #f8fafc; 
                font-weight: 600;
                color: #374151;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .amount { text-align: right; font-weight: 600; }
              .total-row { 
                background-color: #f0fdf4; 
                font-weight: 600;
                border-top: 2px solid #10b981;
              }
              .summary-text {
                background: #f8fafc;
                padding: 16px;
                border-radius: 6px;
                color: #4b5563;
                font-size: 14px;
              }
              .disclaimer {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 16px;
                margin-top: 30px;
                font-size: 12px;
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Employee & Expense Allocation Report</h1>
              <h2>${businessName}</h2>
              <h3>Tax Year ${year}</h3>
              <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="section">
              <h2>Report Summary</h2>
              <div class="summary-text">
                This report details the allocation of employee time, contractor expenses, and supply costs to qualified research activities for the ${year} tax year. All amounts are calculated based on the research activities defined in the R&D tax credit analysis.
              </div>
            </div>
            
            <div class="section">
              <h2>QRE Allocation Summary</h2>
              <table class="allocation-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total Amount</th>
                    <th>Allocated to QRE</th>
                    <th>Allocation %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Employee Wages</td>
                    <td class="amount">$${(calcData.total_wages || 0).toLocaleString()}</td>
                    <td class="amount">$${(calcData.qre_wages || 0).toLocaleString()}</td>
                    <td class="amount">${calcData.total_wages ? ((calcData.qre_wages || 0) / calcData.total_wages * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                  <tr>
                    <td>Contractor Expenses</td>
                    <td class="amount">$${(calcData.total_contractors || 0).toLocaleString()}</td>
                    <td class="amount">$${(calcData.qre_contractors || 0).toLocaleString()}</td>
                    <td class="amount">${calcData.total_contractors ? ((calcData.qre_contractors || 0) / calcData.total_contractors * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                  <tr>
                    <td>Supply Costs</td>
                    <td class="amount">$${(calcData.total_supplies || 0).toLocaleString()}</td>
                    <td class="amount">$${(calcData.qre_supplies || 0).toLocaleString()}</td>
                    <td class="amount">${calcData.total_supplies ? ((calcData.qre_supplies || 0) / calcData.total_supplies * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                  <tr class="total-row">
                    <td><strong>TOTAL QRE</strong></td>
                    <td class="amount"><strong>$${((calcData.total_wages || 0) + (calcData.total_contractors || 0) + (calcData.total_supplies || 0)).toLocaleString()}</strong></td>
                    <td class="amount"><strong>$${(calcData.total_qre || 0).toLocaleString()}</strong></td>
                    <td class="amount"><strong>${((calcData.total_wages || 0) + (calcData.total_contractors || 0) + (calcData.total_supplies || 0)) > 0 ? ((calcData.total_qre || 0) / ((calcData.total_wages || 0) + (calcData.total_contractors || 0) + (calcData.total_supplies || 0)) * 100).toFixed(1) : '0.0'}%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="disclaimer">
              <strong>Note:</strong> This is a summary allocation report. For detailed employee-by-employee breakdowns, activity-specific allocations, and subcomponent analysis, please refer to the comprehensive allocation report generated through the allocation report modal in the R&D Wizard.
            </div>
          </body>
          </html>
        `;
      } else {
        // Default HTML for other document types
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${documentType.replace('_', ' ').toUpperCase()} - ${businessName}</title>
            <style>
              body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${documentType.replace('_', ' ').toUpperCase()}</h1>
              <h2>${businessName}</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
          </html>
        `;
      }
      
      return htmlContent;
    } catch (error) {
      console.error('Error generating HTML:', error);
      return `<html><body><h1>Error generating report</h1><p>${error}</p></body></html>`;
    }
  };

  // Get user's IP address with fallback approach
  const getUserIPAddress = async (): Promise<string> => {
    try {
      // Try to get IP from browser headers or use a fallback
      // Since external API calls are blocked by CSP, we'll use alternative approaches
      
      // First try: Check if we can get it from WebRTC (requires user permission)
      try {
        const rtcPeerConnection = new RTCPeerConnection({ iceServers: [] });
        const noop = () => {};
        rtcPeerConnection.createDataChannel('');
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve('browser-session-' + new Date().getTime());
          }, 1000);
          
          rtcPeerConnection.createOffer()
            .then(offer => rtcPeerConnection.setLocalDescription(offer))
            .catch(noop);
          
          rtcPeerConnection.onicecandidate = (ice) => {
            if (ice && ice.candidate && ice.candidate.candidate) {
              const candidate = ice.candidate.candidate;
              const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
              if (ipMatch) {
                clearTimeout(timeout);
                rtcPeerConnection.close();
                resolve(ipMatch[1]);
                return;
              }
            }
          };
        });
      } catch (webrtcError) {
        console.log('WebRTC IP detection not available:', webrtcError);
        // Fallback to session-based identifier
        return 'session-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2, 9);
      }
    } catch (error) {
      console.error('Error getting IP address:', error);
      // Generate a unique session identifier as fallback
      return 'session-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2, 9);
    }
  };

  // Handle QC approval submission
  const handleQCApproval = async () => {
    if (!pendingToggleType || !qcApproverForm.name || !qcApproverForm.credentials) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const newStatus = !releaseToggles[pendingToggleType];
      const ipAddress = await getUserIPAddress();
      const approvalDate = new Date().toISOString();

      // Generate or retrieve HTML if toggling ON
      let generatedHTML = '';
      let hasExistingHTML = false;
      if (newStatus) {
        if (pendingToggleType === 'allocation_report') {
          // Generate allocation report HTML
          console.log('📊 Generating allocation report HTML');
        generatedHTML = await generateReportHTML(pendingToggleType);
        } else if (pendingToggleType === 'research_report') {
          // CRITICAL: Do not overwrite the rich, fully formatted Research Report if it already exists
          const { data: existing } = await supabase
            .from('rd_reports')
            .select('id, generated_html')
            .eq('business_year_id', wizardState.selectedYear?.id)
            .eq('type', 'RESEARCH_SUMMARY')
            .single();

          if (existing?.generated_html) {
            hasExistingHTML = true;
            generatedHTML = existing.generated_html; // preserve previously generated full CSS report
            console.log('📄 Using existing saved Research Report HTML (preserving full formatting)');
          } else {
            generatedHTML = await generateReportHTML(pendingToggleType);
          }
        } else {
          // Filing Guide and other docs can be (re)generated here
          generatedHTML = await generateReportHTML(pendingToggleType);
        }

        // Save to rd_reports table
        console.log('💾 Attempting to save report HTML for:', pendingToggleType);
        
        // ✅ ENUM MAPPING: Convert frontend document type to database enum value
        const dbEnumType = mapDocumentTypeToEnum(pendingToggleType);
        console.log('🔄 Mapping document type:', pendingToggleType, '→', dbEnumType);
        
        const reportData: any = {
          business_year_id: wizardState.selectedYear?.id,
          business_id: wizardState.business?.id,
          type: dbEnumType, // ✅ Use mapped enum value instead of frontend type
          qc_approved_by: qcApproverForm.name,
          qc_approved_at: approvalDate,
          qc_approver_ip: ipAddress,
          generated_text: `QC approved report for ${pendingToggleType}`,
          ai_version: 'manual_qc_v1.0'
        };

          // Save HTML to appropriate column based on document type
          if (pendingToggleType === 'allocation_report') {
            // Save allocation reports to the allocation_report column
            if (generatedHTML) {
              reportData.allocation_report = generatedHTML;
            }
          } else {
            // Only include generated_html if we actually generated new content or for non-Research Report docs
            // This prevents overwriting the fully formatted Research Report that was generated elsewhere
            if (generatedHTML && (!hasExistingHTML || pendingToggleType !== 'research_report')) {
              reportData.generated_html = generatedHTML;
            }
          }
        
        console.log('📄 Report data to save:', {
          ...reportData,
            generated_html: reportData.generated_html ? reportData.generated_html.length + ' characters' : 'unchanged',
            allocation_report: reportData.allocation_report ? reportData.allocation_report.length + ' characters' : 'unchanged'
        });

        const { error: reportError } = await supabase
          .from('rd_reports')
          .upsert(reportData, {
            onConflict: 'business_year_id,type'
          });

        if (reportError) {
          console.error('❌ Error saving report HTML:', reportError);
          console.error('📋 Error details:', {
            code: reportError.code,
            message: reportError.message,
            details: reportError.details,
            hint: reportError.hint
          });
          
          // If the unique constraint error, try without ON CONFLICT as a fallback
          if (reportError.code === '42P10') {
            console.log('🔄 Retrying without ON CONFLICT clause...');
            
            // First check if record exists
            const { data: existingReport } = await supabase
              .from('rd_reports')
              .select('id')
              .eq('business_year_id', wizardState.selectedYear?.id)
              .eq('type', dbEnumType) // ✅ Use mapped enum value
              .single();
            
            if (existingReport) {
              // Update existing record
              const { error: updateError } = await supabase
                .from('rd_reports')
                .update(reportData)
                .eq('id', existingReport.id);
              
              if (updateError) {
                console.error('❌ Fallback update failed:', updateError);
              } else {
                console.log('✅ Report updated successfully (fallback method)');
              }
            } else {
              // Insert new record
              const { error: insertError } = await supabase
                .from('rd_reports')
                .insert(reportData);
              
              if (insertError) {
                console.error('❌ Fallback insert failed:', insertError);
              } else {
                console.log('✅ Report inserted successfully (fallback method)');
              }
            }
          }
        } else {
          console.log('✅ Report HTML saved successfully');
        }
      }

      // Update QC controls with approver information
      console.log('🔄 Updating QC controls for:', {
        business_year_id: wizardState.selectedYear?.id,
        document_type: pendingToggleType,
        is_released: newStatus
      });
      console.log('🆔 UPDATE Business Year ID:', wizardState.selectedYear?.id);

      const { error, data } = await supabase
        .from('rd_qc_document_controls')
        .update({
          is_released: newStatus,
          released_at: newStatus ? approvalDate : null,
          qc_approver_name: newStatus ? qcApproverForm.name : null,
          qc_approver_credentials: newStatus ? qcApproverForm.credentials : null,
          qc_approved_date: newStatus ? approvalDate : null,
          qc_approver_ip_address: newStatus ? ipAddress : null,
          updated_at: approvalDate
        })
        .eq('business_year_id', wizardState.selectedYear?.id)
        .eq('document_type', pendingToggleType)
        .select();

      console.log('📋 QC controls update result:', { error, data, updatedRows: data?.length });
      
      // ✅ DEBUG: Show what was actually updated
      if (data && data.length > 0) {
        console.log('📊 QC controls update - what was changed:', data[0]);
      }

      if (error) {
        console.error('❌ QC controls update failed:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No QC control records were updated! This might mean the record does not exist.');
        console.log('🔍 Checking if QC control record exists...');
        
        const { data: existingRecord, error: checkError } = await supabase
          .from('rd_qc_document_controls')
          .select('*')
          .eq('business_year_id', wizardState.selectedYear?.id)
          .eq('document_type', pendingToggleType);
        
        console.log('📋 Existing QC control record check:', { existingRecord, checkError });
        
        if (!existingRecord || existingRecord.length === 0) {
          console.log('🆕 Creating missing QC control record...');
          const { error: insertError } = await supabase
            .from('rd_qc_document_controls')
            .insert({
              business_year_id: wizardState.selectedYear?.id,
              document_type: pendingToggleType,
              is_released: newStatus,
              released_at: newStatus ? approvalDate : null,
              qc_approver_name: newStatus ? qcApproverForm.name : null,
              qc_approver_credentials: newStatus ? qcApproverForm.credentials : null,
              qc_approved_date: newStatus ? approvalDate : null,
              qc_approver_ip_address: newStatus ? ipAddress : null,
              requires_jurat: pendingToggleType === 'filing_guide',
              requires_payment: pendingToggleType === 'filing_guide'
            });
          
          if (insertError) {
            console.error('❌ Failed to create QC control record:', insertError);
            throw insertError;
          } else {
            console.log('✅ QC control record created successfully');
          }
        }
      } else {
        console.log('✅ QC controls updated successfully');
      }

      // ✅ CRITICAL FIX: Update business year QC status for document availability
      console.log('🔄 Updating business year QC status for document availability...');
      
      // For research_report, set status to 'ready_for_review' when approved
      const qcStatus = pendingToggleType === 'research_report' ? 'ready_for_review' : 'approved';
      
      const { error: businessYearError } = await supabase
        .from('rd_business_years')
        .update({
          qc_status: newStatus ? qcStatus : 'pending',
          qc_approved_by: newStatus ? wizardState.user?.id : null,
          qc_approved_at: newStatus ? approvalDate : null
        })
        .eq('id', wizardState.selectedYear?.id);

      if (businessYearError) {
        console.error('❌ Failed to update business year QC status:', businessYearError);
        // Don't throw error here - QC controls update was successful
      } else {
        console.log('✅ Business year QC status updated to:', newStatus ? qcStatus : 'pending');
      }

      // Update local state BEFORE reload
      console.log('🔄 Updating local toggle state for', pendingToggleType, 'to', newStatus);
      setReleaseToggles(prev => ({ ...prev, [pendingToggleType]: newStatus }));
      
      // Close modal and reset form
      setShowQCApproverModal(false);
      setPendingToggleType(null);
      setQcApproverForm({ name: '', credentials: '', password: '' });
      
      // ✅ DEBUG: Check what's actually in database before reload
      console.log('🔍 Checking database state before reload...');
      console.log('🆔 DEBUG Query Business Year ID:', wizardState.selectedYear?.id);
      const { data: debugData, error: debugError } = await supabase
        .from('rd_qc_document_controls')
        .select('document_type, is_released')
        .eq('business_year_id', wizardState.selectedYear?.id);
      
      console.log('📋 Database state after update:', debugData);
      debugData?.forEach(record => {
        console.log(`🔍 DB Record: ${record.document_type} = ${record.is_released}`);
      });
      
      // ✅ TRANSACTION TIMING: Add small delay to ensure database transaction commits
      console.log('⏰ Waiting 100ms for database transaction to commit...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await loadReportsData();
      
      // ✅ DEBUG: Check final toggle state after reload
      console.log('🎯 Final toggle states after reload:', releaseToggles);
      
      alert(`Document ${pendingToggleType} ${newStatus ? 'released' : 'unreleased'} successfully!`);
      
    } catch (error) {
      console.error('Error processing QC approval:', error);
      alert('Error processing QC approval. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENUM MAPPING: Map frontend document types to database enum values
  const mapDocumentTypeToEnum = (documentType: string): string => {
    switch (documentType) {
      case 'research_report':
        return 'RESEARCH_SUMMARY';
      case 'filing_guide':
        return 'FILING_GUIDE';
      case 'allocation_report':
        return 'RESEARCH_SUMMARY'; // ✅ Use RESEARCH_SUMMARY type but save to allocation_report column
      case 'research_design':
        return 'RESEARCH_DESIGN';
      default:
        console.warn('⚠️ Unknown document type:', documentType);
        return documentType.toUpperCase();
    }
  };

  // Toggle document release status with QC approval
  const toggleRelease = async (documentType: string) => {
    const currentStatus = releaseToggles[documentType];
    
    // If turning ON, require QC approval
    if (!currentStatus) {
      setPendingToggleType(documentType);
      setShowQCApproverModal(true);
    } else {
      // If turning OFF, confirm and process immediately
      if (confirm(`Are you sure you want to unreleased the ${documentType}?`)) {
        try {
          setLoading(true);
          
          const { error } = await supabase
            .from('rd_qc_document_controls')
            .update({
              is_released: false,
              released_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('business_year_id', wizardState.selectedYear?.id)
            .eq('document_type', documentType);

          if (error) throw error;

          setReleaseToggles(prev => ({ ...prev, [documentType]: false }));
          await loadReportsData();
        } catch (error) {
          console.error('Error toggling release status:', error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Save Jurat notes
  const saveJuratNotes = async () => {
    const yearIdToSave = wizardState.selectedYear?.id;
    if (!yearIdToSave) return;
    
    try {
      setLoading(true);
      
      // Update or create jurat control record
      const { error } = await supabase
        .from('rd_qc_document_controls')
        .upsert({
          business_year_id: yearIdToSave,
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

  // Force refresh jurat status - useful for checking signatures from client portal
  const refreshJuratStatus = async () => {
    const yearIdToCheck = wizardState.selectedYear?.id;
    if (!yearIdToCheck) return;

    try {
      console.log('🔄 [ReportsStep] Force refreshing jurat status for:', yearIdToCheck);
      
      const { data: signatures, error: sigError } = await supabase
        .from('rd_signature_records')
        .select('*')
        .eq('business_year_id', yearIdToCheck)
        .order('signed_at', { ascending: false })
        .limit(1);

      console.log('📊 [ReportsStep] Refresh result:', { signatures, sigError });

      if (!sigError && signatures && signatures.length > 0) {
        console.log('✅ [ReportsStep] Jurat signature found on refresh:', signatures[0]);
        setJuratUploaded(true);
        setJuratUploadDate(signatures[0].signed_at);
        setSignedJuratData(signatures[0]);
      } else {
        console.log('❌ [ReportsStep] No jurat signatures found on refresh');
        setJuratUploaded(false);
        setJuratUploadDate(null);
        setSignedJuratData(null);
      }
    } catch (error) {
      console.error('Error refreshing jurat status:', error);
    }
  };

  // Export signed jurat as PDF
  const exportSignedJuratAsPDF = async () => {
    if (!signedJuratData) {
      alert('No signed jurat data available for export');
      return;
    }

    try {
      console.log('📄 Starting PDF export for signed jurat:', {
        signerName: signedJuratData.signer_name,
        hasSignatureImage: !!signedJuratData.signature_image,
        signatureImageLength: signedJuratData.signature_image?.length || 0
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SIGNED JURAT DOCUMENT', pageWidth / 2, 30, { align: 'center' });
      
      // Document info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('R&D Tax Credit Documentation - Annual Attestation', pageWidth / 2, 45, { align: 'center' });
      
      // Signature details
      let yPos = 70;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SIGNATURE DETAILS:', 20, yPos);
      
      yPos += 15;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Signatory: ${signedJuratData.signer_name}`, 20, yPos);
      
      if (signedJuratData.signer_title) {
        yPos += 8;
        pdf.text(`Title: ${signedJuratData.signer_title}`, 20, yPos);
      }
      
      if (signedJuratData.signer_email) {
        yPos += 8;
        pdf.text(`Email: ${signedJuratData.signer_email}`, 20, yPos);
      }
      
      yPos += 8;
      pdf.text(`Signed: ${new Date(signedJuratData.signed_at).toLocaleString()}`, 20, yPos);
      
      yPos += 8;
      pdf.text(`IP Address: ${signedJuratData.ip_address}`, 20, yPos);
      
      // Jurat text
      yPos += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('JURAT TEXT:', 20, yPos);
      
      yPos += 15;
      pdf.setFont('helvetica', 'normal');
      const splitText = pdf.splitTextToSize(signedJuratData.jurat_text, pageWidth - 40);
      pdf.text(splitText, 20, yPos);
      
      // Add signature image if available
      if (signedJuratData.signature_image) {
        yPos += splitText.length * 5 + 20;
        
        if (yPos > pageHeight - 80) {
          pdf.addPage();
          yPos = 30;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('DIGITAL SIGNATURE:', 20, yPos);
        
        try {
          // Ensure we have a valid data URL
          let imageData = signedJuratData.signature_image;
          
          // If the image doesn't start with data:, it might be base64 without the prefix
          if (!imageData.startsWith('data:')) {
            imageData = `data:image/png;base64,${imageData}`;
          }
          
          // Determine image format from data URL
          let format = 'PNG';
          if (imageData.includes('data:image/jpeg')) {
            format = 'JPEG';
          } else if (imageData.includes('data:image/jpg')) {
            format = 'JPEG';
          }
          
          console.log('📄 Adding signature image to PDF:', {
            format,
            dataLength: imageData.length,
            startsWithData: imageData.startsWith('data:')
          });
          
          pdf.addImage(imageData, format, 20, yPos + 10, 80, 25);
          console.log('✅ Successfully added signature image to PDF');
          
        } catch (error) {
          console.error('❌ Could not add signature image to PDF:', error);
          
          // Add a text placeholder instead
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(10);
          pdf.text('(Digital signature image could not be rendered in PDF)', 20, yPos + 20);
        }
      }
      
      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, pageHeight - 20);
      pdf.text('Direct Research Advisors - R&D Tax Credit Documentation', 20, pageHeight - 10);
      
      // Save PDF
      const fileName = `Signed_Jurat_${signedJuratData.signer_name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF export completed successfully:', fileName);
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
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

  // Profiles Management Functions
  const loadProfiles = async () => {
    if (!wizardState.business?.client_id) return;

    try {
      setLoadingProfiles(true);
      setProfilesError(null);

      // Get the client's account_id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('account_id')
        .eq('id', wizardState.business.client_id)
        .single();

      if (clientError) {
        throw new Error(`Failed to get client account: ${clientError.message}`);
      }

      if (!client?.account_id) {
        throw new Error('Client has no associated account');
      }

      // Get all profiles for this account
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('account_id', client.account_id);

      if (profilesError) {
        throw new Error(`Failed to load profiles: ${profilesError.message}`);
      }

      // Check which profiles have auth users by calling admin service
      const profilesWithAuth = await Promise.all(
        (profilesData || []).map(async (profile) => {
          try {
            const { data: authCheckData, error: authError } = await supabase.functions.invoke('admin-service', {
              body: {
                pathname: '/admin-service/get-user-by-id',
                userId: profile.id
              }
            });

            return {
              ...profile,
              hasAuth: !authError && !!authCheckData?.user
            };
          } catch (error) {
            console.warn(`Error checking auth for profile ${profile.id}:`, error);
            return {
              ...profile,
              hasAuth: false
            };
          }
        })
      );

      setProfiles(profilesWithAuth);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setProfilesError(error instanceof Error ? error.message : 'Failed to load profiles');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const generateProfileMagicLink = async (profileId: string) => {
    if (!wizardState.business?.client_id) return;

    try {
      // Find the profile to get the email
      const profile = profiles.find(p => p.id === profileId);
      if (!profile?.email) {
        throw new Error('Profile email not found');
      }

      // Generate magic link for the profile that redirects to client portal with business_id, client_id, and preview_token
      // Use the profileId in URL since that's who gets authenticated by the magic link
      const previewToken = Date.now().toString(); // Simple timestamp token for preview verification
      const { data: magicLinkData, error: magicLinkError } = await supabase.functions.invoke('admin-service', {
        body: {
          pathname: '/admin-service/generate-magic-link',
          email: profile.email,
          redirectTo: `${window.location.origin}/client-portal/${profileId}?business_id=${wizardState.business.id}&client_id=${wizardState.business.client_id}&preview_token=${previewToken}`
        }
      });

      if (magicLinkError) {
        throw new Error(`Failed to generate magic link: ${magicLinkError.message}`);
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(magicLinkData.magicLink);
      
      // Show success message (you might want to add a toast here)
      console.log('Magic link copied to clipboard:', magicLinkData.magicLink);
      alert('Magic link copied to clipboard!');
      
    } catch (error) {
      console.error('Error generating profile magic link:', error);
      alert('Failed to generate magic link');
    }
  };

  // Portal Email Management Functions
  const loadPortalEmail = async () => {
    if (!wizardState.business?.id) return;

    try {
      const { data, error } = await supabase
        .from('rd_businesses')
        .select('portal_email')
        .eq('id', wizardState.business.id)
        .single();

      if (error) {
        console.error('❌ [ReportsStep] Error loading portal email:', error);
        return;
      }

      setPortalEmail(data?.portal_email || '');
      console.log('📧 [ReportsStep] Loaded portal email:', data?.portal_email);
    } catch (error) {
      console.error('❌ [ReportsStep] Error loading portal email:', error);
    }
  };

  const savePortalEmail = async () => {
    if (!wizardState.business?.id) return;

    try {
      setLoadingPortalEmail(true);
      const { error } = await supabase
        .from('rd_businesses')
        .update({ portal_email: portalEmail || null })
        .eq('id', wizardState.business.id);

      if (error) {
        console.error('❌ [ReportsStep] Error saving portal email:', error);
        return;
      }

      console.log('✅ [ReportsStep] Portal email saved successfully:', portalEmail);
      setEditingPortalEmail(false);
    } catch (error) {
      console.error('❌ [ReportsStep] Error saving portal email:', error);
    } finally {
      setLoadingPortalEmail(false);
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
      
      // Prominent console logging for debugging
      console.log('🚀🚀🚀 [ADMIN PREVIEW] Portal URL Generated:', portalUrl);
      console.log('🚀🚀🚀 [ADMIN PREVIEW] URL Components:', {
        origin: window.location.origin,
        clientId: wizardState.business.client_id,
        businessId: wizardState.business.id,
        adminPreview: true,
        fullUrl: portalUrl
      });
      
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
      {/* Modern Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Reports & Quality Control</h1>
              <p className="text-blue-100 text-lg">Manage document releases, quality control, and client portal access</p>
            </div>
            <div className="flex items-center space-x-4">
              <Settings className="w-12 h-12 text-white/80" />
            </div>
          </div>
          
          {/* CSV Export Section */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Data Export</h3>
                <p className="text-blue-100 text-sm">Export calculation data and QRE details</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { ExpenseManagementService } = await import('../../../../../services/expenseManagementService');
                    const csvData = await ExpenseManagementService.exportExpensesToCSV(wizardState.selectedYear?.id);
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rd_expenses_${wizardState.selectedYear?.year || new Date().getFullYear()}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error exporting CSV:', error);
                    alert('Failed to export CSV. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 hover:border-white/40 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="mr-2" size={20} />
                )}
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          {/* Primary QC Controls Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-1 flex items-center">
                  <Settings className="mr-2" size={20} />
                  Quality Control Dashboard
                </h3>
                <p className="text-sm text-blue-700">Manage credit values, document releases, and client portal access</p>
              </div>
              
              {/* Credit Summary Header - Matching Calculations Section Style */}
              <div className="flex flex-col items-end">
                <div className="bg-white/90 rounded-xl shadow-lg px-6 py-4 min-w-[260px] flex flex-col items-end space-y-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center text-sm font-medium text-blue-900">
                      <Building2 className="w-4 h-4 mr-1 text-blue-500" />
                      Federal Credit
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        {selectedMethod === 'asc' ? 'ASC' : 'Standard'}
                      </span>
                    </span>
                    {editingCredits ? (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={federalCredit}
                          onChange={(e) => setFederalCredit(parseFloat(e.target.value) || 0)}
                          className="w-24 pl-5 pr-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right font-bold text-blue-700"
                        />
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-blue-700">
                        ${Math.round(federalCredit).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center text-sm font-medium text-green-900">
                      <MapPin className="w-4 h-4 mr-1 text-green-500" />
                      State Credit
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        {wizardState.business?.domicile_state || 'N/A'}
                      </span>
                    </span>
                    {editingCredits ? (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={stateCredit}
                          onChange={(e) => setStateCredit(parseFloat(e.target.value) || 0)}
                          className="w-24 pl-5 pr-2 py-1 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right font-bold text-green-700"
                        />
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-green-700">
                        ${Math.round(stateCredit).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="border-t border-gray-200 w-full my-1"></div>
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center text-base font-semibold text-purple-900">
                      <DollarSign className="w-5 h-5 mr-1 text-purple-500" />
                      Total Credits
                    </span>
                    <span className="text-2xl font-extrabold text-purple-700 drop-shadow-lg">
                      ${Math.round((federalCredit || 0) + (stateCredit || 0)).toLocaleString()}
                    </span>
                  </div>
                  
                                     {/* Credit Management Controls */}
                   <div className="border-t border-gray-200 w-full mt-2 pt-2">
                     <div className="flex items-center justify-between w-full">
                       <div className="flex items-center space-x-1">
                         {/* Method Selector */}
                         <select
                           value={selectedMethod}
                           onChange={(e) => {
                             const newMethod = e.target.value as 'standard' | 'asc';
                             setSelectedMethod(newMethod);
                             
                             // Update federal credit value if we have results
                             if (results?.federalCredits) {
                               const federalCredits = results.federalCredits;
                               const newFederalCredit = newMethod === 'asc' 
                                 ? (federalCredits?.asc?.credit || 0)
                                 : (federalCredits?.standard?.credit || 0);
                               setFederalCredit(newFederalCredit);
                             }
                           }}
                           disabled={creditsLocked || editingCredits}
                           className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                         >
                           <option value="asc">ASC</option>
                           <option value="standard">Standard</option>
                         </select>
                         
                         {creditsLocked ? (
                           <div className="flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                             <Lock className="mr-1" size={10} />
                             Locked
                           </div>
                         ) : (
                           <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                             <Unlock className="mr-1" size={10} />
                             Unlocked
                           </div>
                         )}
                         {creditsCalculatedAt && (
                           <div className="text-xs text-gray-500">
                             {new Date(creditsCalculatedAt).toLocaleDateString()}
                           </div>
                         )}
                       </div>
                      
                      <div className="flex items-center space-x-1">
                        {editingCredits ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingCredits(false);
                                loadReportsData();
                              }}
                              disabled={loadingCredits}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                              <X size={10} />
                            </button>
                            <button
                              onClick={saveCreditValues}
                              disabled={loadingCredits}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {loadingCredits ? (
                                <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
                              ) : (
                                <Check size={10} />
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={loadCalculatedCreditsFromWizard}
                              disabled={loadingCredits || creditsLocked}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                              title="Load from Wizard"
                            >
                              {loadingCredits ? (
                                <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
                              ) : (
                                <Download size={10} />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingCredits(true)}
                              disabled={creditsLocked || loadingCredits}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                              title="Edit Credits"
                            >
                              <Edit size={10} />
                            </button>
                            <button
                              onClick={toggleCreditsLock}
                              disabled={loadingCredits}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                creditsLocked 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              } disabled:opacity-50`}
                              title={creditsLocked ? 'Unlock Credits' : 'Lock Credits'}
                            >
                              {creditsLocked ? <Unlock size={10} /> : <Lock size={10} />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Cards with QC Controls */}
            <div className="grid md:grid-cols-4 gap-6">
              {/* Research Report QC */}
              <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 relative">
                {/* Header: Icon + Title */}
                <div className="flex items-center mb-4">
                    <FileText className="text-blue-600 mr-3" size={24} />
                      <h4 className="font-semibold text-gray-900">Research Report</h4>
                </div>

                {/* Action Button */}
                <div className="mb-4">
                  <button
                    onClick={() => {
                      console.log('%c🚀 [REPORTS SECTION] Research Report button clicked!', 'color: #ff00ff; font-size: 18px; font-weight: bold;');
                      console.log('%c📊 [REPORTS] wizardState.selectedYear:', 'color: #00ffff; font-weight: bold;', wizardState.selectedYear);
                      console.log('%c📊 [REPORTS] wizardState.business:', 'color: #00ffff; font-weight: bold;', wizardState.business);
                      console.log('%c📊 [REPORTS] businessYearId:', 'color: #00ffff; font-weight: bold;', wizardState.selectedYear?.id);
                      console.log('%c📊 [REPORTS] businessId:', 'color: #00ffff; font-weight: bold;', wizardState.business?.id);
                      if (!wizardState.selectedYear?.id) {
                        alert('Missing business year. Please select a year first.');
                        return;
                      }
                      console.log('%c🔍 [REPORTS] Setting modal to true...', 'color: #ffff00; font-weight: bold;');
                      setIsResearchReportOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm min-w-[160px]"
                  >
                    <div className="flex items-center">
                    <Eye className="mr-2" size={16} />
                      Preview
                    </div>
                    {reportGenerationDates?.research_report && (
                      <div className="flex items-center ml-2 px-2 py-1 bg-blue-700 rounded-full">
                        <CheckCircle className="mr-1" size={12} />
                        <span className="text-xs">
                          {formatGenerationDate(reportGenerationDates.research_report)}
                        </span>
                      </div>
                    )}
                  </button>
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
                  <div className="mt-3">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50">
                      <CheckCircle className="mr-1 text-green-600" size={16} />
                      <span className="text-sm font-medium text-green-600">
                    Released: {qcControls.find(c => c.document_type === 'research_report')?.released_at 
                          ? new Date(qcControls.find(c => c.document_type === 'research_report')!.released_at!).toLocaleDateString()
                          : 'Today'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Filing Guide QC */}
              <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200">
                {/* Header: Icon + Title */}
                <div className="flex items-center mb-4">
                    <FileText className="text-purple-600 mr-3" size={24} />
                      <h4 className="font-semibold text-gray-900">Filing Guide</h4>
                </div>

                {/* Action Button */}
                <div className="mb-4">
                  <button
                    onClick={() => setIsFilingGuideOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm min-w-[160px]"
                  >
                    <div className="flex items-center">
                    <Eye className="mr-2" size={16} />
                      Preview
                    </div>
                    {/* Filing Guide date comes from business year update when saved */}
                    {businessYearData?.updated_at && (
                      <div className="flex items-center ml-2 px-2 py-1 bg-purple-700 rounded-full">
                        <CheckCircle className="mr-1" size={12} />
                        <span className="text-xs">
                          {formatGenerationDate(businessYearData.updated_at)}
                        </span>
                      </div>
                    )}
                  </button>
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

                {/* Payment Received Toggle (links to rd_business_years.payment_received) */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Payment Received</span>
                  <button
                    onClick={() => togglePaymentReceived(!(businessYearData?.payment_received ?? false))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      businessYearData?.payment_received ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                    title={businessYearData?.payment_received ? 'Mark as unpaid' : 'Mark as paid'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        businessYearData?.payment_received ? 'translate-x-6' : 'translate-x-1'
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
                  <div className="mt-3">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50">
                      <CheckCircle className="mr-1 text-green-600" size={16} />
                      <span className="text-sm font-medium text-green-600">
                    Released: {qcControls.find(c => c.document_type === 'filing_guide')?.released_at 
                          ? new Date(qcControls.find(c => c.document_type === 'filing_guide')!.released_at!).toLocaleDateString()
                          : 'Today'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Report */}
              <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200">
                {/* Header: Icon + Title */}
                <div className="flex items-center mb-4">
                  <DollarSign className="text-emerald-600 mr-3" size={24} />
                  <h4 className="font-semibold text-gray-900">Billing Report</h4>
                </div>

                {/* Year multi-select */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Include Years</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableYears.map(y => (
                      <label key={y.id} className="inline-flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedBillingYearIds.includes(y.id)}
                          onChange={e => {
                            setSelectedBillingYearIds(prev => {
                              if (e.target.checked) return Array.from(new Set([...prev, y.id]));
                              return prev.filter(id => id !== y.id);
                            });
                          }}
                        />
                        <span className="text-sm text-gray-700">{y.year}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mb-2">
                  <label className="flex items-center mb-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={includeStateCreditsForBilling}
                      onChange={(e) => setIncludeStateCreditsForBilling(e.target.checked)}
                    />
                    Include State Credits in Billing Report
                  </label>
                  <button
                    onClick={() => setShowBillingReport(true)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm min-w-[160px]"
                  >
                    <div className="flex items-center">
                      <Eye className="mr-2" size={16} />
                      Preview
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500">Preview and export a beautifully designed, single-page billing report based on selected years.</p>
              </div>

              {/* Allocation Report QC */}
              <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 relative">
                {/* Header: Icon + Title */}
                <div className="flex items-center mb-4">
                    <Building2 className="text-green-600 mr-3" size={24} />
                      <h4 className="font-semibold text-gray-900">Allocation Report</h4>
                </div>

                {/* Action Buttons */}
                <div className="mb-4 space-y-2">
                  <button
                    onClick={() => setShowAllocationReport(true)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm min-w-[160px]"
                  >
                    <div className="flex items-center">
                    <Eye className="mr-2" size={16} />
                      Preview
                    </div>
                    {reportGenerationDates?.allocation_report && (
                      <div className="flex items-center ml-2 px-2 py-1 bg-green-700 rounded-full">
                        <CheckCircle className="mr-1" size={12} />
                        <span className="text-xs">
                          {formatGenerationDate(reportGenerationDates.allocation_report)}
                        </span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={saveAllocationReport}
                    className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <div className="flex items-center">
                      <Save className="mr-2" size={16} />
                      Save to Database
                    </div>
                  </button>
                </div>

                {/* Release Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Release to Client</span>
                  <button
                    onClick={() => toggleRelease('allocation_report')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      releaseToggles['allocation_report'] ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        releaseToggles['allocation_report'] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* QC Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">QC Notes</label>
                    {editingNotes['allocation_report'] ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveQCNotes('allocation_report')}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingNotes(prev => ({ ...prev, allocation_report: false }))}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingNotes(prev => ({ ...prev, allocation_report: true }))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  
                  {editingNotes['allocation_report'] ? (
                    <textarea
                      value={qcNotes['allocation_report'] || ''}
                      onChange={(e) => setQcNotes(prev => ({ ...prev, allocation_report: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      rows={3}
                      placeholder="Add QC review notes..."
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 min-h-[2.5rem]">
                      {qcNotes['allocation_report'] || 'No notes added'}
                    </div>
                  )}
                </div>

                {/* Release Date */}
                {releaseToggles['allocation_report'] && (
                  <div className="mt-3">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50">
                      <CheckCircle className="mr-1 text-green-600" size={16} />
                      <span className="text-sm font-medium text-green-600">
                    Released: {qcControls.find(c => c.document_type === 'allocation_report')?.released_at 
                          ? new Date(qcControls.find(c => c.document_type === 'allocation_report')!.released_at!).toLocaleDateString()
                          : 'Today'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Client Jurat QC */}
              <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User className="text-orange-600 mr-3" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-900">Client Jurat</h4>
                      <p className="text-sm text-gray-600">Client attestation and signature</p>
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

                {/* Action Buttons */}
                <div className="mb-4 space-y-2">
                  <button
                    onClick={refreshJuratStatus}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Clock className="mr-2" size={14} />
                    Check for New Signatures
                  </button>

                  {juratUploaded ? (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            // Load the latest signature for this business year
                            const { data: signatures, error } = await supabase
                              .from('rd_signature_records')
                              .select('*')
                              .eq('business_year_id', wizardState.selectedYear?.id)
                              .order('signed_at', { ascending: false })
                              .limit(1);
                            
                            if (error) {
                              console.error('Error loading signature:', error);
                              alert('Failed to load signature data');
                              return;
                            }
                            
                            if (signatures && signatures.length > 0) {
                              setSignedJuratData(signatures[0]);
                              setShowSignedJuratModal(true);
                            } else {
                              alert('No signature found for this business year');
                            }
                          } catch (error) {
                            console.error('Error loading signature:', error);
                            alert('Failed to load signature data');
                          }
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <Eye className="mr-2" size={16} />
                        View Signed Document
                      </button>
                      <button
                        onClick={() => exportSignedJuratAsPDF()}
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <Download className="mr-2" size={16} />
                        Export PDF
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowJuratPreview(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                    >
                      <PenTool className="mr-2" size={16} />
                      Create Signature
                    </button>
                  )}
                </div>

                {juratUploaded && juratUploadDate && (
                  <div className="text-sm text-gray-600 mb-3">
                    Signed: {new Date(juratUploadDate).toLocaleDateString()}
                  </div>
                )}

                {/* QC Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">QC Notes</label>
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
                      placeholder="Add QC review notes..."
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 min-h-[2.5rem]">
                      {juratNotes || 'No notes added'}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Portal Management */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Share2 className="mr-2" size={20} />
              Client Portal Management
            </h3>

            {/* Portal Email Override Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Mail className="text-blue-600 mr-2" size={16} />
                  <span className="text-sm font-medium text-gray-700">Portal Email Override</span>
                </div>
                <span className="text-xs text-gray-500">
                  Optional custom email for client access
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {editingPortalEmail ? (
                    <>
                      <input
                        type="email"
                        value={portalEmail}
                        onChange={(e) => setPortalEmail(e.target.value)}
                        placeholder="Enter custom email for client portal access"
                        className="flex-1 p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          setEditingPortalEmail(false);
                          loadPortalEmail(); // Reset to original value
                        }}
                        disabled={loadingPortalEmail}
                        className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePortalEmail}
                        disabled={loadingPortalEmail}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {loadingPortalEmail ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={portalEmail || 'Not set - will use client email'}
                        readOnly
                        className="flex-1 p-2 text-sm border border-gray-300 rounded bg-gray-50"
                      />
                      <button
                        onClick={() => setEditingPortalEmail(true)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  If set, magic links will be sent to this email instead of the client's primary email address.
                </p>
              </div>
            </div>

            {/* Account Profiles Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <User className="text-purple-600 mr-2" size={16} />
                  <span className="text-sm font-medium text-gray-700">Account Profiles</span>
                </div>
                <span className="text-xs text-gray-500">
                  Users who can access the client portal
                </span>
              </div>
              
              {loadingProfiles ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading profiles...</span>
                </div>
              ) : profilesError ? (
                <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                  {profilesError}
                </div>
              ) : profiles.length === 0 ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">No Profiles Found</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        No user profiles are associated with this client account yet. Create profiles to enable client portal access.
                      </p>
                      <button
                        onClick={() => {
                          // Navigate to Client Management section
                          window.location.href = '/admin/clients';
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        <User className="w-3 h-3 mr-1" />
                        Manage Client Profiles
                      </button>
                    </div>
                  </div>
                </div>
              ) : profiles.filter(p => p.hasAuth).length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-900 mb-1">No Login Accounts Available</h4>
                      <p className="text-sm text-amber-700 mb-3">
                        While profiles exist for this client, none have login accounts enabled. Create login accounts to enable magic link generation.
                      </p>
                      <button
                        onClick={() => {
                          // Navigate to Client Management section
                          window.location.href = '/admin/clients';
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 transition-colors"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Enable Login Accounts
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {profile.full_name || 'Unknown Name'}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {profile.email}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {profile.role || 'User'}
                              </span>
                              {profile.hasAuth ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Has Login
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  No Login
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {profile.hasAuth && (
                        <button
                          onClick={() => generateProfileMagicLink(profile.id)}
                          className="ml-3 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                          title="Copy magic link for this user to access client portal"
                        >
                          Copy Magic Link
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Magic links allow users to access the client portal without entering credentials. Only profiles with login accounts can receive magic links.
                </p>
              </div>
            </div>

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





      {/* Jurat Preview Modal */}
      {showJuratPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Jurat Statement Preview</h2>
                <button
                  onClick={() => setShowJuratPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Statement Text</h3>
                  <button
                    onClick={() => setEditingJurat(!editingJurat)}
                    className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    {editingJurat ? <Check className="w-4 h-4 mr-1" /> : <Edit className="w-4 h-4 mr-1" />}
                    {editingJurat ? 'Save' : 'Edit'}
                  </button>
                </div>

                {editingJurat ? (
                  <textarea
                    value={juratText}
                    onChange={(e) => setJuratText(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter jurat text..."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {juratText}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowJuratPreview(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                {!juratUploaded && (
                  <button
                    onClick={() => {
                      setShowJuratPreview(false);
                      setShowSignatureModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Proceed to Sign
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureCapture
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSigned={(signatureData) => {
          setSignatureData(signatureData);
          setJuratUploaded(true);
          setJuratUploadDate(signatureData.signedAt);
          console.log('Jurat signed:', signatureData);
        }}
        juratText={juratText}
        businessYearId={wizardState.selectedYear?.id}
        clientName={wizardState.business?.name}
      />

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
          clientName={wizardState?.business?.client_full_name}
        />
      )}

      {isResearchReportOpen && (
        <ResearchReportModal
          isOpen={isResearchReportOpen}
          onClose={() => {
            console.log('%c🔒 [REPORTS] Research Report Modal closing...', 'color: #ff0000; font-size: 16px; font-weight: bold;');
            setIsResearchReportOpen(false);
            // Refresh report generation dates when modal closes
            if (onReportGenerated) {
              onReportGenerated();
            }
          }}
          businessYearId={(() => {
            const yearId = wizardState.selectedYear?.id;
            console.log('%c📊 [REPORTS MODAL] Passing businessYearId:', 'color: #00ff00; font-weight: bold;', yearId);
            return yearId;
          })()}
          businessId={(() => {
            const businessId = wizardState.business?.id;
            console.log('%c📊 [REPORTS MODAL] Passing businessId:', 'color: #00ff00; font-weight: bold;', businessId);
            return businessId;
          })()}
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

      {showBillingReport && (
        <BillingReportModal
          isOpen={showBillingReport}
          onClose={() => setShowBillingReport(false)}
          businessId={wizardState.business?.id}
          selectedYearIds={selectedBillingYearIds}
          availableYears={availableYears}
          includeStateCredits={includeStateCreditsForBilling}
        />
      )}

      {/* QC Approver Modal */}
      {showQCApproverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">QC Approver Authentication</h3>
              <p className="text-sm text-gray-600 mt-1">
                Approving release of: <strong>{pendingToggleType?.replace('_', ' ')}</strong>
              </p>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approver Name *
                </label>
                <input
                  type="text"
                  value={qcApproverForm.name}
                  onChange={(e) => setQcApproverForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credentials/Employee ID *
                </label>
                <input
                  type="text"
                  value={qcApproverForm.credentials}
                  onChange={(e) => setQcApproverForm(prev => ({ ...prev, credentials: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your employee ID or credentials"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Password
                </label>
                <input
                  type="password"
                  value={qcApproverForm.password}
                  onChange={(e) => setQcApproverForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter verification password"
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This action will generate HTML report content and log your approval with timestamp and IP address for audit purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowQCApproverModal(false);
                  setPendingToggleType(null);
                  setQcApproverForm({ name: '', credentials: '', password: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleQCApproval}
                disabled={loading || !qcApproverForm.name || !qcApproverForm.credentials}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Approve & Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signed Jurat Document Modal */}
      {showSignedJuratModal && signedJuratData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Signed Jurat Document</h3>
              <button
                onClick={() => setShowSignedJuratModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center text-green-800 mb-2">
                  <CheckCircle className="mr-2" size={20} />
                  <span className="font-medium">Document Successfully Signed</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div><strong>Signed by:</strong> {signedJuratData.signer_name}</div>
                  {signedJuratData.signer_email && (
                    <div><strong>Email:</strong> {signedJuratData.signer_email}</div>
                  )}
                  {signedJuratData.signer_title && (
                    <div><strong>Title:</strong> {signedJuratData.signer_title}</div>
                  )}
                  <div><strong>Date:</strong> {new Date(signedJuratData.signed_at).toLocaleString()}</div>
                  <div><strong>IP Address:</strong> {signedJuratData.ip_address}</div>
                </div>
              </div>

              {/* Signature Image */}
              {signedJuratData.signature_image && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Digital Signature</h4>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={signedJuratData.signature_image}
                      alt="Digital Signature"
                      className="max-w-full h-auto"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                </div>
              )}

              {/* Document Content */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Jurat Declaration</h4>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-sm">
                  <p className="mb-4">
                    I declare under penalty of perjury that I have examined this claim, including any accompanying schedules and statements, and to the best of my knowledge and belief, it is true, correct, and complete.
                  </p>
                  <p className="mb-4">
                    I further declare that the research activities and qualified research expenses identified in this claim meet all requirements under Internal Revenue Code Section 41 and applicable regulations.
                  </p>
                  <p className="text-gray-600 italic">
                    This declaration was signed electronically using a secure digital signature process on {new Date(signedJuratData.signed_at).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => exportSignedJuratAsPDF()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="mr-2" size={16} />
                Export as PDF
              </button>
              <button
                onClick={() => setShowSignedJuratModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsStep; 