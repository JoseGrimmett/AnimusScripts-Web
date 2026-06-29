import React from "react";
import "./PackageCTA.css";

const packages = [
  {
    name: "Data & Reporting Foundation",
    price: "4–6 weeks",
    description: "Trusted dashboards and centralized reporting for operations, finance, or production data.",
    features: ["Data discovery and modeling", "Power BI dashboards and KPIs", "SQL reporting layer", "Refresh automation and documentation"],
    cta: "Start the discovery",
    primary: false,
  },
  {
    name: "Workflow Automation Build",
    price: "3–5 weeks",
    description: "Replace manual forms, approvals, and spreadsheets with observable, auditable automation.",
    features: ["Form intake design", "Routing and database storage", "Teams or email alerts", "Processing logs and tracking"],
    cta: "Let's talk",
    primary: true,
  },
  {
    name: "Microsoft 365 Operations Upgrade",
    price: "4–8 weeks",
    description: "SharePoint, Teams, and Power Apps systems that give teams a clean interface.",
    features: ["SharePoint list architecture", "Power Apps or web interface", "Role-based access design", "AD group strategy and documentation"],
    cta: "Schedule a review",
    primary: false,
  },
];

const PackageCTA = () => {
  return (
    <section className="package-cta section-reveal">
      <div className="package-intro">
        <p className="brand-pill">Engagement packages</p>
        <h3>Choose the work that matches your biggest bottleneck.</h3>
        <p>All packages include direct partnership, knowledge transfer, and documentation so you own the system.</p>
      </div>
      <div className="package-grid">
        {packages.map((pkg) => (
          <article className={`package-card card-raise ${pkg.primary ? "featured" : ""}`} key={pkg.name}>
            <div className="package-header">
              <h4>{pkg.name}</h4>
              <span className="package-price">{pkg.price}</span>
            </div>
            <p className="package-desc">{pkg.description}</p>
            <div className="package-features">
              {pkg.features.map((feature) => (
                <div key={feature} className="feature-item">
                  <span className="dot">•</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <a href="#contact" className={`btn ${pkg.primary ? "dark-btn" : "ghost-btn"}`}>
              {pkg.cta}
            </a>
          </article>
        ))}
      </div>
      <p className="package-note">All packages include audit logging, error recovery, and documentation for long-term maintainability.</p>
    </section>
  );
};

export default PackageCTA;
