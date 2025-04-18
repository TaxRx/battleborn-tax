import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Subscription {
  userId: string;
  status: 'active' | 'inactive';
}

interface SubscriptionStore {
  subscriptions: Record<string, Subscription>;
  setSubscriptionStatus: (userId: string, status: 'active' | 'inactive') => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set) => ({
      subscriptions: {},
      setSubscriptionStatus: (userId, status) =>
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [userId]: { userId, status }
          }
        }))
    }),
    {
      name: 'subscription-storage'
    }
  )
);