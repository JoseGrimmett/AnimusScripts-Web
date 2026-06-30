import React, { useState, useEffect } from "react";
import NavBar from "./Components/NavBar/NavBar";
import Hero from "./Components/Hero/Hero";
import Programs from "./Components/Programs/Programs";
import ProofSection from "./Components/ProofSection/ProofSection";
import Contact from "./Components/Contact/Contact";
import Footer from "./Components/Footer/Footer";
import TrustSection from "./Components/TrustSection/TrustSection";
import DeliveryChecklist from "./Components/DeliveryChecklist/DeliveryChecklist";
import PackageCTA from "./Components/PackageCTA/PackageCTA";
import VideoPlayer from "./Components/VideoPlayer/VideoPlayer";
import SocialProof from "./Components/SocialProof/SocialProof";
import StickyMobileCTA from "./Components/StickyMobileCTA/StickyMobileCTA";
import { initAnalytics, trackPageView } from "./utils/analytics";

const App = () => {
  const [playState, setPlayState] = useState(false);

  useEffect(() => {
    // Initialize analytics on app load
    initAnalytics();
    trackPageView(window.location.pathname, "Animus Scripts - Home");
  }, []);

  return (
    <div>
      <NavBar />
      <Hero setPlayState={setPlayState} />
      <div className="container">
        <ProofSection />
        <Programs />
        <SocialProof />
        <DeliveryChecklist />
        <PackageCTA />
        <TrustSection />
        <Contact/>
        <Footer />
      </div>
      <VideoPlayer playState={playState} setPlayState={setPlayState} />
      <StickyMobileCTA />
    </div>
  );
};

export default App;
