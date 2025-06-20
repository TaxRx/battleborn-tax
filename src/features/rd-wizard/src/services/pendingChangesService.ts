import { isDemoMode } from '../utils/demoMode';
import { demoPendingChanges } from '../data/demoSeed';
import { v4 as uuidv4 } from 'uuid';

export async function getPendingChangesForClient(clientId: string) {
  if (isDemoMode()) {
    return { data: demoPendingChanges.filter(c => c.client_id === clientId && c.status === 'pending') };
  }
  // TODO: Add Supabase logic
  return { data: [] };
}

export async function proposeChange(change: any) {
  if (isDemoMode()) {
    const newChange = { ...change, id: uuidv4(), status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    demoPendingChanges.push(newChange);
    return { data: newChange };
  }
  // TODO: Add Supabase logic
  return { data: null };
}

export async function updatePendingChangeStatus(changeId: string, status: 'approved' | 'rejected') {
  if (isDemoMode()) {
    const idx = demoPendingChanges.findIndex(c => c.id === changeId);
    if (idx !== -1) {
      demoPendingChanges[idx].status = status;
      demoPendingChanges[idx].updated_at = new Date().toISOString();
      return { data: demoPendingChanges[idx] };
    }
    return { data: null };
  }
  // TODO: Add Supabase logic
  return { data: null };
}

export async function getAllPendingChanges() {
  if (isDemoMode()) {
    return { data: demoPendingChanges };
  }
  // TODO: Add Supabase logic
  return { data: [] };
} 