import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ResearchMetrics {
  clinicalSuccess: number;
  timeEfficiency: number;
  costEfficiency: number;
  patientSatisfaction: number;
}

interface ResearchStats {
  casesCompleted: number;
  averageDuration: number;
  complicationCount: number;
}

interface ResearchOutcome {
  id: string;
  activityId: string;
  subcomponentId: string;
  quarter: number;
  year: number;
  submittedBy: string;
  submittedAt: string;
  metrics: ResearchMetrics;
  stats: ResearchStats;
  status: 'exceeding' | 'meeting' | 'below' | 'needs-review';
  notes: string;
}

interface ResearchOutcomesState {
  outcomes: ResearchOutcome[];
  
  // Actions
  addOutcome: (outcome: Omit<ResearchOutcome, 'id' | 'submittedAt'>) => void;
  updateOutcome: (id: string, outcome: Partial<ResearchOutcome>) => void;
  deleteOutcome: (id: string) => void;
  getOutcomesForActivity: (activityId: string, year: number, quarter?: number) => ResearchOutcome[];
  getOutcomesForSubcomponent: (subcomponentId: string, year: number, quarter?: number) => ResearchOutcome[];
  
  // Analytics
  getAverageMetrics: (activityId: string, year: number) => {
    clinicalSuccess: number;
    timeEfficiency: number;
    costEfficiency: number;
    patientSatisfaction: number;
  };
  getTotalStats: (activityId: string, year: number) => {
    totalCases: number;
    averageDuration: number;
    totalComplications: number;
  };
  getQuarterlyTrends: (activityId: string, subcomponentId: string, year: number) => Array<{
    quarter: number;
    metrics: {
      clinicalSuccess: number;
      timeEfficiency: number;
    };
  }>;
}

const useResearchOutcomesStore = create<ResearchOutcomesState>()(
  persist(
    (set, get) => ({
      outcomes: [],
      
      addOutcome: (outcome) => set((state) => ({
        outcomes: [...state.outcomes, {
          ...outcome,
          id: Math.random().toString(36).substr(2, 9),
          submittedAt: new Date().toISOString()
        }]
      })),
      
      updateOutcome: (id, outcome) => set((state) => ({
        outcomes: state.outcomes.map((o) => 
          o.id === id ? { ...o, ...outcome } : o
        )
      })),
      
      deleteOutcome: (id) => set((state) => ({
        outcomes: state.outcomes.filter((o) => o.id !== id)
      })),
      
      getOutcomesForActivity: (activityId, year, quarter) => {
        const { outcomes } = get();
        return outcomes.filter((o) => 
          o.activityId === activityId && 
          o.year === year && 
          (quarter ? o.quarter === quarter : true)
        );
      },
      
      getOutcomesForSubcomponent: (subcomponentId, year, quarter) => {
        const { outcomes } = get();
        return outcomes.filter((o) => 
          o.subcomponentId === subcomponentId && 
          o.year === year && 
          (quarter ? o.quarter === quarter : true)
        );
      },
      
      getAverageMetrics: (activityId, year) => {
        const outcomes = get().getOutcomesForActivity(activityId, year);
        if (outcomes.length === 0) {
          return {
            clinicalSuccess: 0,
            timeEfficiency: 0,
            costEfficiency: 0,
            patientSatisfaction: 0,
          };
        }
        
        return {
          clinicalSuccess: outcomes.reduce((acc, o) => acc + o.metrics.clinicalSuccess, 0) / outcomes.length,
          timeEfficiency: outcomes.reduce((acc, o) => acc + o.metrics.timeEfficiency, 0) / outcomes.length,
          costEfficiency: outcomes.reduce((acc, o) => acc + o.metrics.costEfficiency, 0) / outcomes.length,
          patientSatisfaction: outcomes.reduce((acc, o) => acc + o.metrics.patientSatisfaction, 0) / outcomes.length,
        };
      },
      
      getTotalStats: (activityId, year) => {
        const outcomes = get().getOutcomesForActivity(activityId, year);
        if (outcomes.length === 0) {
          return {
            totalCases: 0,
            averageDuration: 0,
            totalComplications: 0,
          };
        }
        
        const totalCases = outcomes.reduce((acc, o) => acc + o.stats.casesCompleted, 0);
        const totalDuration = outcomes.reduce((acc, o) => acc + (o.stats.averageDuration * o.stats.casesCompleted), 0);
        
        return {
          totalCases,
          averageDuration: totalDuration / totalCases,
          totalComplications: outcomes.reduce((acc, o) => acc + o.stats.complicationCount, 0),
        };
      },
      
      getQuarterlyTrends: (activityId: string, subcomponentId: string, year: number) => {
        const outcomes = get().outcomes.filter(outcome => 
          outcome.activityId === activityId && 
          outcome.subcomponentId === subcomponentId &&
          outcome.year === year
        );
        
        return [1, 2, 3, 4].map(quarter => {
          const quarterOutcomes = outcomes.filter(outcome => outcome.quarter === quarter);
          if (quarterOutcomes.length === 0) {
            return {
              quarter,
              metrics: {
                clinicalSuccess: 0,
                timeEfficiency: 0
              }
            };
          }
          
          const metrics = quarterOutcomes.reduce((acc, outcome) => ({
            clinicalSuccess: acc.clinicalSuccess + outcome.metrics.clinicalSuccess,
            timeEfficiency: acc.timeEfficiency + outcome.metrics.timeEfficiency
          }), { clinicalSuccess: 0, timeEfficiency: 0 });
          
          return {
            quarter,
            metrics: {
              clinicalSuccess: metrics.clinicalSuccess / quarterOutcomes.length,
              timeEfficiency: metrics.timeEfficiency / quarterOutcomes.length
            }
          };
        });
      },
    }),
    {
      name: 'research-outcomes-storage',
      partialize: (state) => ({
        outcomes: state.outcomes
      })
    }
  )
);

export default useResearchOutcomesStore; 