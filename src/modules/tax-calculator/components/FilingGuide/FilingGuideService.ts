import html2pdf from 'html2pdf.js';
import db from '../../lib/supabaseClient';
import { Form6765Override } from './types';

interface FilingGuideExportData {
  businessData: any;
  selectedYear: any;
  calculations: any;
  fileName: string;
}

export class FilingGuideService {
  static async exportToPDF(data: FilingGuideExportData): Promise<void> {
    try {
      // Create a temporary container for the document
      const container = document.createElement('div');
      container.className = 'filing-guide-export-container';
      
      // Get the document content
      const documentContent = this.generateDocumentHTML(data);
      container.innerHTML = documentContent;
      
      // Add to DOM temporarily
      document.body.appendChild(container);
      
      // Configure PDF options
      const pdfOptions = {
        margin: [0.5, 0.5, 0.5, 0.5], // top, right, bottom, left in inches
        filename: data.fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      // Generate PDF
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