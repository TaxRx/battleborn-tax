import { StateCreditBaseData } from '../../services/stateCreditDataService';

export interface StateProFormaLine {
  line: string;
  label: string;
  field: string;
  editable: boolean;
  calc?: (data: Record<string, number>) => number;
  defaultValue?: number;
  type?: 'currency' | 'percentage' | 'yesno';
  description?: string;
  sort_order?: number;
}

// IMPORTANT: New York does not offer a standalone Research and Development Credit
// NY offers enhanced Investment Tax Credit (ITC) rates for R&D property:
// - Regular ITC Rate: 4-5% 
// - R&D Property Rate: 7-9% (CT-46/IT-212)
// See: https://www.tax.ny.gov/bus/ct/article9a_tax_credits.htm

export const NY_PROFORMA_LINES: StateProFormaLine[] = [
  {
    line: 'N/A',
    label: 'New York does not offer a standalone Research and Development Credit',
    field: 'nyNoRDCredit',
    editable: false,
    defaultValue: 0,
    description: 'NY offers enhanced Investment Tax Credit rates for R&D property (7-9% vs 4-5% regular rate) under Forms CT-46/IT-212, not a separate R&D credit.',
    sort_order: 1
  }
];

// New York does not have alternative R&D credit methods
export const NY_ALTERNATIVE_LINES: StateProFormaLine[] = [
  {
    line: 'N/A',
    label: 'No alternative R&D credit calculation available',
    field: 'nyNoAltCredit',
    editable: false,
    defaultValue: 0,
    description: 'New York does not offer alternative R&D credit calculations.',
    sort_order: 1
  }
];

export const nyConfig = {
  forms: {
    standard: {
      name: "N/A - No R&D Credit Available",
      method: "none",
      lines: NY_PROFORMA_LINES
    },
    alternative: {
      name: "N/A - No Alternative Available",
      method: "none",
      lines: NY_ALTERNATIVE_LINES
    }
  },
  hasAlternativeMethod: false,
  creditRate: 0,
  creditType: "none",
  formReference: "N/A - See Investment Tax Credit (Forms CT-46/IT-212)",
  validationRules: [],
  alternativeValidationRules: [],
  notes: [
    "⚠️  New York does not offer a standalone Research and Development Credit",
    "🔧 For R&D activities, consider the Investment Tax Credit (ITC) options:",
    "   • Regular ITC Rate: 4-5% (Forms CT-46/IT-212)",
    "   • R&D Property Enhanced Rate: 7-9%",
    "   • Life Sciences R&D Credit: Separate credit (Form IT-648)",
    "📋 R&D property qualifies for enhanced ITC rates under the Investment Tax Credit system",
    "🔗 More info: https://www.tax.ny.gov/bus/ct/article9a_tax_credits.htm"
  ]
}; 