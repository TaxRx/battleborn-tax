import { supabase } from '../supabase';
import { jsPDF } from 'jspdf';

interface LeadData {
  name: string;
  email: string;
  phone: string;
  income?: number;
  state?: string;
  donationAmount?: number;
  calculations?: {
    heroesSupported: number;
    philanthropicImpact: number;
    netTaxSavings: number;
    federal: number;
    state: number;
    initial: number;
    totalBenefit: number;
  };
}

export const saveLeadToDatabase = async (leadData: LeadData) => {
  try {
    // Save lead to database
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select();

    if (error) throw error;

    // Trigger email sending via Supabase Edge Function
    const { error: functionError } = await supabase.functions.invoke('send-lead-email', {
      body: { leadData }
    });

    if (functionError) {
      console.error('Error sending email:', functionError);
    }

    return data;
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
};

export const generatePDF = (leadData: LeadData) => {
  const doc = new jsPDF();
  
  // Add logo and header
  doc.setFontSize(20);
  doc.text('Philanthropic Tax Benefit Summary', 20, 20);
  
  // Add personal information
  doc.setFontSize(12);
  doc.text(`Name: ${leadData.name}`, 20, 40);
  doc.text(`Email: ${leadData.email}`, 20, 50);
  doc.text(`Phone: ${leadData.phone}`, 20, 60);
  
  if (leadData.calculations) {
    // Add financial information
    doc.text('Financial Summary:', 20, 80);
    doc.text(`Income: $${leadData.income?.toLocaleString()}`, 20, 90);
    doc.text(`State: ${leadData.state}`, 20, 100);
    doc.text(`Donation Amount: $${leadData.donationAmount?.toLocaleString()}`, 20, 110);
    
    // Add calculations
    doc.text('Calculated Benefits:', 20, 130);
    doc.text(`Heroes Supported: ${leadData.calculations.heroesSupported}`, 20, 140);
    doc.text(`Philanthropic Impact: $${leadData.calculations.philanthropicImpact.toLocaleString()}`, 20, 150);
    doc.text(`Net Tax Savings: $${leadData.calculations.netTaxSavings.toLocaleString()}`, 20, 160);
    doc.text(`Federal Benefit: $${leadData.calculations.federal.toLocaleString()}`, 20, 170);
    doc.text(`State Benefit: $${leadData.calculations.state.toLocaleString()}`, 20, 180);
  }
  
  // Add footer
  doc.setFontSize(10);
  doc.text('This document is for informational purposes only and does not constitute tax advice.', 20, 270);
  
  return doc.output('blob');
}; 