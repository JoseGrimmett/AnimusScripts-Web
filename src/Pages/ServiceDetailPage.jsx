import React, { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import { serviceCatalog } from "../data/siteContent";
import { trackPageView } from "../utils/analytics";
import "./ServiceDetailPage.css";

const ServiceDetailPage = () => {
  const { slug } = useParams();
  const service = serviceCatalog.find((item) => item.slug === slug);

  useEffect(() => {
    if (service) {
      trackPageView(window.location.pathname, `Animus Scripts - ${service.title}`);
    }
  }, [service]);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="site-shell">
      <NavBar />
      <main className="container detail-main">
        <section className="detail-hero">
          <Link to="/services" className="detail-back-link">
            Back to services
          </Link>
          <p className="section-kicker">Service Detail</p>
          <h1>{service.title}</h1>
          <p>{service.summary}</p>
        </section>

        <section className="detail-layout">
          <article className="detail-card card-raise">
            <h2>How this solves operational bottlenecks</h2>
            <p>{service.detailIntro}</p>
            <h3>Core capabilities</h3>
            <ul>
              {service.capabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="detail-card detail-card-accent card-raise">
            <h2>Operational outcomes</h2>
            <ul>
              {service.outcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="detail-actions">
              <Link to="/contact" className="btn dark-btn">
                Start a Conversation
              </Link>
              <Link to="/what-we-build" className="btn ghost-btn">
                View What We Build
              </Link>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
