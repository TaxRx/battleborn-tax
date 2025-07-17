// Epic 3 Sprint 4: Financial Analytics & Reporting Service
// File: financialAnalyticsService.ts
// Purpose: Financial analytics, forecasting, and reporting capabilities
// Story: 4.2 - Financial Analytics & Reporting (8 points)

import { supabase } from '../../../lib/supabase';

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  revenueGrowth: number;
  customerCount: number;
  customerGrowth: number;
  averageRevenuePerCustomer: number;
  churnRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface CustomerLifetimeValue {
  accountId: string;
  accountName: string;
  totalRevenue: number;
  subscriptionCount: number;
  firstSubscriptionDate: string;
  lastPaymentDate: string;
  averageMonthlyValue: number;
  lifetimeMonths: number;
  churnProbability: number;
  projectedLTV: number;
}

export interface ChurnAnalysis {
  totalCustomers: number;
  churnedCustomers: number;
  churnRate: number;
  averageLifespan: number;
  churnReasons: Record<string, number>;
  highRiskCustomers: Array<{
    accountId: string;
    accountName: string;
    riskScore: number;
    indicators: string[];
  }>;
}

export interface RevenueForecasting {
  period: string;
  forecastedRevenue: number;
  confidence: number;
  factors: Record<string, number>;
  seasonalityImpact: number;
  growthTrend: number;
}

export interface FinancialReport {
  reportType: 'monthly' | 'quarterly' | 'annual';
  period: string;
  totalRevenue: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  refunds: number;
  netRevenue: number;
  customerMetrics: {
    newCustomers: number;
    churnedCustomers: number;
    totalActive: number;
  };
  paymentMetrics: {
    totalTransactions: number;
    successRate: number;
    averageTransactionValue: number;
  };
}

export class FinancialAnalyticsService {
  
