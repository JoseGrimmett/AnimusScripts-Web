import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import { serviceCatalog } from "../data/siteContent";
import "./ServicesIndexPage.css";

const ServicesIndexPage = () => {
  return (
    <div className="site-shell">
      <NavBar />
      <main className="container page-main">
        <section className="page-hero">
          <p className="section-kicker">Services</p>
          <h1>Operational software and intelligence systems built for reliability.</h1>
          <p>
            We help businesses replace manual handoffs, disconnected data, and process ambiguity
            with software systems that keep operations visible and measurable.
          </p>
        </section>

        <section className="services-list-grid" aria-label="Service offerings">
          {serviceCatalog.map((service) => (
            <article className="service-index-card card-raise" key={service.slug}>
              <span className="service-pill">{service.icon}</span>
              <h2>{service.title}</h2>
              <p>{service.summary}</p>
              <Link to={`/services/${service.slug}`} className="service-link">
                Review service details
              </Link>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServicesIndexPage;
