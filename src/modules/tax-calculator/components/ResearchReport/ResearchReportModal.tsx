import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Download, Printer, Eye, EyeOff, 
  Activity, Target, Beaker, Calendar, Users, 
  TrendingUp, Award, BookOpen, ChevronRight, ChevronLeft,
  CheckCircle, AlertCircle, Info, BarChart3,
  Clock, Building2, FileCheck, Microscope
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AIService } from '../../../../services/aiService';
import './ResearchReportModal.css';
import {
  generateTableOfContents,
  generateExecutiveSummary,
  generateBusinessProfile,
  generateActivitySection,
  generateComplianceSummary,
  generateDocumentationChecklist,
  formatAIContent,
  ReportData
} from './reportGenerator';
// rdReportService removed - using static report generation

interface ResearchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessYearId: string;
  businessId?: string;
}

interface BusinessProfile {
  name: string;
  entity_type: string;
  domicile_state: string;
  start_year: number;
  contact_info: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
  };
}

interface SelectedActivity {
  id: string;
  business_year_id: string;
  activity_id: string;
  practice_percent: number;
  selected_roles: any[];
  config: any;
  activity: {
    id: string;
    title: string;
  };
}

interface SelectedStep {
  id: string;
  business_year_id: string;
  research_activity_id: string;
  step_id: string;
  time_percentage: number;
  applied_percentage: number;
  step: {
    id: string;
    name: string;
  };
}

interface SelectedSubcomponent {
  id: string;
  business_year_id: string;
  research_activity_id: string;
  step_id: string;
  subcomponent_id: string;
  frequency_percentage: number;
  year_percentage: number;
  start_month: number;
  start_year: number;
  selected_roles: any[];
  non_rd_percentage: number;
  approval_data?: any;
  hint?: string;
  general_description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmental_process?: string;
  primary_goal?: string;
  expected_outcome_type?: string;
  cpt_codes?: string;
  cdt_codes?: string;
  alternative_paths?: string;
  applied_percentage?: number;
  time_percentage?: number;
  user_notes?: string;
  step_name?: string;
  practice_percent?: number;
  rd_research_subcomponents?: {
    id: string;
    name: string;
    description?: string;
    hint?: string;
    general_description?: string;
    goal?: string;
    hypothesis?: string;
    alternatives?: string;
    uncertainties?: string;
    developmental_process?: string;
    primary_goal?: string;
    expected_outcome_type?: string;
    cpt_codes?: string;
    cdt_codes?: string;
    alternative_paths?: string;
  };
}

