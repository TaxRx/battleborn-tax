import React, { useEffect, useState } from 'react';
import { Card, Title, Text, Tab, TabList, TabGroup, TabPanel, TabPanels, BarChart, DonutChart, AreaChart } from '@tremor/react';
import { Users, UserPlus, Group as GroupIcon, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { advisorService } from '../services/advisorService';
import type { Advisor, Client, Group, Notification, AuditLog } from '../types/user';
import {
  mockStrategies,
  mockPayments,
  mockPayouts,
  mockClients,
  mockNotifications,
  mockActivity,
  mockPaymentsByMonth,
} from '../data/dashboardMockData';

export default function DashboardHome() {
  const [clients, setClients] = useState<Client[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  // Filtering state
  const [timeSpan, setTimeSpan] = useState<'month' | 'quarter' | 'year'>('month');

  // KPI calculations
  const pendingStrategies = mockStrategies.filter(s => s.status === 'pending').length;
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'
  const paymentsThisMonth = mockPayments.filter(p => p.date.startsWith(thisMonth) && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const payoutsThisMonth = mockPayouts.filter(p => p.date.startsWith(thisMonth) && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const activeClients = mockClients.filter(c => c.status === 'active').length;

  // Chart data filtering
  let chartData = mockPaymentsByMonth;
  if (timeSpan === 'month') {
    chartData = mockPaymentsByMonth.slice(-1);
  } else if (timeSpan === 'quarter') {
    chartData = mockPaymentsByMonth.slice(-3);
  } // else year = all

  // Reusable card style
  const cardClass = 'p-8 rounded-2xl shadow bg-white flex flex-col justify-between border-0';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [advisors, clients, groups, notifications, activity, revenue] = await Promise.all([
          advisorService.getAdvisors(),
          advisorService.getClients(''),
          advisorService.getGroups(''),
          advisorService.getNotifications('admin'),
          advisorService.getAuditLogs('admin'),
          advisorService.getMonthlyRevenue()
        ]);
        
        setAdvisors(advisors);
        setClients(clients);
        setGroups(groups);
        setNotifications(notifications);
        setActivity(activity);
        setMonthlyRevenue(revenue);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 bg-[#F6F8FA] min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-500">Monitor and manage your tax services platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-gray-500 text-base font-semibold">Pending Strategies</div>
              <div className="mt-2 text-4xl font-extrabold text-gray-900">{pendingStrategies}</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 17v-2a4 4 0 0 1 4-4h4" /><circle cx="9" cy="7" r="4" /><path d="M17 17v-2a4 4 0 0 0-3-3.87" /></svg>
            </div>
          </div>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-gray-500 text-base font-semibold">Payments Processed (This Month)</div>
              <div className="mt-2 text-4xl font-extrabold text-gray-900">${paymentsThisMonth.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
          </div>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-gray-500 text-base font-semibold">Advisor Payouts (This Month)</div>
              <div className="mt-2 text-4xl font-extrabold text-gray-900">${payoutsThisMonth.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-100">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
            </div>
          </div>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-gray-500 text-base font-semibold">Active Clients</div>
              <div className="mt-2 text-4xl font-extrabold text-gray-900">{activeClients}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-100">
              <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 15s1.5-2 4-2 4 2 4 2" /><path d="M9 9h.01" /><path d="M15 9h.01" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className={cardClass}>
          <div className="text-xl font-bold text-gray-900 mb-4">Quick Actions</div>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Review Strategies</button>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition">Process Payouts</button>
            <button className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition">Add Payment</button>
          </div>
        </div>
        <div className={cardClass}>
          <div className="text-xl font-bold text-gray-900 mb-4">Recent Notifications</div>
          <ul className="divide-y divide-gray-100">
            {mockNotifications.slice(0, 5).map((n, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <span className={`text-gray-800 font-medium ${!n.read ? 'font-bold' : ''}`}>{n.message}</span>
                <span className="text-xs text-gray-400 ml-4">{n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}</span>
              </li>
            ))}
            {mockNotifications.length === 0 && <li className="py-3 text-gray-400">No notifications</li>}
          </ul>
        </div>
      </div>

      {/* Charts with filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="text-lg font-semibold text-gray-700">Payments & Payouts</div>
        <select
          className="ml-2 px-3 py-2 border rounded-lg text-gray-700 bg-white shadow-sm"
          value={timeSpan}
          onChange={e => setTimeSpan(e.target.value as any)}
        >
          <option value="month">This Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className={cardClass}>
          <div className="text-xl font-bold text-gray-900 mb-4">Payments by Month</div>
          <BarChart
            className="mt-6 h-72"
            data={chartData}
            index="month"
            categories={["payments", "payouts"]}
            colors={["blue", "emerald"]}
            valueFormatter={number => `$${number.toLocaleString()}`}
          />
        </div>
        <div className={cardClass}>
          <div className="text-xl font-bold text-gray-900 mb-4">Payments vs. Payouts</div>
          <DonutChart
            className="mt-6 h-72"
            data={[
              { name: 'Payments', value: chartData.reduce((sum, d) => sum + d.payments, 0) },
              { name: 'Payouts', value: chartData.reduce((sum, d) => sum + d.payouts, 0) },
            ]}
            category="value"
            index="name"
            valueFormatter={number => `$${number.toLocaleString()}`}
            colors={["blue", "emerald"]}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className={cardClass + ' mb-12'}>
        <div className="text-xl font-bold text-gray-900 mb-4">Recent Activity</div>
        <ul className="divide-y divide-gray-100">
          {mockActivity.slice(0, 7).map((log, i) => (
            <li key={i} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">{log.action}</div>
                <div className="text-gray-500 text-sm">{log.details}</div>
              </div>
              <div className="text-gray-400 text-xs">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 