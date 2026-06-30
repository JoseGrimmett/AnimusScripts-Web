import React, { useState } from "react";
import "./PricingComparison.css";

const PricingComparison = () => {
  const [expandedCategory, setExpandedCategory] = useState("core-features");

  const categories = [
    {
      id: "core-features",
      name: "Core Features",
      features: [
        { name: "Data integration & ETL", discovery: true, core: true, partnership: true },
        { name: "SQL reporting layers", discovery: false, core: true, partnership: true },
        { name: "Power BI dashboards", discovery: false, core: true, partnership: true },
        { name: "Workflow automation", discovery: false, core: true, partnership: true },
        { name: "Microsoft 365 solutions", discovery: false, core: true, partnership: true },
        { name: "Internal applications", discovery: false, core: true, partnership: true },
      ],
    },
    {
      id: "scope",
      name: "Project Scope",
      features: [
        { name: "Scope: Audit & discovery", discovery: true, core: false, partnership: false },
        { name: "1-3 integrations/workflows", discovery: false, core: true, partnership: false },
        { name: "Ongoing support & expansion", discovery: false, core: false, partnership: true },
        { name: "Dedicated resource access", discovery: false, core: false, partnership: true },
        { name: "Quarterly planning sessions", discovery: false, core: false, partnership: true },
      ],
    },
    {
      id: "support",
      name: "Support & Maintenance",
      features: [
        { name: "Email support", discovery: true, core: true, partnership: true },
        { name: "Monthly status reviews", discovery: false, core: true, partnership: true },
        { name: "Proactive monitoring", discovery: false, core: false, partnership: true },
        { name: "24-hour response SLA", discovery: false, core: false, partnership: true },
        { name: "Team training included", discovery: false, core: true, partnership: true },
      ],
    },
    {
      id: "deployment",
      name: "Deployment & Infrastructure",
      features: [
        { name: "Cloud & on-prem options", discovery: false, core: true, partnership: true },
        { name: "Compliance & security audit", discovery: false, core: false, partnership: true },
        { name: "Active Directory & SSO", discovery: false, core: false, partnership: true },
        { name: "Production deployment", discovery: false, core: true, partnership: true },
        { name: "Disaster recovery plan", discovery: false, core: false, partnership: true },
      ],
    },
  ];

  return (
    <div className="pricing-comparison">
      <div className="pricing-comparison-header">
        <h3>Feature Comparison</h3>
        <p>See what's included at each engagement level</p>
      </div>

      <div className="pricing-comparison-table-wrapper">
        <table className="pricing-comparison-table">
          <thead>
            <tr>
              <th className="feature-col">Feature</th>
              <th className="tier-col">Discovery</th>
              <th className="tier-col">Core Implementation</th>
              <th className="tier-col">Ongoing Partnership</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <React.Fragment key={category.id}>
                <tr className="category-row">
                  <td colSpan="4">
                    <button
                      className={`category-toggle ${
                        expandedCategory === category.id ? "expanded" : ""
                      }`}
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === category.id ? null : category.id
                        )
                      }
                    >
                      <span className="category-icon">+</span>
                      <span className="category-name">{category.name}</span>
                    </button>
                  </td>
                </tr>
                {expandedCategory === category.id &&
                  category.features.map((feature, idx) => (
                    <tr key={idx} className="feature-row">
                      <td className="feature-name">{feature.name}</td>
                      <td className={`feature-cell ${feature.discovery ? "included" : ""}`}>
                        {feature.discovery && <span className="checkmark">✓</span>}
                      </td>
                      <td className={`feature-cell ${feature.core ? "included" : ""}`}>
                        {feature.core && <span className="checkmark">✓</span>}
                      </td>
                      <td className={`feature-cell ${feature.partnership ? "included" : ""}`}>
                        {feature.partnership && <span className="checkmark">✓</span>}
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-cta">
        <p>Not sure which tier is right for you?</p>
        <a href="#contact" className="btn dark-btn">Talk to us about your needs</a>
      </div>
    </div>
  );
};

export default PricingComparison;
