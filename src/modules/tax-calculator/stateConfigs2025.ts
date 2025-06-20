// Import helper functions
import { createNoTaxState, createStateConfig } from './taxRateHelpers';

// Create state configurations for 2025
export const stateConfigs2025 = {
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
    { single: 14600, married_joint: 29200, married_separate: 14600, head_household: 21900 }
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
    { single: 3080, married_joint: 3080, married_separate: 3080, head_household: 3080 }
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
    { single: 13850, married_joint: 27700, married_separate: 13850, head_household: 20800 }
  ),
  PA: createStateConfig(
    [{ rate: 0.0307, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 0, married_joint: 0, married_separate: 0, head_household: 0 }
  ),
  UT: createStateConfig(
    [{ rate: 0.0485, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }],
    { single: 15050, married_joint: 30100, married_separate: 15050, head_household: 22550 }
  ),

  // States with progressive tax rates
  AL: createStateConfig(
    [
      { rate: 0.02, single: 500, married_joint: 1000, married_separate: 500, head_household: 500 },
      { rate: 0.04, single: 3000, married_joint: 6000, married_separate: 3000, head_household: 3000 },
      { rate: 0.05, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2575, married_joint: 7725, married_separate: 3863, head_household: 4841 }
  ),
  AZ: createStateConfig(
    [
      { rate: 0.0259, single: 29569, married_joint: 59136, married_separate: 29569, head_household: 29569 },
      { rate: 0.0334, single: 73795, married_joint: 147591, married_separate: 73795, head_household: 73795 },
      { rate: 0.0417, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 13850, married_joint: 27700, married_separate: 13850, head_household: 20800 }
  ),
  AR: createStateConfig(
    [
      { rate: 0.02, single: 4429, married_joint: 4429, married_separate: 4429, head_household: 4429 },
      { rate: 0.04, single: 8755, married_joint: 8755, married_separate: 8755, head_household: 8755 },
      { rate: 0.0475, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2266, married_joint: 4532, married_separate: 2266, head_household: 2266 }
  ),
  CA: createStateConfig(
    [
      { rate: 0.01, single: 10402, married_joint: 20804, married_separate: 10402, head_household: 10402 },
      { rate: 0.02, single: 24660, married_joint: 49321, married_separate: 24660, head_household: 24660 },
      { rate: 0.04, single: 38922, married_joint: 77843, married_separate: 38922, head_household: 38922 },
      { rate: 0.06, single: 54029, married_joint: 108057, married_separate: 54029, head_household: 54029 },
      { rate: 0.08, single: 68284, married_joint: 136568, married_separate: 68284, head_household: 68284 },
      { rate: 0.093, single: 348798, married_joint: 697596, married_separate: 348798, head_household: 348798 },
      { rate: 0.103, single: 418555, married_joint: 837110, married_separate: 418555, head_household: 418555 },
      { rate: 0.113, single: 697593, married_joint: 1395187, married_separate: 697593, head_household: 697593 },
      { rate: 0.123, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 5358, married_joint: 10716, married_separate: 5358, head_household: 10716 }
  ),
  CT: createStateConfig(
    [
      { rate: 0.03, single: 10300, married_joint: 20600, married_separate: 10300, head_household: 16480 },
      { rate: 0.05, single: 51500, married_joint: 103000, married_separate: 51500, head_household: 82400 },
      { rate: 0.055, single: 103000, married_joint: 206000, married_separate: 103000, head_household: 164800 },
      { rate: 0.06, single: 206000, married_joint: 412000, married_separate: 206000, head_household: 329600 },
      { rate: 0.065, single: 257500, married_joint: 515000, married_separate: 257500, head_household: 412000 },
      { rate: 0.069, single: 515000, married_joint: 1030000, married_separate: 515000, head_household: 824000 },
      { rate: 0.0699, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 15450, married_joint: 24720, married_separate: 12360, head_household: 19570 }
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
    { single: 3348, married_joint: 6695, married_separate: 3348, head_household: 3348 }
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
    { single: 5562, married_joint: 11124, married_separate: 5562, head_household: 5562 }
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
    { single: 2266, married_joint: 4532, married_separate: 2266, head_household: 2266 }
  ),
  ID: createStateConfig(
    [
      { rate: 0.01, single: 1545, married_joint: 3090, married_separate: 1545, head_household: 1545 },
      { rate: 0.03, single: 3090, married_joint: 6180, married_separate: 3090, head_household: 3090 },
      { rate: 0.045, single: 4635, married_joint: 9270, married_separate: 4635, head_household: 4635 },
      { rate: 0.06, single: 7725, married_joint: 15450, married_separate: 7725, head_household: 7725 },
      { rate: 0.065, single: 11330, married_joint: 22660, married_separate: 11330, head_household: 11330 },
      { rate: 0.069, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 13850, married_joint: 27700, married_separate: 13850, head_household: 20800 }
  ),
  IA: createStateConfig(
    [
      { rate: 0.004, single: 0, married_joint: 0, married_separate: 0, head_household: 0 },
      { rate: 0.0044, single: 6180, married_joint: 12360, married_separate: 6180, head_household: 6180 },
      { rate: 0.0057, single: 30900, married_joint: 61800, married_separate: 30900, head_household: 30900 },
      { rate: 0.006, single: 77250, married_joint: 154500, married_separate: 77250, head_household: 77250 },
      { rate: 0.0061, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2163, married_joint: 5356, married_separate: 2163, head_household: 2163 }
  ),
  KS: createStateConfig(
    [
      { rate: 0.031, single: 15450, married_joint: 30900, married_separate: 15450, head_household: 15450 },
      { rate: 0.0525, single: 30900, married_joint: 61800, married_separate: 30900, head_household: 30900 },
      { rate: 0.057, single: 61800, married_joint: 123600, married_separate: 61800, head_household: 61800 },
      { rate: 0.059, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 3605, married_joint: 8240, married_separate: 3605, head_household: 3605 }
  ),
  LA: createStateConfig(
    [
      { rate: 0.02, single: 12875, married_joint: 25750, married_separate: 12875, head_household: 12875 },
      { rate: 0.04, single: 51500, married_joint: 103000, married_separate: 51500, head_household: 51500 },
      { rate: 0.06, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 4635, married_joint: 9270, married_separate: 4635, head_household: 4635 }
  ),
  ME: createStateConfig(
    [
      { rate: 0.058, single: 25235, married_joint: 50470, married_separate: 25235, head_household: 25235 },
      { rate: 0.0675, single: 59792, married_joint: 119583, married_separate: 59792, head_household: 59792 },
      { rate: 0.0715, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 13850, married_joint: 27700, married_separate: 13850, head_household: 20800 }
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
    { single: 2369, married_joint: 4738, married_separate: 2369, head_household: 2369 }
  ),
  MN: createStateConfig(
    [
      { rate: 0.0535, single: 0, married_joint: 0, married_separate: 0, head_household: 0 },
      { rate: 0.068, single: 30900, married_joint: 61800, married_separate: 30900, head_household: 30900 },
      { rate: 0.0785, single: 103000, married_joint: 206000, married_separate: 103000, head_household: 103000 },
      { rate: 0.0985, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 13850, married_joint: 27700, married_separate: 13850, head_household: 20800 }
  ),
  MS: createStateConfig(
    [
      { rate: 0.04, single: 0, married_joint: 0, married_separate: 0, head_household: 0 },
      { rate: 0.05, single: 10300, married_joint: 20600, married_separate: 10300, head_household: 10300 },
      { rate: 0.0525, single: Infinity, married_joint: Infinity, married_separate: Infinity, head_household: Infinity }
    ],
    { single: 2369, married_joint: 4738, married_separate: 2369, head_household: 2369 }
  )
}; 