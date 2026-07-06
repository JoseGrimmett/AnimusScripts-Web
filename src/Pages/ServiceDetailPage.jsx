import React, { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { animate, stagger } from "animejs";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import { serviceCatalog } from "../data/siteContent";
import { trackPageView } from "../utils/analytics";
import useAnimeReveal from "../hooks/useAnimeReveal";
import "./ServiceDetailPage.css";

const ServiceDetailPage = () => {
  const { slug } = useParams();
  const service = serviceCatalog.find((item) => item.slug === slug);
  const backLinkRef = useRef(null);
  const kickerRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroCopyRef = useRef(null);
  const layoutRef = useRef(null);

  useEffect(() => {
    if (service) {
      trackPageView(window.location.pathname, `Animus Scripts - ${service.title}`);
    }
  }, [service]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroNodes = [backLinkRef.current, kickerRef.current, heroTitleRef.current, heroCopyRef.current].filter(Boolean);

    if (prefersReducedMotion) {
      heroNodes.forEach((node) => {
        node.style.opacity = "1";
        node.style.transform = "none";
      });
      return undefined;
    }

    animate(heroNodes, {
      opacity: [0, 1],
      y: [20, 0],
      delay: stagger(110),
      duration: 720,
      ease: "outCubic",
    });

    return undefined;
  }, [service]);

  useAnimeReveal(layoutRef, ".reveal-item", { delayStep: 95, initialOffset: 20, duration: 720 });

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="site-shell">
      <NavBar />
      <main className="container detail-main">
        <section className="detail-hero">
          <Link to="/services" className="detail-back-link" ref={backLinkRef}>
            Back to services
          </Link>
          <p className="section-kicker" ref={kickerRef}>Service Detail</p>
          <h1 ref={heroTitleRef}>{service.title}</h1>
          <p ref={heroCopyRef}>{service.summary}</p>
        </section>

        <section className="detail-layout" ref={layoutRef}>
          <article className="detail-card card-raise reveal-item">
            <h2>How this solves operational bottlenecks</h2>
            <p>{service.detailIntro}</p>
            <h3>Core capabilities</h3>
            <ul>
              {service.capabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="detail-card detail-card-accent card-raise reveal-item">
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
