import React, { useEffect, useState } from 'react';
import { Lock, FileText } from 'lucide-react';
import { useTaxProfileStore } from '../store/taxProfileStore';
import InfoForm from './InfoForm';
import * as Dialog from '@radix-ui/react-dialog';

export default function DocumentsPage() {
  const { taxProfile, loading, error, fetchTaxProfile, updateTaxProfile } = useTaxProfileStore();
  const [showInfoForm, setShowInfoForm] = useState(false);

  useEffect(() => {
    fetchTaxProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (!taxProfile || showInfoForm) {
    return (
      <Dialog.Root open={true} onOpenChange={setShowInfoForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl z-50 focus:outline-none">
            <Dialog.Title className="text-xl font-bold px-8 pt-8">Enter Tax Information</Dialog.Title>
            <Dialog.Description className="px-8 pb-2 text-gray-500">Please complete your tax profile to access documents.</Dialog.Description>
            <InfoForm
              initialData={taxProfile}
              onSubmit={async (data) => {
                await updateTaxProfile(data);
                setShowInfoForm(false);
              }}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Documents</h1>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center py-12">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Documents Locked</h3>
          <p className="text-gray-600 mb-6">
            Your tax strategy documents will appear here after completing the payment process.
          </p>
          <button
            onClick={() => {}} // Will be implemented when billing is ready
            className="px-6 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654] focus:outline-none focus:ring-2 focus:ring-[#12ab61] focus:ring-offset-2"
          >
            Unlock Documents
          </button>
        </div>

        <div className="mt-12 border-t pt-8">
          <h4 className="font-medium mb-4">Available Documents</h4>
          <div className="space-y-4">
            {['Augusta Rule Agreement', 'Charitable Donation Strategy', 'Tax Savings Report'].map((doc) => (
              <div 
                key={doc}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{doc}</span>
                </div>
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}