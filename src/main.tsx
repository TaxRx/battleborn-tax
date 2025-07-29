import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import GalileoTaxApp from './NewApp';
import './index.css';
import ErrorBoundary from './modules/shared/components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  
  <React.StrictMode>
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <ErrorBoundary>
        <GalileoTaxApp />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);