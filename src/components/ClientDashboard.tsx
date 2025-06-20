import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCharitableDonationsByClientYear } from '../services/advisorService';
import type { CharitableDonation, Client } from '../types/user';
import useAuthStore from '../store/authStore';

export default function ClientDashboard() {
  const [client, setClient] = useState<Client | null>(null);
  const [donation, setDonation] = useState<CharitableDonation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { demoMode, userType } = useAuthStore();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);
      try {
        // Handle demo mode
        if (demoMode) {
          setClient({
            id: 'demo-client',
            name: 'Demo Client',
            email: 'demo.client@example.com',
            role: 'client',
            status: 'initial_contact',
            hasCompletedTaxProfile: false,
            advisorId: 'demo-advisor',
            groupIds: [],
            documents: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            strategies: [],
          });
          // No need to fetch donation for demo
          setDonation(null);
          return;
        }

        // Regular Supabase auth flow
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Not logged in');
        // Fetch client profile (assume user is a client)
        // Replace with your actual client fetch logic if needed
        setClient({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email || '',
          email: session.user.email || '',
          role: 'client',
          status: 'initial_contact',
          hasCompletedTaxProfile: false,
          advisorId: '',
          groupIds: [],
          documents: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          strategies: [],
        });
        const cd = await getCharitableDonationsByClientYear(session.user.id, currentYear);
        setDonation(cd || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load client data');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [demoMode]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!client) return <div className="p-8 text-center">No client data found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Welcome, {client.name || client.email}</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Charitable Donation ({currentYear})</h3>
        {donation ? (
          <div className="space-y-2">
            <div>Status: <span className="font-semibold">{donation.status}</span></div>
            <div>Initial Amount: <span className="font-semibold">${donation.initialAmount.toLocaleString()}</span></div>
            <div>Final Amount: <span className="font-semibold">{donation.finalAmount ? `$${donation.finalAmount.toLocaleString()}` : '-'}</span></div>
            <div>Due Diligence: <span className="font-semibold">{donation.dueDiligenceRequested ? 'Yes' : 'No'}</span></div>
          </div>
        ) : (
          <div>No Charitable Donation started for this year.</div>
        )}
      </div>
    </div>
  );
} 