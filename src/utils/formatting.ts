/**
 * Format a number as currency with proper formatting
 * @param value - The number to format
 * @param currency - The currency symbol (default: '$')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | undefined | null, currency: string = '$'): string {
  if (value === undefined || value === null || value === '') {
    return `${currency}0`;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `${currency}0`;
  }
  
  return `${currency}${numValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Parse a currency string back to a number
 * @param value - The currency string to parse
 * @returns The parsed number or 0 if invalid
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbol and commas
  const cleanValue = value.replace(/[$,]/g, '');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
}

export const formatEIN = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as XX-XXXXXXX
  if (digits.length <= 2) {
    return digits;
  } else {
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  }
};

export const generateDefaultYears = (currentYear: number = new Date().getFullYear()) => {
  const years = [];
  // Only show current year by default
  years.push({
    year: currentYear,
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0,
    capitalGains: 0,
    longTermCapitalGains: 0,
    householdIncome: 0,
    ordinaryIncome: 0,
    isActive: true
  });
  return years;
};

export const calculateHouseholdIncome = (personalYear: any, businesses: any[] = []) => {
  // Sum all income sources
  const totalIncome = 
    (personalYear.wagesIncome || 0) + 
    (personalYear.passiveIncome || 0) + 
    (personalYear.unearnedIncome || 0) + 
    (personalYear.capitalGains || 0);

  // Sum K-1 income from all businesses for this year
  const k1Income = businesses.reduce((total, business) => {
    const businessYear = business.years?.find((y: any) => y.year === personalYear.year);
    if (businessYear && businessYear.isActive) {
      return total + (businessYear.ordinaryK1Income || 0) + (businessYear.guaranteedK1Income || 0);
    }
    return total;
  }, 0);

  return totalIncome + k1Income;
};

export const calculateOrdinaryIncome = (personalYear: any, businesses: any[] = []) => {
  // Ordinary income = W-2 + passive + unearned + K-1 income
  const ordinaryIncome = 
    (personalYear.wagesIncome || 0) + 
    (personalYear.passiveIncome || 0) + 
    (personalYear.unearnedIncome || 0);

  // Add K-1 income from all businesses for this year
  const k1Income = businesses.reduce((total, business) => {
    const businessYear = business.years?.find((y: any) => y.year === personalYear.year);
    if (businessYear && businessYear.isActive) {
      return total + (businessYear.ordinaryK1Income || 0) + (businessYear.guaranteedK1Income || 0);
    }
    return total;
  }, 0);

  return ordinaryIncome + k1Income;
};

export const generateDefaultBusinessYears = (currentYear: number = new Date().getFullYear()) => {
  const years = [];
  // 6 historical years + 1 future year
  for (let i = 6; i >= 0; i--) {
    const year = currentYear - i;
    years.push({
      year,
      isActive: true,
      ordinaryK1Income: 0,
      guaranteedK1Income: 0,
      annualRevenue: 0,
      employeeCount: 0
    });
  }
  return years;
}; 