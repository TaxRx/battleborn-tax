# Research Report Component Documentation

## Overview
The Research Report component generates comprehensive Clinical Practice Guideline reports for R&D Tax Credit documentation. The report is formatted for standard 8.5 x 11-inch pages with 1-inch margins and includes a professional footer.

## Changes Made

### 1. Created AI Service (`src/services/aiService.ts`)
- Provides AI-powered content generation for research activities
- Generates hypotheses, development steps, and data feedback
- Supports Section G Line 49f descriptions for IRS Form 6765
- Uses OpenAI GPT-4 for intelligent content generation

### 2. Updated Research Report Modal
- Fixed import issues for the AI service
- Enhanced print formatting for 8.5 x 11-inch pages with 1-inch margins
- Added professional footer with:
  - Business name
  - Current year
  - "CONFIDENTIAL - DO NOT REPRODUCE WITHOUT PERMISSION" in red, 9pt font

### 3. Enhanced Print Styles
- Proper page breaks to avoid splitting content
- Hidden non-essential elements in print view
- Clean, professional formatting for printed documents
- Fixed footer positioning on all printed pages

## Configuration

### OpenAI API Key Setup
1. Create a `.env` file in the project root (if it doesn't exist)
2. Add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Never commit the `.env` file to version control

### Environment Variables Required
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_OPENAI_API_KEY` - Your OpenAI API key

## Usage

### Generating a Research Report
1. Navigate to the business year you want to generate a report for
2. Click the "Generate Report" button
3. Review the report preview
4. Use the "Print Report" or "Download HTML" buttons

### Print Features
- Automatically formats for 8.5 x 11-inch paper
- 1-inch margins on all sides
- Professional footer on every page
- Page breaks prevent content splitting
- Clean black and white formatting for printing

## Report Contents

The generated report includes:

1. **Executive Summary**
   - Overview of research activities
   - Key findings and compliance status

2. **Business Profile**
   - Company information
   - Contact details

3. **Research Overview**
   - Distribution charts
   - Component statistics

4. **Research Activities**
   - Hierarchical structure visualization
   - Research steps with progress indicators
   - Clinical practice guidelines for each subcomponent
   - CPT/CDT codes where applicable

5. **Compliance Summary**
   - Four-part test qualification status
   - Documentation requirements

6. **Documentation Checklist**
   - Required supporting documents
   - Best practices for record keeping

## Troubleshooting

### Import Errors
If you see import errors for `aiService`, ensure:
1. The file exists at `src/services/aiService.ts`
2. The import paths are correct relative to your component

### OpenAI API Errors
If AI generation fails:
1. Check that your API key is correctly set in `.env`
2. Ensure you have sufficient OpenAI API credits
3. Check console for specific error messages

### Print Formatting Issues
If the print layout doesn't look correct:
1. Use Print Preview to check formatting
2. Ensure you're using standard 8.5 x 11-inch paper settings
3. Check that printer margins are set to 1 inch

## Security Notes

- Never hardcode API keys in your source code
- Use environment variables for all sensitive configuration
- The AI service is configured with `dangerouslyAllowBrowser: true` for development only
- In production, implement a backend API to handle OpenAI requests securely

## Future Enhancements

Consider implementing:
- PDF export functionality
- Custom report templates
- Batch report generation
- Email delivery of reports
- Integration with document management systems 