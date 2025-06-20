// Check if the app is running in demo mode
export const isDemoMode = () => true;

// Set demo mode
export const setDemoMode = (enabled: boolean) => {
  localStorage.setItem('demoMode', enabled.toString());
};

// Toggle demo mode
export const toggleDemoMode = () => {
  const current = isDemoMode();
  setDemoMode(!current);
  return !current;
}; 