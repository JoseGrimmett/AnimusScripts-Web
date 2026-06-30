import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar";
import Contact from "./Components/Contact/Contact";
import Footer from "./Components/Footer/Footer";
import {
  processSteps,
  problemAreas,
  projectSystems,
  serviceCatalog,
  technologyStack,
} from "./data/siteContent";
import { initAnalytics, trackPageView } from "./utils/analytics";
import "./App.css";

const App = () => {
  useEffect(() => {
    initAnalytics();
    trackPageView(window.location.pathname, "Animus Scripts - Home");
  }, []);

  return (
    <div className="site-shell">
      <NavBar />
      <main>
        <section className="home-hero" id="home">
          <div className="container home-hero-grid">
            <div>
              <p className="section-kicker">Operational Software Consultancy</p>
              <h1>
                Operational software, automation, and intelligence for growing businesses.
              </h1>
              <p className="hero-copy">
                Animus Scripts builds internal tools, workflow automations, reporting systems,
                and integrations that replace spreadsheets, manual handoffs, and disconnected
                data.
              </p>
              <div className="hero-actions">
                <Link to="/contact" className="btn dark-btn">
                  Build a Better Workflow
                </Link>
                <Link to="/what-we-build" className="btn ghost-btn">
                  View What We Build
                </Link>
              </div>
            </div>

            <div className="system-visual" aria-hidden="true">
              <div className="system-node node-intake">Intake</div>
              <div className="system-node node-routing">Routing</div>
              <div className="system-node node-data">Data Store</div>
              <div className="system-node node-report">Reporting</div>
              <div className="system-node node-alerts">Alerts</div>
              <div className="system-link link-a"></div>
              <div className="system-link link-b"></div>
              <div className="system-link link-c"></div>
              <div className="system-link link-d"></div>
              <div className="system-link link-e"></div>
            </div>
          </div>
        </section>

        <section className="home-section" id="problems">
          <div className="container">
            <div className="section-head">
              <p className="section-kicker">Problem Statement</p>
              <h2>Your business should not run on spreadsheets, inboxes, and tribal knowledge.</h2>
            </div>
            <div className="grid-six">
              {problemAreas.map((item) => (
                <article className="info-card card-raise" key={item}>
                  <h3>{item}</h3>
                </article>
              ))}
            </div>
            <p className="section-summary">
              Animus Scripts designs systems that make work visible, repeatable, and measurable.
            </p>
          </div>
        </section>

        <section className="home-section" id="services">
          <div className="container">
            <div className="section-head">
              <p className="section-kicker">Services</p>
              <h2>Practical delivery across workflow, data, and integration systems.</h2>
            </div>
            <div className="service-grid">
              {serviceCatalog.map((service) => (
                <article className="service-card card-raise" key={service.slug}>
                  <span className="service-icon">{service.icon}</span>
                  <h3>{service.title}</h3>
                  <p>{service.summary}</p>
                  <Link to={`/services/${service.slug}`} className="service-link">
                    View service details
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section" id="what-we-build">
          <div className="container">
            <div className="section-head">
              <p className="section-kicker">What We Build</p>
              <h2>Representative systems for operations, finance, and manufacturing teams.</h2>
            </div>
            <div className="project-grid-home">
              {projectSystems.slice(0, 4).map((project) => (
                <article className="project-card-home card-raise" key={project.title}>
                  <h3>{project.title}</h3>
                  <p>
                    <strong>Business problem:</strong> {project.problem}
                  </p>
                  <p>
                    <strong>System built:</strong> {project.system}
                  </p>
                  <p>
                    <strong>Operational outcome:</strong> {project.outcome}
                  </p>
                </article>
              ))}
            </div>
            <div className="section-actions">
              <Link to="/what-we-build" className="btn ghost-btn">
                See More Systems
              </Link>
            </div>
          </div>
        </section>

        <section className="home-section" id="process">
          <div className="container">
            <div className="section-head">
              <p className="section-kicker">Process</p>
              <h2>Simple delivery model designed for operational clarity.</h2>
            </div>
            <div className="process-grid">
              {processSteps.map((step, index) => (
                <article className="process-card card-raise" key={step.title}>
                  <span>{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section" id="technology">
          <div className="container">
            <div className="section-head">
              <p className="section-kicker">Technology</p>
              <h2>Platforms and tools we use to build reliable internal systems.</h2>
            </div>
            <div className="badge-grid">
              {technologyStack.map((tool) => (
                <span className="tech-badge" key={tool}>
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section final-cta" id="contact">
          <div className="container">
            <Contact />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default App;
