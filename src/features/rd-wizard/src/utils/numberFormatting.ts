/**
 * Utility functions for number formatting
 */

/**
 * Rounds a number to the nearest whole number
 */
export const roundToWholeNumber = (num: number): number => {
  return Math.round(num);
};

/**
 * Rounds a dollar amount to the nearest dollar
 */
export const roundToDollar = (amount: number): number => {
  return Math.round(amount);
};

/**
 * Formats a number as a percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Formats a number as a dollar string
 */
export const formatDollar = (amount: number): string => {
  return `$${roundToDollar(amount).toLocaleString()}`;
};

/**
 * Generates a random percentage between min and max
 */
export const generateRandomPercentage = (min: number, max: number): number => {
  return roundToWholeNumber(Math.random() * (max - min) + min);
};

/**
 * Calculates historical frequency percentage
 * Reduces by 1-4% each year, never going below 10%
 */
export const calculateHistoricalFrequency = (baseFrequency: number, yearOffset: number): number => {
  const reductionPerYear = generateRandomPercentage(1, 4);
  const reducedFrequency = baseFrequency - (reductionPerYear * yearOffset);
  return Math.max(10, roundToWholeNumber(reducedFrequency));
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}; 