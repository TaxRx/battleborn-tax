import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Printer, Eye, EyeOff } from 'lucide-react';
import { FilingGuideDocument } from './FilingGuideDocument';
import { FilingGuideService } from './FilingGuideService';
import './FilingGuide.css';

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

  const handleExport = async () => {
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
          fileName
        });
      } else {
        await FilingGuideService.exportToHTML({
          businessData,
          selectedYear,
          calculations,
          fileName
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
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Federal Filing Guide - ${businessData?.name || 'Client'}</title>
        <style>
          ${document.querySelector('style[data-filing-guide]')?.textContent || ''}
        </style>
      </head>
      <body>
        ${document.querySelector('.filing-guide-document')?.outerHTML || ''}
      </body>
      </html>
    `;
    
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

  if (!isOpen) return null;

  return (
    <div className="filing-guide-modal-overlay">
      <div className="filing-guide-modal">
        <div className="filing-guide-modal-header">
          <h2 className="filing-guide-modal-title">
            <FileText className="filing-guide-icon" />
            Federal R&D Credit Filing Guide
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
                
                <div className="filing-guide-toc-section">
                  <div className="filing-guide-toc-section-title">Document Sections</div>
                  {tocSections.map((section) => (
                    <div key={section.id}>
                      <button
                        className={`filing-guide-toc-item ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => scrollToSection(section.id)}
                      >
                        <span style={{ marginRight: '8px' }}>{section.icon}</span>
                        {section.title}
                      </button>
                      {section.subsections && (
                        <div>
                          {section.subsections.map((subsection) => (
                            <button
                              key={subsection.id}
                              className={`filing-guide-toc-item filing-guide-toc-sub-item ${activeSection === subsection.id ? 'active' : ''}`}
                              onClick={() => scrollToSection(subsection.id)}
                            >
                              {subsection.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
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