import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  userType: 'client' | 'admin' | 'master-admin' | null;
  login: (userType: 'client' | 'admin' | 'master-admin') => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userType: null,
      login: (userType) => set({ isAuthenticated: true, userType }),
      logout: () => set({ isAuthenticated: false, userType: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore; 