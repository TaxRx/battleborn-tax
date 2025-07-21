import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  userType: 'admin' | 'operator' | 'affiliate' | 'client' | 'expert' | 'master-admin' | null;
  login: (userType: 'admin' | 'operator' | 'affiliate' | 'client' | 'expert' | 'master-admin') => void;
  logout: () => void;
  demoMode?: boolean;
  enableDemoMode?: (userType: 'admin' | 'operator' | 'affiliate' | 'client' | 'expert') => void;
  disableDemoMode?: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userType: null,
      demoMode: false,
      login: (userType) => set({ isAuthenticated: true, userType, demoMode: false }),
      logout: () => set({ isAuthenticated: false, userType: null, demoMode: false }),
      enableDemoMode: (userType) => set({ demoMode: true, isAuthenticated: true, userType }),
      disableDemoMode: () => set({ demoMode: false, isAuthenticated: false, userType: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore; 