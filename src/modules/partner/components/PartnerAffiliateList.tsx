
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import InviteAffiliateModal from './InviteAffiliateModal';

// Define the Affiliate type based on our profiles schema
interface Affiliate {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

const PartnerAffiliateList: React.FC = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);
      
      const { data, error } = await supabase.functions.invoke('partner-service', {
        body: { pathname: '/partner-service/list-affiliates' },
      });

      if (error) throw error;

      setAffiliates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading affiliates...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <InviteAffiliateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAffiliateInvited={() => {
          setIsModalOpen(false);
          fetchAffiliates(); // Refresh the list
        }}
      />
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Affiliate Management</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Invite Affiliate
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full mr-4" src={affiliate.avatar_url || ''} alt={`${affiliate.full_name} logo`} />
                      {affiliate.full_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{affiliate.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(affiliate.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PartnerAffiliateList;
