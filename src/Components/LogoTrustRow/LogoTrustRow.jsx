import React from "react";
import "./LogoTrustRow.css";

const LogoTrustRow = () => {
  return (
    <section className="logo-trust-row section-reveal">
      <div className="trust-label">Trusted by</div>
      <div className="logo-grid">
        <div className="logo-placeholder">
          <span>Client A</span>
        </div>
        <div className="logo-placeholder">
          <span>Client B</span>
        </div>
        <div className="logo-placeholder">
          <span>Client C</span>
        </div>
        <div className="logo-placeholder">
          <span>Client D</span>
        </div>
      </div>
      <p className="trust-note">
        Proven execution with founders, operators, and product-led teams building for scale.
      </p>
    </section>
  );
};

export default LogoTrustRow;
