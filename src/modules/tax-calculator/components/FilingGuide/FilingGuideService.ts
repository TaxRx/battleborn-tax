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
      console.log('🚀 [PUPPETEER PDF] Starting PDF generation...');
      console.log('🔍 [PUPPETEER PDF] Data received:', { 
        hasBusinessData: !!data.businessData,
        hasSelectedYear: !!data.selectedYear,
        hasCalculations: !!data.calculations,
        fileName: data.fileName
      });

      // Find the existing FilingGuideDocument in the DOM
      let existingDocument = document.querySelector('.filing-guide-preview .filing-guide-document');
      
      if (!existingDocument) {
        console.log('🔍 [PUPPETEER PDF] .filing-guide-preview .filing-guide-document not found, trying .filing-guide-document...');
        existingDocument = document.querySelector('.filing-guide-document');
      }
      
      if (!existingDocument) {
        console.log('🔍 [PUPPETEER PDF] .filing-guide-document not found, trying .filing-guide-preview...');
        existingDocument = document.querySelector('.filing-guide-preview');
      }
      
      if (!existingDocument) {
        console.error('❌ [PUPPETEER PDF] Filing guide content not found');
        throw new Error('Filing guide content not found. Please ensure the filing guide is open.');
      }
      
      console.log('✅ [PUPPETEER PDF] Found filing guide content:', {
        tagName: existingDocument.tagName,
        className: existingDocument.className,
        hasContent: !!existingDocument.innerHTML,
        contentLength: existingDocument.innerHTML.length
      });

      // Create complete HTML document for Puppeteer
      const htmlContent = this.createPuppeteerHTML(data, existingDocument as HTMLElement);
      console.log('✅ [PUPPETEER PDF] Created HTML content for Puppeteer');
      console.log('🔍 [PUPPETEER PDF] HTML content length:', htmlContent.length);
      console.log('🔍 [PUPPETEER PDF] HTML preview:', htmlContent.substring(0, 500) + '...');

      // Send to PDF generation API endpoint
      await this.generatePDFWithPuppeteer(htmlContent, data.fileName);
      console.log('✅ [PUPPETEER PDF] PDF generated successfully:', data.fileName);
      
    } catch (error) {
      console.error('❌ [PUPPETEER PDF] Error generating PDF:', error);
      alert(`❌ Failed to generate PDF: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
      throw error;
    }
  }

  static async exportToHTML(data: FilingGuideExportData): Promise<void> {
    try {
      console.log('🔍 [HTML EXPORT] Starting HTML generation...');
      
      // Find the existing FilingGuideDocument in the DOM (same as PDF export)
      let existingDocument = document.querySelector('.filing-guide-preview .filing-guide-document');
      
      if (!existingDocument) {
        console.log('🔍 [HTML EXPORT] .filing-guide-preview .filing-guide-document not found, trying .filing-guide-document...');
        existingDocument = document.querySelector('.filing-guide-document');
      }
      
      if (!existingDocument) {
        console.error('❌ [HTML EXPORT] Filing guide content not found');
        // Fallback to static template
        const htmlContent = this.generateDocumentHTML(data);
        this.downloadHTML(htmlContent, data.fileName.replace('.pdf', '.html'));
        return;
      }

      console.log('✅ [HTML EXPORT] Found filing guide content');
      
      // Generate complete HTML document with actual content
      const htmlContent = this.generateCompleteHTML(data, existingDocument as HTMLElement);
      this.downloadHTML(htmlContent, data.fileName.replace('.pdf', '.html'));
      
      console.log('✅ [HTML EXPORT] HTML generated successfully');
      
    } catch (error) {
      console.error('❌ [HTML EXPORT] Error generating HTML:', error);
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

  private static downloadHTML(htmlContent: string, fileName: string): void {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  private static generateCompleteHTML(data: FilingGuideExportData, documentElement: HTMLElement): string {
    const { businessData, selectedYear } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Clone and clean the document content for HTML export
    const contentClone = documentElement.cloneNode(true) as HTMLElement;
    this.cleanContentForHTML(contentClone);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Federal Filing Guide - ${businessData?.name || 'Client'}</title>
        <style>
          ${this.getHTMLExportStyles()}
        </style>
      </head>
      <body>
        <div class="html-export-wrapper">
          <!-- Professional Header -->
          <div class="html-export-header">
            <div class="header-content">
              <div class="header-left">
                <img src="data:image/svg+xml;base64,${this.getLogoBase64()}" alt="Direct Research" class="header-logo" />
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
          <div class="html-export-content">
            ${contentClone.outerHTML}
          </div>

          <!-- Professional Footer -->
          <div class="html-export-footer">
            <div class="footer-content">
              <div class="footer-left">
                <span>Prepared by Direct Research</span>
              </div>
              <div class="footer-center">
                <span>Confidential & Proprietary</span>
              </div>
              <div class="footer-right">
                <span>Tax Year ${selectedYear?.year || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
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
            <img src="data:image/svg+xml;base64,${this.getLogoBase64()}" alt="Direct Research Logo">
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

  private static createSimplePDFContent(data: FilingGuideExportData, documentElement: HTMLElement): string {
    const { businessData, selectedYear } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Extract text content more aggressively
    const textContent = this.extractContentText(documentElement);
    
    return `
      <div class="pdf-document" style="min-height: 1000px; padding: 20px; font-family: Arial, sans-serif;">
        <!-- Simple Header -->
        <div class="pdf-header" style="text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid #333;">
          <h1 style="color: #1e3a8a; margin: 0 0 10px 0; font-size: 24px;">Federal R&D Credit Filing Guide</h1>
          <p style="margin: 5px 0; font-size: 14px;">Prepared by Direct Research</p>
          <p style="margin: 5px 0; font-size: 14px;">Client: ${businessData?.name || 'N/A'} | Tax Year: ${selectedYear?.year || 'N/A'} | Generated: ${currentDate}</p>
        </div>

        <!-- Content Area -->
        <div class="pdf-content" style="min-height: 800px; line-height: 1.6;">
          ${textContent}
        </div>

        <!-- Footer -->
        <div class="pdf-footer" style="text-align: center; margin-top: 30px; padding: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
          <p>Confidential & Proprietary | Direct Research | Tax Year ${selectedYear?.year || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  private static extractContentText(element: HTMLElement): string {
    // Create a clean copy for text extraction
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove all scripts, styles, and interactive elements
    const unwanted = clone.querySelectorAll('script, style, button, input, select, .state-selector-container, .modal-overlay');
    unwanted.forEach(el => el.remove());
    
    // Get all meaningful content sections
    const sections = clone.querySelectorAll('.filing-guide-section, .section, .filing-guide-cover-page, .about-direct-research, .filing-process-overview, .qre-summary-tables');
    
    let content = '';
    
    if (sections.length > 0) {
      sections.forEach((section, index) => {
        const title = section.querySelector('h1, h2, h3, .filing-guide-section-title, .section-title')?.textContent?.trim();
        if (title) {
          content += `<h2 style="color: #1e3a8a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${title}</h2>\n`;
        }
        
        // Extract paragraphs and text content
        const paragraphs = section.querySelectorAll('p, li, td');
        paragraphs.forEach(p => {
          const text = p.textContent?.trim();
          if (text && text.length > 10) {
            content += `<p style="margin: 10px 0; font-size: 14px;">${text}</p>\n`;
          }
        });
        
        // Extract table data
        const tables = section.querySelectorAll('table');
        tables.forEach(table => {
          content += '<div style="margin: 20px 0;"><table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">';
          const rows = table.querySelectorAll('tr');
          rows.forEach((row, rowIndex) => {
            content += '<tr>';
            const cells = row.querySelectorAll('td, th');
            cells.forEach(cell => {
              const isHeader = cell.tagName === 'TH' || rowIndex === 0;
              const style = isHeader 
                ? 'padding: 8px; border: 1px solid #ccc; background: #f5f5f5; font-weight: bold;'
                : 'padding: 8px; border: 1px solid #ccc;';
              content += `<${cell.tagName.toLowerCase()} style="${style}">${cell.textContent?.trim() || ''}</${cell.tagName.toLowerCase()}>`;
            });
            content += '</tr>';
          });
          content += '</table></div>';
        });
      });
    } else {
      // Fallback: extract any text content
      content = `<div style="padding: 20px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Complete filing guide content captured from live application.</p>
        <div style="white-space: pre-wrap; font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${element.textContent?.substring(0, 2000) || 'No content found'}...
        </div>
      </div>`;
    }
    
    return content || '<p style="padding: 20px; font-size: 16px;">No content available for PDF generation.</p>';
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
              <img src="data:image/svg+xml;base64,${this.getLogoBase64()}" alt="Direct Research" class="header-logo" />
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

  private static cleanContentForHTML(element: HTMLElement): void {
    // Remove all interactive elements for HTML export (similar to PDF)
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
      span.className = 'html-static-value';
      span.textContent = inputEl.value || '0';
      inputEl.parentNode?.replaceChild(span, inputEl);
    });

    // Convert select dropdowns to static text
    const selects = element.querySelectorAll('select');
    selects.forEach(select => {
      const selectEl = select as HTMLSelectElement;
      const span = document.createElement('span');
      span.className = 'html-static-value';
      span.textContent = selectEl.options[selectEl.selectedIndex]?.text || '';
      selectEl.parentNode?.replaceChild(span, selectEl);
    });

    // Ensure tables render properly
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
      table.classList.add('html-table');
      
      // Add proper classes to table cells
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.classList.add('html-table-cell');
      });
    });
  }

  private static getHTMLExportStyles(): string {
    return `
      /* Reset and Base Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333333;
        background: white;
        margin: 0;
        padding: 20px;
      }

      .html-export-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }

      /* Professional Header */
      .html-export-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6366f1 100%);
        color: white;
        padding: 30px;
        border-radius: 8px 8px 0 0;
      }

      .header-content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 30px;
      }

      .header-left {
        flex: 0 0 auto;
      }

      .header-logo {
        max-width: 250px;
        height: auto;
        filter: brightness(0) invert(1);
      }

      .header-right {
        flex: 1;
        text-align: right;
      }

      .document-title {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 20px;
        letter-spacing: -0.5px;
      }

      .header-details {
        text-align: left;
        background: rgba(255, 255, 255, 0.1);
        padding: 20px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .detail-row:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .detail-row .label {
        font-weight: 600;
        min-width: 120px;
      }

      .detail-row .value {
        font-weight: 500;
        text-align: right;
      }

      /* Content Area */
      .html-export-content {
        padding: 40px;
        background: white;
      }

      /* Professional Footer */
      .html-export-footer {
        background: #f8fafc;
        border-top: 2px solid #e5e7eb;
        padding: 20px 30px;
        border-radius: 0 0 8px 8px;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        color: #6b7280;
      }

      .footer-left,
      .footer-center,
      .footer-right {
        flex: 1;
        text-align: center;
      }

      .footer-left {
        text-align: left;
        font-weight: 600;
      }

      .footer-right {
        text-align: right;
      }

      /* Filing Guide Sections */
      .filing-guide-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 30px;
        margin-bottom: 30px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .filing-guide-section-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #e5e7eb;
      }

      .filing-guide-section-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        font-weight: bold;
      }

      .filing-guide-section-title {
        font-size: 24px;
        font-weight: bold;
        color: #1f2937;
        margin: 0;
      }

      .filing-guide-section-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin-top: 4px;
      }

      /* Table Styling */
      .html-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
      }

      .html-table th {
        background-color: #f8fafc;
        font-weight: bold;
        text-align: left;
        padding: 12px 16px;
        border-bottom: 2px solid #e5e7eb;
        font-size: 14px;
      }

      .html-table td,
      .html-table-cell {
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
        font-size: 14px;
      }

      .html-table tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }

      /* Static Value Styling */
      .html-static-value {
        background-color: #f3f4f6;
        padding: 4px 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-weight: 500;
        display: inline-block;
        min-width: 50px;
        text-align: center;
      }

      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        color: #1f2937;
        margin: 20px 0 12px 0;
        font-weight: bold;
      }

      h1 { font-size: 28px; }
      h2 { font-size: 24px; }
      h3 { font-size: 20px; }
      h4 { font-size: 18px; }

      p {
        margin: 12px 0;
        line-height: 1.6;
      }

      /* Amount Formatting */
      .amount, .currency, .number {
        text-align: right;
        font-family: 'Courier New', monospace;
        font-weight: 500;
      }

      .percentage {
        text-align: center;
        font-weight: 500;
      }

      /* Cover Page Specific */
      .filing-guide-cover-page {
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6366f1 100%);
        color: white;
        padding: 60px;
        text-align: center;
        border-radius: 8px;
        margin-bottom: 30px;
      }

      .filing-guide-main-title {
        font-size: 36px;
        font-weight: bold;
        margin-bottom: 16px;
      }

      .filing-guide-subtitle {
        font-size: 20px;
        margin-bottom: 40px;
        opacity: 0.9;
      }

      .filing-guide-cover-details {
        max-width: 500px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.1);
        padding: 30px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }

      .filing-guide-detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .filing-guide-detail-row:last-child {
        border-bottom: none;
      }

      .filing-guide-detail-label {
        font-weight: 600;
      }

      .filing-guide-detail-value {
        font-weight: 500;
      }

      /* Process Steps */
      .process-steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }

      .process-step {
        display: flex;
        gap: 16px;
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .step-number {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        flex-shrink: 0;
      }

      .step-content h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
      }

      .step-content p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }

      /* Print Styles */
      @media print {
        body {
          padding: 0;
        }
        
        .html-export-wrapper {
          box-shadow: none;
          max-width: none;
        }
        
        .filing-guide-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .filing-guide-cover-page {
          page-break-after: always;
        }
      }
    `;
  }

  private static getLogoBase64(): string {
    // For now, return a simple placeholder. In production, you'd want to:
    // 1. Load the actual logo file as base64
    // 2. Or use a data URI of the actual logo
    // 3. Or fetch it from the server and convert to base64
    return btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="250" height="60" viewBox="0 0 250 60">
        <rect width="250" height="60" fill="white"/>
        <text x="125" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e3a8a">
          Direct Research
        </text>
      </svg>
    `);
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
        min-height: 11in;
        overflow: visible;
        position: relative;
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
        min-height: 400px;
        position: relative;
        overflow: visible;
      }

      /* Ensure all filing guide sections are visible */
      .pdf-content .filing-guide-section {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        background: white !important;
        margin-bottom: 20px !important;
        padding: 20px !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 6px !important;
      }

      /* Ensure content inside sections is visible */
      .pdf-content .filing-guide-section * {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* Special handling for spans and inline elements */
      .pdf-content .filing-guide-section span,
      .pdf-content .filing-guide-section a,
      .pdf-content .filing-guide-section em,
      .pdf-content .filing-guide-section strong {
        display: inline !important;
      }

      /* Ensure tables are properly displayed */
      .pdf-content table {
        display: table !important;
        visibility: visible !important;
        width: 100% !important;
        border-collapse: collapse !important;
      }

      .pdf-content table tr {
        display: table-row !important;
      }

      .pdf-content table td,
      .pdf-content table th {
        display: table-cell !important;
        visibility: visible !important;
        padding: 8px !important;
        border: 1px solid #e5e7eb !important;
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
      .popup,
      .state-selector-container,
      button,
      input[type="button"],
      input[type="submit"] {
        display: none !important;
        visibility: hidden !important;
      }

      /* Force visibility for key content */
      .pdf-content .filing-guide-cover-page,
      .pdf-content .filing-guide-section-header,
      .pdf-content .filing-guide-section-title,
      .pdf-content .filing-guide-section-subtitle,
      .pdf-content .qre-table,
      .pdf-content .filing-process-overview,
      .pdf-content .about-direct-research {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
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

  // ================================
  // PUPPETEER PDF GENERATION METHODS
  // ================================

  private static createPuppeteerHTML(data: FilingGuideExportData, documentElement: HTMLElement): string {
    const { businessData, selectedYear } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Clone and reorganize the document content with proper page breaks
    const contentClone = documentElement.cloneNode(true) as HTMLElement;
    const structuredContent = this.restructureContentWithPageBreaks(contentClone, data);

    // Capture live CSS from the current page
    const liveCSS = this.captureLiveCSS();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Federal Filing Guide - ${businessData?.name || 'Client'}</title>
        
        <!-- Google Fonts - Plus Jakarta Sans -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet">
        
        <!-- Live CSS from the application -->
        <style id="live-css">
          ${liveCSS}
        </style>
        
        <!-- Enhanced PDF-specific styles with page breaks -->
        <style id="pdf-styles">
          ${this.getEnhancedPDFStylesWithPageBreaks()}
        </style>
      </head>
      <body>
        <div class="pdf-wrapper">
          ${structuredContent}
        </div>
      </body>
      </html>
    `;
  }

  private static async generatePDFWithPuppeteer(htmlContent: string, fileName: string): Promise<void> {
    try {
      console.log('🚀 [PUPPETEER API] Sending HTML to PDF generation endpoint...');
      console.log('📊 [PUPPETEER API] Request details:', {
        htmlLength: htmlContent.length,
        fileName: fileName,
        endpoint: 'http://localhost:3001/api/generate-pdf'
      });

      // Call our Express PDF server running on port 3001
      const response = await fetch('http://localhost:3001/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          filename: fileName,
          options: {
            format: 'Letter',
            margin: {
              top: '0.75in',
              right: '0.5in',
              bottom: '0.75in',
              left: '0.5in'
            },
            printBackground: true,
            preferCSSPageSize: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status} ${response.statusText}`);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('✅ [PUPPETEER API] PDF downloaded successfully:', fileName);

    } catch (error) {
      console.error('❌ [PUPPETEER API] Error:', error);
      console.error('❌ [PUPPETEER API] Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a connection error
      if (error.message.includes('fetch')) {
        console.error('❌ [PUPPETEER API] Network error - PDF server may not be running');
        alert('PDF server is not running. Please start the PDF server with: npm run pdf-server');
        return;
      }
      
      // Fallback: Download HTML content instead
      console.log('🔄 [PUPPETEER API] Falling back to HTML download...');
      this.downloadHTML(htmlContent, fileName.replace('.pdf', '_fallback.html'));
      
      throw new Error(`PDF generation service unavailable. HTML version downloaded instead. Original error: ${error.message}`);
    }
  }

  private static restructureContentWithPageBreaks(element: HTMLElement, data: FilingGuideExportData): string {
    const { businessData, selectedYear } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log('🔄 [PDF] Restructuring content with page breaks for:', businessData?.name, selectedYear?.year);

    // Clean the element first
    this.cleanContentForPuppeteer(element);

    // Extract sections from the existing content using multiple selector patterns
    const sections = {
      cover: this.extractSection(element, '#filing-guide-section-cover, .filing-guide-cover-page, [id*="cover"]'),
      about: this.extractSection(element, '#filing-guide-section-about, .about-direct-research, [id*="about"]'),
      overview: this.extractSection(element, '#filing-guide-section-overview, .filing-process-overview, [id*="overview"]'),
      processSteps: this.extractSection(element, '.filing-process-steps, .process-steps'), // Will be removed
      summaryTables: this.extractSection(element, '#filing-guide-section-summary, .qre-summary-tables, .qre-table, [id*="summary"]'),
      calculationSummary: this.extractSection(element, '.calculation-method-summary'), // Will be removed
      form6765: this.extractSection(element, '#filing-guide-section-form6765, .form-6765, [id*="form6765"], [id*="form-6765"]'),
      stateCredits: this.extractSection(element, '#filing-guide-section-state, .state-credits, .state-pro-forma, [id*="state"]'),
      stateGuidelines: this.extractSection(element, '.state-guidelines, .state-filing-guidelines, [class*="guidelines"]'),
      calculations: this.extractSection(element, '#filing-guide-section-calculations, .calculation-specifics, [id*="calculation"]'),
      researchBaseline: this.extractSection(element, '.research-activity-baseline, .research-baseline, [class*="baseline"], [class*="research-activity"]')
    };

    // Check if it's pre-2024 Form 6765
    const isPre2024 = selectedYear && selectedYear.year < 2024;

    // Log what sections were found
    console.log('📋 [PDF] Extracted sections:', {
      cover: !!sections.cover,
      about: !!sections.about,
      overview: !!sections.overview,
      summaryTables: !!sections.summaryTables,
      form6765: !!sections.form6765,
      stateCredits: !!sections.stateCredits,
      stateGuidelines: !!sections.stateGuidelines,
      calculations: !!sections.calculations,
      researchBaseline: !!sections.researchBaseline,
      isPre2024
    });

    return `
      <!-- Page 1: Title Page -->
      <div class="pdf-page title-page">
        ${this.createTitlePage(businessData, selectedYear, currentDate)}
      </div>

      <!-- Page 2: About Direct Research -->
      <div class="pdf-page about-page">
        ${sections.about || this.createAboutSection()}
      </div>

      <!-- Page 3: Filing Process Overview -->
      <div class="pdf-page overview-page">
        ${sections.overview || this.createFilingProcessOverview()}
      </div>

      <!-- Page 4: Summary Tables and Visuals -->
      <div class="pdf-page summary-page">
        <div class="filing-guide-section">
          <div class="filing-guide-section-header">
            <div class="filing-guide-section-title">Summary Tables and Visuals</div>
            <div class="filing-guide-section-subtitle">QRE calculations and visual breakdowns</div>
          </div>
          ${sections.summaryTables || '<p>Summary tables will be displayed here.</p>'}
        </div>
      </div>

      <!-- Page 5-6: Form 6765 -->
      <div class="pdf-page form-page ${isPre2024 ? 'pre-2024-form' : 'form-2024-plus'}">
        <div class="filing-guide-section">
          <div class="filing-guide-section-header">
            <div class="filing-guide-section-title">Form 6765 ${isPre2024 ? '(Pre-2024)' : '(2024+)'}</div>
            <div class="filing-guide-section-subtitle">Credit for Increasing Research Activities</div>
          </div>
          ${sections.form6765 || '<p>Form 6765 will be displayed here.</p>'}
        </div>
      </div>

      <!-- Page 7: State Pro Forma (Single Page) -->
      ${sections.stateCredits ? `
      <div class="pdf-page state-proforma-page">
        <div class="filing-guide-section state-proforma-compact">
          <div class="filing-guide-section-header">
            <div class="filing-guide-section-title">State Credits Pro Forma</div>
            <div class="filing-guide-section-subtitle">State-specific R&D credit calculations</div>
          </div>
          ${sections.stateCredits}
        </div>
      </div>
      ` : ''}

      <!-- Page 8: State Guidelines (Single Page) -->
      ${sections.stateGuidelines ? `
      <div class="pdf-page state-guidelines-page">
        <div class="filing-guide-section">
          <div class="filing-guide-section-header">
            <div class="filing-guide-section-title">State Guidelines</div>
            <div class="filing-guide-section-subtitle">State-specific filing requirements and notes</div>
          </div>
          ${sections.stateGuidelines}
        </div>
      </div>
      ` : ''}

      <!-- Page 9: Research Activity Baseline (New Page) -->
      ${sections.researchBaseline ? `
      <div class="pdf-page research-baseline-page">
        <div class="filing-guide-section">
          <div class="filing-guide-section-header">
            <div class="filing-guide-section-title">Research Activity Baseline</div>
            <div class="filing-guide-section-subtitle">Research activities and baseline calculations</div>
          </div>
          ${sections.researchBaseline}
        </div>
      </div>
      ` : ''}

      <!-- Additional Calculation Specifics -->
      ${sections.calculations ? `
      <div class="pdf-page calculations-page">
        <div class="filing-guide-section">
          <div class="filing-guide-section-header">
            <div class="filing-guide-section-title">Calculation Specifics</div>
            <div class="filing-guide-section-subtitle">Detailed calculation methodology and notes</div>
          </div>
          ${sections.calculations}
        </div>
      </div>
      ` : ''}
    `;
  }

  private static extractSection(element: HTMLElement, selectors: string): string {
    // Try multiple selectors separated by commas
    const selectorList = selectors.split(',').map(s => s.trim());
    
    for (const selector of selectorList) {
      try {
        const section = element.querySelector(selector);
        if (section) {
          console.log(`✅ [PDF] Found section with selector: ${selector}`);
          // Clone the section to avoid modifying the original
          const sectionClone = section.cloneNode(true) as HTMLElement;
          this.cleanContentForPuppeteer(sectionClone);
          return sectionClone.outerHTML;
        }
      } catch (error) {
        console.warn(`⚠️ [PDF] Invalid selector: ${selector}`, error);
      }
    }
    
    console.log(`❌ [PDF] No section found for selectors: ${selectors}`);
    return '';
  }

  private static createTitlePage(businessData: any, selectedYear: any, currentDate: string): string {
    return `
      <div class="title-page-content">
        <div class="title-logo">
          <img src="/images/Direct Research_horizontal advisors logo.png" alt="Direct Research Logo" class="title-logo-img">
        </div>
        
        <h1 class="title-main">Federal R&D Credit Filing Guide</h1>
        <h2 class="title-subtitle">Prepared by Direct Research</h2>
        
        <div class="title-details">
          <div class="detail-row">
            <span class="detail-label">Client Name:</span>
            <span class="detail-value">${businessData?.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tax Year:</span>
            <span class="detail-value">${selectedYear?.year || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date Generated:</span>
            <span class="detail-value">${currentDate}</span>
          </div>
        </div>
        
        <div class="title-footer">
          <p>This document contains confidential and proprietary information prepared specifically for the above-named client.</p>
        </div>
      </div>
    `;
  }

  private static createAboutSection(): string {
    return `
      <div class="about-content">
        <h2>About Direct Research</h2>
        <p>Direct Research is a leading provider of R&D tax credit services, specializing in helping businesses maximize their federal and state research and development tax incentives.</p>
        
        <h3>Our Services</h3>
        <ul>
          <li>R&D Tax Credit Studies and Documentation</li>
          <li>Federal and State Credit Calculations</li>
          <li>IRS Audit Defense and Support</li>
          <li>Research Activity Documentation</li>
          <li>Multi-State Credit Optimization</li>
        </ul>
        
        <h3>Our Expertise</h3>
        <p>With years of experience in R&D tax credit consulting, our team understands the complexities of federal and state regulations, ensuring your business captures every eligible credit while maintaining full compliance.</p>
      </div>
    `;
  }

  private static createFilingProcessOverview(): string {
    return `
      <div class="overview-content">
        <h2>Filing Process Overview</h2>
        <p>This section provides a comprehensive overview of the R&D tax credit filing process and key considerations for your tax return.</p>
        
        <h3>Key Filing Requirements</h3>
        <ul>
          <li>Complete Form 6765 for federal R&D credit claim</li>
          <li>Attach supporting documentation and calculations</li>
          <li>File applicable state forms for additional credits</li>
          <li>Maintain detailed records of research activities</li>
        </ul>
        
        <h3>Important Deadlines</h3>
        <ul>
          <li>Federal filing: Original tax return due date (with extensions)</li>
          <li>State filings: Vary by state (see state-specific guidelines)</li>
          <li>Documentation retention: Minimum 3 years, recommended 6+ years</li>
        </ul>
      </div>
    `;
  }

  private static cleanContentForPuppeteer(element: HTMLElement): void {
    // Remove all interactive elements
    const interactiveSelectors = [
      'button', 
      'input[type="button"]', 
      'input[type="submit"]', 
      '.state-selector-container',
      '.modal-overlay',
      '.tooltip',
      '.dropdown-menu',
      'script',
      'style'
    ];
    
    interactiveSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Convert input fields to static text while preserving styling classes
    const inputs = element.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      const span = document.createElement('span');
      span.className = `pdf-static-value ${inputEl.className}`;
      span.textContent = inputEl.value || '0';
      inputEl.parentNode?.replaceChild(span, inputEl);
    });

    // Convert select dropdowns to static text while preserving styling classes
    const selects = element.querySelectorAll('select');
    selects.forEach(select => {
      const selectEl = select as HTMLSelectElement;
      const span = document.createElement('span');
      span.className = `pdf-static-value ${selectEl.className}`;
      span.textContent = selectEl.options[selectEl.selectedIndex]?.text || '';
      selectEl.parentNode?.replaceChild(span, selectEl);
    });

    // Preserve and enhance existing classes for better PDF styling
    const sections = element.querySelectorAll('.filing-guide-section, .section, .form-section');
    sections.forEach((section) => {
      section.classList.add('pdf-section');
    });

    // Enhance table styling while preserving existing classes
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
      table.classList.add('pdf-table');
      
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        header.classList.add('pdf-table-header');
      });
      
      const cells = table.querySelectorAll('td');
      cells.forEach(cell => {
        cell.classList.add('pdf-table-cell');
      });
    });

    // Add PDF-specific classes for common elements
    const amounts = element.querySelectorAll('.amount, .currency, .number');
    amounts.forEach(amount => {
      amount.classList.add('pdf-amount');
    });

    const percentages = element.querySelectorAll('.percentage');
    percentages.forEach(percentage => {
      percentage.classList.add('pdf-percentage');
    });

    // Ensure all headings have proper PDF classes
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.classList.add('pdf-heading');
    });

    // Ensure paragraphs have proper styling
    const paragraphs = element.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
      paragraph.classList.add('pdf-text');
    });
  }

  private static captureLiveCSS(): string {
    try {
      // Capture CSS from all stylesheets in the current page
      let allCSS = '';
      
      // Get CSS from style elements
      const styleElements = document.querySelectorAll('style');
      styleElements.forEach((style) => {
        if (style.textContent) {
          allCSS += `\n/* Captured from style element */\n${style.textContent}\n`;
        }
      });
      
      // Get CSS from linked stylesheets (if accessible)
      const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach((link) => {
        try {
          const href = (link as HTMLLinkElement).href;
          if (href && href.includes('fonts.googleapis.com')) {
            // Skip Google Fonts as we're loading them separately
            return;
          }
          // Note: Can't access external stylesheets due to CORS, but we'll include what we can
          allCSS += `\n/* Stylesheet: ${href} */\n`;
        } catch (e) {
          // Ignore CORS errors for external stylesheets
        }
      });
      
      // Get computed styles for key filing guide elements
      const filingGuideElements = document.querySelectorAll('.filing-guide-section, .filing-guide-document, .qre-table, .form-6765-table');
      filingGuideElements.forEach((element, index) => {
        try {
          const computedStyle = window.getComputedStyle(element);
          const cssText = Array.from(computedStyle).map(prop => 
            `${prop}: ${computedStyle.getPropertyValue(prop)};`
          ).join('\n  ');
          
          if (cssText) {
            allCSS += `\n/* Computed styles for element ${index} (.${element.className}) */\n.${element.className.split(' ').join('.')} {\n  ${cssText}\n}\n`;
          }
        } catch (e) {
          // Ignore errors accessing computed styles
        }
      });
      
      return allCSS;
    } catch (error) {
      console.warn('Could not capture live CSS:', error);
      return '';
    }
  }

  private static getEnhancedPDFStylesWithPageBreaks(): string {
    return `
      /* CSS Reset and Foundation */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Typography Foundation with Plus Jakarta Sans */
      html {
        font-size: 14px;
        line-height: 1.6;
      }

      body {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', system-ui, sans-serif;
        font-weight: 400;
        font-size: 11px;
        color: #1f2937;
        background: white;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        line-height: 1.5;
      }

      /* PDF Page Layout - Each page is a separate container */
      .pdf-page {
        width: 8.5in;
        min-height: 11in;
        padding: 0.75in 0.5in;
        margin: 0;
        background: white;
        page-break-after: always;
        page-break-inside: avoid;
        display: block;
        position: relative;
      }

      .pdf-page:last-child {
        page-break-after: avoid;
      }

      /* Specific Page Styling */
      
      /* Page 1: Title Page */
      .title-page {
        text-align: center;
        padding: 2in 1in;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      }

      .title-logo {
        margin-bottom: 1.5in;
      }

      .title-logo-img {
        max-width: 4in;
        height: auto;
      }

      .title-main {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 28pt;
        font-weight: 800;
        color: #1e40af;
        margin-bottom: 0.5in;
        letter-spacing: -0.025em;
      }

      .title-subtitle {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 18pt;
        font-weight: 600;
        color: #3730a3;
        margin-bottom: 1.5in;
      }

      .title-details {
        max-width: 5in;
        margin: 0 auto 1in auto;
        text-align: left;
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .title-details .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        padding: 10px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .title-details .detail-label {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 600;
        color: #374151;
        font-size: 12pt;
      }

      .title-details .detail-value {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 500;
        color: #1f2937;
        font-size: 12pt;
      }

      .title-footer {
        position: absolute;
        bottom: 1in;
        left: 1in;
        right: 1in;
        text-align: center;
        font-size: 10pt;
        color: #6b7280;
        font-style: italic;
      }

      /* Page 2: About Page */
      .about-page {
        padding: 1in 0.75in;
      }

      .about-content h2 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 22pt;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 20px;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 10px;
      }

      .about-content h3 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 16pt;
        font-weight: 600;
        color: #1f2937;
        margin: 25px 0 15px 0;
      }

      .about-content p {
        font-size: 11pt;
        line-height: 1.6;
        margin-bottom: 15px;
        color: #374151;
      }

      .about-content ul {
        margin: 15px 0 15px 25px;
      }

      .about-content li {
        font-size: 11pt;
        line-height: 1.6;
        margin-bottom: 8px;
        color: #374151;
      }

      /* Page 3: Overview Page */
      .overview-page {
        padding: 1in 0.75in;
      }

      .overview-content h2 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 22pt;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 20px;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 10px;
      }

      .overview-content h3 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 16pt;
        font-weight: 600;
        color: #1f2937;
        margin: 25px 0 15px 0;
      }

      .overview-content p {
        font-size: 11pt;
        line-height: 1.6;
        margin-bottom: 15px;
        color: #374151;
      }

      .overview-content ul {
        margin: 15px 0 15px 25px;
      }

      .overview-content li {
        font-size: 11pt;
        line-height: 1.6;
        margin-bottom: 8px;
        color: #374151;
      }

      /* Page 4: Summary Page */
      .summary-page {
        padding: 0.75in 0.5in;
      }

      /* Page 5-6: Form Pages */
      .form-page {
        padding: 0.5in 0.25in;
      }

      .form-2024-plus {
        /* Allow more space for Section G 49F visibility */
        min-height: 22in; /* Span 2 pages if needed */
      }

      .pre-2024-form {
        /* Constrain to single page */
        max-height: 10in;
        overflow: hidden;
      }

      /* Page 7: State Pro Forma - Compact Single Page */
      .state-proforma-page {
        padding: 0.5in 0.25in;
      }

      .state-proforma-compact {
        font-size: 9pt;
      }

      .state-proforma-compact table {
        font-size: 9pt;
      }

      .state-proforma-compact th,
      .state-proforma-compact td {
        padding: 4px 6px;
        font-size: 9pt;
      }

      /* Page 8: State Guidelines - Single Page */
      .state-guidelines-page {
        padding: 0.75in 0.5in;
        font-size: 10pt;
      }

      /* Page 9+: Research Baseline - New Page */
      .research-baseline-page {
        padding: 0.75in 0.5in;
      }

      /* General Section Styling */
      .filing-guide-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        position: relative;
      }

      .filing-guide-section-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f3f4f6;
      }

      .filing-guide-section-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 18pt;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 5px 0;
        letter-spacing: -0.025em;
      }

      .filing-guide-section-subtitle {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 12pt;
        font-weight: 500;
        color: #6b7280;
        margin: 0;
      }

      /* Table Styling */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: white;
        border: 1px solid #e5e7eb;
      }

      th {
        background: #f8fafc;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 600;
        font-size: 10pt;
        text-align: left;
        padding: 8px 10px;
        color: #1f2937;
        border: 1px solid #e5e7eb;
      }

      td {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 10pt;
        font-weight: 400;
        padding: 6px 10px;
        border: 1px solid #e5e7eb;
        color: #374151;
        vertical-align: top;
      }

      /* Form Input Styling for PDF */
      .pdf-static-value {
        background: white;
        border: 1px solid #e5e7eb;
        padding: 3px 6px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 500;
        font-size: 10pt;
        color: #1f2937;
        display: inline-block;
        min-width: 40px;
        text-align: center;
      }

      /* Amount and Number Formatting */
      .amount, .currency, .number, 
      .pdf-amount, .pdf-number, .pdf-currency,
      .pdf-static-value {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 500 !important;
        font-size: 10pt !important;
        color: #1f2937 !important;
        text-align: right;
      }

      .percentage, .pdf-percentage {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 600 !important;
        font-size: 10pt !important;
        text-align: center;
        color: #059669;
      }

      /* Hide elements that shouldn't appear in PDF */
      button,
      input[type="button"],
      input[type="submit"],
      .state-selector-container,
      .modal-overlay,
      .tooltip,
      .dropdown-menu,
      .no-print {
        display: none !important;
        visibility: hidden !important;
      }

      /* Ensure key content is visible */
      .filing-guide-section,
      .qre-table,
      .form-6765-table,
      .calculation-specifics {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* Page Break Controls */
      @page {
        size: Letter;
        margin: 0;
      }

      @media print {
        .pdf-page {
          page-break-after: always;
          page-break-inside: avoid;
        }

        .pdf-page:last-child {
          page-break-after: avoid;
        }

        .form-2024-plus {
          page-break-inside: auto; /* Allow spanning multiple pages for Form 6765 2024+ */
        }

        .pre-2024-form,
        .state-proforma-page,
        .state-guidelines-page {
          page-break-inside: avoid; /* Keep these on single pages */
        }

        /* Ensure Section G 49F is visible in Form 6765 2024+ */
        .form-6765-section-g,
        .section-g,
        [class*="section-g"],
        [id*="section-g"] {
          page-break-inside: avoid;
        }

        .form-6765-line-49f,
        .line-49f,
        [class*="line-49f"],
        [id*="line-49f"],
        [class*="49f"],
        tr:has(.line-49f),
        tr:has([class*="49f"]) {
          page-break-before: avoid;
          page-break-after: avoid;
          page-break-inside: avoid;
        }

        /* Additional specific targeting for Form 6765 visibility */
        .form-6765-table tr:nth-last-child(-n+5) {
          page-break-before: avoid; /* Keep last 5 rows together */
        }
      }
    `;
  }

  private static getEnhancedPDFStyles(): string {
    return `
      /* CSS Reset and Foundation */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Typography Foundation with Plus Jakarta Sans */
      html {
        font-size: 14px;
        line-height: 1.6;
      }

      body {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', system-ui, sans-serif;
        font-weight: 400;
        font-size: 11px;
        color: #1f2937;
        background: white;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        line-height: 1.5;
      }

      /* PDF Layout Container - Full Width */
      .pdf-wrapper {
        width: 100%;
        max-width: 8.5in;
        margin: 0;
        padding: 0;
        background: white;
        min-height: 11in;
        position: relative;
      }

      /* Compact Header Styling */
      .pdf-header {
        background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #6366f1 100%);
        color: white;
        padding: 12px 8px;
        margin-bottom: 16px;
        position: relative;
        overflow: hidden;
      }

      .pdf-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        opacity: 0.3;
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        position: relative;
        z-index: 1;
      }

      .header-left {
        flex: 0 0 auto;
      }

      .logo-section {
        background: rgba(255, 255, 255, 0.15);
        padding: 8px 12px;
        border-radius: 8px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .company-logo {
        flex-shrink: 0;
      }

      .logo-img {
        height: 24px;
        width: auto;
        object-fit: contain;
        filter: brightness(0) invert(1);
      }

      .company-info {
        display: flex;
        flex-direction: column;
      }

      .company-name {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 14px;
        font-weight: 700;
        margin: 0;
        color: white;
        letter-spacing: -0.025em;
        line-height: 1.2;
      }

      .company-tagline {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 11px;
        font-weight: 500;
        margin: 0;
        color: rgba(255, 255, 255, 0.9);
        letter-spacing: 0.025em;
        text-transform: uppercase;
        line-height: 1.2;
      }

      .header-right {
        flex: 1;
        text-align: right;
      }

      .document-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 18px;
        font-weight: 800;
        margin: 0;
        color: white;
        letter-spacing: -0.025em;
        line-height: 1.2;
        text-align: right;
      }

      .header-details {
        background: rgba(255, 255, 255, 0.1);
        padding: 24px;
        border-radius: 12px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-align: left;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      }

      .detail-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .detail-item .label {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 600;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        min-width: 100px;
      }

      .detail-item .value {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 500;
        font-size: 14px;
        color: white;
        text-align: right;
      }

      /* Content Area Styling - Maximum Width Utilization */
      .pdf-content {
        padding: 0 8px;
        min-height: 600px;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }

      /* Filing Guide Section Styling */
      .filing-guide-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 32px;
        margin-bottom: 32px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        position: relative;
      }

      .filing-guide-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
        border-radius: 12px 12px 0 0;
      }

      .filing-guide-section-header {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f3f4f6;
      }

      .filing-guide-section-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 8px 0;
        letter-spacing: -0.025em;
      }

      .filing-guide-section-subtitle {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        margin: 0;
        letter-spacing: 0.025em;
      }

      /* Typography Enhancements */
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        color: #1f2937;
        margin: 24px 0 16px 0;
        letter-spacing: -0.025em;
        line-height: 1.3;
      }

      h1 { font-size: 32px; font-weight: 800; }
      h2 { font-size: 24px; font-weight: 700; }
      h3 { font-size: 20px; font-weight: 600; }
      h4 { font-size: 18px; font-weight: 600; }
      h5 { font-size: 16px; font-weight: 600; }
      h6 { font-size: 14px; font-weight: 600; }

      p {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 11px;
        font-weight: 400;
        line-height: 1.6;
        color: #374151;
        margin: 12px 0;
      }

      /* Table Styling */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      th {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 600;
        font-size: 10px;
        text-align: left;
        padding: 12px 16px;
        color: #1f2937;
        border-bottom: 2px solid #e5e7eb;
        letter-spacing: 0.025em;
        text-transform: uppercase;
      }

      td {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 11px;
        font-weight: 400;
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
        vertical-align: top;
      }

      tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }

      tbody tr:hover {
        background-color: #f3f4f6;
      }

      /* Form and Input Styling - Flat White Style for PDF */
      .pdf-static-value {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0;
        padding: 4px 8px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 500;
        font-size: 11px;
        color: #1f2937;
        display: inline-block;
        min-width: 50px;
        text-align: center;
        box-shadow: none;
      }

      /* Amount and Number Formatting - Consistent Typography */
      .amount, .currency, .number, 
      .pdf-amount, .pdf-number, .pdf-currency,
      input[type="number"], input[type="text"][value*="$"],
      .pdf-static-value,
      td:has(.amount), td:has(.currency), td:has(.number),
      .qre-table td, .form-6765-table td {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 500 !important;
        font-size: 11px !important;
        color: #1f2937 !important;
        text-align: right;
      }

      .percentage, .pdf-percentage {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 600 !important;
        font-size: 11px !important;
        text-align: center;
        color: #059669;
      }

      /* Ensure all numeric content uses consistent fonts */
      span:contains('$'), span:contains('%'), span:contains('.00'),
      div:contains('$'), div:contains('%'), div:contains('.00') {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 500 !important;
        font-size: 11px !important;
      }

      /* Professional Footer - Minimal Padding for Max Width */
      .pdf-footer {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-top: 3px solid #e5e7eb;
        padding: 12px 16px;
        margin-top: 24px;
        position: relative;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }

      .footer-left {
        font-weight: 600;
        color: #374151;
      }

      .footer-center {
        font-weight: 500;
        font-style: italic;
      }

      .footer-right {
        font-weight: 600;
        color: #374151;
      }

      /* Print Optimizations - No CSS Page Numbers (using Puppeteer footer) */
      @page {
        margin: 0.25in 0.1in 0.4in 0.1in;
        size: Letter;
      }

      @media print {
        body {
          font-size: 12px;
        }
        
        .pdf-wrapper {
          width: 100%;
          margin: 0;
        }
        
        .filing-guide-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        table {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .pdf-header {
          page-break-after: avoid;
        }
        
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          break-after: avoid;
        }
      }

      /* Ensure visibility of all content */
      .filing-guide-section,
      .filing-guide-document,
      .qre-table,
      .form-6765-table,
      .calculation-specifics,
      .filing-process-overview,
      .about-direct-research {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
      }

      /* Cover Page Styling */
      .filing-guide-cover-page {
        background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
        color: white;
        padding: 60px 40px;
        text-align: center;
        border-radius: 12px;
        margin-bottom: 40px;
        position: relative;
        overflow: hidden;
      }

      .filing-guide-main-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 42px;
        font-weight: 800;
        margin-bottom: 16px;
        letter-spacing: -0.025em;
      }

      .filing-guide-subtitle {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 40px;
        opacity: 0.9;
      }

      /* Process Steps Styling */
      .process-steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        margin: 32px 0;
      }

      .process-step {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        position: relative;
      }

      .step-number {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 16px;
      }

      .step-content h4 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #1f2937;
      }

      .step-content p {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 14px;
        font-weight: 400;
        margin: 0;
        color: #6b7280;
        line-height: 1.6;
      }
    `;
  }

  private static getPuppeteerStyles(): string {
    return `
      /* Reset and Base Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: #333333;
        background: white;
        margin: 0;
        padding: 0;
      }

      .puppeteer-document {
        width: 8.5in;
        margin: 0 auto;
        background: white;
        min-height: 11in;
      }

      /* Professional Header */
      .puppeteer-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #6366f1 100%);
        color: white;
        padding: 24px;
        margin-bottom: 32px;
      }

      .header-content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }

      .header-left {
        flex: 0 0 auto;
      }

      .logo-placeholder {
        background: rgba(255, 255, 255, 0.2);
        padding: 12px 20px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }

      .logo-placeholder h2 {
        font-size: 18px;
        font-weight: bold;
        margin: 0;
        color: white;
      }

      .header-right {
        flex: 1;
        text-align: right;
      }

      .document-title {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 16px;
        letter-spacing: -0.5px;
      }

      .header-details {
        text-align: left;
        background: rgba(255, 255, 255, 0.1);
        padding: 16px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .detail-row:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .detail-row .label {
        font-weight: 600;
        min-width: 100px;
      }

      .detail-row .value {
        font-weight: 500;
        text-align: right;
      }

      /* Content Area */
      .puppeteer-content {
        padding: 0 24px;
        min-height: 600px;
      }

      /* Section Styling */
      .puppeteer-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .filing-guide-section-header {
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e5e7eb;
      }

      .filing-guide-section-title {
        font-size: 20px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 4px 0;
      }

      .filing-guide-section-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }

      /* Table Styling */
      .puppeteer-table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
      }

      .puppeteer-table th {
        background-color: #f8fafc;
        font-weight: bold;
        text-align: left;
        padding: 12px;
        border-bottom: 2px solid #e5e7eb;
        font-size: 12px;
      }

      .puppeteer-table td,
      .puppeteer-table-cell {
        padding: 10px 12px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
        font-size: 12px;
      }

      .puppeteer-table tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }

      /* Static Value Styling */
      .puppeteer-static-value {
        background-color: #f3f4f6;
        padding: 4px 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-weight: 500;
        display: inline-block;
        min-width: 40px;
        text-align: center;
        font-size: 11px;
      }

      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        color: #1f2937;
        margin: 16px 0 8px 0;
        font-weight: bold;
      }

      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
      h3 { font-size: 18px; }
      h4 { font-size: 16px; }

      p {
        margin: 8px 0;
        line-height: 1.6;
      }

      /* Amount Formatting */
      .amount, .currency, .number {
        text-align: right;
        font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
        font-weight: 500;
      }

      .percentage {
        text-align: center;
        font-weight: 500;
      }

      /* Professional Footer */
      .puppeteer-footer {
        background: #f8fafc;
        border-top: 2px solid #e5e7eb;
        padding: 16px 24px;
        margin-top: 32px;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #6b7280;
      }

      .footer-left,
      .footer-center,
      .footer-right {
        flex: 1;
        text-align: center;
      }

      .footer-left {
        text-align: left;
        font-weight: 600;
      }

      .footer-right {
        text-align: right;
      }

      /* Print optimizations for Puppeteer */
      @media print {
        body {
          font-size: 11px;
        }
        
        .puppeteer-document {
          width: 100%;
          margin: 0;
        }
        
        .puppeteer-section {
          page-break-inside: avoid;
        }
        
        .puppeteer-table {
          page-break-inside: avoid;
        }
        
        .puppeteer-header {
          page-break-after: avoid;
        }
      }

      /* Additional content visibility rules */
      .filing-guide-section,
      .section,
      .form-section,
      .qre-table,
      .filing-process-overview,
      .about-direct-research,
      .calculation-specifics {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
  }
} 