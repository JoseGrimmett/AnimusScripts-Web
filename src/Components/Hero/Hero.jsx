import React from "react";
import "./Hero.css";

const Hero = () => {
  return (
    <section id="hero" className="hero">
      <div className="hero-overlay" />
      <div className="hero-content container">
        <div className="hero-badge">Practical systems for manufacturing, operations, and finance teams</div>
        <h1>Reliable internal systems that replace manual reporting, disconnected workflows, and fragile spreadsheets.</h1>
        <p>
          Animus Scripts helps businesses replace disconnected spreadsheets, manual reporting, and fragile processes with reliable data pipelines, trusted dashboards, and operational systems built around how your team actually works.
        </p>
        <div className="hero-actions">
          <a href="#contact" className="btn dark-btn">Start the conversation</a>
          <a href="#featured-work" className="btn ghost-btn">See our work</a>
        </div>
        <div className="hero-trust-bar">
          <span>Manufacturing, operations, finance teams</span>
          <span>SQL, Power BI, Python, Microsoft 365</span>
          <span>Audit trails, data quality, repeatable processes</span>
        </div>
        <div className="hero-highlights">
          <div>
            <strong>Observable automation</strong>
            <span>Every system includes logging, error handling, and recovery—not silent failures.</span>
          </div>
          <div>
            <strong>Built for your tools</strong>
            <span>Integrations with SQL, Power BI, SharePoint, Teams, ERP, and the systems you already use.</span>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <strong>No bloat</strong>
            <span>Practical systems designed for your specific workflow and data structure.</span>
          </div>
          <div>
            <strong>Central source of truth</strong>
            <span>Reconciled data, consistent definitions, and verified reporting across the organization.</span>
          </div>
          <div>
            <strong>Long-term partnership</strong>
            <span>Documentation, knowledge transfer, and ongoing support for a system that scales with the business.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
