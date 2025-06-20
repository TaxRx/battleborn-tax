// Mock data for Admin Dashboard (safe to remove/replace with real API later)

export const mockStrategies = [
  {
    id: 'strat-1',
    clientName: 'Acme Dental',
    advisor: 'Dr. Smith',
    status: 'pending',
    submittedAt: '2024-06-01T10:00:00Z',
    type: 'R&D Credit',
    value: 12000,
    description: 'R&D tax credit for 2023 activities.',
    supportingDocs: [
      { name: 'Payroll Report.pdf', url: '#' },
      { name: 'Expense Summary.xlsx', url: '#' }
    ],
    userAnswers: {
      'Q1': 'We developed a new dental device.',
      'Q2': 'Total R&D spend: $50,000',
      'Q3': '3 full-time staff involved',
    }
  },
  {
    id: 'strat-2',
    clientName: 'Bright Smiles',
    advisor: 'Dr. Lee',
    status: 'approved',
    submittedAt: '2024-05-20T14:30:00Z',
    type: 'Augusta Rule',
    value: 8000,
    description: 'Augusta Rule for annual meeting.',
    supportingDocs: [
      { name: 'Meeting Invoice.pdf', url: '#' }
    ],
    userAnswers: {
      'Q1': 'Hosted annual meeting at principal residence.',
      'Q2': 'Rental value: $8,000',
    }
  },
  {
    id: 'strat-3',
    clientName: 'OrthoCare',
    advisor: 'Dr. Patel',
    status: 'pending',
    submittedAt: '2024-06-03T09:15:00Z',
    type: 'R&D Credit',
    value: 15000,
    description: 'R&D credit for orthodontic device improvements.',
    supportingDocs: [],
    userAnswers: {
      'Q1': 'Improved orthodontic device design.',
      'Q2': 'Spent $60,000 on R&D',
      'Q3': '2 engineers, 1 assistant',
    }
  },
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

export const mockClients = [
  {
    id: 'client-1',
    name: 'Acme Dental',
    status: 'active',
    joined: '2023-11-10',
  },
  {
    id: 'client-2',
    name: 'Bright Smiles',
    status: 'active',
    joined: '2024-01-15',
  },
  {
    id: 'client-3',
    name: 'OrthoCare',
    status: 'pending',
    joined: '2024-05-30',
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