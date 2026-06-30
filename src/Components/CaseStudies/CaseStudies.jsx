import React from "react";
import { Link } from "react-router-dom";
import "./CaseStudies.css";

const caseStudies = [
  {
    title: "Northstar CRM",
    category: "Mobile operations",
    summary:
      "A field-first CRM experience that replaced scattered spreadsheets with a focused and reliable workflow hub.",
    outcome: "+38% faster response time",
    roiMetrics: [
      { label: "Response Time Improvement", value: "+38%" },
      { label: "Manual Data Entry Reduction", value: "65%" },
      { label: "First-Year ROI", value: "245%" },
      { label: "Annual Savings", value: "$127K" }
    ],
    link: "/services/mobile-products",
  },
  {
    title: "Atlas Operations",
    category: "Web platform",
    summary:
      "An internal operations platform that brought visibility, approvals, and reporting into a single polished system.",
    outcome: "Unified reporting in one place",
    roiMetrics: [
      { label: "Reporting Consolidation", value: "3→1 system" },
      { label: "Approval Cycle Time", value: "-60%" },
      { label: "Team Hours Saved/Week", value: "18 hrs" },
      { label: "Annual Hours Saved", value: "900 hrs" }
    ],
    link: "/services/web-platforms",
  },
  {
    title: "Helix Automations",
    category: "Automation system",
    summary:
      "Connected fragmented processes into a scalable automation layer that reduced repetitive admin work across teams.",
    outcome: "2x weekly team capacity",
    roiMetrics: [
      { label: "Capacity Gain", value: "+2x/week" },
      { label: "Process Automation Rate", value: "85%" },
      { label: "Payback Period", value: "2.3 months" },
      { label: "Year 2 ROI", value: "450%" }
    ],
    link: "/services/it-automation",
  },
];

const CaseStudies = () => {
  return (
    <section className="case-studies section-reveal" id="case-studies">
      <div className="case-studies-head fade-in">
        <p>Case studies</p>
        <h2>Recent builds shaped around real operational needs.</h2>
        <p className="case-studies-copy">
          Every engagement is designed to feel measurable, maintainable, and deeply aligned with the team using it.
        </p>
      </div>

      <div className="case-spotlight fade-in">
        <div className="spotlight-copy">
          <div className="brand-pill">Featured engagement</div>
          <h3>Northstar CRM</h3>
          <p>
            A field-first product experience that helped a growing team replace scattered coordination with a calm, focused workflow system.
          </p>
          <div className="metric-grid">
            <div className="metric-card">
              <strong>+38%</strong>
              <span>response efficiency</span>
            </div>
            <div className="metric-card">
              <strong>4 weeks</strong>
              <span>to first rollout</span>
            </div>
            <div className="metric-card">
              <strong>1 unified flow</strong>
              <span>for operations and field teams</span>
            </div>
          </div>
        </div>
        <div className="spotlight-visual">
          <div className="visual-orb" />
          <div className="visual-panel" />
          <div className="visual-bar" />
        </div>
      </div>

      <div className="case-study-grid">
        {caseStudies.map((study, index) => (
          <article className={`case-card fade-in case-card-${index + 1} card-raise`} key={study.title}>
            <div className="case-meta">
              <span>{study.category}</span>
              <strong>{study.outcome}</strong>
            </div>
            <h3>{study.title}</h3>
            <p>{study.summary}</p>
            
            {study.roiMetrics && (
              <div className="case-roi-metrics">
                {study.roiMetrics.map((metric, idx) => (
                  <div key={idx} className="roi-metric-item">
                    <span className="roi-metric-label">{metric.label}</span>
                    <strong className="roi-metric-value">{metric.value}</strong>
                  </div>
                ))}
              </div>
            )}
            
            <Link to={study.link} className="text-link">
              View service →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CaseStudies;
