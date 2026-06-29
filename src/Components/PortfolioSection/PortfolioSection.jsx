import React from "react";
import { Link } from "react-router-dom";
import useScrollReveal from "../../hooks/useScrollReveal";
import portfolioVisual from "../../assets/portfolio-visual.svg";
import "./PortfolioSection.css";

const highlights = [
  {
    title: "Northstar CRM",
    summary: "A field-ready mobile workflow system designed to simplify operations and reduce friction.",
    link: "/services/mobile-products",
  },
  {
    title: "Atlas Operations",
    summary: "A web platform that brought reporting, approvals, and cross-team visibility into one clean experience.",
    link: "/services/web-platforms",
  },
  {
    title: "Helix Automations",
    summary: "A connected automation layer that eliminated repetitive admin work and strengthened team capacity.",
    link: "/services/it-automation",
  },
];

const PortfolioSection = () => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <section className={`portfolio-section section-reveal ${isVisible ? "is-visible" : ""}`} ref={ref}>
      <div className="portfolio-copy">
        <p>Selected portfolio</p>
        <h2>Work that feels like a product company, not a generic service shop.</h2>
        <p className="portfolio-text">
          Every engagement is shaped around product quality, operational clarity, and the confidence of a team that needs software to work beautifully under pressure.
        </p>
      </div>

      <div className="portfolio-grid">
        <div className="portfolio-visual-card">
          <img src={portfolioVisual} alt="Abstract product studio showcase" />
        </div>
        <div className="portfolio-cards">
          {highlights.map((item) => (
            <article className="portfolio-card card-raise" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <Link to={item.link} className="text-link">Read more →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
