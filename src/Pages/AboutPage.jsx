import React, { useEffect } from "react";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import { trackPageView } from "../utils/analytics";
import "./AboutPage.css";

const AboutPage = () => {
  useEffect(() => {
    trackPageView(window.location.pathname, "Animus Scripts - About");
  }, []);

  return (
    <div className="site-shell">
      <NavBar />
      <main className="container page-main">
        <section className="page-hero">
          <p className="section-kicker">About Animus Scripts</p>
          <h1>Software systems designed to make operations reliable.</h1>
          <p>
            Animus Scripts was built around a simple belief: businesses should not have to accept
            inefficient processes just because "that is how it has always been done."
          </p>
        </section>

        <section className="about-layout">
          <article className="about-panel card-raise">
            <h2>Founder focus</h2>
            <p>
              Animus Scripts is led by a computer science professional focused on practical
              business systems. The work centers on measurable process improvements, clear data
              ownership, and operational reliability.
            </p>
            <p>
              Engagements are designed to fit real business constraints: existing tools, current
              teams, and the need for maintainable systems that continue delivering value over
              time.
            </p>
          </article>

          <article className="about-panel card-raise">
            <h2>Experience areas</h2>
            <ul>
              <li>Business intelligence and operational reporting</li>
              <li>Workflow automation and process orchestration</li>
              <li>SQL architecture and ETL pipeline design</li>
              <li>SharePoint and Microsoft 365 systems</li>
              <li>Internal tools and systems integration</li>
              <li>Manufacturing and operations workflows</li>
            </ul>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
