// Debug utility for tracing calculation issues
export const debug = {
  log: (component: string, message: string, data: any) => {
    console.log(`[DEBUG ${component}] ${message}:`, data);
  },
  
  error: (component: string, message: string, error: any) => {
    console.error(`[ERROR ${component}] ${message}:`, error);
  },
  
  traceCharitableDonation: (stage: string, data: any) => {
    console.log(`[CHARITABLE DONATION TRACE] ${stage}:`, {
      donationAmount: data.donationAmount,
      deductionValue: data.deductionValue,
      fmvMultiplier: data.fmvMultiplier,
      totalBenefit: data.totalBenefit,
      federalSavings: data.federalSavings,
      stateSavings: data.stateSavings,
      timestamp: new Date().toISOString()
    });
  },
  
  traceStrategyFlow: (stage: string, strategyId: string, details: any) => {
    console.log(`[STRATEGY FLOW] ${stage} - ${strategyId}:`, {
      details,
      timestamp: new Date().toISOString()
    });
  }
}; 