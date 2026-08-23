// Analytics utility for tracking user interactions and events
// Supports Google Analytics and custom event tracking

const ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
let lastTrackedPath = null;

// Initialize Google Analytics if ID is configured
export const initAnalytics = () => {
  if (!ANALYTICS_ID) {
    console.log("Analytics ID not configured. Set VITE_GOOGLE_ANALYTICS_ID in env.");
    return;
  }

  if (window.gtag) {
    return;
  }

  // Load Google Analytics script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", ANALYTICS_ID, { send_page_view: false });
};

// Track page views
export const trackPageView = (path, title) => {
  if (window.gtag && path !== lastTrackedPath) {
    lastTrackedPath = path;
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title,
    });
  }
};

// Track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
};

// Track pricing page interactions
export const trackPricingEvent = (action, value = null) => {
  trackEvent("pricing_interaction", {
    action: action,
    value: value,
  });
};

// Track ROI calculator interactions
export const trackROICalculation = (inputs, results) => {
  trackEvent("roi_calculation", {
    team_size: inputs.teamSize,
    calculation_type: "roi_estimate",
    estimated_year1_roi: results.roiYear1,
    payback_months: results.paybackMonths,
  });
};

// Track lead capture
export const trackLeadCapture = (context) => {
  trackEvent("lead_capture", {
    context: context,
    email_captured: true,
  });
};

// Track demo video views
export const trackDemoView = () => {
  trackEvent("demo_view", {
    demo_type: "animated_showcase",
  });
};

// Track CTA clicks
export const trackCTAClick = (ctaName, location) => {
  trackEvent("cta_click", {
    cta_name: ctaName,
    cta_location: location,
  });
};

// Track navigation
export const trackNavigation = (destination) => {
  trackEvent("navigation", {
    destination: destination,
  });
};

export default {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackPricingEvent,
  trackROICalculation,
  trackLeadCapture,
  trackDemoView,
  trackCTAClick,
  trackNavigation,
};
