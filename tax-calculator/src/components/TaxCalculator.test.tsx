import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from '@jest/globals';
import TaxCalculator from './TaxCalculator';
import { supabase } from '../tests/__mocks__/supabase';
import { taxRates } from '../data/taxRates';

// Mock the zustand store
jest.mock('../store/taxStore', () => ({
  useTaxStore: () => ({
    taxInfo: {
      user_id: 'test-user',
      filing_status: 'single',
      standard_deduction: true,
      custom_deduction: 0,
      itemized_deductions: 0,
      wages_income: 0,
      business_income: 0,
      investment_income: 0,
      rental_income: 0,
      other_income: 0,
      state: 'CA'
    },
    updateTaxInfo: jest.fn(),
    calculateTax: jest.fn(),
    saveTaxCalculation: jest.fn(),
    loadSavedCalculations: jest.fn(),
  })
}));

describe('TaxCalculator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<TaxCalculator />);
    expect(screen.getByTestId('tax-calculator')).toBeInTheDocument();
  });

  test('handles missing tax rates gracefully', () => {
    // Mock taxRates as undefined
    jest.mock('../data/taxRates', () => ({
      taxRates: undefined
    }));
    
    render(<TaxCalculator />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('handles form submission with invalid data', async () => {
    render(<TaxCalculator />);
    
    // Try to submit with invalid wages
    const wagesInput = screen.getByLabelText(/wages/i);
    fireEvent.change(wagesInput, { target: { value: -1000 } });
    
    const submitButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid input/i)).toBeInTheDocument();
    });
  });

  test('handles network errors during calculation save', async () => {
    // Mock a network error
    supabase.from.mockReturnValue({
      insert: jest.fn().mockRejectedValue(new Error('Network error'))
    });

    render(<TaxCalculator />);
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
  });

  test('handles authentication errors', async () => {
    // Mock an authentication error
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error('Not authenticated') });
    
    render(<TaxCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    });
  });

  test('handles state changes correctly', async () => {
    render(<TaxCalculator />);
    
    // Change state selection
    const stateSelect = screen.getByLabelText(/state/i);
    fireEvent.change(stateSelect, { target: { value: 'NY' } });
    
    await waitFor(() => {
      expect(screen.getByText(/new york/i)).toBeInTheDocument();
    });
  });

  test('updates tax brackets when filing status changes', async () => {
    render(<TaxCalculator />);
    
    // Change filing status
    const filingStatusSelect = screen.getByLabelText(/filing status/i);
    fireEvent.change(filingStatusSelect, { target: { value: 'married_joint' } });
    
    await waitFor(() => {
      expect(screen.getByText(/married filing jointly/i)).toBeInTheDocument();
    });
  });

  test('handles large numbers without precision loss', () => {
    render(<TaxCalculator />);
    
    // Enter a large income
    const wagesInput = screen.getByLabelText(/wages/i);
    fireEvent.change(wagesInput, { target: { value: '9999999.99' } });
    
    expect(wagesInput).toHaveValue('9999999.99');
  });
}); 