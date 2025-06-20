import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  userType: 'client' | 'admin' | 'master-admin' | null;
  demoMode: boolean;
  login: (userType: 'client' | 'admin' | 'master-admin') => void;
  logout: () => void;
  enableDemoMode: (userType: 'client' | 'admin') => void;
  disableDemoMode: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userType: null,
      demoMode: false,
      login: (userType) => set({ isAuthenticated: true, userType, demoMode: false }),
      logout: () => set({ isAuthenticated: false, userType: null, demoMode: false }),
      enableDemoMode: (userType) => set({ isAuthenticated: true, userType, demoMode: true }),
      disableDemoMode: () => set({ isAuthenticated: false, userType: null, demoMode: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore; 