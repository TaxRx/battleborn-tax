import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from '@jest/globals';
import InfoForm from './InfoForm';
import { supabase } from '../tests/__mocks__/supabase';
import type { TaxInfo } from '../types/tax';

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
  })
}));

describe('InfoForm Component', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    initialValues: {
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
    } as TaxInfo
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<InfoForm {...defaultProps} />);
    expect(screen.getByTestId('info-form')).toBeInTheDocument();
  });

  test('handles form validation correctly', async () => {
    render(<InfoForm {...defaultProps} />);
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/required field/i)).toBeInTheDocument();
    });
  });

  test('handles form submission with valid data', async () => {
    const mockUpdateTaxInfo = jest.fn();
    const mockOnSubmit = jest.fn();

    render(<InfoForm {...defaultProps} onSubmit={mockOnSubmit} />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: 'Acme Inc' }
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('handles server errors gracefully', async () => {
    // Mock a server error
    const mockError = new Error('Server error');
    supabase.from.mockReturnValue({
      update: jest.fn().mockRejectedValue(mockError)
    });

    const mockOnSubmit = jest.fn().mockRejectedValue(mockError);
    render(<InfoForm {...defaultProps} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error saving/i)).toBeInTheDocument();
    });
  });

  test('handles state selection change', async () => {
    const mockOnSubmit = jest.fn();
    render(<InfoForm {...defaultProps} onSubmit={mockOnSubmit} />);
    
    // Change state
    const stateSelect = screen.getByLabelText(/state/i);
    fireEvent.change(stateSelect, { target: { value: 'NY' } });
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'NY' })
      );
    });
  });

  test('handles business owner toggle', async () => {
    render(<InfoForm {...defaultProps} />);
    
    // Toggle business owner checkbox
    const checkbox = screen.getByLabelText(/business owner/i);
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/entity type/i)).toBeInTheDocument();
    });
  });

  test('preserves form state on re-render', () => {
    const { rerender } = render(<InfoForm {...defaultProps} />);
    
    // Fill out a field
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    
    // Re-render component
    rerender(<InfoForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/full name/i)).toHaveValue('John Doe');
  });
}); 