const ResearchReportModal: React.FC<ResearchReportModalProps> = ({
  isOpen,
  onClose,
  businessYearId,
  businessId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [businessYearData, setBusinessYearData] = useState<any>(null);
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<SelectedStep[]>([]);
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<SelectedSubcomponent[]>([]);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading research data...');
  const [cachedReport, setCachedReport] = useState<any>(null);
  const [businessRoles, setBusinessRoles] = useState<Array<{id: string, name: string}>>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubcomponentId, setEditingSubcomponentId] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');

  useEffect(() => {
    if (isOpen && businessYearId) {
      loadData();
    }
  }, [isOpen, businessYearId]);

  // Add window functions for iframe communication
  useEffect(() => {
    // Make regenerateAISection available to iframe
    (window as any).regenerateAISection = regenerateAISection;
    (window as any).editAIPrompt = editAIPrompt;
    
    // Cleanup on unmount
    return () => {
      delete (window as any).regenerateAISection;
      delete (window as any).editAIPrompt;
    };
  }, []);

  // Function to clean up existing markdown formatting in cached reports
  const cleanupExistingFormatting = (htmlContent: string): string => {
    return htmlContent
      // Fix **bold** formatting that wasn't properly converted
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Fix any remaining markdown patterns
      .replace(/^\*\*(.+?)\*\*:$/gm, '<h4 class="ai-step-title">$1:</h4>')
      // Fix bullet points that might not be properly formatted
      .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
      // Wrap orphaned <li> elements
      .replace(/(<li>.*?<\/li>)(?:\s*<li>.*?<\/li>)*/g, '<ul>$&</ul>');
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading data for businessYearId:', businessYearId);

      // Load business profile with category FIRST (before checking cache)
      setLoadingMessage('Loading business profile...');
      const { data: yearData, error: yearError } = await supabase
        .from('rd_business_years')
        .select(`
          *,
          business:business_id (
            name,
            entity_type,
            domicile_state,
            start_year,
            contact_info,
            category:category_id (
              id,
              name
            )
          )
        `)
        .eq('id', businessYearId)
        .single();

      if (yearError) {
        console.error('❌ Business year error:', yearError);
        setError('Failed to load business profile');
        return;
      }

      setBusinessProfile(yearData?.business);
      setBusinessYearData(yearData);
      console.log('✅ Business profile loaded:', yearData?.business?.name);
      console.log('✅ Business year data loaded:', yearData?.year);
      console.log('🏷️ Business category loaded:', {
        categoryId: yearData?.business?.category?.id,
        categoryName: yearData?.business?.category?.name,
        businessName: yearData?.business?.name
      });

      // NOW check for cached report (after we know the category)
      const categoryName = yearData?.business?.category?.name?.toLowerCase();
      const isSoftwareReport = categoryName === 'software';
      
      console.log('🔍 Category analysis:', {
        categoryName,
        isSoftwareReport,
        expectedReportType: isSoftwareReport ? 'Software R&D Documentation' : 'Clinical Practice Guideline'
      });

      setLoadingMessage('Checking for existing report...');
      const { data: existingReport } = await supabase
        .from('rd_reports')
        .select('*')
        .eq('business_year_id', businessYearId)
        .eq('type', 'RESEARCH_SUMMARY')
        .single();
      
      // Only use cached report if it matches the current category expectations
      if (existingReport && existingReport.generated_html) {
        const reportHtml = existingReport.generated_html;
        const containsSoftwareTitle = reportHtml.includes('Software Development R&D Documentation');
        const containsHealthcareTitle = reportHtml.includes('Clinical Practice Guideline Report');
        
        const cacheMatchesCategory = isSoftwareReport ? containsSoftwareTitle : containsHealthcareTitle;
        
        console.log('🔍 Cache analysis:', {
          reportExists: true,
          containsSoftwareTitle,
          containsHealthcareTitle,
          isSoftwareReport,
          cacheMatchesCategory
        });
        
        if (cacheMatchesCategory) {
          console.log('✅ Found valid cached report for current category, loading preview');
          setCachedReport(existingReport);
          setGeneratedReport(cleanupExistingFormatting(existingReport.generated_html));
          setShowPreview(true);
          setLoadingMessage('Report loaded from cache');
        } else {
          console.log('⚠️ Cached report exists but doesn\'t match current category');
          console.log('📋 Using existing report as user already completed it - avoiding forced regeneration');
          // Load the existing report anyway since user already completed it
          setCachedReport(existingReport);
          setGeneratedReport(cleanupExistingFormatting(existingReport.generated_html));
          setShowPreview(true);
          setLoadingMessage('Report loaded from cache (category mismatch ignored)');
        }
      } else {
        console.log('📝 No cached report found, will generate new');
      }

      // Load selected activities with names
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('rd_selected_activities')
        .select(`
          *,
          activity:activity_id (
            id,
            title
          )
        `)
        .eq('business_year_id', businessYearId);

      if (activitiesError) {
        console.error('❌ Selected activities error:', activitiesError);
        setError('Failed to load selected activities');
        return;
      }

      setSelectedActivities(activitiesData || []);
      console.log('✅ Selected activities loaded:', activitiesData?.length || 0);

      // Load selected steps with names
      const { data: stepsData, error: stepsError } = await supabase
        .from('rd_selected_steps')
        .select(`
          *,
          step:step_id (
            id,
            name
          )
        `)
        .eq('business_year_id', businessYearId);

      if (stepsError) {
        console.error('❌ Selected steps error:', stepsError);
        setError('Failed to load selected steps');
        return;
      }

      setSelectedSteps(stepsData || []);
      console.log('✅ Selected steps loaded:', stepsData?.length || 0);
      console.log('✅ Selected steps data:', stepsData?.map(s => ({ 
        name: s.step?.name, 
        time_percentage: s.time_percentage, 
        applied_percentage: s.applied_percentage 
      })));

      // Load selected subcomponents with names from rd_research_subcomponents
      const { data: subcomponentsData, error: subcomponentsError } = await supabase
        .from('rd_selected_subcomponents')
        .select(`
          *,
          rd_research_subcomponents!inner (
            id,
            name,
            description,
            hint,
            general_description,
            goal,
            hypothesis,
            alternatives,
            uncertainties,
            developmental_process,
            primary_goal,
            expected_outcome_type,
            cpt_codes,
            cdt_codes,
            alternative_paths
          )
        `)
        .eq('business_year_id', businessYearId);

      if (subcomponentsError) {
        console.error('❌ Selected subcomponents error:', subcomponentsError);
        setError('Failed to load selected subcomponents');
        return;
      }

      setSelectedSubcomponents(subcomponentsData || []);
      console.log('✅ Selected subcomponents loaded:', subcomponentsData?.length || 0);

      // Load business roles - need to get business_id first
      setLoadingMessage('Loading business roles...');
      
      // Get business_id from the business year
      const businessId = yearData?.business?.id || yearData?.business_id;
      
      if (businessId) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('rd_roles')
          .select('id, name')
          .eq('business_id', businessId)
          .order('name');

        if (rolesError) {
          console.error('❌ Business roles error:', rolesError);
          // Continue without roles
        } else {
          setBusinessRoles(rolesData || []);
          console.log('✅ Business roles loaded:', rolesData?.length || 0);
        }
      } else {
        console.warn('⚠️ No business ID found, using default roles');
        setBusinessRoles([
          { id: '1', name: 'Medical Staff' },
          { id: '2', name: 'Administrative Staff' },
          { id: '3', name: 'Research Coordinators' }
        ]);
      }

    } catch (err) {
      console.error('❌ Data loading error:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate activity sections with proper async handling
  const generateActivitySections = async (activitiesMap, businessRoles, reportType, businessProfile) => {
    try {
      console.log('🔄 Generating activity sections...');
      const activitySections = await Promise.all(
        Array.from(activitiesMap.entries()).map(async ([activityId, data], index) => {
          try {
            return await generateActivitySection(activityId, data, index, businessRoles, reportType, businessProfile);
          } catch (error) {
            console.error(`❌ Error generating activity section for ${activityId}:`, error);
            // Return a fallback section if generation fails
            return `
              <section class="activity-section">
                <h2>Activity ${index + 1}: ${data.activity?.activity?.title || 'Unknown Activity'}</h2>
                <p>Error generating detailed section for this activity.</p>
              </section>
            `;
          }
        })
      );
      
      console.log('✅ Generated', activitySections.length, 'activity sections');
      return activitySections.join('\n');
    } catch (error) {
      console.error('❌ Error generating activity sections:', error);
      return '<section><h2>Error generating activity sections</h2></section>';
    }
  };

  const generateReport = async () => {
    if (!businessProfile || selectedActivities.length === 0) {
      setError('No data available to generate report');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Generating comprehensive report with AI insights...');

    // Get the current year for the report
    const currentYear = new Date().getFullYear();

    // Group data by activity
    const activitiesMap = new Map<string, {
      activity: SelectedActivity;
      steps: SelectedStep[];
      subcomponents: SelectedSubcomponent[];
    }>();

    // Initialize activities map
    selectedActivities.forEach(activity => {
      activitiesMap.set(activity.activity_id, {
        activity,
        steps: [],
        subcomponents: []
      });
    });

    // Add steps to activities
    selectedSteps.forEach(step => {
      const activityData = activitiesMap.get(step.research_activity_id);
      if (activityData) {
        activityData.steps.push(step);
      }
    });

    // Add subcomponents to activities
    selectedSubcomponents.forEach(subcomponent => {
      const activityData = activitiesMap.get(subcomponent.research_activity_id);
      if (activityData) {
        activityData.subcomponents.push(subcomponent);
      }
    });

    // Generate comprehensive report using helper functions
    const reportData: ReportData = {
      businessProfile,
      selectedActivities,
      selectedSteps,
      selectedSubcomponents
    };

    // Determine report type based on business category
    const categoryName = businessProfile?.category?.name?.toLowerCase();
    const isSoftwareReport = categoryName === 'software';
    
    const reportTitle = isSoftwareReport 
      ? 'Software Development R&D Documentation'
      : 'Clinical Practice Guideline Report';
    
    const reportSubtitle = isSoftwareReport
      ? 'Research & Development Tax Credit Substantiation'
      : 'Research & Development Documentation';

    let report = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    ${getReportStyles()}
  </style>
</head>
<body>
  <div class="report-layout">
    ${generateTableOfContents(activitiesMap)}
    
    <div class="report-main-content">
      <div class="report-header">
        <div class="header-content">
          <h1 class="report-main-title">${reportTitle}</h1>
          <h2 class="report-subtitle">${reportSubtitle}</h2>
          <div class="report-date">Generated: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      ${generateExecutiveSummary(reportData)}
      ${generateBusinessProfile(businessProfile)}
      
      <section id="research-overview" class="report-section">
        <div class="section-header">
          <div class="section-icon">🔬</div>
          <div>
            <h2 class="section-title">Research Overview</h2>
            <p class="section-subtitle">Summary of Research Activities & Components</p>
          </div>
        </div>

        <div class="charts-container">
          <div class="chart-card">
            <h3 class="chart-title">Research Distribution</h3>
            <div class="distribution-chart">
              ${selectedActivities.map(activity => `
                <div class="distribution-bar">
                  <div class="bar-label">${activity.activity?.title || 'Activity'}</div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${activity.practice_percent}%">
                      ${activity.practice_percent}%
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="chart-card">
            <h3 class="chart-title">Component Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">${selectedActivities.length}</div>
                <div class="stat-label">Activities</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${selectedSteps.length}</div>
                <div class="stat-label">Steps</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${selectedSubcomponents.length}</div>
                <div class="stat-label">Subcomponents</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      ${await generateActivitySections(activitiesMap, businessRoles, isSoftwareReport ? 'software' : 'healthcare', businessProfile)}

      ${generateComplianceSummary()}
      ${generateDocumentationChecklist()}

      <div class="report-footer">
        <p>This report is generated for R&D Tax Credit compliance purposes.</p>
        <p>© ${new Date().getFullYear()} ${businessProfile.name}. All rights reserved.</p>
      </div>
    </div>
  </div>
  
  <!-- Print Footer -->
  <div class="print-footer">
    <div class="footer-content">
      <span class="footer-business">${businessProfile.name}</span>
      <span class="footer-year">${currentYear}</span>
      <span class="footer-confidential">CONFIDENTIAL - DO NOT REPRODUCE WITHOUT PERMISSION</span>
    </div>
  </div>

  <script>
    // AI Section Regeneration Functions
    function regenerateAISection(subcomponentId) {
      if (window.parent && window.parent.regenerateAISection) {
        window.parent.regenerateAISection(subcomponentId);
      } else {
        alert('Regeneration functionality requires parent window context');
      }
    }

    function editAIPrompt(subcomponentId) {
      if (window.parent && window.parent.editAIPrompt) {
        window.parent.editAIPrompt(subcomponentId);
      } else {
        alert('Edit functionality requires parent window context');
      }
    }

    // Scroll spy for navigation
    function updateActiveNavItem() {
      const sections = document.querySelectorAll('[id]');
      const navItems = document.querySelectorAll('.toc-item');
      
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 100) {
          current = section.getAttribute('id');
        }
      });

      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + current) {
          item.classList.add('active');
        }
      });
    }

    // Enhanced scroll function
    function scrollToSection(sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }

    // Add scroll listener for spy functionality
    window.addEventListener('scroll', updateActiveNavItem);
    window.addEventListener('load', updateActiveNavItem);
  </script>
</body>
</html>
    `;

    try {
      console.log('📊 Final report length:', report.length, 'characters');
      console.log('📄 Report preview (first 500 chars):', report.substring(0, 500));
      console.log('🔍 Report contains main content:', report.includes('report-main-content'));
      
      setGeneratedReport(report);
      setShowPreview(true);

      // Save the report to the database
      setLoadingMessage('Saving report to database...');
      
      // Check if report already exists
      const { data: existingReport } = await supabase
        .from('rd_reports')
        .select('id')
        .eq('business_year_id', businessYearId)
        .eq('type', 'RESEARCH_SUMMARY')
        .single();
      
      let savedReport;
      if (existingReport) {
        // Update existing report
        const { data, error } = await supabase
          .from('rd_reports')
          .update({
            generated_html: report,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReport.id)
          .select()
          .single();
        
        if (error) throw error;
        savedReport = data;
      } else {
        // Create new report
        const { data, error } = await supabase
          .from('rd_reports')
          .insert({
            business_year_id: businessYearId,
            type: 'RESEARCH_SUMMARY',
            generated_text: '',
            generated_html: report,
            ai_version: '1.0',
            locked: false
          })
          .select()
          .single();
        
        if (error) throw error;
        savedReport = data;
      }
      
      setCachedReport(savedReport);
      console.log('✅ Report saved to database with ID:', savedReport.id);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateAISection = async (subcomponentId: string) => {
    try {
      setLoadingMessage('Regenerating AI content...');
      setIsLoading(true);

      // Find the subcomponent
      const subcomponent = selectedSubcomponents.find(sub => sub.id === subcomponentId);
      if (!subcomponent) return;

      const subData = subcomponent.rd_research_subcomponents || subcomponent;
      
      // Detect business type for appropriate content generation
      const categoryName = businessProfile?.category?.name?.toLowerCase();
      const isSoftwareReport = categoryName === 'software';

      console.log('🤖 Calling AI for content regeneration:', {
        componentName: subData.name,
        category: categoryName,
        isSoftwareReport
      });

      // Generate context-appropriate prompt for AI
      const componentName = subData.name || subData.general_description || 'Subcomponent';
      const description = subData.general_description || subData.description || '';
      
      const prompt = isSoftwareReport ? 
        `Generate comprehensive IRS R&D tax credit documentation for "${componentName}" in a software development environment.

Component Description: ${description}

Development Team Roles: ${businessRoles.map(role => role.name).join(', ')}

Please provide:
1. Technical uncertainty documentation and challenges addressed
2. Process of experimentation details (iterations, testing, alternatives)
3. Qualified purpose demonstration (functionality, performance, reliability improvements)
4. Technological nature evidence (computer science/engineering principles)
5. Specific role assignments with time allocation estimates
6. Documentation requirements for IRS audit defense

Format the response with proper HTML headings (h4, h5) and lists (ul, li) for integration into a research report.` :
        `Generate professional clinical practice guidelines for implementing "${componentName}" in a healthcare setting.

Subcomponent Description: ${description}

Available Staff Roles: ${businessRoles.map(role => role.name).join(', ')}

Please provide:
1. Step-by-step implementation guidelines with clear headings
2. For each step, specify which staff roles should be involved
3. Use professional medical/clinical language
4. Include bullet points for role assignments under each step
5. Quality assurance and documentation requirements

Format the response with proper HTML headings (h4, h5) and lists (ul, li) for integration into a research report.`;

      // Call AI service
      const aiResponse = await AIService.getInstance().generateResearchContent(prompt, {
        businessCategory: categoryName || 'healthcare',
        componentName,
        availableRoles: businessRoles
      });

      console.log('✅ AI response received, updating report');

      // Update the HTML with AI-generated content
      const updatedHTML = generatedReport.replace(
        new RegExp(`<div class="best-practices-content">.*?</div>`, 's'),
        `<div class="best-practices-content">${formatAIContent(aiResponse)}</div>`
      );

      setGeneratedReport(updatedHTML);

      // Save updated report
      const { data: existingReport } = await supabase
        .from('rd_reports')
        .select('id')
        .eq('business_year_id', businessYearId)
        .eq('type', 'RESEARCH_SUMMARY')
        .single();
      
      if (existingReport) {
        await supabase
          .from('rd_reports')
          .update({
            generated_html: updatedHTML,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReport.id);
      }
      
    } catch (error) {
      console.error('Failed to regenerate AI section:', error);
      setError('Failed to regenerate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const editAIPrompt = (subcomponentId: string) => {
    const subcomponent = selectedSubcomponents.find(sub => sub.id === subcomponentId);
    if (!subcomponent) return;

    // Detect business type for appropriate prompt generation
    const categoryName = businessProfile?.category?.name?.toLowerCase();
    const isSoftwareReport = categoryName === 'software';

    const subData = subcomponent.rd_research_subcomponents || subcomponent;
    setEditingSubcomponentId(subcomponentId);
    
    const prompt = isSoftwareReport ? 
      `Generate comprehensive IRS R&D tax credit documentation for "${subData.name || 'this development component'}" in a software development environment.

Component Description: ${subData.general_description || subData.description || ''}

Development Team Roles: ${businessRoles.map(role => role.name).join(', ')}

Please provide:
1. Technical uncertainty documentation and challenges addressed
2. Process of experimentation details (iterations, testing, alternatives)
3. Qualified purpose demonstration (functionality, performance, reliability improvements)
4. Technological nature evidence (computer science/engineering principles)
5. Specific role assignments with time allocation estimates
6. Documentation requirements for IRS audit defense` :
      `Generate professional clinical practice guidelines for implementing "${subData.name || 'this subcomponent'}" in a healthcare setting.

Subcomponent Description: ${subData.general_description || subData.description || ''}

Available Staff Roles: ${businessRoles.map(role => role.name).join(', ')}

Please provide:
1. Step-by-step implementation guidelines with clear headings
2. For each step, specify which staff roles should be involved
3. Use professional medical/clinical language
4. Format with proper markdown headings
5. Include bullet points for role assignments under each step`;

    setEditPrompt(prompt);
    setShowEditModal(true);
  };

  const handleCustomPromptGeneration = async () => {
    try {
      setLoadingMessage('Generating content with custom prompt...');
      setIsLoading(true);
      setShowEditModal(false);

      // Get category info for context
      const categoryName = businessProfile?.category?.name?.toLowerCase();
      const isSoftwareReport = categoryName === 'software';

      console.log('🤖 Calling AI with custom prompt:', {
        promptLength: editPrompt.length,
        category: categoryName,
        isSoftwareReport
      });

      // Call AI service with the custom prompt
      const aiResponse = await AIService.getInstance().generateResearchContent(editPrompt, {
        businessCategory: categoryName || 'healthcare',
        componentName: editingSubcomponentId || 'Custom Content',
        availableRoles: businessRoles
      });

      console.log('✅ AI response received for custom prompt, updating report');

      // Update the HTML with AI-generated content
      const updatedHTML = generatedReport.replace(
        new RegExp(`<div class="best-practices-content">.*?</div>`, 's'),
        `<div class="best-practices-content">${formatAIContent(aiResponse)}</div>`
      );

      setGeneratedReport(updatedHTML);

      // Save updated report
      const { data: existingReport } = await supabase
        .from('rd_reports')
        .select('id')
        .eq('business_year_id', businessYearId)
        .eq('type', 'RESEARCH_SUMMARY')
        .single();
      
      if (existingReport) {
        await supabase
          .from('rd_reports')
          .update({
            generated_html: updatedHTML,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReport.id);
      }
      
    } catch (error) {
      console.error('Failed to generate custom content:', error);
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Research Report - ${businessProfile?.name || 'Unknown'}</title>
            <style>
              ${getReportStyles()}
              @media print {
                body { margin: 0; }
                .research-report { max-width: none; }
              }
            </style>
          </head>
          <body>
            ${generatedReport}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Research Report - ${businessProfile?.name || 'Unknown'}</title>
          <style>${getReportStyles()}</style>
        </head>
        <body>
          ${generatedReport}
        </body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Research_Report_${businessProfile?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePDFDownload = async () => {
    if (!generatedReport) {
      setError('Please generate report first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Starting PDF generation...');
      
      // Import html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;
      
      // SIMPLIFIED APPROACH: Extract just the main content from the generated report
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatedReport;
      
      // Find the main content container
      const mainContent = tempDiv.querySelector('.report-main-content') || tempDiv.querySelector('body') || tempDiv;
      console.log('🔍 Found main content:', !!mainContent);
      
      if (!mainContent) {
        throw new Error('No content found in generated report');
      }
      
      // Create simple PDF container with just the essential content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.padding = '20px';
      pdfContainer.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      pdfContainer.style.color = '#374151';
      pdfContainer.style.lineHeight = '1.6';
      pdfContainer.style.fontSize = '14px';
      pdfContainer.style.backgroundColor = 'white';
      
      // Add basic styling
      const basicStyles = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          h1 { font-size: 24px; margin-bottom: 16px; color: #1f2937; font-weight: 700; }
          h2 { font-size: 20px; margin: 20px 0 12px 0; color: #374151; font-weight: 600; }
          h3 { font-size: 16px; margin: 16px 0 8px 0; color: #4b5563; font-weight: 600; }
          p { margin-bottom: 12px; }
          .section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
          .activity-card { background: #f9fafb; padding: 16px; margin: 16px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .step-card { background: white; border: 1px solid #e5e7eb; padding: 12px; margin: 8px 0; border-radius: 6px; }
          .subcomponent-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; color: #374151; }
          .page-break { page-break-before: always; }
        </style>
      `;
      
      // Create clean content for PDF
      const cleanContent = mainContent.innerHTML
        .replace(/style="[^"]*"/g, '') // Remove inline styles
        .replace(/class="[^"]*interactive[^"]*"/g, '') // Remove interactive elements
        .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<button[\s\S]*?<\/button>/gi, '') // Remove buttons
        .replace(/onclick="[^"]*"/g, ''); // Remove click handlers
      
      // Add cover page
      const coverPageHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <h1 style="font-size: 32px; margin-bottom: 20px; color: #1e40af;">
            R&D Tax Credit Research Report
          </h1>
          <h2 style="font-size: 24px; margin-bottom: 40px; color: #374151;">
            ${businessProfile?.name || 'Business Entity'}
          </h2>
          <div style="margin-bottom: 20px;">
            <strong>Tax Year:</strong> ${businessYearData?.year || new Date().getFullYear()}
          </div>
          <div style="margin-bottom: 20px;">
            <strong>Generated:</strong> ${new Date().toLocaleDateString()}
          </div>
          <div style="margin-bottom: 20px;">
            <strong>Activities:</strong> ${selectedActivities.length} Research Activities
          </div>
          <div class="page-break"></div>
        </div>
      `;
      
      pdfContainer.innerHTML = basicStyles + coverPageHTML + cleanContent;
      
      // Add to DOM for rendering
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.top = '-9999px';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '8.5in';
      pdfContainer.style.backgroundColor = 'white';
      
      document.body.appendChild(pdfContainer);
      console.log('📄 PDF container added to DOM');
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simple PDF options
      const pdfOptions = {
        margin: 0.5,
        filename: `Research_Report_${businessProfile?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.9 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait'
        }
      };
      
      console.log('📊 Generating PDF with options:', pdfOptions);
      
      // Generate PDF
      const pdf = await html2pdf().from(pdfContainer).set(pdfOptions).save();
      
      console.log('✅ PDF generated successfully');
      
      // Clean up
      document.body.removeChild(pdfContainer);
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      setError(`Failed to generate PDF: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const createCoverPage = () => {
    const coverPage = document.createElement('div');
    coverPage.id = 'cover-page';
    coverPage.className = 'pdf-cover-page';
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    coverPage.innerHTML = `
      <div class="cover-content">
        <div class="cover-header">
          <div class="company-logo">
            <div class="logo-placeholder">
              <div class="logo-icon">R&D</div>
            </div>
          </div>
          <div class="company-info">
            <h3>Direct Research Advisors</h3>
            <p>R&D Tax Credit Specialists</p>
          </div>
        </div>
        
        <div class="cover-main">
          <h1 class="cover-title">
            Qualified Research Activities<br/>
            Documentation Report
          </h1>
          
          <div class="cover-subtitle">
            IRC Section 41 Compliance Documentation
          </div>
          
          <div class="cover-details">
            <div class="detail-item">
              <label>Business Entity:</label>
              <span>${businessProfile?.name || 'Unknown Business'}</span>
            </div>
                         <div class="detail-item">
               <label>Tax Year:</label>
               <span>${businessYearData?.year || new Date().getFullYear()}</span>
             </div>
            <div class="detail-item">
              <label>Report Generated:</label>
              <span>${currentDate}</span>
            </div>
            <div class="detail-item">
              <label>Activities Documented:</label>
              <span>${selectedActivities.length} Qualified Research Activities</span>
            </div>
            <div class="detail-item">
              <label>Research Steps:</label>
              <span>${selectedSteps.length} Research Process Steps</span>
            </div>
          </div>
        </div>
        
        <div class="cover-footer">
          <div class="confidentiality-notice">
            <h4>CONFIDENTIAL</h4>
            <p>This document contains proprietary business information and research documentation 
            prepared for tax compliance purposes under IRC Section 41. Unauthorized distribution is prohibited.</p>
          </div>
        </div>
      </div>
    `;
    
    return coverPage;
  };

  const createTableOfContents = () => {
    const tocPage = document.createElement('div');
    tocPage.id = 'table-of-contents';
    tocPage.className = 'pdf-toc-page';
    
    tocPage.innerHTML = `
      <div class="toc-content">
        <h2 class="toc-title">Table of Contents</h2>
        
        <div class="toc-entries">
          <div class="toc-entry">
            <span class="toc-item">Executive Summary</span>
            <span class="toc-dots"></span>
            <span class="toc-page">3</span>
          </div>
          
          <div class="toc-entry">
            <span class="toc-item">R&D Tax Credit Overview</span>
            <span class="toc-dots"></span>
            <span class="toc-page">4</span>
          </div>
          
          <div class="toc-entry">
            <span class="toc-item">Qualified Research Activities</span>
            <span class="toc-dots"></span>
            <span class="toc-page">5</span>
          </div>
          
          ${selectedActivities.map((activity, index) => `
            <div class="toc-entry toc-sub-entry">
              <span class="toc-item">${activity.name || `Activity ${index + 1}`}</span>
              <span class="toc-dots"></span>
              <span class="toc-page">${6 + index}</span>
            </div>
          `).join('')}
          
          <div class="toc-entry">
            <span class="toc-item">Research Process Documentation</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${6 + selectedActivities.length}</span>
          </div>
          
          <div class="toc-entry">
            <span class="toc-item">Compliance Summary</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${7 + selectedActivities.length}</span>
          </div>
          
          <div class="toc-entry">
            <span class="toc-item">Appendices</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${8 + selectedActivities.length}</span>
          </div>
        </div>
        
        <div class="toc-footer">
                     <p><strong>Document Purpose:</strong> This report provides comprehensive documentation of qualified research activities 
           conducted during the ${businessYearData?.year || new Date().getFullYear()} tax year, prepared in accordance with 
           Internal Revenue Code Section 41 requirements for R&D tax credit claims.</p>
        </div>
      </div>
    `;
    
    return tocPage;
  };

  const addPDFHeadersFooters = (content) => {
    // Add page headers and footers to main content sections
    const sections = content.querySelectorAll('.report-section, .activity-section, .step-section');
    sections.forEach((section, index) => {
      if (index > 0) { // Skip first section
        const pageBreak = document.createElement('div');
        pageBreak.className = 'pdf-page-break';
        section.parentNode.insertBefore(pageBreak, section);
      }
      
      // Add header to each section
      const header = document.createElement('div');
      header.className = 'pdf-page-header';
      header.innerHTML = `
        <div class="header-content">
          <div class="header-left">${businessProfile?.name || 'R&D Documentation'}</div>
                     <div class="header-right">Tax Year ${businessYearData?.year || new Date().getFullYear()}</div>
        </div>
      `;
      section.insertBefore(header, section.firstChild);
    });
    
    // Add footer to the container
    const footer = document.createElement('div');
    footer.className = 'pdf-page-footer';
    footer.innerHTML = `
      <div class="footer-content">
        <div class="footer-left">Direct Research Advisors • R&D Tax Credit Documentation</div>
        <div class="footer-center">CONFIDENTIAL</div>
        <div class="footer-right">Generated ${new Date().toLocaleDateString()}</div>
      </div>
    `;
    content.appendChild(footer);
  };

  const getPDFStyles = () => {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .pdf-document-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #1f2937;
        line-height: 1.6;
        background: white;
        width: 8.5in;
        min-height: 11in;
      }
      
      /* Cover Page Styles */
      .pdf-cover-page {
        width: 100%;
        height: 11in;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6366f1 100%);
        color: white;
        page-break-after: always;
      }
      
      .cover-content {
        padding: 1in;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      
      .cover-header {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      
      .logo-placeholder {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .logo-icon {
        font-size: 24px;
        font-weight: 700;
        color: white;
      }
      
      .company-info h3 {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .company-info p {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .cover-main {
        text-align: center;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 30px;
      }
      
      .cover-title {
        font-size: 48px;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 16px;
      }
      
      .cover-subtitle {
        font-size: 24px;
        font-weight: 400;
        opacity: 0.9;
        margin-bottom: 40px;
      }
      
      .cover-details {
        background: rgba(255, 255, 255, 0.1);
        padding: 30px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        max-width: 500px;
        margin: 0 auto;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 16px;
      }
      
      .detail-item:last-child {
        margin-bottom: 0;
      }
      
      .detail-item label {
        font-weight: 500;
        opacity: 0.9;
      }
      
      .detail-item span {
        font-weight: 600;
      }
      
      .cover-footer {
        margin-top: auto;
      }
      
      .confidentiality-notice {
        background: rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.3);
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      }
      
      .confidentiality-notice h4 {
        color: #fca5a5;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: 2px;
      }
      
      .confidentiality-notice p {
        font-size: 12px;
        line-height: 1.5;
        opacity: 0.9;
      }
      
      /* Table of Contents Styles */
      .pdf-toc-page {
        width: 100%;
        min-height: 11in;
        padding: 1in;
        background: white;
        page-break-after: always;
      }
      
      .toc-title {
        font-size: 36px;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 40px;
        text-align: center;
      }
      
      .toc-entries {
        margin-bottom: 40px;
      }
      
      .toc-entry {
        display: flex;
        align-items: baseline;
        margin-bottom: 16px;
        font-size: 16px;
      }
      
      .toc-sub-entry {
        margin-left: 24px;
        font-size: 14px;
        color: #6b7280;
      }
      
      .toc-item {
        font-weight: 500;
      }
      
      .toc-dots {
        flex-grow: 1;
        height: 1px;
        background: repeating-linear-gradient(to right, transparent, transparent 2px, #d1d5db 2px, #d1d5db 6px);
        margin: 0 12px;
        align-self: end;
        margin-bottom: 6px;
      }
      
      .toc-page {
        font-weight: 600;
        color: #1e3a8a;
      }
      
      .toc-footer {
        background: #f9fafb;
        padding: 24px;
        border-radius: 8px;
        border-left: 4px solid #3730a3;
      }
      
      .toc-footer p {
        font-size: 14px;
        line-height: 1.6;
        color: #4b5563;
      }
      
      /* Main Content Styles */
      .pdf-main-content {
        padding: 0.75in;
        background: white;
      }
      
      /* Page Break Controls */
      .pdf-page-break {
        page-break-before: always;
        height: 0;
      }
      
      .pdf-keep-together {
        page-break-inside: avoid;
      }
      
      /* Header and Footer Styles */
      .pdf-page-header {
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #6b7280;
      }
      
      .header-left {
        font-weight: 600;
      }
      
      .header-right {
        font-weight: 500;
      }
      
      .pdf-page-footer {
        position: fixed;
        bottom: 0.5in;
        left: 0.75in;
        right: 0.75in;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
      }
      
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #6b7280;
      }
      
      .footer-center {
        font-weight: 600;
        color: #dc2626;
        letter-spacing: 1px;
      }
      
      /* Enhanced Content Styling */
      .pdf-main-content h1 {
        font-size: 28px;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 24px;
        page-break-after: avoid;
      }
      
      .pdf-main-content h2 {
        font-size: 24px;
        font-weight: 600;
        color: #1e3a8a;
        margin-top: 32px;
        margin-bottom: 16px;
        page-break-after: avoid;
      }
      
      .pdf-main-content h3 {
        font-size: 20px;
        font-weight: 600;
        color: #374151;
        margin-top: 24px;
        margin-bottom: 12px;
        page-break-after: avoid;
      }
      
      .pdf-main-content h4 {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-top: 20px;
        margin-bottom: 8px;
        page-break-after: avoid;
      }
      
      .pdf-main-content p {
        margin-bottom: 12px;
        text-align: justify;
      }
      
      .pdf-main-content ul, .pdf-main-content ol {
        margin-left: 24px;
        margin-bottom: 16px;
      }
      
      .pdf-main-content li {
        margin-bottom: 6px;
      }
      
      /* Card and Section Styling */
      .activity-card, .step-card, .report-section {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      
      .activity-card h3, .step-card h3 {
        color: #1e3a8a;
        border-bottom: 2px solid #3730a3;
        padding-bottom: 8px;
        margin-bottom: 16px;
      }
      
      /* Table Styling */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 14px;
      }
      
      th, td {
        padding: 12px;
        border: 1px solid #d1d5db;
        text-align: left;
      }
      
      th {
        background: #f3f4f6;
        font-weight: 600;
        color: #374151;
      }
      
      /* Print Optimization */
      @media print {
        .pdf-document-container {
          background: white !important;
          color: black !important;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
      
      @page {
        size: letter;
        margin: 0.75in 0.75in 1in 0.75in;
      }
    `;
  };

  const getReportStyles = () => {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1f2937;
        line-height: 1.6;
        background: #f8fafc;
      }
      
      /* Import all styles from CSS file */
      ${document.querySelector('style[data-vite-dev-id*="ResearchReportModal.css"]')?.textContent || ''}
      
      /* Print-specific styles for 8.5x11 with 0.5-inch margins */
      @media print {
        @page {
          size: 8.5in 11in;
          margin: 0.5in;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        
        .report-layout {
          display: block;
        }
        
        .toc-sidebar {
          display: none; /* Hide sidebar in print */
        }
        
        .report-main-content {
          max-width: 7.5in; /* 8.5in - 1in margins */
          margin: 0 auto;
          padding: 0;
          padding-bottom: 1.5in; /* Space for footer */
        }
        
        .report-section {
          page-break-inside: avoid;
          margin-bottom: 0.5in;
        }
        
        .report-header {
          page-break-after: avoid;
        }
        
        /* Print footer styles */
        .print-footer {
          display: block !important;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 0.5in;
          margin: 0;
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9pt;
          padding: 0 0.5in;
          height: 100%;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-business {
          font-weight: 600;
        }
        
        .footer-year {
          color: #6b7280;
        }
        
        .footer-confidential {
          color: #dc2626;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 9pt;
        }
        
        /* Adjust spacing for footer */
        .report-main-content {
          padding-bottom: 1.5in;
        }
      }
      
      /* Hide print footer in screen view */
      @media screen {
        .print-footer {
          display: none;
        }
      }
      
      /* Additional print-specific styles */
      .report-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6366f1 100%);
        color: white;
        padding: 60px 40px;
        text-align: center;
        margin-bottom: 40px;
      }
      
      .report-main-title {
        font-size: 36px;
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: -1px;
      }
      
      .report-subtitle {
        font-size: 24px;
        font-weight: 400;
        opacity: 0.9;
      }
      
      .report-date {
        margin-top: 16px;
        font-size: 16px;
        opacity: 0.8;
      }
      
      .distribution-chart {
        margin: 20px 0;
      }
      
      .distribution-bar {
        margin-bottom: 16px;
      }
      
      .bar-label {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
        color: #4b5563;
      }
      
      .bar-container {
        background: #e5e7eb;
        height: 32px;
        border-radius: 16px;
        overflow: hidden;
      }
      
      .bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        display: flex;
        align-items: center;
        padding: 0 16px;
        font-size: 14px;
        font-weight: 600;
        transition: width 0.5s ease;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        text-align: center;
      }
      
      .stat-item {
        padding: 20px;
        background: #f3f4f6;
        border-radius: 12px;
      }
      
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #6366f1;
      }
      
      .stat-label {
        font-size: 14px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .profile-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        margin-bottom: 32px;
      }
      
      .profile-item label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .profile-item p {
        font-size: 16px;
        color: #1f2937;
      }
      
      .contact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }
      
      .contact-item {
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .guideline-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .guideline-header {
        margin-bottom: 20px;
      }
      
      .guideline-header h4 {
        font-size: 20px;
        color: #1f2937;
        margin-bottom: 12px;
      }
      
      .guideline-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .guideline-sections {
        display: grid;
        gap: 20px;
      }
      
      .codes-section {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
      }
      
      .codes-section h5 {
        font-size: 16px;
        margin-bottom: 8px;
        color: #4b5563;
      }
      
      .codes-list {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .compliance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 24px;
        margin-top: 24px;
      }
      
      .compliance-card {
        background: white;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .compliance-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .compliance-card h3 {
        font-size: 18px;
        color: #1f2937;
        margin-bottom: 8px;
      }
      
      .compliance-card p {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
      }
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="research-report-modal-overlay">
      <div className="research-report-modal">
        <div className="research-report-modal-header">
          <h2>
            <FileText />
            {businessProfile?.category?.name?.toLowerCase() === 'software' 
              ? 'Research Summary Report' 
              : 'Clinical Practice Guideline Report Generator'}
          </h2>
          <button onClick={onClose} className="modal-close-button">
            <X />
          </button>
        </div>

        <div className="research-report-modal-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">{loadingMessage}</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle className="error-icon" />
              <p className="error-message">{error}</p>
              <button onClick={loadData} className="action-button action-button-primary">
                Retry
              </button>
            </div>
          ) : showPreview ? (
            <div className="report-preview-container">
              <iframe
                srcDoc={generatedReport}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'white'
                }}
                title="Report Preview"
              />
            </div>
          ) : (
            <div className="report-main-content" style={{ padding: '40px' }}>
              <div className="report-section">
                <div className="section-header">
                  <div className="section-icon">📊</div>
                  <div>
                    <h2 className="section-title">Report Generation Dashboard</h2>
                    <p className="section-subtitle">Review your research data before generating the report</p>
                  </div>
                </div>

                {businessProfile && (
                  <div className="summary-card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1f2937' }}>
                      <Building2 style={{ display: 'inline', marginRight: '8px' }} />
                      Business Profile
                    </h3>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <label>Company Name</label>
                        <p>{businessProfile.name}</p>
                      </div>
                      <div className="profile-item">
                        <label>Entity Type</label>
                        <p>{businessProfile.entity_type}</p>
                      </div>
                      <div className="profile-item">
                        <label>State</label>
                        <p>{businessProfile.domicile_state}</p>
                      </div>
                      <div className="profile-item">
                        <label>Established</label>
                        <p>{businessProfile.start_year}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="summary-grid">
                  <div className="summary-card">
                    <div className="summary-card-value">{selectedActivities.length}</div>
                    <div className="summary-card-label">Research Activities</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-card-value">{selectedSteps.length}</div>
                    <div className="summary-card-label">Research Steps</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-card-value">{selectedSubcomponents.length}</div>
                    <div className="summary-card-label">Subcomponents</div>
                  </div>
                </div>

                {selectedActivities.length > 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1f2937' }}>
                      <Activity style={{ display: 'inline', marginRight: '8px' }} />
                      Selected Research Activities
                    </h3>
                    <div className="activity-list">
                      {selectedActivities.map((activity, index) => (
                        <div key={activity.id} className="activity-card">
                          <div className="activity-header">
                            <div className="activity-title">
                              <span className="activity-badge">{index + 1}</span>
                              {activity.activity?.title || 'Unnamed Activity'}
                            </div>
                            <div className="chip chip-primary">
                              {activity.practice_percent}% Practice
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="report-info" style={{ 
                  marginTop: '32px', 
                  padding: '20px', 
                  background: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #0284c7'
                }}>
                  <h4 style={{ color: '#0284c7', marginBottom: '8px' }}>
                    <Info style={{ display: 'inline', marginRight: '8px' }} />
                    About This Report
                  </h4>
                  <p style={{ color: '#0369a1', lineHeight: '1.6' }}>
                    {businessProfile?.category?.name?.toLowerCase() === 'software' ? (
                      <>This comprehensive Software R&D Documentation report will document all qualified research 
                      activities in accordance with IRC Section 41 requirements. The report includes detailed 
                      hierarchical structures, technical documentation, compliance summaries, and IRS audit defense materials.
                      <br /><br />
                      <strong>GitHub Integration:</strong> {businessProfile?.github_token ? (
                        <span className="text-green-600">✓ Configured - Repository analysis enabled for this client</span>
                      ) : (
                        <>To enable GitHub repository analysis and commit tracking, add your GitHub token in the 
                        Business Setup step under "GitHub Access Token". This will automatically generate repository summaries, 
                        commit analysis, and development activity tracking for R&D substantiation.</>
                      )}</>
                    ) : (
                      <>This comprehensive Clinical Practice Guideline report will document all qualified research 
                      activities in accordance with IRC Section 41 requirements. The report includes detailed 
                      hierarchical structures, visual guides, compliance summaries, and documentation checklists.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="report-actions">
          {!showPreview && !isLoading && !error && (
            <button 
              onClick={generateReport} 
              className="action-button action-button-primary"
              disabled={selectedActivities.length === 0}
              style={{ minWidth: '200px' }}
            >
              <FileText />
              {cachedReport ? 'Regenerate Report' : 'Generate Comprehensive Report'}
            </button>
          )}
          
          {showPreview && (
            <>
              <button 
                onClick={() => setShowPreview(false)} 
                className="action-button action-button-secondary"
              >
                <ChevronLeft />
                Back to Summary
              </button>
              <button onClick={handlePrint} className="action-button action-button-primary">
                <Printer />
                Print Report
              </button>
              <button onClick={handleDownload} className="action-button action-button-primary">
                <Download />
                Download HTML
              </button>
              <button onClick={handlePDFDownload} className="action-button action-button-primary">
                <FileText />
                Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit AI Prompt Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit AI Prompt</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label className="modal-label">
                Custom Prompt for AI Generation:
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="modal-textarea"
                rows={12}
                placeholder="Enter your custom prompt for AI content generation..."
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-btn modal-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomPromptGeneration}
                className="modal-btn modal-btn-primary"
                disabled={!editPrompt.trim()}
              >
                Generate Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchReportModal; 