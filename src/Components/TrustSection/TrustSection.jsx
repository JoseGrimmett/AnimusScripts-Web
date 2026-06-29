import React from "react";
import "./TrustSection.css";

const testimonials = [
  {
    quote: "We replaced three separate Excel reports with one reliable dashboard. The whole team trusts the data now.",
    author: "Finance lead, manufacturing company",
  },
  {
    quote: "The system has built-in logging so when something fails, we can see exactly what happened and fix it. No more silent errors.",
    author: "Operations manager, supply chain team",
  },
];

const engagementPhases = [
  {
    title: "Map current state",
    detail: "Review data sources, workflows, pain points, and the systems you already depend on.",
    label: "Week 1",
  },
  {
    title: "Design the solution",
    detail: "Plan the data model, automation logic, error handling, and how teams will use the new system.",
    label: "Week 2–3",
  },
  {
    title: "Build & document",
    detail: "Implement, test, train your team, and hand off ownership with clear documentation and support.",
    label: "Weeks 4–ongoing",
  },
];

const credibilityPoints = [
  "Observable automation with audit logging",
  "Error handling and recovery built in",
  "Knowledge transfer and documentation",
  "Practical systems for the tools you use",
];

const TrustSection = () => {
  return (
    <section className="trust-section section-reveal">
      <div className="trust-social-proof">
        <div className="trust-intro">
          <p className="brand-pill">Social proof</p>
          <h2>Trusted by teams managing data, operations, and workflows at scale.</h2>
          <p>
            The work is designed to replace spreadsheet chaos, manual processes, and silent failures with observable, maintainable systems.
          </p>
        </div>
        <div className="testimonial-stack">
          {testimonials.map((item) => (
            <article className="testimonial-card card-raise" key={item.author}>
              <p>“{item.quote}”</p>
              <strong>{item.author}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="engagement-section">
        <div className="engagement-intro">
          <p className="brand-pill">What it looks like</p>
          <h3>A focused engagement shaped around your data, workflows, and team.</h3>
        </div>
        <div className="engagement-grid">
          {engagementPhases.map((phase) => (
            <article className="engagement-card card-raise" key={phase.title}>
              <span>{phase.label}</span>
              <h4>{phase.title}</h4>
              <p>{phase.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="credibility-strip">
        {credibilityPoints.map((point) => (
          <div key={point} className="credibility-pill">
            {point}
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustSection;
