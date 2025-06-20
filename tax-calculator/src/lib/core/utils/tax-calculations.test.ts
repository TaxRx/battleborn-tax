import { TaxInfo, TaxRates, FilingStatus, SavedCalculation } from '../../../types/tax';
import { calculateTaxBreakdown } from './tax-calculations';
import { supabase, MockResponse } from '../../../tests/__mocks__/supabase';

const commonBrackets = {
  single: [
    { rate: 0.1, min: 0, max: 11000 },
    { rate: 0.12, min: 11001, max: 44725 },
    { rate: 0.22, min: 44726, max: 95375 },
    { rate: 0.24, min: 95376, max: 182100 },
    { rate: 0.32, min: 182101, max: 231250 },
    { rate: 0.35, min: 231251, max: 578125 },
    { rate: 0.37, min: 578126, max: Infinity }
  ],
  married_joint: [
    { rate: 0.1, min: 0, max: 22000 },
    { rate: 0.12, min: 22001, max: 89450 },
    { rate: 0.22, min: 89451, max: 190750 },
    { rate: 0.24, min: 190751, max: 364200 },
    { rate: 0.32, min: 364201, max: 462500 },
    { rate: 0.35, min: 462501, max: 693750 },
    { rate: 0.37, min: 693751, max: Infinity }
  ],
  married_separate: [
    { rate: 0.1, min: 0, max: 11000 },
    { rate: 0.12, min: 11001, max: 44725 },
    { rate: 0.22, min: 44726, max: 95375 },
    { rate: 0.24, min: 95376, max: 182100 },
    { rate: 0.32, min: 182101, max: 231250 },
    { rate: 0.35, min: 231251, max: 346875 },
    { rate: 0.37, min: 346876, max: Infinity }
  ],
  head_household: [
    { rate: 0.1, min: 0, max: 15700 },
    { rate: 0.12, min: 15701, max: 59850 },
    { rate: 0.22, min: 59851, max: 95350 },
    { rate: 0.24, min: 95351, max: 182100 },
    { rate: 0.32, min: 182101, max: 231250 },
    { rate: 0.35, min: 231251, max: 578100 },
    { rate: 0.37, min: 578101, max: Infinity }
  ]
};

const commonStandardDeductions = {
  single: 13850,
  married_joint: 27700,
  married_separate: 13850,
  head_household: 20800
};

describe('Tax Calculations', () => {
  const mockTaxInfo: TaxInfo = {
    user_id: 'test-user',
    filing_status: 'single' as FilingStatus,
    standard_deduction: true,
    custom_deduction: 0,
    itemized_deductions: 0,
    wages_income: 100000,
    business_income: 50000,
    investment_income: 20000,
    rental_income: 15000,
    other_income: 5000,
    passive_income: 10000,
    unearned_income: 5000,
    capital_gains: 10000,
    business_owner: true,
    ordinary_k1_income: 20000,
    guaranteed_k1_income: 10000,
    state: 'CA'
  };

  const mockTaxRates: TaxRates = {
    year: 2024,
    federal: {
      brackets: commonBrackets,
      standard_deduction: commonStandardDeductions
    },
    state: {
      CA: {
        brackets: commonBrackets,
        standard_deduction: commonStandardDeductions
      }
    },
    fica: {
      social_security: 0.062,
      social_security_limit: 168600,
      medicare: 0.0145,
      self_employment: 0.153
    },
    self_employment: {
      rate: 0.153
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculates tax breakdown correctly', () => {
    const result = calculateTaxBreakdown(mockTaxInfo, mockTaxRates);
    
    expect(result).toBeDefined();
    expect(result.federal).toBeGreaterThan(0);
    expect(result.state).toBeGreaterThan(0);
    expect(result.social_security).toBeGreaterThan(0);
    expect(result.medicare).toBeGreaterThan(0);
    expect(result.self_employment).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.effective_rate).toBeGreaterThan(0);
    expect(result.marginal_rate).toBeGreaterThan(0);
    expect(result.deductions).toBeDefined();
    expect(result.deductions.standard).toBeGreaterThan(0);
    expect(result.deductions.itemized).toBe(0);
    expect(result.deductions.total).toBeGreaterThan(0);
  });

  test('saves tax calculation to database', async () => {
    const result = calculateTaxBreakdown(mockTaxInfo, mockTaxRates);
    const savedCalculation: SavedCalculation = {
      id: 'test-calc-id',
      user_id: mockTaxInfo.user_id,
      year: mockTaxRates.year,
      date: new Date().toISOString(),
      tax_info: mockTaxInfo,
      breakdown: result,
      strategies: []
    };

    // Mock the Supabase response
    const mockResponse: MockResponse<SavedCalculation> = {
      data: savedCalculation,
      error: null
    };

    supabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue(mockResponse),
    });

    const response = await supabase
      .from('tax_calculations')
      .insert(savedCalculation);

    expect(response.error).toBeNull();
    expect(response.data).toEqual(savedCalculation);
    expect(supabase.from).toHaveBeenCalledWith('tax_calculations');
  });

  test('loads saved tax calculations from database', async () => {
    const result = calculateTaxBreakdown(mockTaxInfo, mockTaxRates);
    const savedCalculations: SavedCalculation[] = [{
      id: 'test-calc-id',
      user_id: mockTaxInfo.user_id,
      year: mockTaxRates.year,
      date: new Date().toISOString(),
      tax_info: mockTaxInfo,
      breakdown: result,
      strategies: []
    }];

    // Mock the Supabase response
    const mockResponse: MockResponse<SavedCalculation[]> = {
      data: savedCalculations,
      error: null
    };

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    const response = await supabase
      .from('tax_calculations')
      .select('*')
      .eq('user_id', mockTaxInfo.user_id)
      .order('date', { ascending: false });

    expect(response.error).toBeNull();
    expect(response.data).toEqual(savedCalculations);
    expect(supabase.from).toHaveBeenCalledWith('tax_calculations');
  });

  test('handles database errors gracefully', async () => {
    const error = new Error('Database error');
    
    // Mock the Supabase error response
    const mockResponse: MockResponse<SavedCalculation[]> = {
      data: null,
      error
    };

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    const response = await supabase
      .from('tax_calculations')
      .select('*')
      .eq('user_id', mockTaxInfo.user_id)
      .order('date', { ascending: false });

    expect(response.error).toEqual(error);
    expect(response.data).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('tax_calculations');
  });
}); 