import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import ServicesIndexPage from './Pages/ServicesIndexPage.jsx';
import ServiceDetailPage from './Pages/ServiceDetailPage.jsx';
import PricingPage from './Pages/PricingPage.jsx';
import WhatWeBuildPage from './Pages/WhatWeBuildPage.jsx';
import AboutPage from './Pages/AboutPage.jsx';
import ContactPage from './Pages/ContactPage.jsx';
import SubmissionsPage from './Pages/SubmissionsPage.jsx';
import AdminCrmPage from './Pages/AdminCrmPage.jsx';
import AdminDashboardPage from './Pages/AdminDashboardPage.jsx';
import PortalPage from './Pages/PortalPage.jsx';
import EmployeeRouteGuard from './Components/RouteGuards/EmployeeRouteGuard.jsx';
import ToastHost from './Components/ToastHost/ToastHost.jsx';
import AnalyticsRouteTracker from './Components/AnalyticsRouteTracker/AnalyticsRouteTracker.jsx';
import AppErrorBoundary from './Components/AppErrorBoundary/AppErrorBoundary.jsx';
import './styles/design-system.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <AnalyticsRouteTracker />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/services" element={<ServicesIndexPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/what-we-build" element={<WhatWeBuildPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/admin" element={<SubmissionsPage />} />
          <Route
            path="/admin/dashboard"
            element={(
              <EmployeeRouteGuard>
                <AdminDashboardPage />
              </EmployeeRouteGuard>
            )}
          />
          <Route
            path="/admin/crm"
            element={(
              <EmployeeRouteGuard>
                <AdminCrmPage />
              </EmployeeRouteGuard>
            )}
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
        <ToastHost />
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
