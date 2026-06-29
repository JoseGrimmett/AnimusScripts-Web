import React from "react";
import { Link } from "react-router-dom";
import "./Programs.css";

const services = [
  {
    title: "Business Intelligence & Reporting",
    description: "Power BI dashboards, SQL reporting layers, KPI definitions, and trusted operational metrics.",
    slug: "business-intelligence",
  },
  {
    title: "Data Integration & ETL",
    description: "Python pipelines, API ingestion, scheduled data loading, and audit logging for reliable automation.",
    slug: "data-integration",
  },
  {
    title: "Workflow Automation",
    description: "Form processing, approval routing, Teams notifications, and automated tracking without fragile scripts.",
    slug: "workflow-automation",
  },
  {
    title: "Microsoft 365 & SharePoint",
    description: "Power Apps, role-based access, centralized data architecture, and governance-ready systems.",
    slug: "microsoft-365",
  },
  {
    title: "Internal Business Applications",
    description: "SQL-backed tools for operations, purchasing, quality, shipment, and ERP extensions.",
    slug: "internal-applications",
  },
  {
    title: "Active Directory & Access Strategy",
    description: "Role-based group design, distribution structures, and permission governance for organization and security.",
    slug: "active-directory",
  },
];

const Programs = () => {
  return (
    <div className="programs" id="program">
      {services.map((service, index) => (
        <article className="program card-raise" key={service.title}>
          <div className={`program-visual program-visual-${index + 1}`}>
            <div className="program-ring" />
            <div className="program-line" />
            <div className="program-dot" />
          </div>
          <div className="program-content">
            <div className="program-pill">Internal systems</div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="program-footer">
              <span>Reliable · Auditable · Scalable</span>
              <Link to={`/services/${service.slug}`} className="service-link">
                Learn more
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default Programs;
