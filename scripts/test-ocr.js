#!/usr/bin/env node

/**
 * OCR Testing Script using Mistral AI
 * 
 * This script tests OCR functionality using the Mistral AI library's mistral-ocr-latest model.
 * It can process documents from URLs or local files for optical character recognition.
 * 
 * Usage:
 *   node scripts/test-ocr.js <document_url_or_path>
 * 
 * Environment Variables:
 *   MISTRAL_API_KEY - Required API key for Mistral AI service
 * 
 * Examples:
 *   node scripts/test-ocr.js https://example.com/document.pdf
 *   node scripts/test-ocr.js ./docs/sample-pdfs/report.pdf
 */

import { Mistral } from "@mistralai/mistralai";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Mistral client
const mistral = new Mistral({
  apiKey: process.env["MISTRAL_API_KEY"] ?? "",
});

/**
 * W2 Tax Document extraction prompt for structured data
 */
const W2_EXTRACTION_PROMPT = `
You are a tax document processing assistant. Extract all relevant information from this W2 tax document and return it as a JSON array of objects.

For each W2 form found in the document, extract the following information:

{
  "tax_year": "YYYY",
  "employer": {
    "name": "Employer Name",
    "ein": "XX-XXXXXXX",
    "address": {
      "street": "Street Address",
      "city": "City",
      "state": "State",
      "zip": "ZIP Code"
    }
  },
  "employee": {
    "name": "Employee Full Name",
    "ssn": "XXX-XX-XXXX",
    "address": {
      "street": "Street Address", 
      "city": "City",
      "state": "State",
      "zip": "ZIP Code"
    }
  },
  "wages_and_compensation": {
    "box_1_wages": "0.00",
    "box_2_federal_tax_withheld": "0.00",
    "box_3_social_security_wages": "0.00",
    "box_4_social_security_tax_withheld": "0.00",
    "box_5_medicare_wages": "0.00",
    "box_6_medicare_tax_withheld": "0.00",
    "box_7_social_security_tips": "0.00",
    "box_8_allocated_tips": "0.00",
    "box_9_verification_code": "",
    "box_10_dependent_care_benefits": "0.00",
    "box_11_nonqualified_plans": "0.00",
    "box_12_codes": [
      {
        "code": "A",
        "amount": "0.00"
      }
    ],
    "box_13_statutory_employee": false,
    "box_13_retirement_plan": false,
    "box_13_third_party_sick_pay": false,
    "box_14_other": [
      {
        "description": "Description",
        "amount": "0.00"
      }
    ]
  },
  "state_and_local": [
    {
      "state": "State Code",
      "state_wages": "0.00",
      "state_tax_withheld": "0.00",
      "locality": "Locality Name",
      "local_wages": "0.00",
      "local_tax_withheld": "0.00"
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Extract information exactly as it appears on the form
2. Convert all monetary amounts to string format with 2 decimal places
3. Use "0.00" for empty or missing monetary fields
4. Use empty strings for missing text fields
5. Use false for unchecked checkboxes
6. Return ONLY raw JSON - absolutely NO markdown formatting, NO code blocks, NO backticks, NO explanations
7. If multiple W2 forms are present, include each as a separate object in the array
8. Preserve all box codes and descriptions exactly as shown
9. Your response must start with [ and end with ] - nothing else
10. Do not wrap the JSON in markdown code blocks or any other formatting

Return the result as a pure JSON array of W2 objects with no additional formatting or text.
`;

/**
 * Process document with OCR using Mistral AI Chat with document support
 * @param {string} documentInput - URL or file path to document
 * @param {boolean} isW2Document - Whether to use W2-specific extraction
 */
