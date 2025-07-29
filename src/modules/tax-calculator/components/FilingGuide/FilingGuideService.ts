import html2pdf from 'html2pdf.js';
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

      // Create a professional wrapper for the PDF
      const container = document.createElement('div');
      container.className = 'filing-guide-pdf-export';
      
      // Add professional header and styling
      const headerHTML = this.generatePDFHeader(data);
      const footerHTML = this.generatePDFFooter(data);
      
      // Clone the actual document content
      const documentClone = existingDocument.cloneNode(true) as HTMLElement;
      
      // Apply PDF-specific styling
      this.applyPDFStyling(documentClone);
      
      // Combine header + content + footer
      container.innerHTML = `
        <div class="pdf-page-wrapper">
          ${headerHTML}
          <div class="pdf-content">
            ${documentClone.outerHTML}
          </div>
          ${footerHTML}
        </div>
      `;
      
      // Add comprehensive PDF styles
      this.addPDFStyles(container);
      
      // Add to DOM temporarily
      document.body.appendChild(container);
      
      // Enhanced PDF options for professional output
      const pdfOptions = {
        margin: [0.75, 0.5, 0.75, 0.5], // top, right, bottom, left in inches
        filename: data.fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          width: 816, // 8.5 inches at 96 DPI
          height: 1056 // 11 inches at 96 DPI
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
      };
      
      // Generate PDF with better error handling
      await html2pdf().from(container).set(pdfOptions).save();
      
      // Clean up
      document.body.removeChild(container);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
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

  // Generate professional PDF header
  private static generatePDFHeader(data: FilingGuideExportData): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="pdf-header page-break-avoid">
        <div class="header-logo">
          <img src="/images/Direct Research_horizontal advisors logo.png" alt="Direct Research Logo" style="height: 40px;">
        </div>
        <div class="header-content">
          <h1 class="header-title">Federal R&D Credit Filing Guide</h1>
          <div class="header-details">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Client:</span>
                <span class="detail-value">${data.businessData?.name || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Tax Year:</span>
                <span class="detail-value">${data.selectedYear?.year || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Method:</span>
                <span class="detail-value">${data.calculations?.selectedMethod === 'asc' ? 'Alternative Simplified Credit (ASC)' : 'Standard Method'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date Prepared:</span>
                <span class="detail-value">${currentDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Generate professional PDF footer
  private static generatePDFFooter(data: FilingGuideExportData): string {
    return `
      <div class="pdf-footer page-break-avoid">
        <div class="footer-content">
          <div class="footer-left">
            <span>Direct Research - R&D Tax Credit Specialists</span>
          </div>
          <div class="footer-center">
            <span>Confidential & Proprietary</span>
          </div>
          <div class="footer-right">
            <span>Tax Year ${data.selectedYear?.year || 'N/A'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Apply PDF-specific styling to the document content
  private static applyPDFStyling(element: HTMLElement): void {
    // Remove interactive elements that don't make sense in PDF
    const interactiveElements = element.querySelectorAll('button, input[type="checkbox"], select, .state-selector-container');
    interactiveElements.forEach(el => {
      if (el.tagName.toLowerCase() === 'input' && (el as HTMLInputElement).type === 'text') {
        // Convert text inputs to static values
        const input = el as HTMLInputElement;
        const span = document.createElement('span');
        span.className = 'pdf-static-value';
        span.textContent = input.value || '0';
        el.parentNode?.replaceChild(span, el);
      } else if (el.tagName.toLowerCase() === 'select') {
        // Convert selects to static values
        const select = el as HTMLSelectElement;
        const span = document.createElement('span');
        span.className = 'pdf-static-value';
        span.textContent = select.options[select.selectedIndex]?.text || '';
        el.parentNode?.replaceChild(span, el);
      } else {
        // Remove other interactive elements
        el.remove();
      }
    });

    // Add page break classes for better PDF layout
    const sections = element.querySelectorAll('.filing-guide-section');
    sections.forEach((section, index) => {
      if (index > 0) {
        section.classList.add('page-break-before');
      }
      section.classList.add('page-break-avoid');
    });

    // Enhance table formatting
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
      table.classList.add('pdf-table', 'page-break-avoid');
      
      // Add borders and better spacing for PDF
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '20px';
      
      const cells = table.querySelectorAll('th, td');
      cells.forEach(cell => {
        (cell as HTMLElement).style.border = '1px solid #ddd';
        (cell as HTMLElement).style.padding = '8px';
        (cell as HTMLElement).style.textAlign = 'left';
      });
    });
  }

  // Add comprehensive PDF styles
  private static addPDFStyles(container: HTMLElement): void {
    const style = document.createElement('style');
    style.textContent = `
      .filing-guide-pdf-export {
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #333;
        background: white;
        max-width: 8.5in;
        margin: 0 auto;
      }

      .pdf-header {
        display: flex;
        align-items: center;
        padding: 20px 0;
        border-bottom: 2px solid #2563eb;
        margin-bottom: 30px;
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
      }

      .header-logo {
        margin-right: 20px;
      }

      .header-content {
        flex: 1;
      }

      .header-title {
        font-size: 18pt;
        font-weight: bold;
        color: #1e40af;
        margin: 0 0 15px 0;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .detail-label {
        font-weight: 600;
        color: #374151;
      }

      .detail-value {
        color: #111827;
        font-weight: 500;
      }

      .pdf-content {
        margin: 20px 0;
      }

      .pdf-footer {
        border-top: 1px solid #d1d5db;
        margin-top: 40px;
        padding-top: 20px;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9pt;
        color: #6b7280;
      }

      .filing-guide-section {
        margin-bottom: 30px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
      }

      .filing-guide-section-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f3f4f6;
      }

      .filing-guide-section-icon {
        font-size: 18pt;
        margin-right: 15px;
      }

      .filing-guide-section-title {
        font-size: 14pt;
        font-weight: bold;
        color: #1f2937;
        margin: 0;
      }

      .filing-guide-section-subtitle {
        font-size: 10pt;
        color: #6b7280;
        margin: 5px 0 0 0;
      }

      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 10pt;
      }

      .pdf-table th {
        background-color: #f8fafc;
        font-weight: bold;
        text-align: left;
        padding: 10px;
        border: 1px solid #d1d5db;
      }

      .pdf-table td {
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        vertical-align: top;
      }

      .pdf-static-value {
        background-color: #f9fafb;
        padding: 4px 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-weight: 500;
      }

      .page-break-before {
        page-break-before: always !important;
        break-before: page !important;
      }

      .page-break-after {
        page-break-after: always !important;
        break-after: page !important;
      }

      .page-break-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      @media print {
        .filing-guide-pdf-export {
          font-size: 10pt;
        }
        
        .pdf-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        
        .pdf-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
      }
    `;
    
    container.appendChild(style);
  }

  // Delete a single override
  static async deleteForm6765Override({ clientId, businessYear, section, lineNumber }: {
    clientId: string;
    businessYear: number;
    section: string;
    lineNumber: number;
  }): Promise<boolean> {
    const { error } = await db.from('form_6765_overrides')
      .delete()
      .eq('client_id', clientId)
      .eq('business_year', businessYear)
      .eq('section', section)
      .eq('line_number', lineNumber);

    if (error) {
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
} 