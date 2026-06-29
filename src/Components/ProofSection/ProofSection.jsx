import React from "react";
import "./ProofSection.css";

const highlights = [
  {
    value: "Observable automation",
    label: "Every system includes logging, error handling, and recovery so you know what happened.",
  },
  {
    value: "Central source of truth",
    label: "Reconciled data, consistent definitions, and verified reporting across the organization.",
  },
  {
    value: "Built for your stack",
    label: "SQL, Power BI, Teams, SharePoint, and integrations with the systems you already use.",
  },
];

const outcomes = [
  "Manual reporting and spreadsheet chaos replaced with trusted dashboards",
  "Fragile workflows automated with audit trails and error recovery",
  "Centralized data that scales with the business without technical debt",
];

const ProofSection = () => {
  return (
    <section className="proof-section section-reveal" id="proof">
      <div className="proof-intro">
        <p>Proof and process</p>
        <h2>Practical systems built to be reliable, auditable, and maintainable.</h2>
        <p className="proof-copy">
          The goal is not just to automate work. It is to create systems your team can trust, understand, and improve over time.
        </p>
      </div>

      <div className="proof-grid">
        {highlights.map((item) => (
          <article className="proof-card card-raise" key={item.value}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>

      <div className="proof-outcomes">
        <div className="proof-outcomes-card card-raise">
          <h3>What clients value most</h3>
          <ul>
            {outcomes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="proof-outcomes-card accent-card card-raise">
          <h3>Best fit for</h3>
          <p>Manufacturing, operations, finance, and supply-chain teams that depend on SQL, Power BI, Microsoft 365, or legacy ERP systems.</p>
        </div>
      </div>

      <div className="proof-cta card-raise">
        <p>Need a partner who can turn an idea into a dependable product experience?</p>
        <a href="#contact" className="btn dark-btn">Start the conversation</a>
      </div>

      <div className="testimonial-row">
        <article className="testimonial-card card-raise">
          <p>“The process felt calm and strategic, and the result gave our team something easier to use every day.”</p>
          <strong>— Founder, operations-focused product team</strong>
        </article>
        <article className="testimonial-card card-raise">
          <p>“It felt like someone understood the workflow, not just the code.”</p>
          <strong>— Team lead, growing service business</strong>
        </article>
      </div>
    </section>
  );
};

export default ProofSection;
