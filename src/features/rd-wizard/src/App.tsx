import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from './context/UserContext';
import { ImpersonationProvider } from './contexts/ImpersonationContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Authentication pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Client pages
import ClientDashboard from './pages/client/Dashboard';
import BusinessInfo from './pages/client/BusinessInfo';
import DocumentUpload from './pages/client/DocumentUpload';
import QualifiedActivities from './pages/client/QualifiedActivities';
import QualifiedExpenses from './pages/client/QualifiedExpenses';
import FinalizeCalculations from './pages/client/FinalizeCalculations';
import Payment from './pages/client/Payment';
import Reports from './pages/client/Reports';
import ResearchOutcomes from './pages/client/ResearchOutcomes';
import ResearchOutcomesDashboard from './pages/client/ResearchOutcomesDashboard';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ClientManagement from './pages/admin/ClientManagement';
import ClientDetail from './pages/admin/ClientDetail';
import DocumentReview from './pages/admin/DocumentReview';
import ActivityReview from './pages/admin/ActivityReview';
import ExpenseReview from './pages/admin/ExpenseReview';
import Changelog from './pages/admin/Changelog';
import PendingApproval from './pages/admin/PendingApproval';

// Common
import LandingPage from './pages/common/LandingPage';
import NotFound from './pages/common/NotFound';

function App() {
  return (
    <ImpersonationProvider>
      <UserProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            
            {/* Client routes */}
            <Route path="/client" element={<DashboardLayout userType="client" />}>
              <Route index element={<ClientDashboard />} />
              <Route path="business-info" element={<BusinessInfo />} />
              <Route path="document-upload" element={<DocumentUpload />} />
              <Route path="qualified-activities" element={<QualifiedActivities />} />
              <Route path="qualified-expenses" element={<QualifiedExpenses />} />
              <Route path="finalize-calculations" element={<FinalizeCalculations />} />
              <Route path="payment" element={<Payment />} />
              <Route path="reports" element={<Reports />} />
              <Route path="research-outcomes" element={<ResearchOutcomes />} />
              <Route path="research-outcomes/dashboard" element={<ResearchOutcomesDashboard />} />
            </Route>
            
            {/* Admin routes */}
            <Route path="/admin" element={<DashboardLayout userType="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="documents/:id" element={<ClientDetail />} />
              <Route path="activities/:id" element={<ClientDetail />} />
              <Route path="expenses/:id" element={<ClientDetail />} />
              <Route path="audit-logs/:id" element={<ClientDetail />} />
              <Route path="document-review" element={<DocumentReview />} />
              <Route path="activity-review" element={<ActivityReview />} />
              <Route path="expense-review" element={<ExpenseReview />} />
              <Route path="audit-logs" element={<Changelog />} />
              <Route path="pending-approval" element={<PendingApproval />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <ToastContainer 
            position="top-right" 
            autoClose={3000} 
            hideProgressBar={false}
            style={{ zIndex: 9999 }}
          />
        </Router>
      </UserProvider>
    </ImpersonationProvider>
  );
}

export default App;