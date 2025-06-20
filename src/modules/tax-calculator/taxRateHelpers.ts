// Helper function to create no-tax state config
export const createNoTaxState = () => ({
  brackets: [
    { 
      rate: 0, 
      single: Infinity, 
      married_joint: Infinity, 
      married_separate: Infinity, 
      head_household: Infinity 
    }
  ],
  standardDeduction: {
    single: 0,
    married_joint: 0,
    married_separate: 0,
    head_household: 0
  }
});

// Helper function to create state tax config
export const createStateConfig = (
  brackets: Array<{
    rate: number;
    single: number;
    married_joint: number;
    married_separate: number;
    head_household: number;
  }>,
  standardDeduction: {
    single: number;
    married_joint: number;
    married_separate: number;
    head_household: number;
  }
) => ({
  brackets,
  standardDeduction
}); 