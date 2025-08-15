# Sample PDFs Directory

This directory contains sample PDF reports generated using the pdf-lib library for R&D tax credit documentation.

## PDF Generation Script

Use the following command to generate a PDF report:

```bash
node scripts/generate-rd-pdf.js <business_year_id>
```

### Requirements

1. **Running Supabase instance**: The script connects to the rd-service endpoint
2. **Valid business year ID**: Must exist in your database
3. **Data setup**: Business year should have associated research activities, employee allocations, etc.

### Example Usage

```bash
# Generate PDF for business year ID 'abc123'
node scripts/generate-rd-pdf.js abc123

# Set business year ID via environment variable
BUSINESS_YEAR_ID=abc123 node scripts/generate-rd-pdf.js
```

## Generated PDF Features

### Professional Layout
- **Cover Page**: Professional title page with business information and confidentiality notice
- **Table of Contents**: Clickable navigation with page numbers
- **Headers/Footers**: Consistent branding with page numbers and confidential notices
- **Typography**: Professional font hierarchy with consistent styling

### Content Sections
1. **Executive Summary**: Key metrics and overview
2. **Business Profile**: Company information and contact details
3. **Research Activities Overview**: Summary of all activities
4. **Detailed Research Activities**: Each activity on separate page with:
   - Activity description and objectives
   - Research focus and technological advancement
   - Scientific uncertainty documentation
   - Systematic approach methodology
   - Subcomponents with research steps
5. **Employee Allocations**: R&D personnel breakdown with hours and wages
6. **Supply Allocations**: Materials and resources used in research
7. **Tax Credit Calculations**: QRE amounts and credit calculations
8. **Compliance Summary**: Four-part test documentation

### Technical Features
- **Page Management**: Smart page breaks to prevent content splitting
- **Professional Styling**: Consistent colors, fonts, and spacing
- **Data Formatting**: Currency, dates, and percentages properly formatted
- **Tables**: Well-formatted tabular data with alternating row colors
- **Error Handling**: Graceful handling of missing data

## Configuration

The script can be configured via environment variables:

```bash
# Supabase configuration
VITE_SUPABASE_URL=http://localhost:54321
RD_SERVICE_URL=http://localhost:54321/functions/v1/rd-service

# Business year ID (alternative to command line argument)
BUSINESS_YEAR_ID=your_business_year_id
```

## Output

Generated PDFs are saved in this directory with the naming convention:
```
rd-research-report-{business_year_id}-{date}.pdf
```

Example: `rd-research-report-abc123-2024-08-15.pdf`

## Quality Standards

- **Print Ready**: Optimized for 8.5" x 11" paper with proper margins
- **Professional Appearance**: Consistent with tax compliance documentation standards
- **Comprehensive**: Includes all necessary information for R&D tax credit claims
- **Audit Ready**: Structured for IRS audit defense with proper documentation

## Troubleshooting

### Common Issues

1. **"Failed to fetch report data"**
   - Ensure Supabase is running (`supabase start`)
   - Verify the business year ID exists in your database
   - Check that rd-service function is deployed

2. **"No research activities found"**
   - Verify the business year has associated research activities
   - Check that activities have subcomponents and steps
   - Ensure data was properly imported/created

3. **Missing employee/supply data**
   - The PDF will still generate but show "No allocations recorded"
   - Add employee and supply allocation data for complete reports

### Testing with Sample Data

For testing purposes, you can use the demo business year IDs from your database. Check the `rd_business_years` table for available IDs.

## Development

To modify the PDF generation:

1. **Styling**: Edit the `CONFIG` object in `scripts/generate-rd-pdf.js`
2. **Layout**: Modify the individual section creation methods
3. **Content**: Update the data mapping in each section generator
4. **Fonts**: Add custom fonts by embedding them in the `initialize()` method

The script is modular and each section can be independently modified without affecting others.