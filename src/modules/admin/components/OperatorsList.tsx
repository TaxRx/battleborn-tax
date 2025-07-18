
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CreateOperatorModal from './CreateOperatorModal'; // Import the modal

// Define the Operator type based on our schema
interface Operator {
  id: string;
  company_name: string;
  logo_url: string;
  status: string;
  primary_contact_email: string;
  created_at: string;
}

const OperatorsList: React.FC = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);
      
      const { data, error } = await supabase.functions.invoke('admin-service', {
        body: { pathname: '/admin-service/list-partners' },
      });

      if (error) throw error;

      setOperators(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading operators...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <CreateOperatorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOperatorCreated={() => {
          setIsModalOpen(false);
          fetchOperators(); // Refresh the list
        }}
      />
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Operator Accounts</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Operator
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operators.map((operator) => (
                <tr key={operator.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full mr-4" src={operator.logo_url || ''} alt={`${operator.company_name} logo`} />
                      {operator.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{operator.primary_contact_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      operator.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {operator.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(operator.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default OperatorsList;