async function processOCR(documentInput, isW2Document = false) {
  try {
    console.log('🔍 Mistral AI OCR Testing Script');
    console.log('================================');
    
    // Validate API key
    if (!process.env["MISTRAL_API_KEY"]) {
      console.error('❌ Error: MISTRAL_API_KEY environment variable is required');
      console.log('💡 Set your API key: export MISTRAL_API_KEY="your-api-key-here"');
      process.exit(1);
    }

    console.log(`📄 Processing document: ${documentInput}`);
    
    if (isW2Document) {
      console.log('📋 W2 Tax Document Mode: Extracting structured tax information');
    }
    
    // Determine if input is URL or file path
    const isUrl = documentInput.startsWith('http://') || documentInput.startsWith('https://');
    let documentUrl;

    if (isUrl) {
      console.log('🌐 Processing as URL...');
      documentUrl = documentInput;
    } else {
      console.log('📁 Processing as local file...');
      
      // Resolve file path relative to project root
      const filePath = resolve(process.cwd(), documentInput);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File not found: ${filePath}`);
        process.exit(1);
      }

      console.log(`📍 Full file path: ${filePath}`);
      console.log('⚠️  Note: Local file processing requires uploading to a URL first');
      console.log('🔄 For now, please use a public URL instead');
      process.exit(1);
    }

    console.log('🚀 Sending chat request with document to Mistral AI...');
    console.log('⏳ This may take a few moments...');

    const startTime = Date.now();

    // Prepare messages based on mode
    let messages;
    
    if (isW2Document) {
      messages = [
        {
          role: "system",
          content: `You are a tax document processing assistant. ${W2_EXTRACTION_PROMPT}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all relevant information from this W2 tax document and return it as a pure JSON array with no markdown formatting, code blocks, or explanations. Start your response with [ and end with ]."
            },
            {
              type: "document_url",
              documentUrl: documentUrl
            }
          ]
        }
      ];
    } else {
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text content from this document using OCR and return it in a readable format."
            },
            {
              type: "document_url",
              documentUrl: documentUrl
            }
          ]
        }
      ];
    }

    const chatResponse = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: messages
    });

    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Document processing completed in ${processingTime} seconds`);
    console.log('');
    
    if (isW2Document) {
      console.log('📊 W2 Tax Information (JSON):');
      console.log('============================');
      
      const responseContent = chatResponse.choices[0]?.message?.content || '';
      
      // Try to parse and format the JSON response
      try {
        let jsonData;
        let cleanedResponse = responseContent;
        
        // Remove markdown code blocks if present
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Remove any leading/trailing whitespace and explanatory text
        cleanedResponse = cleanedResponse.trim();
        
        // Remove any non-printable characters and normalize whitespace
        cleanedResponse = cleanedResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        cleanedResponse = cleanedResponse.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Remove any Unicode BOM or other invisible characters
        cleanedResponse = cleanedResponse.replace(/^\uFEFF/, '');
        
        console.log('🔍 Debug: Attempting to parse JSON...');
        console.log('📏 Length:', cleanedResponse.length);
        console.log('🔤 First 50 chars:', JSON.stringify(cleanedResponse.substring(0, 50)));
        console.log('🔤 Last 50 chars:', JSON.stringify(cleanedResponse.substring(cleanedResponse.length - 50)));
        
        // Try to extract JSON from the response
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          console.log('✅ Found JSON match, attempting to parse...');
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          console.log('⚠️  No JSON match found, parsing entire response...');
          // Try to parse the entire cleaned response as JSON
          jsonData = JSON.parse(cleanedResponse);
        }
        
        // Pretty print the structured W2 data
        console.log(JSON.stringify(jsonData, null, 2));
        
        // Additional analysis for W2 data
        if (Array.isArray(jsonData)) {
          console.log('');
          console.log('📈 W2 Analysis Summary:');
          console.log('=======================');
          console.log(`📋 Number of W2 forms found: ${jsonData.length}`);
          
          jsonData.forEach((w2, index) => {
            console.log(`\n📄 W2 Form ${index + 1}:`);
            console.log(`   👤 Employee: ${w2.employee?.name || 'N/A'}`);
            console.log(`   🏢 Employer: ${w2.employer?.name || 'N/A'}`);
            console.log(`   📅 Tax Year: ${w2.tax_year || 'N/A'}`);
            console.log(`   💰 Total Wages (Box 1): $${w2.wages_and_compensation?.box_1_wages || '0.00'}`);
            console.log(`   🏛️  Federal Tax Withheld (Box 2): $${w2.wages_and_compensation?.box_2_federal_tax_withheld || '0.00'}`);
          });
        }
        
      } catch (parseError) {
        console.log('❌ JSON Parse Error:', parseError.message);
        console.log('📍 Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
        
        // Try to find the exact character causing the issue
        if (parseError.message.includes('position')) {
          const position = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
          const cleanedResponse = responseContent
            .replace(/```json\s*/g, '').replace(/```\s*/g, '')
            .trim()
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .replace(/^\uFEFF/, '');
            
          console.log('🔍 Character at error position:', JSON.stringify(cleanedResponse.charAt(position)));
          console.log('🔍 Context around error (±10 chars):', JSON.stringify(cleanedResponse.substring(position - 10, position + 10)));
        }
        
        console.log('\n⚠️  Raw response (unable to parse as JSON):');
        console.log(responseContent);
        console.log('\n💡 Attempting fallback: extracting and manually validating JSON...');
        
        // Last resort: try to manually fix common JSON issues
        try {
          let fallbackResponse = responseContent
            .replace(/```json\s*/g, '').replace(/```\s*/g, '')
            .trim()
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .replace(/^\uFEFF/, '');
            
          // Fix common issues: trailing commas, etc.
          fallbackResponse = fallbackResponse.replace(/,(\s*[}\]])/g, '$1');
          
          const fallbackData = JSON.parse(fallbackResponse);
          console.log('✅ Fallback parsing successful!');
          console.log(JSON.stringify(fallbackData, null, 2));
          
          // Show analysis if successful
          if (Array.isArray(fallbackData)) {
            console.log('');
            console.log('📈 W2 Analysis Summary:');
            console.log('=======================');
            console.log(`📋 Number of W2 forms found: ${fallbackData.length}`);
            
            fallbackData.forEach((w2, index) => {
              console.log(`\n📄 W2 Form ${index + 1}:`);
              console.log(`   👤 Employee: ${w2.employee?.name || 'N/A'}`);
              console.log(`   🏢 Employer: ${w2.employer?.name || 'N/A'}`);
              console.log(`   📅 Tax Year: ${w2.tax_year || 'N/A'}`);
              console.log(`   💰 Total Wages (Box 1): $${w2.wages_and_compensation?.box_1_wages || '0.00'}`);
              console.log(`   🏛️  Federal Tax Withheld (Box 2): $${w2.wages_and_compensation?.box_2_federal_tax_withheld || '0.00'}`);
            });
          }
        } catch (fallbackError) {
          console.log('❌ Fallback parsing also failed:', fallbackError.message);
          console.log('💡 The response format may be incompatible with JSON parsing.');
        }
      }
    } else {
      console.log('📋 OCR Results:');
      console.log('==============');
      
      const responseContent = chatResponse.choices[0]?.message?.content || '';
      console.log(responseContent);

      // Additional analysis
      if (responseContent) {
        console.log('');
        console.log('📊 Analysis:');
        console.log('============');
        
        const wordCount = responseContent.split(/\s+/).length;
        const charCount = responseContent.length;
        console.log(`📝 Text extracted: ${charCount} characters, ${wordCount} words`);
      }
    }

  } catch (error) {
    console.error('❌ Document Processing Error:', error.message);
    
    if (error.response) {
      console.error('🔍 Response details:', error.response.data || error.response);
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network error: Check your internet connection and URL');
    } else if (error.message.includes('API key')) {
      console.error('🔑 API key error: Check your MISTRAL_API_KEY environment variable');
    }
    
    process.exit(1);
  }
}

/**
 * Main function to handle command line arguments and execute OCR
 */
async function main() {
  // Get document input from command line arguments
  const documentInput = process.argv[2];
  const mode = process.argv[3];
  
  if (!documentInput) {
    console.log('🔍 Mistral AI OCR Testing Script');
    console.log('================================');
    console.log('');
    console.log('Usage: node scripts/test-ocr.js <document_url_or_path> [mode]');
    console.log('');
    console.log('Modes:');
    console.log('  w2       - Extract structured W2 tax document information as JSON');
    console.log('  general  - Standard OCR text extraction (default)');
    console.log('');
    console.log('Examples:');
    console.log('  # Standard OCR');
    console.log('  node scripts/test-ocr.js https://example.com/document.pdf');
    console.log('  node scripts/test-ocr.js ./docs/sample-pdfs/report.pdf');
    console.log('');
    console.log('  # W2 Tax Document extraction');
    console.log('  node scripts/test-ocr.js https://support.adp.com/adp_payroll/content/hybrid/PDF/W2_Interactive.pdf w2');
    console.log('  node scripts/test-ocr.js ./tax-documents/w2-2023.pdf w2');
    console.log('');
    console.log('Environment Variables:');
    console.log('  MISTRAL_API_KEY - Your Mistral AI API key (required)');
    console.log('');
    console.log('Supported formats: PDF, PNG, JPG, JPEG, WebP, BMP, TIFF');
    process.exit(1);
  }

  // Determine if W2 mode is enabled
  const isW2Mode = mode && mode.toLowerCase() === 'w2';
  
  if (isW2Mode) {
    console.log('📋 W2 Tax Document Processing Mode Enabled');
    console.log('');
  }

  await processOCR(documentInput, isW2Mode);
}

// Execute main function
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});