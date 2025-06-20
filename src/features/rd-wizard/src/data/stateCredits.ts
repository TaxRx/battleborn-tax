// State-by-state R&D tax credit rules
// This file exports an object keyed by state abbreviation
// Each entry contains: calculation, entityTypeRestrictions, preApplication, and notes

export type EntityType = 'sole_proprietorship' | 'partnership' | 'llc' | 'pllc' | 'c_corp' | 's_corp';

interface StateCreditRule {
  name: string;
  calculation: string; // Human-readable formula or description
  entityTypeRestrictions: 'corporation' | 'passthrough' | 'both' | 'none';
  preApplication: string;
  notes?: string;
}

export const stateCredits: Record<string, StateCreditRule> = {
  AL: {
    name: 'Alabama',
    calculation: 'No state R&D tax credit available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  AK: {
    name: 'Alaska',
    calculation: 'stateCredit = 0.18 * federalCredit',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  AZ: {
    name: 'Arizona',
    calculation: 'If QREs <= $2.5M: stateCredit = 0.24 * QREs; If QREs > $2.5M: stateCredit = (0.24 * $2.5M) + (0.15 * (QREs - $2.5M))',
    entityTypeRestrictions: 'both',
    preApplication: 'Required for refundable credits; submit to Arizona Commerce Authority',
  },
  AR: {
    name: 'Arkansas',
    calculation: 'In-house: stateCredit = 0.20 * (QREs - priorYearQREs); University: stateCredit = 0.33 * QREs',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit to Arkansas Department of Finance and Administration',
  },
  CA: {
    name: 'California',
    calculation: 'baseAmount = fixedBasePercentage * avgGrossReceiptsPrior4Years; stateCredit = 0.15 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  CO: {
    name: 'Colorado',
    calculation: 'baseAmount = avg(QREsPrior2Years); stateCredit = 0.03 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; pre-certification with local Enterprise Zone Administrator',
  },
  CT: {
    name: 'Connecticut',
    calculation: 'Incremental: stateCredit = 0.20 * (QREs - priorYearQREs); Non-incremental: stateCredit = 0.06 * QREs',
    entityTypeRestrictions: 'corporation',
    preApplication: 'Not required',
  },
  DE: {
    name: 'Delaware',
    calculation: 'Standard: stateCredit = 0.10 * federalCredit; Targeted Growth Area: stateCredit = 0.20 * federalCredit',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit by September 15 for the prior tax year',
  },
  FL: {
    name: 'Florida',
    calculation: 'baseAmount = avg(QREsPrior4Years); stateCredit = 0.10 * (QREs - baseAmount)',
    entityTypeRestrictions: 'corporation',
    preApplication: 'Required; applications accepted during a specific window in March',
  },
  GA: {
    name: 'Georgia',
    calculation: 'baseAmount = 0.50 * avg(QREsPrior3Years); stateCredit = 0.10 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; must submit Form IT-APP for approval',
  },
  HI: {
    name: 'Hawaii',
    calculation: 'stateCredit = federalCredit',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit Form N-346A for certification',
  },
  ID: {
    name: 'Idaho',
    calculation: 'stateCredit = 0.05 * QREs',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  IL: {
    name: 'Illinois',
    calculation: 'baseAmount = avg(QREsPrior3Years); stateCredit = 0.065 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  IN: {
    name: 'Indiana',
    calculation: 'First $1M: stateCredit = 0.15 * (QREs - baseAmount); Above $1M: stateCredit = 0.10 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  IA: {
    name: 'Iowa',
    calculation: 'baseAmount = fixedBasePercentage * avgGrossReceiptsPrior4Years; stateCredit = 0.065 * (QREs - baseAmount)',
    entityTypeRestrictions: 'none',
    preApplication: 'Not required',
  },
  KS: {
    name: 'Kansas',
    calculation: 'stateCredit = 0.065 * QREs',
    entityTypeRestrictions: 'corporation',
    preApplication: 'Not required',
  },
  KY: {
    name: 'Kentucky',
    calculation: 'stateCredit = 0.05 * QREs',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit Schedule QR with the tax return',
  },
  LA: {
    name: 'Louisiana',
    calculation: '<50 employees: stateCredit = 0.30 * QREs; 50–99 employees: stateCredit = 0.10 * QREs; 100+ employees: stateCredit = 0.05 * QREs',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; apply annually',
  },
  ME: {
    name: 'Maine',
    calculation: 'baseAmount = avg(QREsPrior3Years); stateCredit = (0.05 * (QREs - baseAmount)) + (0.075 * basicResearchPayments)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  MD: {
    name: 'Maryland',
    calculation: 'stateCredit = 0.10 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; apply by November 15',
  },
  MA: {
    name: 'Massachusetts',
    calculation: 'Incremental: stateCredit = 0.10 * (QREs - baseAmount); Non-incremental: stateCredit = 0.05 * QREs',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  MI: {
    name: 'Michigan',
    calculation: 'No state R&D tax credit available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  MN: {
    name: 'Minnesota',
    calculation: 'First $2M: stateCredit = 0.10 * QREs',
    entityTypeRestrictions: 'none',
    preApplication: 'Not required',
  },
  MS: {
    name: 'Mississippi',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  MO: {
    name: 'Missouri',
    calculation: 'Standard: stateCredit = 0.15 * (QREs - baseAmount); With university collaboration: stateCredit = 0.20 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit application to the Missouri Department of Economic Development',
  },
  MT: {
    name: 'Montana',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  NE: {
    name: 'Nebraska',
    calculation: 'Standard: stateCredit = 0.15 * (QREs - baseAmount); With university collaboration: stateCredit = 0.35 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  NV: {
    name: 'Nevada',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  NH: {
    name: 'New Hampshire',
    calculation: 'stateCredit = 0.10 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit application to the New Hampshire Department of Revenue Administration',
  },
  NJ: {
    name: 'New Jersey',
    calculation: 'Standard: stateCredit = 0.10 * (QREs - baseAmount); Basic research payments: stateCredit = 0.15 * basicResearchPayments',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  NM: {
    name: 'New Mexico',
    calculation: 'stateCredit = 0.05 * QREs',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit application to the New Mexico Taxation and Revenue Department',
  },
  NY: {
    name: 'New York',
    calculation: 'Excelsior Program: stateCredit = 0.06 * QREs; Life Sciences: stateCredit = 0.15 * QREs (≥10 employees) or 0.20 * QREs (<10 employees)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; apply through Empire State Development',
  },
  NC: {
    name: 'North Carolina',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  ND: {
    name: 'North Dakota',
    calculation: 'Standard: stateCredit = 0.25 * first $100,000 of (QREs - baseAmount) + 0.08 * remaining (QREs - baseAmount); Alternative: stateCredit = 0.175 * first $100,000 of (QREs - baseAmount) + 0.056 * remaining (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  OH: {
    name: 'Ohio',
    calculation: 'stateCredit = 0.07 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  OK: {
    name: 'Oklahoma',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  OR: {
    name: 'Oregon',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  PA: {
    name: 'Pennsylvania',
    calculation: 'Standard: stateCredit = 0.10 * (QREs - baseAmount); Small businesses: stateCredit = 0.20 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit application by December 1',
  },
  RI: {
    name: 'Rhode Island',
    calculation: 'First $111,111: stateCredit = 0.225 * (QREs - baseAmount); Above $111,111: stateCredit = 0.169 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  SC: {
    name: 'South Carolina',
    calculation: 'stateCredit = 0.05 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  SD: {
    name: 'South Dakota',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  TN: {
    name: 'Tennessee',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  TX: {
    name: 'Texas',
    calculation: 'Standard: stateCredit = 0.05 * (QREs - baseAmount); With university collaboration: stateCredit = 0.0625 * (QREs - baseAmount)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  UT: {
    name: 'Utah',
    calculation: 'Incremental: stateCredit = 0.05 * (QREs - baseAmount); Basic research: stateCredit = 0.05 * (basicResearchPayments - baseAmount); Current year: stateCredit = 0.075 * QREs',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  VT: {
    name: 'Vermont',
    calculation: 'stateCredit = 0.27 * federalCredit',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required',
  },
  VA: {
    name: 'Virginia',
    calculation: 'Standard: stateCredit = 0.15 * first $300,000 of (QREs - baseAmount); With university collaboration: stateCredit = 0.20 * first $300,000 of (QREs - baseAmount); Alternative: stateCredit = 0.10 * (QREs - 0.5 * avg(QREsPrior3Years))',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit Form MRD by September 1',
  },
  WA: {
    name: 'Washington',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
  WV: {
    name: 'West Virginia',
    calculation: 'Standard: stateCredit = max(0.03 * QREs, 0.10 * (QREs - baseAmount)); baseAmount = avg(QREsPrior3Years)',
    entityTypeRestrictions: 'both',
    preApplication: 'Required; submit Form SRDTC-A by the due date of the tax return, including extensions',
  },
  WI: {
    name: 'Wisconsin',
    calculation: 'Standard: stateCredit = 0.0575 * (QREs - baseAmount); If no QREs in prior 3 years: stateCredit = 0.02875 * QREs; Specialized: stateCredit = 0.115 * (QREs - baseAmount); baseAmount = 0.5 * avg(QREsPrior3Years)',
    entityTypeRestrictions: 'both',
    preApplication: 'Not required; claim the credit using Schedule R',
  },
  WY: {
    name: 'Wyoming',
    calculation: 'No state R&D tax credit currently available.',
    entityTypeRestrictions: 'none',
    preApplication: 'N/A',
  },
};

export function calculateStateCredit({
  state,
  entityType,
  QREs,
  priorYearQREs = 0,
  grossReceipts = 0,
  federalCredit = 0,
  avgPriorQREs = 0,
  avgGrossReceipts = 0,
  baseAmount = 0,
  basicResearchPayments = 0,
  numEmployees = 0,
}: {
  state: string;
  entityType: EntityType;
  QREs: number;
  priorYearQREs?: number;
  grossReceipts?: number;
  federalCredit?: number;
  avgPriorQREs?: number;
  avgGrossReceipts?: number;
  baseAmount?: number;
  basicResearchPayments?: number;
  numEmployees?: number;
}): number {
  const rule = stateCredits[state as keyof typeof stateCredits];
  if (!rule) return 0;
  const isCorporation = entityType === 'c_corp';
  const isPassthrough = ['s_corp', 'llc', 'pllc', 'partnership', 'sole_proprietorship'].includes(entityType);
  if (rule.entityTypeRestrictions === 'none') return 0;
  if (rule.entityTypeRestrictions === 'corporation' && !isCorporation) return 0;
  if (rule.entityTypeRestrictions === 'passthrough' && !isPassthrough) return 0;

  switch (state) {
    case 'AK':
      return Math.round(0.18 * federalCredit);
    case 'AZ':
      if (QREs <= 2500000) return Math.round(0.24 * QREs);
      return Math.round((0.24 * 2500000) + (0.15 * (QREs - 2500000)));
    case 'AR':
      // Assume in-house for now
      return Math.round(0.20 * (QREs - priorYearQREs));
    case 'CA':
      // baseAmount = fixedBasePercentage * avgGrossReceiptsPrior4Years
      return Math.round(0.15 * (QREs - baseAmount));
    case 'CO':
      // baseAmount = avg(QREsPrior2Years)
      return Math.round(0.03 * (QREs - baseAmount));
    case 'CT':
      // Incremental: 0.20 * (QREs - priorYearQREs), Non-incremental: 0.06 * QREs
      return Math.max(
        Math.round(0.20 * (QREs - priorYearQREs)),
        Math.round(0.06 * QREs)
      );
    case 'DE':
      // Standard: 0.10 * federalCredit
      return Math.round(0.10 * federalCredit);
    case 'FL':
      return Math.round(0.10 * (QREs - baseAmount));
    case 'GA':
      return Math.round(0.10 * (QREs - baseAmount));
    case 'HI':
      return Math.round(federalCredit);
    case 'ID':
      return Math.round(0.05 * QREs);
    case 'IL':
      return Math.round(0.065 * (QREs - baseAmount));
    case 'IN':
      if (QREs - baseAmount <= 1000000) return Math.round(0.15 * (QREs - baseAmount));
      return Math.round(0.10 * (QREs - baseAmount));
    case 'IA':
      return Math.round(0.065 * (QREs - baseAmount));
    case 'KS':
      return Math.round(0.065 * QREs);
    case 'KY':
      return Math.round(0.05 * QREs);
    case 'LA':
      if (numEmployees < 50) return Math.round(0.30 * QREs);
      if (numEmployees < 100) return Math.round(0.10 * QREs);
      return Math.round(0.05 * QREs);
    case 'ME':
      return Math.round(0.05 * (QREs - baseAmount) + 0.075 * basicResearchPayments);
    case 'MD':
      return Math.round(0.10 * (QREs - baseAmount));
    case 'MA':
      return Math.max(
        Math.round(0.10 * (QREs - baseAmount)),
        Math.round(0.05 * QREs)
      );
    case 'MN':
      if (QREs <= 2000000) return Math.round(0.10 * QREs);
      return Math.round(0.10 * 2000000 + 0.025 * (QREs - 2000000));
    case 'MO':
      // Assume standard for now
      return Math.round(0.15 * (QREs - baseAmount));
    case 'NE':
      // Assume standard for now
      return Math.round(0.15 * (QREs - baseAmount));
    case 'NH':
      return Math.round(0.10 * (QREs - baseAmount));
    case 'NJ':
      // Standard: 0.10 * (QREs - baseAmount), Basic research: 0.15 * basicResearchPayments
      return Math.max(
        Math.round(0.10 * (QREs - baseAmount)),
        Math.round(0.15 * basicResearchPayments)
      );
    case 'NM':
      return Math.round(0.05 * QREs);
    case 'NY':
      if (numEmployees < 10) return Math.round(0.20 * QREs);
      return Math.round(0.15 * QREs);
    case 'ND':
      // Standard: 0.25 * first $100k, 0.08 * remaining
      const ndBase = QREs - baseAmount;
      if (ndBase <= 100000) return Math.round(0.25 * ndBase);
      return Math.round(0.25 * 100000 + 0.08 * (ndBase - 100000));
    case 'OH':
      return Math.round(0.07 * (QREs - baseAmount));
    case 'PA':
      // Standard: 0.10 * (QREs - baseAmount), Small: 0.20 * (QREs - baseAmount)
      // Assume standard for now
      return Math.round(0.10 * (QREs - baseAmount));
    case 'RI':
      const riBase = QREs - baseAmount;
      if (riBase <= 111111) return Math.round(0.225 * riBase);
      return Math.round(0.225 * 111111 + 0.169 * (riBase - 111111));
    case 'SC':
      return Math.round(0.05 * (QREs - baseAmount));
    case 'TX':
      // Standard: 0.05 * (QREs - baseAmount), University: 0.0625 * (QREs - baseAmount)
      // Assume standard for now
      return Math.round(0.05 * (QREs - baseAmount));
    case 'UT':
      // Incremental: 0.05 * (QREs - baseAmount), Basic: 0.05 * (basicResearchPayments - baseAmount), Current: 0.075 * QREs
      // Assume incremental for now
      return Math.round(0.05 * (QREs - baseAmount));
    case 'VT':
      return Math.round(0.27 * federalCredit);
    case 'VA':
      // Standard: 0.15 * first $300k, University: 0.20 * first $300k, Alt: 0.10 * (QREs - 0.5 * avg(QREsPrior3Years))
      // Assume standard for now
      const vaBase = QREs - baseAmount;
      if (vaBase <= 300000) return Math.round(0.15 * vaBase);
      return Math.round(0.15 * 300000);
    case 'WV':
      // Standard: max(0.03 * QREs, 0.10 * (QREs - baseAmount))
      return Math.max(
        Math.round(0.03 * QREs),
        Math.round(0.10 * (QREs - baseAmount))
      );
    case 'WI':
      // Standard: 0.0575 * (QREs - baseAmount), If no QREs in prior 3 years: 0.02875 * QREs, Specialized: 0.115 * (QREs - baseAmount)
      // Assume standard for now
      if (avgPriorQREs === 0) return Math.round(0.02875 * QREs);
      return Math.round(0.0575 * (QREs - baseAmount));
    default:
      return 0;
  }
} 