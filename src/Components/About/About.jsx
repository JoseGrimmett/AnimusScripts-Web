import React from "react";
import "./About.css";
import aboutVisual from "../../assets/about-visual.svg";

const About = () => {
  return (
    <section className="about section-reveal" id="about">
      <div className="about-left">
        <img src={aboutVisual} alt="Abstract systems and data illustration" className="about-img" />
        <div className="about-badge">
          <span>Engineering-focused operations</span>
          <strong>Built for reliability</strong>
        </div>
      </div>
      <div className="about-right">
        <h3>About Animus Scripts</h3>
        <h2>Reliable internal systems built for manufacturing, operations, and finance teams.</h2>
        <p>
          Animus Scripts specializes in replacing manual reporting, disconnected workflows, and spreadsheet chaos with practical, auditable internal systems. We work with manufacturing plants, operations teams, finance departments, and organizations that depend on SQL, Power BI, Microsoft 365, and ERP systems to run their business.
        </p>
        <p>
          Every system includes data quality checks, audit logging, error recovery, and documentation so your team understands what happened, why it happened, and how to fix it when something goes wrong.
        </p>
        <div className="about-points">
          <span>Observable automation</span>
          <span>Central data architecture</span>
          <span>Long-term maintainability</span>
          <span>Knowledge transfer</span>
        </div>
        <div className="about-capabilities">
          <div>
            <h4>Technical depth</h4>
            <p>Python, SQL, Power BI, Power Apps, Microsoft Graph, SharePoint, and deep integration experience.</p>
          </div>
          <div>
            <h4>What we build</h4>
            <p>Data pipelines, reporting systems, workflow automation, role-based access, and operational applications.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;