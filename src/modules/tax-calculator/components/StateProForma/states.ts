// Comprehensive list of states with R&D tax credits
// Based on database analysis and state credit research

export interface StateCreditInfo {
  code: string;
  name: string;
  hasCredit: boolean;
  methods: ('standard' | 'alternative')[];
  forms: {
    standard?: string;
    alternative?: string;
  };
  notes: string[];
}

export const STATE_CREDIT_INFO: Record<string, StateCreditInfo> = {
  // States with R&D Credits
  AL: { code: 'AL', name: 'Alabama', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  AK: { code: 'AK', name: 'Alaska', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 6390' }, notes: ['Based on federal credit'] },
  AZ: { code: 'AZ', name: 'Arizona', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 308' }, notes: ['24% credit with base calculation'] },
  AR: { code: 'AR', name: 'Arkansas', hasCredit: true, methods: ['standard'], forms: { standard: 'Form AR1100CT' }, notes: ['Incremental and university research credits'] },
  CA: { code: 'CA', name: 'California', hasCredit: true, methods: ['standard', 'alternative'], forms: { standard: 'Form 3523', alternative: 'Form 3523' }, notes: ['Both standard and ASC credits available'] },
  CO: { code: 'CO', name: 'Colorado', hasCredit: true, methods: ['standard'], forms: { standard: 'Form DR 0097' }, notes: ['3% credit with base calculation'] },
  CT: { code: 'CT', name: 'Connecticut', hasCredit: true, methods: ['standard', 'alternative'], forms: { standard: 'Form 1120 RDC', alternative: 'Form 1120RC' }, notes: ['Two calculation methods available'] },
  DE: { code: 'DE', name: 'Delaware', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 1100' }, notes: ['Based on federal credit'] },
  FL: { code: 'FL', name: 'Florida', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  GA: { code: 'GA', name: 'Georgia', hasCredit: true, methods: ['standard'], forms: { standard: 'Form IT-RD' }, notes: ['10% credit with base calculation'] },
  HI: { code: 'HI', name: 'Hawaii', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  ID: { code: 'ID', name: 'Idaho', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  IL: { code: 'IL', name: 'Illinois', hasCredit: true, methods: ['standard'], forms: { standard: 'Form IL-1120' }, notes: ['6.5% credit with base calculation'] },
  IN: { code: 'IN', name: 'Indiana', hasCredit: true, methods: ['standard'], forms: { standard: 'Form IT-20' }, notes: ['10% credit'] },
  IA: { code: 'IA', name: 'Iowa', hasCredit: true, methods: ['standard'], forms: { standard: 'Form IA 1120' }, notes: ['6.5% credit'] },
  KS: { code: 'KS', name: 'Kansas', hasCredit: true, methods: ['standard'], forms: { standard: 'Form K-120' }, notes: ['6.5% credit'] },
  KY: { code: 'KY', name: 'Kentucky', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 720' }, notes: ['5% credit'] },
  LA: { code: 'LA', name: 'Louisiana', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  ME: { code: 'ME', name: 'Maine', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 1120ME' }, notes: ['5% credit'] },
  MD: { code: 'MD', name: 'Maryland', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 500' }, notes: ['3% credit'] },
  MA: { code: 'MA', name: 'Massachusetts', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 355C' }, notes: ['10% credit'] },
  MI: { code: 'MI', name: 'Michigan', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  MN: { code: 'MN', name: 'Minnesota', hasCredit: true, methods: ['standard'], forms: { standard: 'Form M4' }, notes: ['10% credit'] },
  MS: { code: 'MS', name: 'Mississippi', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 83-105' }, notes: ['5% credit'] },
  MO: { code: 'MO', name: 'Missouri', hasCredit: true, methods: ['standard'], forms: { standard: 'Form MO-1120' }, notes: ['5% credit'] },
  MT: { code: 'MT', name: 'Montana', hasCredit: true, methods: ['standard'], forms: { standard: 'Form CLT-4' }, notes: ['3% credit'] },
  NE: { code: 'NE', name: 'Nebraska', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 1120N' }, notes: ['3% credit'] },
  NV: { code: 'NV', name: 'Nevada', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  NH: { code: 'NH', name: 'New Hampshire', hasCredit: true, methods: ['standard'], forms: { standard: 'Form BT-Summary' }, notes: ['2.5% credit'] },
  NJ: { code: 'NJ', name: 'New Jersey', hasCredit: true, methods: ['standard'], forms: { standard: 'Form CBT-100' }, notes: ['10% credit'] },
  NM: { code: 'NM', name: 'New Mexico', hasCredit: true, methods: ['standard'], forms: { standard: 'Form CIT-1' }, notes: ['5% credit'] },
  NY: { code: 'NY', name: 'New York', hasCredit: true, methods: ['standard'], forms: { standard: 'Form CT-3' }, notes: ['9% credit with base calculation'] },
  NC: { code: 'NC', name: 'North Carolina', hasCredit: true, methods: ['standard'], forms: { standard: 'Form CD-401' }, notes: ['2.5% credit'] },
  ND: { code: 'ND', name: 'North Dakota', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 40' }, notes: ['5% credit'] },
  OH: { code: 'OH', name: 'Ohio', hasCredit: true, methods: ['standard'], forms: { standard: 'Form IT 1140' }, notes: ['7% credit with base calculation'] },
  OK: { code: 'OK', name: 'Oklahoma', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 512' }, notes: ['5% credit'] },
  OR: { code: 'OR', name: 'Oregon', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 20' }, notes: ['5% credit'] },
  PA: { code: 'PA', name: 'Pennsylvania', hasCredit: true, methods: ['standard'], forms: { standard: 'Form RCT-101' }, notes: ['10% credit with base calculation'] },
  RI: { code: 'RI', name: 'Rhode Island', hasCredit: true, methods: ['standard'], forms: { standard: 'Form RI-1120C' }, notes: ['5% credit'] },
  SC: { code: 'SC', name: 'South Carolina', hasCredit: true, methods: ['standard'], forms: { standard: 'Form SC1120' }, notes: ['5% credit'] },
  SD: { code: 'SD', name: 'South Dakota', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  TN: { code: 'TN', name: 'Tennessee', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  TX: { code: 'TX', name: 'Texas', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 05-163' }, notes: ['5% credit'] },
  UT: { code: 'UT', name: 'Utah', hasCredit: true, methods: ['standard'], forms: { standard: 'Form TC-20' }, notes: ['5% credit with choice of methods'] },
  VT: { code: 'VT', name: 'Vermont', hasCredit: true, methods: ['standard'], forms: { standard: 'Form CO-411' }, notes: ['5% credit'] },
  VA: { code: 'VA', name: 'Virginia', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 500' }, notes: ['15% credit with base calculation'] },
  WA: { code: 'WA', name: 'Washington', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
  WV: { code: 'WV', name: 'West Virginia', hasCredit: true, methods: ['standard'], forms: { standard: 'Form CIT' }, notes: ['3% credit'] },
  WI: { code: 'WI', name: 'Wisconsin', hasCredit: true, methods: ['standard'], forms: { standard: 'Form 4' }, notes: ['5% credit'] },
  WY: { code: 'WY', name: 'Wyoming', hasCredit: false, methods: [], forms: {}, notes: ['No state R&D credit available'] },
};

// States with credits that need pro forma configurations
export const STATES_WITH_CREDITS = Object.entries(STATE_CREDIT_INFO)
  .filter(([_, info]) => info.hasCredit)
  .map(([code, info]) => ({ code, ...info }));

// States without credits
export const STATES_WITHOUT_CREDITS = Object.entries(STATE_CREDIT_INFO)
  .filter(([_, info]) => !info.hasCredit)
  .map(([code, info]) => ({ code, ...info })); 