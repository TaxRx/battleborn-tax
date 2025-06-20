import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ResearchNote {
  id: string;
  content: string;
  createdAt: string;
  activityId: string;
  metrics?: {
    dataPoints?: number;
    successRate?: number;
  };
}

interface ResearchNotesState {
  notes: ResearchNote[];
  lastUpdateDate: string;
  updateInterval: number; // days
  addNote: (note: Omit<ResearchNote, 'id' | 'createdAt'>) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, note: Partial<ResearchNote>) => void;
  getLatestNotes: (limit?: number) => ResearchNote[];
  getDaysSinceLastUpdate: () => number;
  getDaysUntilNextUpdate: () => number;
  getMetricsSummary: () => {
    totalActivities: number;
    totalDataPoints: number;
    averageSuccessRate: number;
  };
}

const useResearchNotesStore = create<ResearchNotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      lastUpdateDate: new Date().toISOString(),
      updateInterval: 14, // Update every 14 days

      addNote: (note) => set((state) => ({
        notes: [
          {
            ...note,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
          },
          ...state.notes
        ],
        lastUpdateDate: new Date().toISOString()
      })),

      removeNote: (id) => set((state) => ({
        notes: state.notes.filter((note) => note.id !== id)
      })),

      updateNote: (id, updatedNote) => set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? { ...note, ...updatedNote } : note
        )
      })),

      getLatestNotes: (limit = 5) => {
        const { notes } = get();
        return notes
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },

      getDaysSinceLastUpdate: () => {
        const { lastUpdateDate } = get();
        const diffTime = Math.abs(new Date().getTime() - new Date(lastUpdateDate).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },

      getDaysUntilNextUpdate: () => {
        const { lastUpdateDate, updateInterval } = get();
        const nextUpdateDate = new Date(lastUpdateDate);
        nextUpdateDate.setDate(nextUpdateDate.getDate() + updateInterval);
        const diffTime = nextUpdateDate.getTime() - new Date().getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },

      getMetricsSummary: () => {
        const { notes } = get();
        const activitiesWithNotes = new Set(notes.map(note => note.activityId)).size;
        const totalDataPoints = notes.reduce((sum, note) => sum + (note.metrics?.dataPoints || 0), 0);
        const successRates = notes
          .filter(note => note.metrics?.successRate !== undefined)
          .map(note => note.metrics!.successRate!);
        
        const averageSuccessRate = successRates.length > 0
          ? Math.round(successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length)
          : 0;

        return {
          totalActivities: activitiesWithNotes,
          totalDataPoints,
          averageSuccessRate
        };
      }
    }),
    {
      name: 'research-notes-storage'
    }
  )
);

export default useResearchNotesStore; 