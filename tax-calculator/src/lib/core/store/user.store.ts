import { create } from 'zustand';
import { produce } from 'immer';
import { User } from '../types';
import { userService } from '../services';
import { realtimeService } from '../services/realtime.service';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Complex Actions
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  setupRealtimeSync: () => void;
  cleanup: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  setUser: (user) => set(produce((state) => {
    state.user = user;
  })),

  setLoading: (loading) => set(produce((state) => {
    state.loading = loading;
  })),

  setError: (error) => set(produce((state) => {
    state.error = error;
  })),

  fetchUserProfile: async () => {
    set(produce((state) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      const user = await userService.getCurrentUser();
      set(produce((state) => {
        state.user = user;
        state.loading = false;
      }));

      // Set up realtime sync after successful fetch
      if (user) {
        get().setupRealtimeSync();
      }
    } catch (error: any) {
      set(produce((state) => {
        state.error = error.message;
        state.loading = false;
      }));
    }
  },

  updateUserProfile: async (data) => {
    const { user } = get();
    if (!user) return;

    set(produce((state) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      const updatedUser = await userService.updateProfile(user.id, data);
      set(produce((state) => {
        state.user = updatedUser;
        state.loading = false;
      }));
    } catch (error: any) {
      set(produce((state) => {
        state.error = error.message;
        state.loading = false;
      }));
    }
  },

  setupRealtimeSync: () => {
    const { user } = get();
    if (!user) return;

    // Subscribe to profile updates
    realtimeService.subscribeToUserProfile(user.id, (profile) => {
      set(produce((state) => {
        state.user = { ...state.user!, ...profile };
      }));
    });
  },

  cleanup: () => {
    realtimeService.unsubscribeAll();
  },

  reset: () => {
    realtimeService.unsubscribeAll();
    set(produce((state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    }));
  }
}));