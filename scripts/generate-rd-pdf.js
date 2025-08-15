#!/usr/bin/env node
/**
 * R&D Research Report PDF Generator
 * 
 * This script generates sophisticated PDF reports using pdf-lib from R&D service data.
 * It creates professional-looking reports with cover pages, table of contents, and 
 * well-formatted sections for tax credit compliance documentation.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const CONFIG = {
  // Server configuration (you may need to adjust these based on your setup)
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  RD_SERVICE_URL: process.env.RD_SERVICE_URL || 'http://localhost:54321/functions/v1/rd-service',
  
  // PDF settings
  MARGIN: 72, // 1 inch in points
  PAGE_WIDTH: 612, // 8.5 inches in points
  PAGE_HEIGHT: 792, // 11 inches in points
  FONT_SIZE: {
    title: 24,
    heading1: 20,
    heading2: 16,
    heading3: 14,
    body: 11,
    small: 9
  },
  COLORS: {
    primary: rgb(0.11, 0.29, 0.69), // #1e4ab0 - Professional blue
    secondary: rgb(0.22, 0.22, 0.22), // Dark gray
    text: rgb(0.12, 0.16, 0.22), // Near black
    accent: rgb(0.37, 0.55, 0.97), // Light blue
    background: rgb(0.98, 0.98, 0.98), // Light gray
    white: rgb(1, 1, 1),
    error: rgb(0.86, 0.15, 0.15) // Red for emphasis
  },
  OUTPUT_DIR: './docs/sample-pdfs'
};

// Utility functions for PDF layout
class PDFUtils {
  static wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, force it
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static formatPercentage(value) {
    return `${Math.round(value)}%`;
  }
}

class RDPDFGenerator {
  constructor() {
    this.doc = null;
    this.fonts = {};
    this.currentY = 0;
    this.pageNumber = 0;
    this.reportData = null;
    this.tableOfContents = [];
  }

  async initialize() {
    console.log('🚀 Initializing PDF generator...');
    this.doc = await PDFDocument.create();
    
    // Load standard fonts
    this.fonts.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.fonts.regular = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fonts.italic = await this.doc.embedFont(StandardFonts.HelveticaOblique);
    
    console.log('✅ PDF generator initialized');
  }

  async fetchReportData(businessYearId) {
    console.log(`📊 Fetching report data for business year: ${businessYearId}`);
    
    try {
      const url = `${CONFIG.RD_SERVICE_URL}/rd-report-data?business_year_id=${businessYearId}`;
      console.log(`🔗 Fetching from: ${url}`);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}`,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      };
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      this.reportData = await response.json();
      console.log('✅ Report data fetched successfully');
      console.log(`📋 Data summary:`, {
        businessName: this.reportData.business?.name,
        clientName: this.reportData.client?.full_name,
        activitiesCount: this.reportData.research_activities?.length || 0,
        rolesCount: this.reportData.research_roles?.length || 0,
        employeesCount: this.reportData.employee_allocations?.length || 0,
        suppliesCount: this.reportData.supply_allocations?.length || 0
      });
      
      if (this.reportData.research_roles?.length > 0) {
        console.log(`🎯 Research roles:`, this.reportData.research_roles.map(r => r.name));
      }
      
      return this.reportData;
    } catch (error) {
      console.error('❌ Error fetching report data:', error);
      throw new Error(`Failed to fetch report data: ${error.message}`);
    }
  }

  addPage() {
    const page = this.doc.addPage([CONFIG.PAGE_WIDTH, CONFIG.PAGE_HEIGHT]);
    this.pageNumber++;
    this.currentY = CONFIG.PAGE_HEIGHT - CONFIG.MARGIN;
    return page;
  }

  addHeader(page, title) {
    // Header line
    page.drawRectangle({
      x: CONFIG.MARGIN,
      y: CONFIG.PAGE_HEIGHT - 50,
      width: CONFIG.PAGE_WIDTH - (CONFIG.MARGIN * 2),
      height: 2,
      color: CONFIG.COLORS.primary
    });

    // Business name
    page.drawText(this.reportData.business?.name || 'Research Report', {
      x: CONFIG.MARGIN,
      y: CONFIG.PAGE_HEIGHT - 40,
      size: CONFIG.FONT_SIZE.small,
      font: this.fonts.regular,
      color: CONFIG.COLORS.text
    });

    // Page title
    if (title) {
      const titleWidth = this.fonts.bold.widthOfTextAtSize(title, CONFIG.FONT_SIZE.small);
      page.drawText(title, {
        x: CONFIG.PAGE_WIDTH - CONFIG.MARGIN - titleWidth,
        y: CONFIG.PAGE_HEIGHT - 40,
        size: CONFIG.FONT_SIZE.small,
        font: this.fonts.bold,
        color: CONFIG.COLORS.text
      });
    }

    this.currentY = CONFIG.PAGE_HEIGHT - 70;
  }

  addFooter(page) {
    // Footer line
    page.drawRectangle({
      x: CONFIG.MARGIN,
      y: 50,
      width: CONFIG.PAGE_WIDTH - (CONFIG.MARGIN * 2),
      height: 1,
      color: CONFIG.COLORS.primary
    });

    // Footer text
    const footerText = 'Direct Research Advisors • R&D Tax Credit Documentation';
    page.drawText(footerText, {
      x: CONFIG.MARGIN,
      y: 35,
      size: CONFIG.FONT_SIZE.small,
      font: this.fonts.regular,
      color: CONFIG.COLORS.text
    });

    // Confidential notice
    const confidentialText = 'CONFIDENTIAL';
    const confidentialWidth = this.fonts.bold.widthOfTextAtSize(confidentialText, CONFIG.FONT_SIZE.small);
    page.drawText(confidentialText, {
      x: CONFIG.PAGE_WIDTH / 2 - confidentialWidth / 2,
      y: 35,
      size: CONFIG.FONT_SIZE.small,
      font: this.fonts.bold,
      color: CONFIG.COLORS.error
    });

    // Page number
    const pageText = `Page ${this.pageNumber}`;
    const pageWidth = this.fonts.regular.widthOfTextAtSize(pageText, CONFIG.FONT_SIZE.small);
    page.drawText(pageText, {
      x: CONFIG.PAGE_WIDTH - CONFIG.MARGIN - pageWidth,
      y: 35,
      size: CONFIG.FONT_SIZE.small,
      font: this.fonts.regular,
      color: CONFIG.COLORS.text
    });
  }

  addText(page, text, options = {}) {
    const {
      fontSize = CONFIG.FONT_SIZE.body,
      font = this.fonts.regular,
      color = CONFIG.COLORS.text,
      maxWidth = CONFIG.PAGE_WIDTH - (CONFIG.MARGIN * 2),
      lineHeight = fontSize * 1.4,
      indent = 0
    } = options;

    const lines = PDFUtils.wrapText(text, font, fontSize, maxWidth - indent);
    
    for (const line of lines) {
      if (this.currentY < CONFIG.MARGIN + 50) {
        page = this.addPage();
        this.addHeader(page, options.sectionTitle);
        this.addFooter(page);
      }

      page.drawText(line, {
        x: CONFIG.MARGIN + indent,
        y: this.currentY,
        size: fontSize,
        font: font,
        color: color
      });

      this.currentY -= lineHeight;
    }

    return page;
  }

  addHeading(page, text, level = 1) {
    const fontSizes = [CONFIG.FONT_SIZE.heading1, CONFIG.FONT_SIZE.heading2, CONFIG.FONT_SIZE.heading3];
    const fontSize = fontSizes[level - 1] || CONFIG.FONT_SIZE.body;
    
    // Add some space before heading
    this.currentY -= fontSize * 0.5;
    
    if (this.currentY < CONFIG.MARGIN + 100) {
      page = this.addPage();
      this.addHeader(page, text);
      this.addFooter(page);
    }

    page.drawText(text, {
      x: CONFIG.MARGIN,
      y: this.currentY,
      size: fontSize,
      font: this.fonts.bold,
      color: level === 1 ? CONFIG.COLORS.primary : CONFIG.COLORS.secondary
    });

    this.currentY -= fontSize * 1.5;

    // Add to table of contents for level 1 and 2 headings
    if (level <= 2) {
      this.tableOfContents.push({
        title: text,
        page: this.pageNumber,
        level: level
      });
    }

    return page;
  }

  createCoverPage() {
    console.log('📄 Creating cover page...');
    const page = this.addPage();

    // Background gradient effect (simple rectangles)
    page.drawRectangle({
      x: 0,
      y: CONFIG.PAGE_HEIGHT * 0.7,
      width: CONFIG.PAGE_WIDTH,
      height: CONFIG.PAGE_HEIGHT * 0.3,
      color: CONFIG.COLORS.primary
    });

    // Company logo placeholder
    page.drawRectangle({
      x: CONFIG.MARGIN,
      y: CONFIG.PAGE_HEIGHT - 120,
      width: 80,
      height: 80,
      color: CONFIG.COLORS.white
    });
    
    page.drawText('R&D', {
      x: CONFIG.MARGIN + 25,
      y: CONFIG.PAGE_HEIGHT - 80,
      size: 20,
      font: this.fonts.bold,
      color: CONFIG.COLORS.primary
    });

    // Title
    const mainTitle = 'Qualified Research Activities';
    const subtitle = 'Documentation Report';
    
    page.drawText(mainTitle, {
      x: CONFIG.PAGE_WIDTH / 2 - this.fonts.bold.widthOfTextAtSize(mainTitle, 32) / 2,
      y: CONFIG.PAGE_HEIGHT - 200,
      size: 32,
      font: this.fonts.bold,
      color: CONFIG.COLORS.white
    });

    page.drawText(subtitle, {
      x: CONFIG.PAGE_WIDTH / 2 - this.fonts.bold.widthOfTextAtSize(subtitle, 24) / 2,
      y: CONFIG.PAGE_HEIGHT - 240,
      size: 24,
      font: this.fonts.bold,
      color: CONFIG.COLORS.white
    });

    // IRC Section reference
    const ircText = 'IRC Section 41 Compliance Documentation';
    page.drawText(ircText, {
      x: CONFIG.PAGE_WIDTH / 2 - this.fonts.regular.widthOfTextAtSize(ircText, 16) / 2,
      y: CONFIG.PAGE_HEIGHT - 280,
      size: 16,
      font: this.fonts.regular,
      color: CONFIG.COLORS.white
    });

    // Business details box
    const boxY = CONFIG.PAGE_HEIGHT - 450;
    page.drawRectangle({
      x: CONFIG.MARGIN + 50,
      y: boxY - 100,
      width: CONFIG.PAGE_WIDTH - (CONFIG.MARGIN * 2) - 100,
      height: 120,
      color: CONFIG.COLORS.white,
      borderColor: CONFIG.COLORS.primary,
      borderWidth: 2
    });

    // Business details
    const businessName = this.reportData.business?.name || 'Business Name';
    const clientName = this.reportData.client?.full_name || 'Client Name';
    const taxYear = this.reportData.business_year?.year || new Date().getFullYear();
    const reportDate = PDFUtils.formatDate(new Date().toISOString());

    page.drawText('Business Entity:', {
      x: CONFIG.MARGIN + 70,
      y: boxY - 30,
      size: 12,
      font: this.fonts.bold,
      color: CONFIG.COLORS.text
    });
    page.drawText(businessName, {
      x: CONFIG.MARGIN + 200,
      y: boxY - 30,
      size: 12,
      font: this.fonts.regular,
      color: CONFIG.COLORS.text
    });

    page.drawText('Tax Year:', {
      x: CONFIG.MARGIN + 70,
      y: boxY - 50,
      size: 12,
      font: this.fonts.bold,
      color: CONFIG.COLORS.text
    });
    page.drawText(taxYear.toString(), {
      x: CONFIG.MARGIN + 200,
      y: boxY - 50,
      size: 12,
      font: this.fonts.regular,
      color: CONFIG.COLORS.text
    });

    page.drawText('Report Generated:', {
      x: CONFIG.MARGIN + 70,
      y: boxY - 70,
      size: 12,
      font: this.fonts.bold,
      color: CONFIG.COLORS.text
    });
    page.drawText(reportDate, {
      x: CONFIG.MARGIN + 200,
      y: boxY - 70,
      size: 12,
      font: this.fonts.regular,
      color: CONFIG.COLORS.text
    });

    // Confidentiality notice
    const noticeY = 150;
    page.drawRectangle({
      x: CONFIG.MARGIN,
      y: noticeY - 40,
      width: CONFIG.PAGE_WIDTH - (CONFIG.MARGIN * 2),
      height: 60,
      color: rgb(1, 0.95, 0.95),
      borderColor: CONFIG.COLORS.error,
      borderWidth: 1
    });

    page.drawText('CONFIDENTIAL', {
      x: CONFIG.PAGE_WIDTH / 2 - this.fonts.bold.widthOfTextAtSize('CONFIDENTIAL', 16) / 2,
      y: noticeY - 15,
      size: 16,
      font: this.fonts.bold,
      color: CONFIG.COLORS.error
    });

    const noticeText = 'This document contains proprietary business information prepared for tax compliance purposes.';
    page.drawText(noticeText, {
      x: CONFIG.PAGE_WIDTH / 2 - this.fonts.regular.widthOfTextAtSize(noticeText, 10) / 2,
      y: noticeY - 32,
      size: 10,
      font: this.fonts.regular,
      color: CONFIG.COLORS.text
    });

    return page;
  }

  createTableOfContents() {
    console.log('📑 Creating table of contents...');
    const page = this.addPage();
    this.addHeader(page, 'Table of Contents');
    this.addFooter(page);

    this.addHeading(page, 'Table of Contents', 1);
    this.currentY -= 20;

    // Add TOC entries (we'll populate this as we create sections)
    const tocEntries = [
      { title: 'Executive Summary', page: 3, level: 1 },
      { title: 'Business Profile', page: 4, level: 1 },
      { title: 'Research Activities Overview', page: 5, level: 1 },
      { title: 'Research Activities', page: 6, level: 1 },
      { title: 'Employee Allocations', page: 8, level: 1 },
      { title: 'Supply Allocations', page: 9, level: 1 },
      { title: 'Tax Credit Calculations', page: 10, level: 1 },
      { title: 'Compliance Summary', page: 11, level: 1 }
    ];

    for (const entry of tocEntries) {
      if (this.currentY < CONFIG.MARGIN + 50) {
        page = this.addPage();
        this.addHeader(page, 'Table of Contents');
        this.addFooter(page);
      }

      const indent = (entry.level - 1) * 20;
      const dotLine = '.'.repeat(60 - entry.title.length - entry.page.toString().length);
      
      page.drawText(entry.title, {
        x: CONFIG.MARGIN + indent,
        y: this.currentY,
        size: CONFIG.FONT_SIZE.body,
        font: entry.level === 1 ? this.fonts.bold : this.fonts.regular,
        color: CONFIG.COLORS.text
      });

      page.drawText(entry.page.toString(), {
        x: CONFIG.PAGE_WIDTH - CONFIG.MARGIN - 20,
        y: this.currentY,
        size: CONFIG.FONT_SIZE.body,
        font: this.fonts.regular,
        color: CONFIG.COLORS.text
      });

      this.currentY -= CONFIG.FONT_SIZE.body * 1.5;
    }

    return page;
  }

  createExecutiveSummary() {
    console.log('📊 Creating executive summary...');
    let page = this.addPage();
    this.addHeader(page, 'Executive Summary');
    this.addFooter(page);

    page = this.addHeading(page, 'Executive Summary', 1);

    const summary = `This report documents the qualified research activities conducted by ${this.reportData.business?.name || 'the Company'} during the ${this.reportData.business_year?.year || 'current'} tax year. The research activities described herein satisfy the requirements of Internal Revenue Code Section 41 for claiming the Research and Development Tax Credit.`;

    page = this.addText(page, summary, { sectionTitle: 'Executive Summary' });
    this.currentY -= 20;

    // Key metrics
    page = this.addHeading(page, 'Key Metrics', 2);
    
    const activities = this.reportData.research_activities?.length || 0;
    const employees = this.reportData.employee_allocations?.length || 0;
    const totalQRE = this.reportData.calculations?.total_qre_amount || 0;
    const totalCredit = this.reportData.calculations?.total_credit_amount || 0;

    const metrics = [
      `Research Activities: ${activities}`,
      `R&D Personnel: ${employees}`,
      `Total QRE Amount: ${PDFUtils.formatCurrency(totalQRE)}`,
      `Total Tax Credit: ${PDFUtils.formatCurrency(totalCredit)}`
    ];

    for (const metric of metrics) {
      page = this.addText(page, `• ${metric}`, { 
        sectionTitle: 'Executive Summary',
        indent: 20,
        font: this.fonts.bold
      });
    }

    return page;
  }

  createBusinessProfile() {
    console.log('🏢 Creating business profile...');
    let page = this.addPage();
    this.addHeader(page, 'Business Profile');
    this.addFooter(page);

    page = this.addHeading(page, 'Business Profile', 1);

    const business = this.reportData.business;
    const client = this.reportData.client;

    if (business) {
      page = this.addHeading(page, 'Company Information', 2);
      
      const businessInfo = [
        `Business Name: ${business.name || 'N/A'}`,
        `Business Type: ${business.business_type || 'N/A'}`,
        `Industry: ${business.industry || 'N/A'}`,
        `Client Contact: ${client?.full_name || 'N/A'}`,
        `Email: ${client?.email || 'N/A'}`
      ];

      for (const info of businessInfo) {
        page = this.addText(page, info, { sectionTitle: 'Business Profile' });
      }
    }

    return page;
  }

  createResearchActivitiesOverview() {
    console.log('🔬 Creating research activities overview...');
    let page = this.addPage();
    this.addHeader(page, 'Research Activities Overview');
    this.addFooter(page);

    page = this.addHeading(page, 'Research Activities Overview', 1);

    const roles = this.reportData.research_roles || [];
    const employees = this.reportData.employee_allocations || [];
    
    page = this.addText(page, `This section provides an overview of the qualified research activities conducted during the tax year. The research organization includes ${roles.length} distinct roles with ${employees.length} allocated employees. Each activity has been evaluated against the four-part test requirements of IRC Section 41.`, {
      sectionTitle: 'Research Activities Overview'
    });

    this.currentY -= 20;

    if (roles.length > 0) {
      page = this.addHeading(page, 'Research Roles Hierarchy', 2);

      // Build role hierarchy
      const roleMap = new Map(roles.map(role => [role.id, role]));
      const rootRoles = roles.filter(role => !role.parent_id);
      
      const renderRoleHierarchy = (roleList, level = 0) => {
        roleList.forEach(role => {
          const indent = level * 20;
          const roleText = `${'  '.repeat(level)}• ${role.name}`;
          
          page = this.addText(page, roleText, { 
            sectionTitle: 'Research Activities Overview',
            font: this.fonts.bold,
            indent: indent
          });

          // Count employees with this role
          const employeesWithRole = employees.filter(emp => 
            emp.activity_roles && emp.activity_roles.includes(role.id)
          );
          
          if (employeesWithRole.length > 0) {
            page = this.addText(page, `${employeesWithRole.length} employees allocated`, { 
              sectionTitle: 'Research Activities Overview',
              indent: indent + 20,
              font: this.fonts.italic
            });
          }

          // Find and render child roles
          const childRoles = roles.filter(r => r.parent_id === role.id);
          if (childRoles.length > 0) {
            renderRoleHierarchy(childRoles, level + 1);
          }

          this.currentY -= 10;
        });
      };

      renderRoleHierarchy(rootRoles);

    } else {
      page = this.addText(page, 'No research roles have been defined for this business year.', {
        sectionTitle: 'Research Activities Overview',
        font: this.fonts.italic
      });
    }

    return page;
  }

  createResearchActivitiesDetail() {
    console.log('🔬 Creating detailed research activities...');
    const activities = this.reportData.research_activities || [];

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      
      let page = this.addPage();
      this.addHeader(page, `Activity ${i + 1}`);
      this.addFooter(page);

      page = this.addHeading(page, `Activity ${i + 1}: ${activity.activity_name}`, 1);

      // Activity description
      if (activity.activity_description) {
        page = this.addHeading(page, 'Description', 2);
        page = this.addText(page, activity.activity_description, { 
          sectionTitle: `Activity ${i + 1}` 
        });
        this.currentY -= 15;
      }

      // Research focus
      if (activity.research_focus) {
        page = this.addHeading(page, 'Research Focus', 2);
        page = this.addText(page, activity.research_focus, { 
          sectionTitle: `Activity ${i + 1}` 
        });
        this.currentY -= 15;
      }

      // Technological advancement
      if (activity.technological_advancement) {
        page = this.addHeading(page, 'Technological Advancement', 2);
        page = this.addText(page, activity.technological_advancement, { 
          sectionTitle: `Activity ${i + 1}` 
        });
        this.currentY -= 15;
      }

      // Scientific uncertainty
      if (activity.scientific_uncertainty) {
        page = this.addHeading(page, 'Scientific Uncertainty', 2);
        page = this.addText(page, activity.scientific_uncertainty, { 
          sectionTitle: `Activity ${i + 1}` 
        });
        this.currentY -= 15;
      }

      // Systematic approach
      if (activity.systematic_approach) {
        page = this.addHeading(page, 'Systematic Approach', 2);
        page = this.addText(page, activity.systematic_approach, { 
          sectionTitle: `Activity ${i + 1}` 
        });
        this.currentY -= 15;
      }

      // Subcomponents
      if (activity.subcomponents && activity.subcomponents.length > 0) {
        page = this.addHeading(page, 'Research Subcomponents', 2);
        
        activity.subcomponents.forEach((subcomponent, subIndex) => {
          page = this.addHeading(page, `${subIndex + 1}. ${subcomponent.subcomponent_name}`, 3);
          
          if (subcomponent.subcomponent_description) {
            page = this.addText(page, subcomponent.subcomponent_description, { 
              sectionTitle: `Activity ${i + 1}`,
              indent: 20 
            });
          }

          // Research steps
          if (subcomponent.steps && subcomponent.steps.length > 0) {
            page = this.addText(page, 'Research Steps:', { 
              sectionTitle: `Activity ${i + 1}`,
              font: this.fonts.bold,
              indent: 20 
            });

            subcomponent.steps.forEach((step, stepIndex) => {
              const stepText = `${stepIndex + 1}. ${step.step_name} (${step.time_spent_hours || 0} hours)`;
              page = this.addText(page, stepText, { 
                sectionTitle: `Activity ${i + 1}`,
                indent: 40 
              });

              if (step.step_description) {
                page = this.addText(page, step.step_description, { 
                  sectionTitle: `Activity ${i + 1}`,
                  indent: 60,
                  fontSize: CONFIG.FONT_SIZE.small 
                });
              }
            });
          }

          this.currentY -= 10;
        });
      }
    }
  }

  createEmployeeAllocations() {
    console.log('👥 Creating employee allocations...');
    let page = this.addPage();
    this.addHeader(page, 'Employee Allocations');
    this.addFooter(page);

    page = this.addHeading(page, 'Employee Allocations', 1);

    const employees = this.reportData.employee_allocations || [];
    
    if (employees.length === 0) {
      page = this.addText(page, 'No employee allocations recorded for this period.', {
        sectionTitle: 'Employee Allocations'
      });
      return page;
    }

    page = this.addText(page, `The following ${employees.length} employees participated in qualified research activities during the tax year:`, {
      sectionTitle: 'Employee Allocations'
    });

    this.currentY -= 20;

    // Table header
    const tableY = this.currentY;
    const colWidths = [150, 100, 80, 80, 100];
    const colX = [CONFIG.MARGIN, CONFIG.MARGIN + 150, CONFIG.MARGIN + 250, CONFIG.MARGIN + 330, CONFIG.MARGIN + 410];
    
    // Header background
    page.drawRectangle({
      x: CONFIG.MARGIN,
      y: tableY - 5,
      width: CONFIG.PAGE_WIDTH - (CONFIG.MARGIN * 2),
      height: 20,
      color: CONFIG.COLORS.background
    });

    const headers = ['Employee Name', 'Role', 'R&D Hours', 'Total Hours', 'R&D Wages'];
    headers.forEach((header, i) => {
      page.drawText(header, {
        x: colX[i],
        y: tableY,
        size: CONFIG.FONT_SIZE.small,
        font: this.fonts.bold,
        color: CONFIG.COLORS.text
      });
    });

    this.currentY = tableY - 25;

    // Table rows
    employees.forEach((employee, index) => {
      if (this.currentY < CONFIG.MARGIN + 50) {
        page = this.addPage();
        this.addHeader(page, 'Employee Allocations');
        this.addFooter(page);
        this.currentY = CONFIG.PAGE_HEIGHT - 120;
      }

      const rowData = [
        employee.employee_name || 'N/A',
        employee.employee_role || 'N/A',
        (employee.rd_hours || 0).toString(),
        (employee.total_hours || 0).toString(),
        PDFUtils.formatCurrency(employee.rd_wages || 0)
      ];

      // Alternating row background
      if (index % 2 === 1) {
        page.drawRectangle({
          x: CONFIG.MARGIN,
          y: this.currentY - 5,
          width: CONFIG.PAGE_WIDTH - (CONFIG.MARGIN * 2),
          height: 15,
          color: rgb(0.99, 0.99, 0.99)
        });
      }

      rowData.forEach((data, i) => {
        page.drawText(data, {
          x: colX[i],
          y: this.currentY,
          size: CONFIG.FONT_SIZE.small,
          font: this.fonts.regular,
          color: CONFIG.COLORS.text
        });
      });

      this.currentY -= 20;
    });

    // Totals
    this.currentY -= 10;
    const totalRDWages = employees.reduce((sum, emp) => sum + (emp.rd_wages || 0), 0);
    const totalRDHours = employees.reduce((sum, emp) => sum + (emp.rd_hours || 0), 0);

    page.drawText(`Total R&D Hours: ${totalRDHours}`, {
      x: CONFIG.MARGIN,
      y: this.currentY,
      size: CONFIG.FONT_SIZE.body,
      font: this.fonts.bold,
      color: CONFIG.COLORS.text
    });

    page.drawText(`Total R&D Wages: ${PDFUtils.formatCurrency(totalRDWages)}`, {
      x: CONFIG.MARGIN + 200,
      y: this.currentY,
      size: CONFIG.FONT_SIZE.body,
      font: this.fonts.bold,
      color: CONFIG.COLORS.text
    });

    return page;
  }

  createSupplyAllocations() {
    console.log('📦 Creating supply allocations...');
    let page = this.addPage();
    this.addHeader(page, 'Supply Allocations');
    this.addFooter(page);

    page = this.addHeading(page, 'Supply Allocations', 1);

    const supplies = this.reportData.supply_allocations || [];
    
    if (supplies.length === 0) {
      page = this.addText(page, 'No supply allocations recorded for this period.', {
        sectionTitle: 'Supply Allocations'
      });
      return page;
    }

    page = this.addText(page, `The following supplies and materials were used in qualified research activities:`, {
      sectionTitle: 'Supply Allocations'
    });

    this.currentY -= 20;

    supplies.forEach((supply, index) => {
      if (this.currentY < CONFIG.MARGIN + 100) {
        page = this.addPage();
        this.addHeader(page, 'Supply Allocations');
        this.addFooter(page);
      }

      page = this.addHeading(page, `${index + 1}. ${supply.supply_name}`, 3);
      
      if (supply.supply_description) {
        page = this.addText(page, supply.supply_description, { 
          sectionTitle: 'Supply Allocations',
          indent: 20 
        });
      }

      const supplyDetails = [
        `Total Cost: ${PDFUtils.formatCurrency(supply.total_cost || 0)}`,
        `R&D Allocation: ${PDFUtils.formatCurrency(supply.rd_cost || 0)}`,
        `Allocation Percentage: ${PDFUtils.formatPercentage(supply.allocation_percentage || 0)}`
      ];

      supplyDetails.forEach(detail => {
        page = this.addText(page, detail, { 
          sectionTitle: 'Supply Allocations',
          indent: 20,
          font: this.fonts.bold
        });
      });

      this.currentY -= 15;
    });

    // Total
    const totalRDCost = supplies.reduce((sum, supply) => sum + (supply.rd_cost || 0), 0);
    this.currentY -= 10;
    
    page.drawText(`Total R&D Supply Costs: ${PDFUtils.formatCurrency(totalRDCost)}`, {
      x: CONFIG.MARGIN,
      y: this.currentY,
      size: CONFIG.FONT_SIZE.heading3,
      font: this.fonts.bold,
      color: CONFIG.COLORS.primary
    });

    return page;
  }

  createTaxCreditCalculations() {
    console.log('💰 Creating tax credit calculations...');
    let page = this.addPage();
    this.addHeader(page, 'Tax Credit Calculations');
    this.addFooter(page);

    page = this.addHeading(page, 'Tax Credit Calculations', 1);

    const calc = this.reportData.calculations;
    
    if (!calc) {
      page = this.addText(page, 'Tax credit calculations are not available.', {
        sectionTitle: 'Tax Credit Calculations'
      });
      return page;
    }

    page = this.addText(page, 'The following calculations demonstrate the qualified research expenses (QRE) and resulting tax credits for the research activities documented in this report.', {
      sectionTitle: 'Tax Credit Calculations'
    });

    this.currentY -= 30;

    // QRE Summary
    page = this.addHeading(page, 'Qualified Research Expenses (QRE)', 2);

    const qreItems = [
      ['QRE Wages:', PDFUtils.formatCurrency(calc.total_qre_wages || 0)],
      ['QRE Supplies:', PDFUtils.formatCurrency(calc.total_qre_supplies || 0)],
      ['Total QRE Amount:', PDFUtils.formatCurrency(calc.total_qre_amount || 0)]
    ];

    qreItems.forEach(([label, value]) => {
      page.drawText(label, {
        x: CONFIG.MARGIN,
        y: this.currentY,
        size: CONFIG.FONT_SIZE.body,
        font: this.fonts.bold,
        color: CONFIG.COLORS.text
      });

      page.drawText(value, {
        x: CONFIG.MARGIN + 200,
        y: this.currentY,
        size: CONFIG.FONT_SIZE.body,
        font: this.fonts.regular,
        color: CONFIG.COLORS.text
      });

      this.currentY -= CONFIG.FONT_SIZE.body * 1.5;
    });

    this.currentY -= 20;

    // Tax Credits
    page = this.addHeading(page, 'Tax Credit Summary', 2);

    const creditItems = [
      ['Federal Credit (20%):', PDFUtils.formatCurrency(calc.federal_credit_amount || 0)],
      ['State Credit (5%):', PDFUtils.formatCurrency(calc.state_credit_amount || 0)],
      ['Total Credit Amount:', PDFUtils.formatCurrency(calc.total_credit_amount || 0)]
    ];

    creditItems.forEach(([label, value], index) => {
      const isTotal = index === creditItems.length - 1;
      
      page.drawText(label, {
        x: CONFIG.MARGIN,
        y: this.currentY,
        size: isTotal ? CONFIG.FONT_SIZE.heading3 : CONFIG.FONT_SIZE.body,
        font: this.fonts.bold,
        color: isTotal ? CONFIG.COLORS.primary : CONFIG.COLORS.text
      });

      page.drawText(value, {
        x: CONFIG.MARGIN + 200,
        y: this.currentY,
        size: isTotal ? CONFIG.FONT_SIZE.heading3 : CONFIG.FONT_SIZE.body,
        font: this.fonts.bold,
        color: isTotal ? CONFIG.COLORS.primary : CONFIG.COLORS.text
      });

      this.currentY -= (isTotal ? CONFIG.FONT_SIZE.heading3 : CONFIG.FONT_SIZE.body) * 1.5;
    });

    return page;
  }

  createComplianceSummary() {
    console.log('✅ Creating compliance summary...');
    let page = this.addPage();
    this.addHeader(page, 'Compliance Summary');
    this.addFooter(page);

    page = this.addHeading(page, 'Compliance Summary', 1);

    page = this.addText(page, 'This section summarizes how the documented research activities satisfy the requirements of Internal Revenue Code Section 41 for qualified research activities.', {
      sectionTitle: 'Compliance Summary'
    });

    this.currentY -= 20;

    // Four-part test
    page = this.addHeading(page, 'Four-Part Test Compliance', 2);

    const fourPartTest = [
      {
        title: '1. Permitted Purpose',
        description: 'Research activities were undertaken to create new or improved business components.'
      },
      {
        title: '2. Technological in Nature',
        description: 'Activities relied on principles of engineering, computer science, or physical/biological sciences.'
      },
      {
        title: '3. Elimination of Uncertainty',
        description: 'Research was conducted to eliminate uncertainty about the capability or method for achieving desired results.'
      },
      {
        title: '4. Process of Experimentation',
        description: 'Activities involved systematic trial and error methodologies to achieve the desired results.'
      }
    ];

    fourPartTest.forEach(test => {
      page = this.addHeading(page, test.title, 3);
      page = this.addText(page, test.description, { 
        sectionTitle: 'Compliance Summary',
        indent: 20 
      });
      this.currentY -= 10;
    });

    // Documentation standards
    this.currentY -= 10;
    page = this.addHeading(page, 'Documentation Standards', 2);

    const docStandards = [
      'Detailed records of research activities and objectives',
      'Documentation of scientific uncertainty and technical challenges',
      'Records of systematic experimentation processes',
      'Time tracking for qualified research personnel',
      'Expense allocation for research supplies and materials'
    ];

    docStandards.forEach(standard => {
      page = this.addText(page, `* ${standard}`, { 
        sectionTitle: 'Compliance Summary',
        indent: 20,
        color: CONFIG.COLORS.primary
      });
    });

    return page;
  }

  async generatePDF(businessYearId, outputFilename) {
    try {
      console.log('🚀 Starting PDF generation process...');
      
      // Initialize PDF generator
      await this.initialize();
      
      // Fetch report data
      await this.fetchReportData(businessYearId);
      
      // Generate PDF sections
      this.createCoverPage();
      this.createTableOfContents();
      this.createExecutiveSummary();
      this.createBusinessProfile();
      this.createResearchActivitiesOverview();
      this.createResearchActivitiesDetail();
      this.createEmployeeAllocations();
      this.createSupplyAllocations();
      this.createTaxCreditCalculations();
      this.createComplianceSummary();

      // Save PDF
      const pdfBytes = await this.doc.save();
      
      // Ensure output directory exists
      await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
      
      const outputPath = path.join(CONFIG.OUTPUT_DIR, outputFilename);
      await fs.writeFile(outputPath, pdfBytes);
      
      console.log(`✅ PDF generated successfully: ${outputPath}`);
      console.log(`📄 Total pages: ${this.pageNumber}`);
      console.log(`📊 File size: ${Math.round(pdfBytes.length / 1024)}KB`);
      
      return outputPath;
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    // Get business year ID from command line argument or use default
    const businessYearId = process.argv[2] || process.env.BUSINESS_YEAR_ID;
    
    if (!businessYearId) {
      console.error('❌ Please provide a business year ID:');
      console.log('   node scripts/generate-rd-pdf.js <business_year_id>');
      console.log('   or set BUSINESS_YEAR_ID environment variable');
      process.exit(1);
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const outputFilename = `rd-research-report-${businessYearId}-${timestamp}.pdf`;

    console.log('🎯 R&D Research Report PDF Generator');
    console.log('=====================================');
    console.log(`📋 Business Year ID: ${businessYearId}`);
    console.log(`📁 Output: ${CONFIG.OUTPUT_DIR}/${outputFilename}`);
    console.log('');

    // Generate PDF
    const generator = new RDPDFGenerator();
    const outputPath = await generator.generatePDF(businessYearId, outputFilename);
    
    console.log('');
    console.log('✅ PDF generation completed successfully!');
    console.log(`📄 Generated file: ${outputPath}`);
    
  } catch (error) {
    console.error('');
    console.error('❌ PDF generation failed:');
    console.error(error.message);
    console.error('');
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { RDPDFGenerator, CONFIG };