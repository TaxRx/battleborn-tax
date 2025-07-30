import db from '../../lib/supabaseClient';
import { Form6765Override } from './types';

interface FilingGuideExportData {
  businessData: any;
  selectedYear: any;
  calculations: any;
  fileName: string;
  selectedMethod?: 'asc' | 'standard';
}

export class FilingGuideService {
  static async exportToPDF(data: FilingGuideExportData): Promise<void> {
    try {
      // Find the existing FilingGuideDocument in the DOM
      const existingDocument = document.querySelector('.filing-guide-preview');
      
      if (!existingDocument) {
        throw new Error('Filing guide content not found. Please ensure the filing guide is open.');
      }

      // Import html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;

      // Create a professional wrapper for the PDF
      const container = document.createElement('div');
      container.className = 'filing-guide-pdf-export';
      
      // Add professional styling first
      this.addProfessionalPDFStyles(container);
      
      // Create the complete PDF content
      const pdfContent = this.createProfessionalPDFContent(data, existingDocument as HTMLElement);
      container.innerHTML = pdfContent;
      
      // Add to DOM temporarily (hidden)
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '8.5in';
      container.style.background = 'white';
      document.body.appendChild(container);
      
      // Professional PDF generation options
      const pdfOptions = {
        margin: [0.75, 0.5, 0.75, 0.5], // top, right, bottom, left in inches
        filename: data.fileName,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          width: 816, // 8.5 inches at 96 DPI
          height: 1056, // 11 inches at 96 DPI
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true,
          precision: 16
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.pdf-page-break-before',
          after: '.pdf-page-break-after',
          avoid: '.pdf-page-break-avoid'
        }
      };
      
      // Generate PDF with enhanced error handling
      try {
        await html2pdf().from(container).set(pdfOptions).save();
        console.log('✅ PDF generated successfully:', data.fileName);
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError.message}`);
      }
      
      // Clean up
      document.body.removeChild(container);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`❌ Failed to generate PDF: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
      throw error;
    }
  }

  static async exportToHTML(data: FilingGuideExportData): Promise<void> {
    try {
      const htmlContent = this.generateDocumentHTML(data);
      
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = data.fileName.replace('.pdf', '.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating HTML:', error);
      throw new Error('Failed to generate HTML. Please try again.');
    }
  }

  // Fetch all overrides for a business/year
  static async fetchForm6765Overrides({ clientId, businessYear }: {
    clientId: string;
    businessYear: number;
  }): Promise<Form6765Override[]> {
    const { data, error } = await db.from('form_6765_overrides')
      .select('*')
      .eq('client_id', clientId)
      .eq('business_year', businessYear);

    if (error) {
      console.error('Error fetching Form 6765 overrides:', error);
      return [];
    }

    return data || [];
  }

  // Upsert a single override
  static async upsertForm6765Override(override: Omit<Form6765Override, 'id' | 'created_at' | 'updated_at'>): Promise<Form6765Override | null> {
    const { data, error } = await db.from('form_6765_overrides')
      .upsert({
        client_id: override.client_id,
        business_year: override.business_year,
        section: override.section,
        line_number: override.line_number,
        value: override.value,
        last_modified_by: override.last_modified_by,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,business_year,section,line_number'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting Form 6765 override:', error);
      return null;
    }

    return data;
  }

  static async saveForm6765Override(data: {
    clientId: string;
    businessYear: number;
    section: string;
    lineNumber: number;
    originalValue: string;
    overrideValue: string;
    reason: string;
  }): Promise<boolean> {
    // Implementation for saving Form 6765 overrides
    return true;
  }

  static async deleteForm6765Override({ clientId, businessYear, section, lineNumber }: {
    clientId: string;
    businessYear: number;
    section: string;
    lineNumber: number;
  }): Promise<boolean> {
    try {
      // Implementation for deleting Form 6765 overrides
      return true;
    } catch (error) {
      console.error('Error deleting Form 6765 override:', error);
      return false;
    }

    return true;
  }

  private static generateDocumentHTML(data: FilingGuideExportData): string {
    const { businessData, selectedYear, calculations } = data;
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
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
            background: white;
          }
          
          .page {
            width: 8.5in;
            height: 11in;
            padding: 0.5in;
            margin: 0 auto;
            background: white;
            page-break-after: always;
          }
          
          .page:last-child {
            page-break-after: avoid;
          }
          
          .cover-page {
            text-align: center;
            padding-top: 2in;
          }
          
          .logo {
            margin-bottom: 1in;
          }
          
          .logo img {
            max-width: 4in;
            height: auto;
          }
          
          .main-title {
            font-size: 14pt;
            font-weight: 600;
            margin-bottom: 0.5in;
            color: #1a365d;
          }
          
          .subtitle {
            font-size: 12pt;
            font-weight: 500;
            margin-bottom: 1in;
            color: #4a5568;
          }
          
          .cover-details {
            text-align: left;
            margin: 1in 0;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.25in;
            padding: 0.1in 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .detail-label {
            font-weight: 500;
            color: #4a5568;
          }
          
          .detail-value {
            font-weight: 400;
          }
          
          .footer {
            position: absolute;
            bottom: 0.5in;
            left: 0.5in;
            right: 0.5in;
            text-align: center;
            font-size: 10pt;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            padding-top: 0.25in;
          }
          
          .section {
            margin-bottom: 0.5in;
          }
          
          .section-title {
            font-size: 14pt;
            font-weight: 600;
            margin-bottom: 0.25in;
            color: #1a365d;
            border-bottom: 2px solid #3182ce;
            padding-bottom: 0.1in;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.25in 0;
          }
          
          .table th,
          .table td {
            border: 1px solid #e2e8f0;
            padding: 0.15in;
            text-align: left;
          }
          
          .table th {
            background-color: #f7fafc;
            font-weight: 600;
            font-size: 10pt;
          }
          
          .table td {
            font-size: 10pt;
          }
          
          .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
            font-weight: 500;
          }
          
          .percentage {
            text-align: center;
            font-weight: 500;
          }
          
          .total-row {
            background-color: #f7fafc;
            font-weight: 600;
          }
          
          .credit-row {
            background-color: #ebf8ff;
            font-weight: 600;
          }
          
          .line-number {
            text-align: center;
            font-weight: 600;
            width: 0.5in;
          }
          
          .form-6765-table {
            font-size: 9pt;
          }
          
          .form-6765-table th {
            font-size: 9pt;
            background-color: #edf2f7;
          }
          
          .form-6765-table td {
            font-size: 9pt;
          }
          
          .notes {
            margin-top: 0.25in;
            padding: 0.25in;
            background-color: #f7fafc;
            border-left: 4px solid #3182ce;
          }
          
          .notes h4 {
            margin-bottom: 0.15in;
            color: #2d3748;
          }
          
          .notes ul {
            margin-left: 0.25in;
          }
          
          .notes li {
            margin-bottom: 0.1in;
          }
          
          @media print {
            .page {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="page cover-page">
          <div class="logo">
            <img src="/images/Direct Research_horizontal advisors logo.png" alt="Direct Research Logo">
          </div>
          
          <h1 class="main-title">Federal R&D Credit Filing Guide</h1>
          <h2 class="subtitle">Prepared by Direct Research</h2>
          
          <div class="cover-details">
            <div class="detail-row">
              <span class="detail-label">Tax Year:</span>
              <span class="detail-value">${selectedYear?.year || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Client Name:</span>
              <span class="detail-value">${businessData?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date Generated:</span>
              <span class="detail-value">${currentDate}</span>
            </div>
          </div>
          
          <div class="footer">
            Direct Research | Federal Filing Guide – ${selectedYear?.year || 'N/A'}
          </div>
        </div>
        
        <!-- Content pages would be generated here based on the actual data -->
        <div class="page">
          <div class="section">
            <h2 class="section-title">Filing Process Overview</h2>
            <p>This document contains the filing guide content...</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static createProfessionalPDFContent(data: FilingGuideExportData, documentElement: HTMLElement): string {
    const { businessData, selectedYear } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Clone and clean the document content
    const contentClone = documentElement.cloneNode(true) as HTMLElement;
    this.cleanContentForPDF(contentClone);

    return `
      <div class="pdf-document">
        <!-- Professional Header -->
        <div class="pdf-header">
          <div class="header-content">
            <div class="header-left">
              <img src="/images/Direct Research_horizontal advisors logo.png" alt="Direct Research" class="header-logo" />
            </div>
            <div class="header-right">
              <h1 class="document-title">Federal R&D Credit Filing Guide</h1>
              <div class="header-details">
                <div class="detail-row">
                  <span class="label">Client:</span>
                  <span class="value">${businessData?.name || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Tax Year:</span>
                  <span class="value">${selectedYear?.year || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Generated:</span>
                  <span class="value">${currentDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Content -->
        <div class="pdf-content">
          ${contentClone.outerHTML}
        </div>

        <!-- Professional Footer -->
        <div class="pdf-footer">
          <div class="footer-content">
            <div class="footer-left">
              <span>Prepared by Direct Research</span>
            </div>
            <div class="footer-center">
              <span>Confidential & Proprietary</span>
            </div>
            <div class="footer-right">
              <span>Page <span class="page-number"></span></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private static cleanContentForPDF(element: HTMLElement): void {
    // Remove all interactive elements
    const interactiveSelectors = [
      'button', 
      'input[type="button"]', 
      'input[type="submit"]', 
      '.state-selector-container',
      '.modal-overlay',
      '.tooltip',
      '.dropdown-menu'
    ];
    
    interactiveSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Convert input fields to static text
    const inputs = element.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      const span = document.createElement('span');
      span.className = 'pdf-static-value';
      span.textContent = inputEl.value || '0';
      inputEl.parentNode?.replaceChild(span, inputEl);
    });

    // Convert select dropdowns to static text
    const selects = element.querySelectorAll('select');
    selects.forEach(select => {
      const selectEl = select as HTMLSelectElement;
      const span = document.createElement('span');
      span.className = 'pdf-static-value';
      span.textContent = selectEl.options[selectEl.selectedIndex]?.text || '';
      selectEl.parentNode?.replaceChild(span, selectEl);
    });

    // Add page break classes for better layout
    const sections = element.querySelectorAll('.filing-guide-section, .section, .form-section');
    sections.forEach((section, index) => {
      section.classList.add('pdf-page-break-avoid');
      // Add page break before major sections (but not the first one)
      if (index > 0 && section.classList.contains('filing-guide-section')) {
        section.classList.add('pdf-page-break-before');
      }
    });

    // Ensure tables don't break badly
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
      table.classList.add('pdf-table', 'pdf-page-break-avoid');
      
      // Add proper classes to table cells
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.classList.add('pdf-table-cell');
      });
    });
  }

  private static addProfessionalPDFStyles(container: HTMLElement): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Reset and Base Styles */
      .filing-guide-pdf-export * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .filing-guide-pdf-export {
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 11pt;
        line-height: 1.4;
        color: #333333;
        background: white;
        width: 8.5in;
        margin: 0 auto;
        padding: 0;
      }

      /* Professional Header */
      .pdf-header {
        width: 100%;
        border-bottom: 3px solid #2563eb;
        margin-bottom: 30px;
        padding: 20px 0;
        background: #f8fafc;
      }

      .header-content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        max-width: 7.5in;
        margin: 0 auto;
      }

      .header-left {
        flex: 0 0 auto;
      }

      .header-logo {
        max-width: 200px;
        height: auto;
      }

      .header-right {
        flex: 1;
        text-align: right;
        margin-left: 20px;
      }

      .document-title {
        font-size: 18pt;
        font-weight: bold;
        color: #1e40af;
        margin-bottom: 15px;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      .header-details {
        text-align: left;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 6px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .detail-row .label {
        font-weight: 600;
        color: #374151;
        min-width: 80px;
      }

      .detail-row .value {
        color: #111827;
        font-weight: 500;
        text-align: right;
      }

      /* Content Area */
      .pdf-content {
        max-width: 7.5in;
        margin: 0 auto 40px auto;
        padding: 0 0.25in;
      }

      /* Professional Footer */
      .pdf-footer {
        border-top: 2px solid #d1d5db;
        margin-top: 40px;
        padding: 15px 0;
        background: #f9fafb;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 7.5in;
        margin: 0 auto;
        font-size: 9pt;
        color: #6b7280;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      /* Section Styling */
      .filing-guide-section, .section, .form-section {
        margin-bottom: 25px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 20px;
      }

      .filing-guide-section-header, .section-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f3f4f6;
      }

      .filing-guide-section-title, .section-title {
        font-size: 14pt;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 5px 0;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      .filing-guide-section-subtitle, .section-subtitle {
        font-size: 10pt;
        color: #6b7280;
        margin: 0;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      /* Table Styling */
      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 10pt;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      .pdf-table th {
        background-color: #f8fafc;
        font-weight: bold;
        text-align: left;
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      .pdf-table td, .pdf-table-cell {
        padding: 6px 10px;
        border: 1px solid #d1d5db;
        vertical-align: top;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      /* Static Value Styling */
      .pdf-static-value {
        background-color: #f9fafb;
        padding: 3px 6px;
        border: 1px solid #d1d5db;
        border-radius: 3px;
        font-family: Arial, Helvetica, sans-serif !important;
        font-weight: 500;
        display: inline-block;
        min-width: 40px;
        text-align: center;
      }

      /* Typography Overrides */
      .pdf-content h1, .pdf-content h2, .pdf-content h3, .pdf-content h4, .pdf-content h5, .pdf-content h6 {
        font-family: Arial, Helvetica, sans-serif !important;
        color: #1f2937;
        margin: 15px 0 10px 0;
      }

      .pdf-content h1 { font-size: 16pt; }
      .pdf-content h2 { font-size: 14pt; }
      .pdf-content h3 { font-size: 12pt; }
      .pdf-content h4 { font-size: 11pt; }

      .pdf-content p, .pdf-content div, .pdf-content span {
        font-family: Arial, Helvetica, sans-serif !important;
      }

      /* Page Break Controls */
      .pdf-page-break-before {
        page-break-before: always !important;
        break-before: page !important;
      }

      .pdf-page-break-after {
        page-break-after: always !important;
        break-after: page !important;
      }

      .pdf-page-break-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      /* Form Styling */
      .form-6765-table {
        font-size: 9pt;
      }

      .form-6765-table th,
      .form-6765-table td {
        font-size: 9pt;
        padding: 4px 6px;
      }

      /* Amount Formatting */
      .amount, .currency, .number {
        text-align: right;
        font-family: Arial, Helvetica, sans-serif !important;
        font-weight: 500;
      }

      .percentage {
        text-align: center;
        font-weight: 500;
      }

      /* Hide elements that shouldn't appear in PDF */
      .no-print,
      .modal,
      .tooltip,
      .dropdown,
      .popup {
        display: none !important;
      }

      /* Print Media Queries */
      @media print {
        .filing-guide-pdf-export {
          font-size: 10pt;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        .pdf-header,
        .pdf-footer {
          position: fixed;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        
        .pdf-header {
          top: 0;
        }
        
        .pdf-footer {
          bottom: 0;
        }

        .pdf-content {
          margin: 1in 0.5in;
        }
      }
    `;
    
    container.appendChild(style);
  }
} 