import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { animate, stagger } from "animejs";
import "./PricingPage.css";
import ROICalculator from "../Components/ROICalculator/ROICalculator";
import PricingComparison from "../Components/PricingComparison/PricingComparison";
import LeadCapture from "../Components/LeadCapture/LeadCapture";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import useAnimeReveal from "../hooks/useAnimeReveal";

const pricingTiers = [
  {
    name: "Discovery",
    description: "Right-sizing & planning",
    price: "3–5K",
    duration: "1-2 weeks",
    highlights: [
      "Workflow audit & current state mapping",
      "Feasibility assessment",
      "Solution design & timeline",
      "Scope & ROI estimate",
      "Resource requirements",
      "Risk assessment",
    ],
    details: [
      "Ideal for: Teams evaluating automation potential",
      "Deliverable: Detailed proposal + architecture doc",
      "Best for: Proving ROI before committing",
    ],
    cta: "Schedule a discovery call",
    isPrimary: false,
  },
  {
    name: "Core Implementation",
    description: "End-to-end delivery",
    price: "18–35K",
    duration: "4-8 weeks",
    highlights: [
      "Full system design & architecture",
      "Development & integration",
      "Data migration & validation",
      "Team training & documentation",
      "Handoff & support",
      "Post-launch optimization",
    ],
    details: [
      "Typical scope: 1 data pipeline + 1 dashboard OR 1 workflow automation",
      "Team size: 2-4 FTE weeks",
      "Includes: Audit logging, error handling, testing",
      "Post-launch: 30 days of included support",
    ],
    cta: "Get a custom quote",
    isPrimary: true,
  },
  {
    name: "Ongoing Partnership",
    description: "Support & growth",
    price: "2–5K/mo",
    duration: "Month-to-month",
    highlights: [
      "Quarterly system reviews",
      "Priority bug fixes & updates",
      "New integrations & workflows",
      "Performance optimization",
      "Knowledge transfer & mentoring",
      "Capacity for new projects",
    ],
    details: [
      "Includes: 8-12 hours/month of engineering",
      "Optional: Retainer for guaranteed capacity",
      "Great for: Scaling automation beyond initial scope",
      "Typical: 2-3 new initiatives/year",
    ],
    cta: "Discuss a retainer model",
    isPrimary: false,
  },
];

const engagementModels = [
  {
    title: "Project-Based",
    description: "Fixed scope, fixed timeline. Best for well-defined problems.",
    pros: [
      "Clear budget & timeline",
      "Defined scope upfront",
      "Single deliverable",
    ],
    cons: ["Scope creep requires change orders", "Less flexibility for exploration"],
    typical: "$18–50K per project",
  },
  {
    title: "Retainer",
    description: "Reserved capacity for ongoing work. Best for scaling automation.",
    pros: ["Faster response time", "Continuous improvements", "Lower per-project cost"],
    cons: ["Monthly commitment", "Requires planning ahead"],
    typical: "$4–8K/month",
  },
  {
    title: "Staff Augmentation",
    description: "Dedicated engineer on your team. Best for large initiatives.",
    pros: ["Deep context on your systems", "Works within your team", "Scalable"],
    cons: ["Higher monthly cost", "Less beneficial for small projects"],
    typical: "$6–12K/month per engineer",
  },
];

const faqs = [
  {
    q: "How long does a typical project take?",
    a: "Most core implementations take 4–8 weeks depending on complexity and integrations. Discovery phase is 1–2 weeks. We can accelerate with more concurrent work or use existing templates.",
  },
  {
    q: "What's included in the price?",
    a: "Design, development, testing, data migration, training, and handoff documentation. It does NOT include your data cleanup, stakeholder alignment, or post-launch feature requests (those are change orders).",
  },
  {
    q: "Can you work with our existing systems?",
    a: "Yes. We integrate with any SQL-accessible database, APIs, Power BI, SharePoint, Teams, and most ERP systems. Custom integrations (non-standard APIs) may add time/cost.",
  },
  {
    q: "What if we have legacy systems or custom databases?",
    a: "That's our specialty. We can usually connect if the data is queryable. We'll assess during discovery and adjust timeline accordingly.",
  },
  {
    q: "Do you charge for revisions or changes?",
    a: "Included: 1 round of refinement post-launch. Additional changes are hourly ($150/hr) or bundled into a retainer.",
  },
  {
    q: "What happens after launch?",
    a: "You own the system. We hand off all code, docs, and architecture. Optional retainer keeps us available for enhancements, integrations, and support.",
  },
];

