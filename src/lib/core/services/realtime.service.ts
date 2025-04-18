import { supabase } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SavedCalculation, User } from '../types';

export class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public subscribeToUserProfile(
    userId: string,
    onUpdate: (profile: User) => void
  ): () => void {
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onUpdate(payload.new as User);
        }
      )
      .subscribe();

    this.channels.set(`profile:${userId}`, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(`profile:${userId}`);
    };
  }

  public subscribeToCalculations(
    userId: string,
    onUpdate: (calculation: SavedCalculation) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = supabase
      .channel(`calculations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tax_calculations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
            case 'UPDATE':
              onUpdate(payload.new as SavedCalculation);
              break;
            case 'DELETE':
              onDelete(payload.old.id);
              break;
          }
        }
      )
      .subscribe();

    this.channels.set(`calculations:${userId}`, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(`calculations:${userId}`);
    };
  }

  public unsubscribeAll() {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const realtimeService = RealtimeService.getInstance();