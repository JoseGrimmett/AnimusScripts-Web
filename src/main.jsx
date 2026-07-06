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
import PortalPage from './Pages/PortalPage.jsx';
import EmployeeRouteGuard from './Components/RouteGuards/EmployeeRouteGuard.jsx';
import ToastHost from './Components/ToastHost/ToastHost.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/services" element={<ServicesIndexPage />} />
        <Route path="/services/:slug" element={<ServiceDetailPage />} />
        <Route path="/what-we-build" element={<WhatWeBuildPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route
          path="/admin"
          element={(
            <EmployeeRouteGuard>
              <SubmissionsPage />
            </EmployeeRouteGuard>
          )}
        />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/submissions"
          element={(
            <EmployeeRouteGuard>
              <SubmissionsPage />
            </EmployeeRouteGuard>
          )}
        />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
      <ToastHost />
    </BrowserRouter>
  </StrictMode>,
);
