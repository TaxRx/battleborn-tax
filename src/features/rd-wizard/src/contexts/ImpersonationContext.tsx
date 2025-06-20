import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ImpersonationContextType {
  isImpersonating: boolean;
  adminId: string | null;
  clientId: string | null;
  startImpersonation: (adminId: string, clientId: string) => void;
  stopImpersonation: () => void;
  getImpersonationInfo: () => { adminId: string | null; clientId: string | null };
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};

interface ImpersonationProviderProps {
  children: ReactNode;
}

export const ImpersonationProvider: React.FC<ImpersonationProviderProps> = ({ children }) => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const startImpersonation = (adminId: string, clientId: string) => {
    setIsImpersonating(true);
    setAdminId(adminId);
    setClientId(clientId);
  };

  const stopImpersonation = () => {
    setIsImpersonating(false);
    setAdminId(null);
    setClientId(null);
  };

  const getImpersonationInfo = () => ({ adminId, clientId });

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        adminId,
        clientId,
        startImpersonation,
        stopImpersonation,
        getImpersonationInfo,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}; 