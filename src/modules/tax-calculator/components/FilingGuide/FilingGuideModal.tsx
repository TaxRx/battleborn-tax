import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Printer, Eye, EyeOff } from 'lucide-react';
import { FilingGuideDocument } from './FilingGuideDocument';
import { FilingGuideService } from './FilingGuideService';
import './FilingGuide.css';
import { rdReportService } from '../../services/rdReportService';

interface FilingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessData: any;
  selectedYear: any;
  calculations: any;
  selectedMethod?: 'asc' | 'standard';
  debugData?: any;
}

export const FilingGuideModal: React.FC<FilingGuideModalProps> = ({
  isOpen,
  onClose,
  businessData,
  selectedYear,
  calculations,
  selectedMethod,
  debugData
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html'>('pdf');
  const [showPreview, setShowPreview] = useState(true);
  const [activeSection, setActiveSection] = useState('cover');
  const [cachedReport, setCachedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load cached report on mount
  useEffect(() => {
    const loadCachedReport = async () => {
      if (!businessData?.id || !selectedYear?.id) return;

      setIsLoading(true);
      try {
        // Fix: Correct parameter order for getReport - it should be (businessYearId, reportType)
        const cached = await rdReportService.getReport(
          selectedYear.id,
          'FILING_GUIDE'
        );
        if (cached?.filing_guide) {
          setCachedReport(cached);
          console.log('📄 [Filing Guide] Loaded cached report');
        }
      } catch (error) {
        console.error('Error loading cached filing guide:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadCachedReport();
    }
  }, [isOpen, businessData?.id, selectedYear?.id]);

  // Table of Contents structure
  const tocSections = [
    {
      id: 'cover',
      title: 'Cover Page',
      icon: '📄'
    },
    {
      id: 'about',
      title: 'About Direct Research',
      icon: '🏢'
    },
    {
      id: 'process',
      title: 'Filing Process Overview',
      icon: '📋'
    },
    {
      id: 'summary',
      title: 'Summary Tables & Visuals',
      icon: '📊',
      subsections: [
        { id: 'charts', title: 'KPI Charts' },
        { id: 'qre-tables', title: 'QRE Summary Tables' }
      ]
    },
    {
      id: 'federal',
      title: 'Federal Form 6765 Pro Forma',
      icon: '📝'
    },
    {
      id: 'state',
      title: 'State Credits',
      icon: '🏛️'
    },
    {
      id: 'calculations',
      title: 'Calculation Specifics',
      icon: '🧮'
    }
  ];

  // Scroll spy functionality
  useEffect(() => {
    if (!showPreview) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('filing-guide-section-', '');
          setActiveSection(sectionId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    tocSections.forEach(section => {
      const element = document.getElementById(`filing-guide-section-${section.id}`);
      if (element) {
        observer.observe(element);
      }
      // Also observe subsections
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          const subElement = document.getElementById(`filing-guide-section-${subsection.id}`);
          if (subElement) {
            observer.observe(subElement);
          }
        });
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [showPreview, tocSections]);

  // Scroll to section functionality
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`filing-guide-section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const generateAndSaveReport = async () => {
    if (!businessData || !selectedYear || !calculations) {
      console.error('Missing required data for filing guide generation');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate HTML content
      const htmlContent = generateFilingGuideHTML();
      
      // Fix: Use correct saveReport method signature (businessYearId, htmlContent, reportType)
      await rdReportService.saveReport(
        selectedYear.id,
        htmlContent,
        'FILING_GUIDE'
      );

      // Update cached report - Fix: Correct parameter order
      const newReport = await rdReportService.getReport(
        selectedYear.id,
        'FILING_GUIDE'
      );
      setCachedReport(newReport);
      
      console.log('📄 [Filing Guide] Report generated and saved');
      
    } catch (error) {
      console.error('Error generating filing guide:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFilingGuideHTML = (): string => {
    const documentElement = document.querySelector('.filing-guide-document');
    if (!documentElement) {
      console.error('Filing guide document not found');
      return '';
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Federal Filing Guide - ${businessData?.name || 'Client'}</title>
        <style>
          ${getFilingGuideStyles()}
        </style>
      </head>
      <body>
        <div class="filing-guide-wrapper">
          <div class="filing-guide-header">
            <h1>Federal R&D Credit Filing Guide</h1>
            <div class="filing-guide-meta">
              <div>Client: ${businessData?.name || 'N/A'}</div>
              <div>Tax Year: ${selectedYear?.year || 'N/A'}</div>
              <div>Generated: ${currentDate}</div>
            </div>
          </div>
          ${documentElement.outerHTML}
        </div>
      </body>
      </html>
    `;
  };

  const getFilingGuideStyles = (): string => {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        background: #f8fafc;
      }
      
      .filing-guide-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        min-height: 100vh;
      }
      
      .filing-guide-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6366f1 100%);
        color: white;
        padding: 40px;
        text-align: center;
      }
      
      .filing-guide-header h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 20px;
      }
      
      .filing-guide-meta {
        display: flex;
        justify-content: center;
        gap: 40px;
        font-size: 16px;
      }
      
      .filing-guide-document {
        padding: 40px;
      }
      
      .filing-guide-section {
        margin-bottom: 40px;
        padding: 30px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .filing-guide-section-header {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
        gap: 16px;
      }
      
      .filing-guide-section-icon {
        font-size: 24px;
      }
      
      .filing-guide-section-title {
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .filing-guide-section-subtitle {
        color: #6b7280;
        font-size: 16px;
        margin-top: 4px;
      }
      
      @media print {
        .filing-guide-wrapper {
          box-shadow: none;
        }
        
        .filing-guide-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `;
  };

  const handleExport = async () => {
    // First generate and save report if needed
    if (!cachedReport) {
      await generateAndSaveReport();
    }

    if (!businessData || !selectedYear || !calculations) {
      console.error('Missing required data for filing guide generation');
      return;
    }

    setIsGenerating(true);
    try {
      const fileName = `Federal_Filing_Guide_${businessData.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear.year}.pdf`;
      
      if (exportFormat === 'pdf') {
        await FilingGuideService.exportToPDF({
          businessData,
          selectedYear,
          calculations,
          fileName,
          selectedMethod
        });
      } else {
        await FilingGuideService.exportToHTML({
          businessData,
          selectedYear,
          calculations,
          fileName: fileName.replace('.pdf', '.html'),
          selectedMethod
        });
      }
    } catch (error) {
      console.error('Error generating filing guide:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    let htmlContent = '';
    
    if (cachedReport?.filing_guide) {
      // Use cached HTML
      htmlContent = cachedReport.filing_guide;
    } else {
      // Generate HTML on the fly
      htmlContent = generateFilingGuideHTML();
    }
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Federal_Filing_Guide_${businessData?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear?.year}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Delete existing cached report
      if (cachedReport) {
        await rdReportService.deleteReport(cachedReport.id);
      }
      
      // Generate new report
      await generateAndSaveReport();
      
      console.log('📄 [Filing Guide] Report regenerated successfully');
    } catch (error) {
      console.error('Error regenerating filing guide:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="filing-guide-modal-overlay">
        <div className="filing-guide-modal">
          <div className="filing-guide-modal-header">
            <h2 className="filing-guide-modal-title">
              <FileText className="filing-guide-icon" />
              Loading Filing Guide...
            </h2>
          </div>
          <div className="filing-guide-modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
              <div>Loading cached report...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="filing-guide-modal-overlay">
      <div className="filing-guide-modal">
        <div className="filing-guide-modal-header">
          <h2 className="filing-guide-modal-title">
            <FileText className="filing-guide-icon" />
            Federal R&D Credit Filing Guide
            {cachedReport && (
              <span style={{ fontSize: '14px', fontWeight: '400', marginLeft: '12px', opacity: '0.8' }}>
                (Cached)
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="filing-guide-close-btn"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="filing-guide-modal-content">
          {showPreview ? (
            <div className="filing-guide-layout">
              {/* Table of Contents Sidebar */}
              <div className="filing-guide-toc-sidebar">
                <h3 className="filing-guide-toc-title">Table of Contents</h3>
                
                {tocSections.map((section) => (
                  <div key={section.id} className="filing-guide-toc-section">
                    <button
                      className={`filing-guide-toc-item ${activeSection === section.id ? 'active' : ''}`}
                      onClick={() => scrollToSection(section.id)}
                    >
                      <span style={{ marginRight: '8px' }}>{section.icon}</span>
                      {section.title}
                    </button>
                    
                    {section.subsections?.map((subsection) => (
                      <button
                        key={subsection.id}
                        className={`filing-guide-toc-item filing-guide-toc-sub-item ${activeSection === subsection.id ? 'active' : ''}`}
                        onClick={() => scrollToSection(subsection.id)}
                      >
                        {subsection.title}
                      </button>
                    ))}
                  </div>
                ))}
                
                <div className="filing-guide-toc-section">
                  <div className="filing-guide-toc-section-title">Quick Actions</div>
                  <button
                    className="filing-guide-toc-item"
                    onClick={handlePrint}
                  >
                    <Printer size={14} style={{ marginRight: '8px' }} />
                    Print Guide
                  </button>
                  <button
                    className="filing-guide-toc-item"
                    onClick={handleDownload}
                  >
                    <Download size={14} style={{ marginRight: '8px' }} />
                    Download HTML
                  </button>
                  {cachedReport && (
                    <button
                      className="filing-guide-toc-item"
                      onClick={handleRegenerateReport}
                      disabled={isGenerating}
                    >
                      <FileText size={14} style={{ marginRight: '8px' }} />
                      {isGenerating ? 'Regenerating...' : 'Regenerate Report'}
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="filing-guide-main-content">
                <div className="filing-guide-preview">
                  <FilingGuideDocument
                    businessData={businessData}
                    selectedYear={selectedYear}
                    calculations={calculations}
                    selectedMethod={selectedMethod}
                    debugData={debugData}
                    readOnly={window.location.pathname.includes('/client')}
                  />
                </div>
                
                {/* Print Footer - Hidden on screen */}
                <div className="filing-guide-print-footer">
                  <div className="filing-guide-footer-content">
                    <div className="filing-guide-footer-business">
                      {businessData?.name || 'Direct Research Client'}
                    </div>
                    <div className="filing-guide-footer-year">
                      Federal Filing Guide – Tax Year {selectedYear?.year || new Date().getFullYear()}
                    </div>
                    <div className="filing-guide-footer-confidential">
                      Confidential
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="filing-guide-main-content" style={{ marginLeft: 0, padding: '40px' }}>
              <div className="filing-guide-section">
                <div className="filing-guide-section-header">
                  <div className="filing-guide-section-icon">📊</div>
                  <div>
                    <h2 className="filing-guide-section-title">Filing Guide Generation</h2>
                    <p className="filing-guide-section-subtitle">Review your data before generating the filing guide</p>
                  </div>
                </div>

                {businessData && (
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '24px', 
                    borderRadius: '12px', 
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1f2937' }}>
                      Business Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Company Name
                        </label>
                        <p style={{ fontSize: '16px', color: '#1f2937', margin: '4px 0 0 0' }}>
                          {businessData.name}
                        </p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Tax Year
                        </label>
                        <p style={{ fontSize: '16px', color: '#1f2937', margin: '4px 0 0 0' }}>
                          {selectedYear?.year || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ 
                  background: '#f0f9ff', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  marginTop: '32px'
                }}>
                  <h4 style={{ color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FileText style={{ marginRight: '8px' }} />
                    About This Filing Guide
                  </h4>
                  <p style={{ color: '#0369a1', lineHeight: '1.6', margin: 0 }}>
                    This comprehensive Federal R&D Credit Filing Guide includes all necessary forms, 
                    pro formas, calculation details, and supporting documentation required for your 
                    tax filing. The guide is formatted for professional presentation and includes 
                    both federal and state credit calculations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="filing-guide-modal-footer">
          {!showPreview ? (
            <div className="filing-guide-export-controls">
              <button 
                onClick={() => setShowPreview(true)} 
                className="filing-guide-print-btn"
              >
                <Eye size={16} />
                Preview Filing Guide
              </button>
            </div>
          ) : (
            <div className="filing-guide-export-controls">
              <button 
                onClick={() => setShowPreview(false)} 
                className="filing-guide-print-btn"
              >
                <EyeOff size={16} />
                Back to Summary
              </button>
              
              {!cachedReport && (
                <button
                  onClick={generateAndSaveReport}
                  disabled={isGenerating}
                  className="filing-guide-export-btn"
                  style={{ marginRight: '12px' }}
                >
                  <FileText size={16} />
                  {isGenerating ? 'Generating...' : 'Generate & Save Report'}
                </button>
              )}
              
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'html')}
                className="filing-guide-format-select"
              >
                <option value="pdf">PDF Export</option>
                <option value="html">HTML Export</option>
              </select>
              
              <button
                onClick={handleExport}
                disabled={isGenerating}
                className="filing-guide-export-btn"
              >
                <Download size={16} />
                {isGenerating ? 'Generating...' : 'Export'}
              </button>
              
              <button
                onClick={handlePrint}
                className="filing-guide-print-btn"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 