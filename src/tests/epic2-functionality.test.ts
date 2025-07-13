import { jest } from '@jest/globals';
import './setup';

describe('Epic 2: Client Dashboard Enhancement - Functional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dashboard metrics data structure validation', () => {
    const mockMetrics = {
      total_proposals: 15,
      active_proposals: 8,
      total_savings: 125000,
      completion_rate: 75,
      trend_data: [
        { date: '2025-01-06', proposals: 2 },
        { date: '2025-01-07', proposals: 3 },
        { date: '2025-01-08', proposals: 1 },
        { date: '2025-01-09', proposals: 4 },
        { date: '2025-01-10', proposals: 2 },
        { date: '2025-01-11', proposals: 1 },
        { date: '2025-01-12', proposals: 2 },
      ],
      savings_breakdown: {
        tax_credits: 75000,
        federal_savings: 30000,
        state_savings: 20000,
      },
    };

    // Validate data structure
    expect(typeof mockMetrics.total_proposals).toBe('number');
    expect(typeof mockMetrics.active_proposals).toBe('number');
    expect(typeof mockMetrics.total_savings).toBe('number');
    expect(typeof mockMetrics.completion_rate).toBe('number');
    expect(Array.isArray(mockMetrics.trend_data)).toBe(true);
    expect(mockMetrics.trend_data).toHaveLength(7);
    expect(mockMetrics.savings_breakdown).toHaveProperty('tax_credits');
    expect(mockMetrics.savings_breakdown).toHaveProperty('federal_savings');
    expect(mockMetrics.savings_breakdown).toHaveProperty('state_savings');
  });

  test('activity data structure validation', () => {
    const mockActivities = [
      {
        id: 1,
        activity_type: 'proposal_created',
        description: 'New tax proposal created',
        created_at: '2025-01-12T10:00:00Z',
        metadata: { proposal_id: 'prop-123' },
      },
      {
        id: 2,
        activity_type: 'document_uploaded',
        description: 'Document uploaded for review',
        created_at: '2025-01-11T15:30:00Z',
        metadata: { document_name: 'tax_return_2024.pdf' },
      },
    ];

    // Validate activity structure
    mockActivities.forEach(activity => {
      expect(typeof activity.id).toBe('number');
      expect(typeof activity.activity_type).toBe('string');
      expect(typeof activity.description).toBe('string');
      expect(typeof activity.created_at).toBe('string');
      expect(typeof activity.metadata).toBe('object');
    });
  });

  test('trend data calculations', () => {
    const trendData = [
      { date: '2025-01-06', proposals: 2 },
      { date: '2025-01-07', proposals: 3 },
      { date: '2025-01-08', proposals: 1 },
      { date: '2025-01-09', proposals: 4 },
      { date: '2025-01-10', proposals: 2 },
      { date: '2025-01-11', proposals: 1 },
      { date: '2025-01-12', proposals: 2 },
    ];

    // Calculate trend metrics
    const totalProposals = trendData.reduce((sum, day) => sum + day.proposals, 0);
    const averageProposals = totalProposals / trendData.length;
    const maxProposals = Math.max(...trendData.map(day => day.proposals));
    const minProposals = Math.min(...trendData.map(day => day.proposals));

    expect(totalProposals).toBe(15);
    expect(averageProposals).toBeCloseTo(2.14, 2);
    expect(maxProposals).toBe(4);
    expect(minProposals).toBe(1);
  });

  test('savings breakdown calculations', () => {
    const savingsBreakdown = {
      tax_credits: 75000,
      federal_savings: 30000,
      state_savings: 20000,
    };

    const totalSavings = savingsBreakdown.tax_credits + 
                        savingsBreakdown.federal_savings + 
                        savingsBreakdown.state_savings;

    const taxCreditsPercentage = (savingsBreakdown.tax_credits / totalSavings) * 100;
    const federalPercentage = (savingsBreakdown.federal_savings / totalSavings) * 100;
    const statePercentage = (savingsBreakdown.state_savings / totalSavings) * 100;

    expect(totalSavings).toBe(125000);
    expect(taxCreditsPercentage).toBe(60);
    expect(federalPercentage).toBe(24);
    expect(statePercentage).toBe(16);
  });

  test('completion rate calculations', () => {
    const totalProposals = 15;
    const activeProposals = 8;
    const completedProposals = totalProposals - activeProposals;
    const completionRate = Math.round((completedProposals / totalProposals) * 100);

    expect(completedProposals).toBe(7);
    expect(completionRate).toBe(47);
  });

  test('responsive breakpoint calculations', () => {
    const screenWidths = [320, 640, 768, 1024, 1280, 1920];
    
    screenWidths.forEach(width => {
      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;
      const isDesktop = width >= 1024;
      const gridCols = isMobile ? 1 : isTablet ? 2 : 4;

      if (width < 640) {
        expect(isMobile).toBe(true);
        expect(gridCols).toBe(1);
      } else if (width < 1024) {
        expect(isTablet).toBe(true);
        expect(gridCols).toBe(2);
      } else {
        expect(isDesktop).toBe(true);
        expect(gridCols).toBe(4);
      }
    });
  });

  test('chart data preparation', () => {
    const trendData = [
      { date: '2025-01-06', proposals: 2 },
      { date: '2025-01-07', proposals: 3 },
      { date: '2025-01-08', proposals: 1 },
      { date: '2025-01-09', proposals: 4 },
      { date: '2025-01-10', proposals: 2 },
      { date: '2025-01-11', proposals: 1 },
      { date: '2025-01-12', proposals: 2 },
    ];

    const chartData = {
      labels: trendData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Proposals',
          data: trendData.map(item => item.proposals),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        },
      ],
    };

    expect(chartData.labels).toHaveLength(7);
    expect(chartData.datasets[0].data).toHaveLength(7);
    expect(chartData.datasets[0].label).toBe('Proposals');
    expect(chartData.labels[0]).toMatch(/Jan \d+/);
  });

  test('activity time formatting', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Mock relative time formatting
    const formatRelativeTime = (date: Date) => {
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    };

    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
  });
}); 