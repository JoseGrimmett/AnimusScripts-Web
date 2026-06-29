import React from "react";
import { Link } from "react-router-dom";
import "./FeaturedWork.css";

const featured = [
  {
    title: "Business Intelligence & Reporting",
    description: "Power BI dashboards, KPI definitions, and SQL reporting layers for trusted operational metrics.",
    link: "/services/business-intelligence",
  },
  {
    title: "Data Integration & ETL",
    description: "Python pipelines and API ingestion with audit logging for observable, reliable data movement.",
    link: "/services/data-integration",
  },
  {
    title: "Workflow Automation",
    description: "Form processing, approval routing, and Teams notifications that replace manual handoffs.",
    link: "/services/workflow-automation",
  },
];

const FeaturedWork = () => {
  return (
    <section className="featured-work container section-reveal" id="featured-work">
      <div className="featured-head">
        <p>Core capabilities</p>
        <h2>Practical systems that turn operational data, workflows, and manual processes into reliable automation.</h2>
      </div>
      <div className="featured-grid">
        {featured.map((item) => (
          <article className="featured-card card-raise" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Link to={item.link} className="text-link">View this service →</Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedWork;
