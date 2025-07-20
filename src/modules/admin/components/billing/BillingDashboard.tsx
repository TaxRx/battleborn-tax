// Epic 3 Sprint 4: Billing Management Dashboard
// File: BillingDashboard.tsx
// Purpose: Comprehensive billing management interface for Story 4.1
// Story: 4.1 - Billing Management System (10 points)

import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import AdminProfileService, { 
  SubscriptionPlan, 
  AccountSubscription, 
  AccountInvoice, 
  PaymentHistory, 
  BillingEvent 
} from '../../services/adminProfileService';

interface BillingDashboardProps {
  accountId?: string;
}

interface BillingStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  pendingInvoices: number;
  failedPayments: number;
}

export default function BillingDashboard({ accountId }: BillingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'payments' | 'events'>('overview');
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<AccountSubscription[]>([]);
  const [invoices, setInvoices] = useState<AccountInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const adminProfileService = new AdminProfileService();

  useEffect(() => {
    loadBillingData();
  }, [accountId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load all billing data in parallel
      const [
        plansData,
        subscriptionsData,
        invoicesData,
        paymentsData,
        eventsData
      ] = await Promise.all([
        adminProfileService.getSubscriptionPlans(),
        accountId ? adminProfileService.getAccountSubscriptions(accountId) : adminProfileService.getAllSubscriptions(),
        accountId ? adminProfileService.getAccountInvoices(accountId, { limit: 50 }) : adminProfileService.getAllInvoices({ limit: 50 }),
        accountId ? adminProfileService.getPaymentHistory(accountId, { limit: 50 }) : adminProfileService.getAllPayments({ limit: 50 }),
        accountId ? adminProfileService.getBillingEvents(accountId, { limit: 50 }) : adminProfileService.getAllBillingEvents({ limit: 50 })
      ]);

      setSubscriptionPlans(plansData);
      setSubscriptions(subscriptionsData);
      setInvoices(invoicesData);
      setPayments(paymentsData);
      setBillingEvents(eventsData);

      // Calculate stats
      const stats: BillingStats = {
        totalSubscriptions: subscriptionsData.length,
        activeSubscriptions: subscriptionsData.filter(s => s.status === 'active').length,
        monthlyRevenue: subscriptionsData
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + (s.plan?.priceCents || 0), 0) / 100,
        pendingInvoices: invoicesData.filter(i => i.status === 'open').length,
        failedPayments: paymentsData.filter(p => p.status === 'failed').length
      };
      setBillingStats(stats);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedPlan || !accountId) return;

    try {
      const result = await adminProfileService.createSubscription(accountId, selectedPlan, {
        trialDays: 14
      });
      
      if (result.success) {
        setShowCreateSubscription(false);
        setSelectedPlan('');
        loadBillingData();
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const handleGenerateInvoice = async (subscriptionId: string) => {
    try {
      const result = await adminProfileService.generateInvoice(subscriptionId);
      if (result.success) {
        loadBillingData();
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {accountId ? 'Account Billing Management' : 'Global Billing Management'}
          </h1>
          {!accountId && (
            <p className="text-sm text-gray-500 mt-1">
              Viewing all billing data across all accounts
            </p>
          )}
        </div>
        {accountId && (
          <button
            onClick={() => setShowCreateSubscription(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Subscription
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {billingStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{billingStats.totalSubscriptions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{billingStats.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(billingStats.monthlyRevenue * 100)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{billingStats.pendingInvoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900">{billingStats.failedPayments}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'subscriptions', label: 'Subscriptions' },
            { key: 'invoices', label: 'Invoices' },
            { key: 'payments', label: 'Payments' },
            { key: 'events', label: 'Events' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Billing Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Recent Subscriptions</h4>
                <div className="space-y-2">
                  {subscriptions.slice(0, 3).map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{sub.plan?.planName}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recent Invoices</h4>
                <div className="space-y-2">
                  {invoices.slice(0, 3).map(invoice => (
                    <div key={invoice.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{invoice.invoiceNumber}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Subscriptions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {!accountId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Billing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map(sub => (
                    <tr key={sub.id}>
                      {!accountId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{(sub as any).account?.name || 'Unknown Account'}</div>
                          <div className="text-sm text-gray-500">{(sub as any).account?.type}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sub.plan?.planName}</div>
                          <div className="text-sm text-gray-500">{sub.plan?.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(sub.plan?.priceCents || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sub.currentPeriodEnd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleGenerateInvoice(sub.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Generate Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Invoices</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {!accountId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map(invoice => (
                    <tr key={invoice.id}>
                      {!accountId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{(invoice as any).account?.name || 'Unknown Account'}</div>
                          <div className="text-sm text-gray-500">{(invoice as any).account?.type}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.totalCents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amountCents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod ? 
                          `${payment.paymentMethod.brand} ****${payment.paymentMethod.lastFour}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Billing Events</h3>
            <div className="space-y-4">
              {billingEvents.map(event => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{event.eventType}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.processed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.processed ? 'Processed' : 'Pending'}
                    </span>
                  </div>
                  {event.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">{event.errorMessage}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Subscription Modal */}
      {showCreateSubscription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Create New Subscription</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Choose a plan...</option>
                  {subscriptionPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.planName} - {formatCurrency(plan.priceCents)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateSubscription(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubscription}
                  disabled={!selectedPlan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}