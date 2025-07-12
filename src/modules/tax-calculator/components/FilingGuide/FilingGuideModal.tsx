import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Printer } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <div className="filing-guide-modal-overlay">
      <div className="filing-guide-modal">
        <div className="filing-guide-modal-header">
          <h2 className="filing-guide-modal-title">
            <FileText className="filing-guide-icon" />
            Federal Filing Guide
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
          <div className="filing-guide-preview">
            <FilingGuideDocument
              businessData={businessData}
              selectedYear={selectedYear}
              calculations={calculations}
              selectedMethod={selectedMethod}
              debugData={debugData}
            />
          </div>
        </div>

        <div className="filing-guide-modal-footer">
          <div className="filing-guide-export-controls">
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
        </div>
      </div>
    </div>
  );
}; 