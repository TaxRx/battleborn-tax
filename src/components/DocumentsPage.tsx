import React from 'react';
import { Lock, FileText } from 'lucide-react';

export default function DocumentsPage() {
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