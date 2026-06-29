import React from "react";
import "./DeliveryChecklist.css";

const deliverables = [
  "Data discovery and source-system mapping",
  "Automated data pipelines with error logging",
  "Dashboards, reports, or operational applications",
  "Knowledge transfer and team training",
  "Audit trails and data reconciliation checks",
  "Ongoing support and documentation",
];

const DeliveryChecklist = () => {
  return (
    <section className="delivery-checklist section-reveal">
      <div className="checklist-intro">
        <p className="brand-pill">What you receive</p>
        <h3>Every engagement includes clear deliverables and ongoing support.</h3>
      </div>
      <div className="checklist-grid">
        {deliverables.map((item) => (
          <div key={item} className="checklist-item card-raise">
            <div className="checkmark">✓</div>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DeliveryChecklist;
