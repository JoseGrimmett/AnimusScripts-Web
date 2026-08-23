import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from '../../utils/analytics.js';

const AnalyticsRouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname, document.title || 'Animus Scripts');
  }, [location.pathname]);

  return null;
};

export default AnalyticsRouteTracker;
