import React, { useState } from 'react';
import BusinessInfoModal, { BusinessInfo } from './BusinessInfoModal';

interface BusinessInfoStepProps {
  businessInfo: BusinessInfo | null;
  setBusinessInfo: (info: BusinessInfo) => void;
  onNext: () => void;
}

export default function BusinessInfoStep({ businessInfo, setBusinessInfo, onNext }: BusinessInfoStepProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const years = businessInfo ? Object.keys(businessInfo.pastQREs) : [];

  const isComplete = businessInfo &&
    businessInfo.name &&
    businessInfo.ein &&
    businessInfo.entityType &&
    businessInfo.yearStarted &&
    businessInfo.category &&
    businessInfo.focus &&
    businessInfo.address &&
    businessInfo.contactName &&
    businessInfo.contactEmail &&
    years.every(y => businessInfo.pastQREs[y] && businessInfo.pastReceipts[y]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4">Business Information</h3>
      {businessInfo ? (
        <div className="mb-4 space-y-2">
          <div><b>Name:</b> {businessInfo.name}</div>
          <div><b>EIN:</b> {businessInfo.ein}</div>
          <div><b>Entity Type:</b> {businessInfo.entityType}</div>
          <div><b>Year Started:</b> {businessInfo.yearStarted}</div>
          <div><b>Category:</b> {businessInfo.category}</div>
          <div><b>Focus:</b> {businessInfo.focus}</div>
          <div><b>Address:</b> {businessInfo.address}</div>
          <div><b>Contact Name:</b> {businessInfo.contactName}</div>
          <div><b>Contact Email:</b> {businessInfo.contactEmail}</div>
          <div>
            <b>Past Qualified Research Expenses (QREs):</b>
            <ul className="ml-4">
              {years.map(y => (
                <li key={y}>{y}: ${businessInfo.pastQREs[y]}</li>
              ))}
            </ul>
          </div>
          <div>
            <b>Past Gross Receipts:</b>
            <ul className="ml-4">
              {years.map(y => (
                <li key={y}>{y}: ${businessInfo.pastReceipts[y]}</li>
              ))}
            </ul>
          </div>
          <button className="mt-4 px-4 py-2 border rounded" onClick={() => setModalOpen(true)}>
            Edit Business Info
          </button>
        </div>
      ) : (
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={() => setModalOpen(true)}>
          Add Business Info
        </button>
      )}
      <BusinessInfoModal
        open={modalOpen}
        initialData={businessInfo || undefined}
        onClose={() => setModalOpen(false)}
        onSave={info => {
          setBusinessInfo(info);
          setModalOpen(false);
        }}
      />
      <div className="flex justify-end pt-4">
        <button
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          onClick={onNext}
          disabled={!isComplete}
        >
          Next
        </button>
      </div>
    </div>
  );
} 