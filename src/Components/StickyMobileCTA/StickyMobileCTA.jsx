import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./StickyMobileCTA.css";

const StickyMobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 800px or reaching pricing section
      const scrollPos = window.scrollY;
      const pricingSection = document.getElementById("pricing-tiers");
      
      const shouldShow = scrollPos > 800 || (pricingSection && scrollPos > pricingSection.offsetTop - window.innerHeight);
      
      setIsVisible(shouldShow);
      if (scrollPos > 400) {
        setHasScrolled(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only show on mobile
  const isMobile = window.innerWidth <= 768;

  if (!isMobile || !hasScrolled) {
    return null;
  }

  return (
    <div className={`sticky-mobile-cta ${isVisible ? "visible" : ""}`}>
      <a href="#contact" className="btn dark-btn sticky-cta-btn">
        Book a call
      </a>
    </div>
  );
};

export default StickyMobileCTA;
