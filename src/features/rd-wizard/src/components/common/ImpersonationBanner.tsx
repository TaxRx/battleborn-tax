import React from 'react';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { useUser } from '../../context/UserContext';

const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, adminId, clientId, stopImpersonation } = useImpersonation();
  const { user } = useUser();
  if (!isImpersonating || !adminId || !clientId) return null;
  return (
    <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 px-4 py-2 flex items-center justify-between z-50">
      <span>
        <strong>Admin Impersonation:</strong> You ({user?.email || adminId}) are viewing the app as client <span className="font-mono">{clientId}</span>.
      </span>
      <button
        className="ml-4 px-3 py-1 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold rounded"
        onClick={stopImpersonation}
      >
        Stop Impersonating
      </button>
    </div>
  );
};

export default ImpersonationBanner; 