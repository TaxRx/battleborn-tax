// Import types and state configurations
import { TaxRates } from '../../types';
import { stateConfigs2024 } from './stateConfigs2024';
import { stateConfigs2025 } from './stateConfigs2025';

// Helper function to create no-tax state config
const createNoTaxState = () => ({
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
const createStateConfig = (
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

// Create state configurations that will be shared between years
const stateConfigs = {
  // States with no income tax
  AK: createNoTaxState(),
  FL: createNoTaxState(),
  NV: createNoTaxState(),
  NH: createNoTaxState(),
  SD: createNoTaxState(),
  TN: createNoTaxState(),
  TX: createNoTaxState(),
  WA: createNoTaxState(),
  WY: createNoTaxState(),

  // States with flat tax rates
  CO: createStateConfig(
    [{ rate: 0.0440, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 13850, married_joint: 27700, married_separate: 13850, head_household: 20800 }
  ),
  IL: createStateConfig(
    [{ rate: 0.0495, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 0, married_joint: 0, married_separate: 0, head_household: 0 }
  ),
  IN: createStateConfig(
    [{ rate: 0.0305, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 0, married_joint: 0, married_separate: 0, head_household: 0 }
  ),
  KY: createStateConfig(
    [{ rate: 0.0475, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 2990, married_joint: 2990, married_separate: 2990, head_household: 2990 }
  ),
  MA: createStateConfig(
    [{ rate: 0.0500, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 0, married_joint: 0, married_separate: 0, head_household: 0 }
  ),
  MI: createStateConfig(
    [{ rate: 0.0405, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 0, married_joint: 0, married_separate: 0, head_household: 0 }
  ),
  NC: createStateConfig(
    [{ rate: 0.0475, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 12950, married_joint: 25900, married_separate: 12950, head_household: 19400 }
  ),
  PA: createStateConfig(
    [{ rate: 0.0307, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 0, married_joint: 0, married_separate: 0, head_household: 0 }
  ),
  UT: createStateConfig(
    [{ rate: 0.0485, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 14600, married_joint: 29200, married_separate: 14600, head_household: 21900 }
  ),

  // States with progressive tax rates
  AL: createStateConfig(
    [
      { rate: 0.02, single: 500, married_joint: 1000, married_separate: 500, head_household: 500 },
      { rate: 0.04, single: 3000, married_joint: 6000, married_separate: 3000, head_household: 3000 },
      { rate: 0.05, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2500, married_joint: 7500, married_separate: 3750, head_household: 4700 }
  ),
  AZ: createStateConfig(
    [
      { rate: 0.0259, single: 28708, married_joint: 57414, married_separate: 28708, head_household: 28708 },
      { rate: 0.0334, single: 71646, married_joint: 143292, married_separate: 71646, head_household: 71646 },
      { rate: 0.0417, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 12950, married_joint: 25900, married_separate: 12950, head_household: 19400 }
  ),
  AR: createStateConfig(
    [
      { rate: 0.02, single: 4300, married_joint: 4300, married_separate: 4300, head_household: 4300 },
      { rate: 0.04, single: 8500, married_joint: 8500, married_separate: 8500, head_household: 8500 },
      { rate: 0.0475, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2200, married_joint: 4400, married_separate: 2200, head_household: 2200 }
  ),
  CA: createStateConfig(
    [
      { rate: 0.01, single: 10099, married_joint: 20198, married_separate: 10099, head_household: 10099 },
      { rate: 0.02, single: 23942, married_joint: 47884, married_separate: 23942, head_household: 23942 },
      { rate: 0.04, single: 37788, married_joint: 75576, married_separate: 37788, head_household: 37788 },
      { rate: 0.06, single: 52455, married_joint: 104910, married_separate: 52455, head_household: 52455 },
      { rate: 0.08, single: 66295, married_joint: 132590, married_separate: 66295, head_household: 66295 },
      { rate: 0.093, single: 338639, married_joint: 677278, married_separate: 338639, head_household: 338639 },
      { rate: 0.103, single: 406364, married_joint: 812728, married_separate: 406364, head_household: 406364 },
      { rate: 0.113, single: 677275, married_joint: 1354550, married_separate: 677275, head_household: 677275 },
      { rate: 0.123, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 5202, married_joint: 10404, married_separate: 5202, head_household: 10404 }
  ),
  CT: createStateConfig(
    [
      { rate: 0.03, single: 10000, married_joint: 20000, married_separate: 10000, head_household: 16000 },
      { rate: 0.05, single: 50000, married_joint: 100000, married_separate: 50000, head_household: 80000 },
      { rate: 0.055, single: 100000, married_joint: 200000, married_separate: 100000, head_household: 160000 },
      { rate: 0.06, single: 200000, married_joint: 400000, married_separate: 200000, head_household: 320000 },
      { rate: 0.065, single: 250000, married_joint: 500000, married_separate: 250000, head_household: 400000 },
      { rate: 0.069, single: 500000, married_joint: 1000000, married_separate: 500000, head_household: 800000 },
      { rate: 0.0699, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 15000, married_joint: 24000, married_separate: 12000, head_household: 19000 }
  ),
  DE: createStateConfig(
    [
      { rate: 0.022, single: 2000, married_joint: 2000, married_separate: 2000, head_household: 2000 },
      { rate: 0.039, single: 5000, married_joint: 5000, married_separate: 5000, head_household: 5000 },
      { rate: 0.048, single: 10000, married_joint: 10000, married_separate: 10000, head_household: 10000 },
      { rate: 0.052, single: 20000, married_joint: 20000, married_separate: 20000, head_household: 20000 },
      { rate: 0.055, single: 25000, married_joint: 25000, married_separate: 25000, head_household: 25000 },
      { rate: 0.066, single: 60000, married_joint: 60000, married_separate: 60000, head_household: 60000 },
      { rate: 0.068, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 3250, married_joint: 6500, married_separate: 3250, head_household: 3250 }
  ),
  GA: createStateConfig(
    [
      { rate: 0.01, single: 1000, married_joint: 2000, married_separate: 1000, head_household: 1000 },
      { rate: 0.02, single: 3000, married_joint: 6000, married_separate: 3000, head_household: 3000 },
      { rate: 0.03, single: 5000, married_joint: 10000, married_separate: 5000, head_household: 5000 },
      { rate: 0.04, single: 7000, married_joint: 14000, married_separate: 7000, head_household: 7000 },
      { rate: 0.05, single: 10000, married_joint: 20000, married_separate: 10000, head_household: 10000 },
      { rate: 0.0575, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 5400, married_joint: 10800, married_separate: 5400, head_household: 5400 }
  ),
  HI: createStateConfig(
    [
      { rate: 0.014, single: 2400, married_joint: 4800, married_separate: 2400, head_household: 3600 },
      { rate: 0.032, single: 4800, married_joint: 9600, married_separate: 4800, head_household: 7200 },
      { rate: 0.055, single: 9600, married_joint: 19200, married_separate: 9600, head_household: 14400 },
      { rate: 0.064, single: 14400, married_joint: 28800, married_separate: 14400, head_household: 21600 },
      { rate: 0.068, single: 19200, married_joint: 38400, married_separate: 19200, head_household: 28800 },
      { rate: 0.072, single: 24000, married_joint: 48000, married_separate: 24000, head_household: 36000 },
      { rate: 0.076, single: 36000, married_joint: 72000, married_separate: 36000, head_household: 54000 },
      { rate: 0.079, single: 48000, married_joint: 96000, married_separate: 48000, head_household: 72000 },
      { rate: 0.0825, single: 150000, married_joint: 300000, married_separate: 150000, head_household: 225000 },
      { rate: 0.09, single: 175000, married_joint: 350000, married_separate: 175000, head_household: 262500 },
      { rate: 0.10, single: 200000, married_joint: 400000, married_separate: 200000, head_household: 300000 },
      { rate: 0.11, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2200, married_joint: 4400, married_separate: 2200, head_household: 2200 }
  ),
  ID: createStateConfig(
    [
      { rate: 0.01, single: 1500, married_joint: 3000, married_separate: 1500, head_household: 1500 },
      { rate: 0.03, single: 3000, married_joint: 6000, married_separate: 3000, head_household: 3000 },
      { rate: 0.045, single: 4500, married_joint: 9000, married_separate: 4500, head_household: 4500 },
      { rate: 0.06, single: 7500, married_joint: 15000, married_separate: 7500, head_household: 7500 },
      { rate: 0.065, single: 11000, married_joint: 22000, married_separate: 11000, head_household: 11000 },
      { rate: 0.069, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 12950, married_joint: 25900, married_separate: 12950, head_household: 19400 }
  ),
  IA: createStateConfig(
    [
      { rate: 0.004, single: 0, married_joint: 0, married_separate: 0, head_household: 0 },
      { rate: 0.0044, single: 6000, married_joint: 12000, married_separate: 6000, head_household: 6000 },
      { rate: 0.0057, single: 30000, married_joint: 60000, married_separate: 30000, head_household: 30000 },
      { rate: 0.006, single: 75000, married_joint: 150000, married_separate: 75000, head_household: 75000 },
      { rate: 0.0061, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2100, married_joint: 5200, married_separate: 2100, head_household: 2100 }
  ),
  KS: createStateConfig(
    [
      { rate: 0.031, single: 15000, married_joint: 30000, married_separate: 15000, head_household: 15000 },
      { rate: 0.0525, single: 30000, married_joint: 60000, married_separate: 30000, head_household: 30000 },
      { rate: 0.057, single: 60000, married_joint: 120000, married_separate: 60000, head_household: 60000 },
      { rate: 0.059, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 3500, married_joint: 8000, married_separate: 3500, head_household: 3500 }
  ),
  LA: createStateConfig(
    [
      { rate: 0.02, single: 12500, married_joint: 25000, married_separate: 12500, head_household: 12500 },
      { rate: 0.04, single: 50000, married_joint: 100000, married_separate: 50000, head_household: 50000 },
      { rate: 0.06, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 4500, married_joint: 9000, married_separate: 4500, head_household: 4500 }
  ),
  ME: createStateConfig(
    [
      { rate: 0.058, single: 24500, married_joint: 49000, married_separate: 24500, head_household: 24500 },
      { rate: 0.0675, single: 58050, married_joint: 116100, married_separate: 58050, head_household: 58050 },
      { rate: 0.0715, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 12950, married_joint: 25900, married_separate: 12950, head_household: 19400 }
  ),
  MD: createStateConfig(
    [
      { rate: 0.02, single: 1000, married_joint: 2000, married_separate: 1000, head_household: 1000 },
      { rate: 0.03, single: 2000, married_joint: 4000, married_separate: 2000, head_household: 2000 },
      { rate: 0.04, single: 3000, married_joint: 6000, married_separate: 3000, head_household: 3000 },
      { rate: 0.0475, single: 100000, married_joint: 200000, married_separate: 100000, head_household: 100000 },
      { rate: 0.05, single: 125000, married_joint: 250000, married_separate: 125000, head_household: 125000 },
      { rate: 0.0525, single: 150000, married_joint: 300000, married_separate: 150000, head_household: 150000 },
      { rate: 0.055, single: 250000, married_joint: 500000, married_separate: 250000, head_household: 250000 },
      { rate: 0.0575, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2300, married_joint: 4600, married_separate: 2300, head_household: 2300 }
  ),
  MN: createStateConfig(
    [
      { rate: 0.0535, single: 0, married_joint: 0, married_separate: 0, head_household: 0 },
      { rate: 0.068, single: 30000, married_joint: 60000, married_separate: 30000, head_household: 30000 },
      { rate: 0.0785, single: 100000, married_joint: 200000, married_separate: 100000, head_household: 100000 },
      { rate: 0.0985, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 12950, married_joint: 25900, married_separate: 12950, head_household: 19400 }
  ),
  MS: createStateConfig(
    [
      { rate: 0.04, single: 0, married_joint: 0, married_separate: 0, head_household: 0 },
      { rate: 0.05, single: 10000, married_joint: 20000, married_separate: 10000, head_household: 10000 },
      { rate: 0.0525, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2300, married_joint: 4600, married_separate: 2300, head_household: 2300 }
  )
};

// Create base tax rates object
export const taxRates: Record<number, TaxRates> = {
  2024: {
    year: 2024,
    federal: {
      brackets: [
        { rate: 0.10, single: 11600, married_joint: 23200, married_separate: 11600, head_household: 16550 },
        { rate: 0.12, single: 47150, married_joint: 94300, married_separate: 47150, head_household: 63100 },
        { rate: 0.22, single: 100525, married_joint: 201050, married_separate: 100525, head_household: 100500 },
        { rate: 0.24, single: 191950, married_joint: 383900, married_separate: 191950, head_household: 191950 },
        { rate: 0.32, single: 243725, married_joint: 487450, married_separate: 243725, head_household: 243700 },
        { rate: 0.35, single: 609350, married_joint: 731200, married_separate: 365600, head_household: 609350 },
        { rate: 0.37, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
      ],
      standardDeduction: {
        single: 14600,
        married_joint: 29200,
        married_separate: 14600,
        head_household: 21900
      }
    },
    state: stateConfigs2024,
    fica: {
      socialSecurity: {
        rate: 0.062,
        wageBase: 168600
      },
      medicare: {
        rate: 0.0145,
        additionalRate: 0.009,
        additionalThreshold: 200000
      }
    },
    selfEmployment: {
      rate: 0.153
    }
  },
  2025: {
    year: 2025,
    federal: {
      brackets: [
        { rate: 0.10, single: 11950, married_joint: 23900, married_separate: 11950, head_household: 17050 },
        { rate: 0.12, single: 48550, married_joint: 97100, married_separate: 48550, head_household: 65000 },
        { rate: 0.22, single: 103550, married_joint: 207100, married_separate: 103550, head_household: 103550 },
        { rate: 0.24, single: 197700, married_joint: 395400, married_separate: 197700, head_household: 197700 },
        { rate: 0.32, single: 251050, married_joint: 502100, married_separate: 251050, head_household: 251050 },
        { rate: 0.35, single: 627750, married_joint: 753150, married_separate: 376575, head_household: 627750 },
        { rate: 0.37, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
      ],
      standardDeduction: {
        single: 15050,
        married_joint: 30100,
        married_separate: 15050,
        head_household: 22550
      }
    },
    state: stateConfigs2025,
    fica: {
      socialSecurity: {
        rate: 0.062,
        wageBase: 175200
      },
      medicare: {
        rate: 0.0145,
        additionalRate: 0.009,
        additionalThreshold: 200000
      }
    },
    selfEmployment: {
      rate: 0.153
    }
  }
}; 