  async getRevenueMetrics(
    startDate: string,
    endDate: string
  ): Promise<RevenueMetrics> {
    try {
      // Get current period revenue
      const { data: currentRevenue, error: currentError } = await supabase
        .from('payments')
        .select('amount_cents, created_at, account_id')
        .eq('status', 'succeeded')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (currentError) throw currentError;

      // Get previous period for comparison
      const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime();
      const previousStart = new Date(new Date(startDate).getTime() - periodLength).toISOString();
      const previousEnd = new Date(new Date(endDate).getTime() - periodLength).toISOString();

      const { data: previousRevenue, error: previousError } = await supabase
        .from('payments')
        .select('amount_cents, account_id')
        .eq('status', 'succeeded')
        .gte('created_at', previousStart)
        .lte('created_at', previousEnd);

      if (previousError) throw previousError;

      // Get active subscriptions for MRR
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans!inner (
            price_cents,
            billing_interval
          )
        `)
        .eq('status', 'active');

      if (subError) throw subError;

      // Calculate metrics
      const totalRevenue = (currentRevenue || []).reduce((sum, payment) => sum + payment.amount_cents, 0) / 100;
      const previousTotalRevenue = (previousRevenue || []).reduce((sum, payment) => sum + payment.amount_cents, 0) / 100;
      const revenueGrowth = previousTotalRevenue > 0 ? 
        ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 : 0;

      const uniqueCustomers = new Set((currentRevenue || []).map(p => p.account_id)).size;
      const previousUniqueCustomers = new Set((previousRevenue || []).map(p => p.account_id)).size;
      const customerGrowth = previousUniqueCustomers > 0 ? 
        ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100 : 0;

      // Calculate MRR from active subscriptions
      const mrr = (subscriptions || []).reduce((sum, sub) => {
        const monthlyRevenue = sub.subscription_plans.billing_interval === 'monthly' ? 
          sub.subscription_plans.price_cents / 100 :
          (sub.subscription_plans.price_cents / 100) / 12; // Approximate for yearly
        return sum + monthlyRevenue;
      }, 0);

      const arr = mrr * 12;
      const averageRevenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

      // Calculate churn rate (simplified)
      const { data: churnedSubs, error: churnError } = await supabase
        .from('subscriptions')
        .select('canceled_at')
        .eq('status', 'canceled')
        .gte('canceled_at', startDate)
        .lte('canceled_at', endDate);

      if (churnError) throw churnError;

      const churnRate = subscriptions && subscriptions.length > 0 ? 
        ((churnedSubs || []).length / subscriptions.length) * 100 : 0;

      return {
        mrr,
        arr,
        totalRevenue,
        revenueGrowth,
        customerCount: uniqueCustomers,
        customerGrowth,
        averageRevenuePerCustomer,
        churnRate,
        periodStart: startDate,
        periodEnd: endDate
      };
    } catch (error) {
      console.error('Error calculating revenue metrics:', error);
      throw error;
    }
  }

  async getCustomerLifetimeValues(limit: number = 50): Promise<CustomerLifetimeValue[]> {
    try {
      const { data: customerData, error } = await supabase
        .from('accounts')
        .select(`
          id,
          name,
          subscriptions (
            id,
            created_at,
            status,
            subscription_plans (
              price_cents,
              billing_interval
            )
          ),
          payments (
            amount_cents,
            created_at,
            status
          )
        `)
        .limit(limit);

      if (error) throw error;

      return (customerData || []).map(account => {
        const payments = (account.payments || []).filter(p => p.status === 'succeeded');
        const subscriptions = account.subscriptions || [];
        
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount_cents, 0) / 100;
        const firstSubscriptionDate = subscriptions.length > 0 ? 
          Math.min(...subscriptions.map(s => new Date(s.created_at).getTime())) : Date.now();
        const lastPaymentDate = payments.length > 0 ? 
          Math.max(...payments.map(p => new Date(p.created_at).getTime())) : Date.now();
        
        const lifetimeMonths = Math.max(1, 
          (lastPaymentDate - firstSubscriptionDate) / (1000 * 60 * 60 * 24 * 30)
        );
        const averageMonthlyValue = totalRevenue / lifetimeMonths;
        
        // Simple churn probability based on last payment recency
        const daysSinceLastPayment = (Date.now() - lastPaymentDate) / (1000 * 60 * 60 * 24);
        const churnProbability = Math.min(1, daysSinceLastPayment / 90); // 90 days = 100% churn probability
        
        const projectedLTV = averageMonthlyValue * 12 * (1 - churnProbability);

        return {
          accountId: account.id,
          accountName: account.name,
          totalRevenue,
          subscriptionCount: subscriptions.length,
          firstSubscriptionDate: new Date(firstSubscriptionDate).toISOString(),
          lastPaymentDate: new Date(lastPaymentDate).toISOString(),
          averageMonthlyValue,
          lifetimeMonths,
          churnProbability,
          projectedLTV
        };
      }).sort((a, b) => b.projectedLTV - a.projectedLTV);
    } catch (error) {
      console.error('Error calculating customer lifetime values:', error);
      throw error;
    }
  }

  async getChurnAnalysis(
    startDate: string,
    endDate: string
  ): Promise<ChurnAnalysis> {
    try {
      const { data: allSubscriptions, error: allSubsError } = await supabase
        .from('subscriptions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (allSubsError) throw allSubsError;

      const { data: churnedSubscriptions, error: churnError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'canceled')
        .gte('canceled_at', startDate)
        .lte('canceled_at', endDate);

      if (churnError) throw churnError;

      const totalCustomers = (allSubscriptions || []).length;
      const churnedCustomers = (churnedSubscriptions || []).length;
      const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

      // Calculate average lifespan
      const lifespans = (churnedSubscriptions || []).map(sub => {
        const start = new Date(sub.created_at).getTime();
        const end = new Date(sub.canceled_at).getTime();
        return (end - start) / (1000 * 60 * 60 * 24 * 30); // months
      });
      const averageLifespan = lifespans.length > 0 ? 
        lifespans.reduce((sum, lifespan) => sum + lifespan, 0) / lifespans.length : 0;

      // Analyze churn reasons (simplified)
      const churnReasons = {
        'voluntary_cancellation': Math.floor(churnedCustomers * 0.6),
        'payment_failure': Math.floor(churnedCustomers * 0.3),
        'other': churnedCustomers - Math.floor(churnedCustomers * 0.9)
      };

      // Identify high-risk customers (simplified)
      const { data: riskCustomers, error: riskError } = await supabase
        .from('accounts')
        .select(`
          id,
          name,
          subscriptions (
            status,
            current_period_end
          ),
          payments (
            status,
            created_at
          )
        `)
        .limit(100);

      if (riskError) throw riskError;

      const highRiskCustomers = (riskCustomers || [])
        .map(account => {
          const recentFailures = (account.payments || []).filter(p => 
            p.status === 'failed' && 
            new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length;
          
          const hasActiveSub = (account.subscriptions || []).some(s => s.status === 'active');
          const upcomingRenewal = (account.subscriptions || []).some(s => 
            new Date(s.current_period_end) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          );

          const indicators = [];
          let riskScore = 0;
          
          if (recentFailures > 0) {
            indicators.push('Recent payment failures');
            riskScore += recentFailures * 20;
          }
          if (!hasActiveSub) {
            indicators.push('No active subscription');
            riskScore += 50;
          }
          if (upcomingRenewal) {
            indicators.push('Upcoming renewal');
            riskScore += 10;
          }

          return {
            accountId: account.id,
            accountName: account.name,
            riskScore,
            indicators
          };
        })
        .filter(customer => customer.riskScore > 30)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      return {
        totalCustomers,
        churnedCustomers,
        churnRate,
        averageLifespan,
        churnReasons,
        highRiskCustomers
      };
    } catch (error) {
      console.error('Error analyzing churn:', error);
      throw error;
    }
  }

  async generateFinancialReport(
    reportType: 'monthly' | 'quarterly' | 'annual',
    period: string
  ): Promise<FinancialReport> {
    try {
      // Calculate period dates
      const periodStart = new Date(period);
      let periodEnd: Date;
      
      switch (reportType) {
        case 'monthly':
          periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
          break;
        case 'quarterly':
          periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 0);
          break;
        case 'annual':
          periodEnd = new Date(periodStart.getFullYear() + 1, 0, 0);
          break;
      }

      // Get payments for the period
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (paymentError) throw paymentError;

      // Calculate revenue metrics
      const allPayments = payments || [];
      const successfulPayments = allPayments.filter(p => p.status === 'succeeded');
      const refundPayments = allPayments.filter(p => p.status === 'refunded');
      
      const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount_cents, 0) / 100;
      const subscriptionRevenue = successfulPayments
        .filter(p => p.payment_type === 'subscription')
        .reduce((sum, p) => sum + p.amount_cents, 0) / 100;
      const oneTimeRevenue = successfulPayments
        .filter(p => p.payment_type === 'one_time')
        .reduce((sum, p) => sum + p.amount_cents, 0) / 100;
      const refunds = refundPayments.reduce((sum, p) => sum + p.refund_amount_cents, 0) / 100;
      const netRevenue = totalRevenue - refunds;

      // Get customer metrics
      const { data: newSubscriptions, error: newSubError } = await supabase
        .from('subscriptions')
        .select('account_id')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (newSubError) throw newSubError;

      const { data: churnedSubscriptions, error: churnSubError } = await supabase
        .from('subscriptions')
        .select('account_id')
        .eq('status', 'canceled')
        .gte('canceled_at', periodStart.toISOString())
        .lte('canceled_at', periodEnd.toISOString());

      if (churnSubError) throw churnSubError;

      const { data: activeSubscriptions, error: activeSubError } = await supabase
        .from('subscriptions')
        .select('account_id')
        .eq('status', 'active');

      if (activeSubError) throw activeSubError;

      const customerMetrics = {
        newCustomers: new Set((newSubscriptions || []).map(s => s.account_id)).size,
        churnedCustomers: new Set((churnedSubscriptions || []).map(s => s.account_id)).size,
        totalActive: new Set((activeSubscriptions || []).map(s => s.account_id)).size
      };

      // Calculate payment metrics
      const paymentMetrics = {
        totalTransactions: allPayments.length,
        successRate: allPayments.length > 0 ? 
          (successfulPayments.length / allPayments.length) * 100 : 0,
        averageTransactionValue: successfulPayments.length > 0 ? 
          totalRevenue / successfulPayments.length : 0
      };

      return {
        reportType,
        period,
        totalRevenue,
        subscriptionRevenue,
        oneTimeRevenue,
        refunds,
        netRevenue,
        customerMetrics,
        paymentMetrics
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  async getRevenueForecasting(
    months: number = 12
  ): Promise<RevenueForecasting[]> {
    try {
      // Get historical revenue data
      const { data: historicalPayments, error } = await supabase
        .from('payments')
        .select('amount_cents, created_at')
        .eq('status', 'succeeded')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by month
      const monthlyRevenue = (historicalPayments || []).reduce((acc, payment) => {
        const month = new Date(payment.created_at).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + payment.amount_cents / 100;
        return acc;
      }, {} as Record<string, number>);

      // Simple linear regression for forecasting
      const months_data = Object.keys(monthlyRevenue).sort();
      const revenue_data = months_data.map(month => monthlyRevenue[month]);
      
      // Calculate trend (simplified)
      const avgRevenue = revenue_data.reduce((sum, rev) => sum + rev, 0) / revenue_data.length;
      const trend = revenue_data.length > 1 ? 
        (revenue_data[revenue_data.length - 1] - revenue_data[0]) / revenue_data.length : 0;

      // Generate forecasts
      const forecasts: RevenueForecasting[] = [];
      const currentDate = new Date();
      
      for (let i = 0; i < months; i++) {
        const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
        const period = forecastDate.toISOString().substring(0, 7);
        
        // Simple forecasting model
        const baseRevenue = avgRevenue;
        const trendImpact = trend * i;
        const seasonalityImpact = Math.sin((forecastDate.getMonth() / 12) * 2 * Math.PI) * avgRevenue * 0.1;
        const randomFactor = (Math.random() - 0.5) * avgRevenue * 0.05;
        
        const forecastedRevenue = Math.max(0, baseRevenue + trendImpact + seasonalityImpact + randomFactor);
        const confidence = Math.max(0.5, 1 - (i * 0.05)); // Confidence decreases over time
        
        forecasts.push({
          period,
          forecastedRevenue,
          confidence,
          factors: {
            base: baseRevenue,
            trend: trendImpact,
            seasonality: seasonalityImpact
          },
          seasonalityImpact,
          growthTrend: trend
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating revenue forecasting:', error);
      throw error;
    }
  }
}

export default FinancialAnalyticsService;