const PricingPage = () => {
  const heroTitleRef = useRef(null);
  const heroCopyRef = useRef(null);
  const pricingSectionRef = useRef(null);
  const engagementSectionRef = useRef(null);
  const comparisonSectionRef = useRef(null);
  const roiSectionRef = useRef(null);
  const faqSectionRef = useRef(null);
  const leadSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);
  const [expandedFaq, setExpandedFaq] = React.useState(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroNodes = [heroTitleRef.current, heroCopyRef.current].filter(Boolean);

    if (prefersReducedMotion) {
      heroNodes.forEach((node) => {
        node.style.opacity = "1";
        node.style.transform = "none";
      });
      return undefined;
    }

    animate(heroNodes, {
      opacity: [0, 1],
      y: [22, 0],
      delay: stagger(120),
      duration: 760,
      ease: "outCubic",
    });

    return undefined;
  }, []);

  useAnimeReveal(pricingSectionRef, ".reveal-item", { delayStep: 90, initialOffset: 24 });
  useAnimeReveal(engagementSectionRef, ".reveal-item", { delayStep: 95, initialOffset: 22 });
  useAnimeReveal(comparisonSectionRef, ".reveal-item", { delayStep: 40, initialOffset: 12, duration: 620 });
  useAnimeReveal(roiSectionRef, ".reveal-item", { delayStep: 40, initialOffset: 12, duration: 620 });
  useAnimeReveal(faqSectionRef, ".reveal-item", { delayStep: 75, initialOffset: 18 });
  useAnimeReveal(leadSectionRef, ".reveal-item", { delayStep: 40, initialOffset: 14, duration: 640 });
  useAnimeReveal(ctaSectionRef, ".reveal-item", { delayStep: 40, initialOffset: 14, duration: 640 });

  return (
    <div>
      <NavBar />

      {/* Hero */}
      <section className="pricing-hero">
        <div className="container">
          <div className="pricing-hero-content">
            <h1 ref={heroTitleRef}>Transparent pricing for practical systems</h1>
            <p ref={heroCopyRef}>
              Fixed-price discovery, project-based implementation, or ongoing support. Choose the model that fits your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="pricing-tiers" id="pricing-tiers" ref={pricingSectionRef}>
        <div className="container">
          <div className="pricing-intro reveal-item">
            <h2>Engagement models</h2>
            <p>Start with discovery. Scale with implementation. Sustain with partnership.</p>
          </div>

          <div className="pricing-grid">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`pricing-card ${tier.isPrimary ? "is-primary" : ""} card-raise reveal-item`}
              >
                <div className="pricing-card-header">
                  <h3>{tier.name}</h3>
                  <p className="pricing-desc">{tier.description}</p>
                </div>

                <div className="pricing-price">
                  <span className="pricing-amount">{tier.price}</span>
                  <span className="pricing-duration">{tier.duration}</span>
                </div>

                <ul className="pricing-highlights">
                  {tier.highlights.map((h, i) => (
                    <li key={i}>
                      <span className="pricing-check">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="pricing-details">
                  {tier.details.map((d, i) => (
                    <p key={i}>{d}</p>
                  ))}
                </div>

                <Link to="/contact" className={`btn ${tier.isPrimary ? "dark-btn" : "ghost-btn"}`}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Models */}
      <section className="engagement-models" ref={engagementSectionRef}>
        <div className="container">
          <div className="engagement-header reveal-item">
            <h2>Choose your engagement model</h2>
            <p>We work the way that works best for you</p>
          </div>

          <div className="engagement-grid">
            {engagementModels.map((model, idx) => (
              <div key={idx} className="engagement-card card-raise reveal-item">
                <h3>{model.title}</h3>
                <p className="engagement-desc">{model.description}</p>

                <div className="engagement-section">
                  <h4>Advantages</h4>
                  <ul className="engagement-list">
                    {model.pros.map((pro, i) => (
                      <li key={i}>
                        <span className="engagement-check">+</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="engagement-section">
                  <h4>Considerations</h4>
                  <ul className="engagement-list">
                    {model.cons.map((con, i) => (
                      <li key={i}>
                        <span className="engagement-con">-</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="engagement-typical">{model.typical}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="pricing-comparison-section" ref={comparisonSectionRef}>
        <div className="container reveal-item">
          <PricingComparison />
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="pricing-roi" ref={roiSectionRef}>
        <div className="container reveal-item">
          <ROICalculator />
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-faq" ref={faqSectionRef}>
        <div className="container">
          <div className="faq-header reveal-item">
            <h2>Questions?</h2>
            <p>We've answered the most common ones</p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item card-raise reveal-item ${expandedFaq === idx ? "is-expanded" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <span className="faq-toggle">+</span>
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture */}
      <section className="pricing-lead-capture" ref={leadSectionRef}>
        <div className="container reveal-item">
          <div className="lead-capture-wrapper">
            <LeadCapture 
              title="Get your personalized ROI calculation"
              subtitle="See potential savings based on your team and workflows"
              context="pricing-page"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pricing-cta" ref={ctaSectionRef}>
        <div className="container">
          <div className="pricing-cta-card card-raise reveal-item">
            <h2>Ready to talk about your specific needs?</h2>
            <p>We'll customize a proposal based on your timeline, team size, and budget.</p>
            <div className="pricing-cta-actions">
              <Link to="/contact" className="btn dark-btn">
                Schedule a discovery call
              </Link>
              <a href="mailto:info@animusscripts.com" className="btn ghost-btn">
                Or email us directly
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
