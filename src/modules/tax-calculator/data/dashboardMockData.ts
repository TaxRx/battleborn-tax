// Mock data for Admin Dashboard - Based on actual calculator entries

export const mockStrategies = [
  {
    id: 'strat-001',
    clientName: 'Dr. Sarah Johnson',
    advisor: 'Tax Solutions Pro',
    status: 'submitted',
    submittedAt: '2024-12-01T10:30:00Z',
    type: 'Charitable Donation + Augusta Rule',
    value: 27150,
    description: 'Strategic charitable giving ($50,000) and Augusta Rule rental (14 days @ $600/day)',
    supportingDocs: [
      { name: 'Charitable Donation Receipt.pdf', url: '#' },
      { name: 'Augusta Rule Documentation.pdf', url: '#' }
    ],
    userAnswers: {
      'Charitable Donation': 'Donation amount: $50,000 to qualified charity',
      'Augusta Rule': 'Rented home for 14 days at $600/day for business meetings',
      'Total Income': '$485,000 business income',
      'Tax Bracket': '37% federal, 13.3% state (CA)'
    }
  },
  {
    id: 'strat-002',
    clientName: 'Robert Martinez',
    advisor: 'Strategic Tax Group',
    status: 'in_review',
    submittedAt: '2024-12-01T14:00:00Z',
    type: 'Family Management Company + Hire Kids',
    value: 32700,
    description: 'FMC to shift $95,000 income + hire 2 children for $14,000 total wages',
    supportingDocs: [
      { name: 'FMC Business Plan.pdf', url: '#' },
      { name: 'Employment Contracts.pdf', url: '#' }
    ],
    userAnswers: {
      'Family Management Company': 'Shift $95,000 income to family members in lower brackets',
      'Hire Your Kids': 'Employ 2 children for $7,000 each annually',
      'Total Income': '$320,000 business income',
      'Tax Bracket': '24% federal, 0% state (TX)'
    }
  },
  {
    id: 'strat-003',
    clientName: 'Lisa Thompson',
    advisor: 'Tax Solutions Pro',
    status: 'approved',
    submittedAt: '2024-11-30T09:00:00Z',
    type: 'Cost Segregation',
    value: 15600,
    description: 'Cost segregation study on $520,000 commercial property',
    supportingDocs: [
      { name: 'Cost Segregation Study.pdf', url: '#' },
      { name: 'Property Documentation.pdf', url: '#' }
    ],
    userAnswers: {
      'Property Value': '$520,000 commercial restaurant property',
      'Accelerated Depreciation': '$52,000 additional depreciation',
      'Total Income': '$180,000 business income',
      'Tax Bracket': '24% federal, 0% state (TN)'
    }
  }
];

export const mockClients = [
  {
    id: 'client-001',
    name: 'Dr. Sarah Johnson',
    status: 'active',
    joined: '2024-12-01',
    income: 485000,
    strategies: ['Charitable Donation', 'Augusta Rule'],
    totalSavings: 27150
  },
  {
    id: 'client-002',
    name: 'Robert Martinez',
    status: 'active',
    joined: '2024-12-01',
    income: 320000,
    strategies: ['Family Management Company', 'Hire Your Kids'],
    totalSavings: 32700
  },
  {
    id: 'client-003',
    name: 'Lisa Thompson',
    status: 'active',
    joined: '2024-11-30',
    income: 180000,
    strategies: ['Cost Segregation'],
    totalSavings: 15600
  }
];

export const mockPayments = [
  {
    id: 'pay-1',
    client: 'Acme Dental',
    amount: 12000,
    date: '2024-06-02',
    method: 'ACH',
    status: 'completed',
  },
  {
    id: 'pay-2',
    client: 'Bright Smiles',
    amount: 8000,
    date: '2024-05-22',
    method: 'Credit Card',
    status: 'completed',
  },
  {
    id: 'pay-3',
    client: 'OrthoCare',
    amount: 15000,
    date: '2024-06-04',
    method: 'Wire',
    status: 'pending',
  },
];

export const mockPayouts = [
  {
    id: 'payout-1',
    advisor: 'Dr. Smith',
    amount: 6000,
    date: '2024-06-05',
    status: 'completed',
  },
  {
    id: 'payout-2',
    advisor: 'Dr. Lee',
    amount: 4000,
    date: '2024-05-25',
    status: 'completed',
  },
  {
    id: 'payout-3',
    advisor: 'Dr. Patel',
    amount: 7500,
    date: '2024-06-06',
    status: 'pending',
  },
];

export const mockNotifications = [
  {
    id: 'notif-1',
    message: 'New strategy submitted by Acme Dental',
    timestamp: '2024-06-01T10:05:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    message: 'Payment received from Bright Smiles',
    timestamp: '2024-05-22T16:00:00Z',
    read: true,
  },
  {
    id: 'notif-3',
    message: 'Advisor payout sent to Dr. Lee',
    timestamp: '2024-05-25T12:00:00Z',
    read: true,
  },
];

export const mockActivity = [
  {
    id: 'act-1',
    action: 'Strategy Approved',
    userId: 'admin',
    timestamp: '2024-06-01T12:00:00Z',
    details: 'Strategy for Acme Dental approved by admin.'
  },
  {
    id: 'act-2',
    action: 'Payment Processed',
    userId: 'system',
    timestamp: '2024-06-02T09:00:00Z',
    details: 'Payment from Acme Dental processed.'
  },
  {
    id: 'act-3',
    action: 'Payout Sent',
    userId: 'system',
    timestamp: '2024-06-05T15:00:00Z',
    details: 'Payout to Dr. Smith sent.'
  },
];

// For charts: payments and payouts by month (for filtering)
export const mockPaymentsByMonth = [
  { month: '2024-02', payments: 10000, payouts: 5000 },
  { month: '2024-03', payments: 15000, payouts: 7000 },
  { month: '2024-04', payments: 18000, payouts: 9000 },
  { month: '2024-05', payments: 20000, payouts: 12000 },
  { month: '2024-06', payments: 35000, payouts: 17500 },
]; 