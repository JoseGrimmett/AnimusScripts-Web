import React from "react";
import { Link } from "react-router-dom";
import "./ServicesIndexPage.css";
import ASLogo from "../assets/AnimusSciptsLogo.png";

const services = [
  {
    slug: "mobile-products",
    title: "Mobile Products",
    summary: "Product-minded mobile apps for field teams, client portals, and customer-facing operations.",
    highlights: ["Native and cross-platform delivery", "Reliable offline workflows", "Design systems and polished UX"],
  },
  {
    slug: "web-platforms",
    title: "Web Platforms",
    summary: "Modern web experiences that support business operations, internal tools, and growth initiatives.",
    highlights: ["Scalable dashboards", "Secure user roles", "API and data integration"],
  },
  {
    slug: "it-automation",
    title: "IT Automation & Data Systems",
    summary: "Automation, integrations, and data workflows that reduce manual work and improve visibility.",
    highlights: ["Workflow automation", "Reporting and analytics", "System modernization"],
  },
];

const ServicesIndexPage = () => {
  return (
    <div className="services-page">
      <header className="services-hero">
        <div className="container">
          <div className="services-brand">
            <img src={ASLogo} alt="Animus Scripts logo" />
            <div>
              <p>Animus Scripts</p>
              <span>Product engineering services</span>
            </div>
          </div>
          <h1>Focused solutions for the tools your business relies on every day.</h1>
          <p>
            Each engagement is designed to turn complex operations into a calm, dependable digital experience that feels premium from the first click.
          </p>
          <div className="services-actions">
            <Link to="/" className="btn dark-btn">Back to home</Link>
            <a href="#services-list" className="btn ghost-btn">Explore services</a>
          </div>
        </div>
      </header>

      <main className="container services-list" id="services-list">
        {services.map((service) => (
          <article className="service-card card-raise" key={service.slug}>
            <div className="service-card-top">
              <h2>{service.title}</h2>
              <p>{service.summary}</p>
            </div>
            <ul>
              {service.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to={`/services/${service.slug}`} className="service-link">
              View details →
            </Link>
          </article>
        ))}
      </main>

      <section className="container services-conversion">
        <div className="services-conversion-card">
          <div>
            <p className="detail-eyebrow">Next step</p>
            <h3>Ready to turn your idea into a product experience people trust?</h3>
          </div>
          <div className="services-actions">
            <Link to="/" className="btn dark-btn">Return home</Link>
            <a href="#contact" className="btn ghost-btn">Book a discovery call</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesIndexPage;
