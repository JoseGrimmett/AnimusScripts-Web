import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import { projectSystems } from "../data/siteContent";
import "./WhatWeBuildPage.css";

const WhatWeBuildPage = () => {
  return (
    <div className="site-shell">
      <NavBar />
      <main className="container page-main">
        <section className="page-hero">
          <p className="section-kicker">Representative Systems</p>
          <h1>Operational systems built to replace manual processes.</h1>
          <p>
            These examples represent the types of systems Animus Scripts delivers for operations,
            manufacturing, finance, and IT teams.
          </p>
        </section>

        <section className="project-grid" aria-label="Representative project systems">
          {projectSystems.map((project) => (
            <article className="project-card card-raise" key={project.title}>
              <h2>{project.title}</h2>
              <div>
                <h3>Business problem</h3>
                <p>{project.problem}</p>
              </div>
              <div>
                <h3>System built</h3>
                <p>{project.system}</p>
              </div>
              <div>
                <h3>Operational outcome</h3>
                <p>{project.outcome}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="page-cta card-raise">
          <h2>Need this level of workflow reliability in your environment?</h2>
          <p>
            Let's map your current process and define the right system architecture for your
            team.
          </p>
          <div className="page-cta-actions">
            <Link to="/contact" className="btn dark-btn">
              Start a Conversation
            </Link>
            <Link to="/services" className="btn ghost-btn">
              Review Services
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WhatWeBuildPage;
