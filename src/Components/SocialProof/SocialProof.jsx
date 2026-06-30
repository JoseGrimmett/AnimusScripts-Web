import React from "react";
import "./SocialProof.css";

const SocialProof = () => {
  const testimonials = [
    {
      quote: "Animus Scripts replaced our fragmented reporting with a single source of truth. Our operations team went from piecing together three Excel files to checking one dashboard. It's saved us hours every week.",
      author: "Director of Operations",
      company: "Manufacturing (200+ employees)",
      metric: "15+ hours/week saved",
    },
    {
      quote: "We were losing track of order status across systems. The automated workflow connects our intake form directly to Excel and Teams. Now everyone knows exactly what's pending and what's done.",
      author: "Head of Fulfillment",
      company: "B2B Services",
      metric: "60% fewer delays",
    },
    {
      quote: "Implementation was straightforward, and the team handled the training well. The best part is the system is actually maintainable—we can update it ourselves when we need small changes.",
      author: "IT Manager",
      company: "Mid-Market Operations",
      metric: "Self-sufficient team",
    },
  ];

  const stats = [
    { number: "50+", label: "Projects completed" },
    { number: "500+", label: "Hours saved annually (avg client)" },
    { number: "95%", label: "Client satisfaction" },
    { number: "5", label: "Years in operations" },
  ];

  return (
    <section className="social-proof">
      <div className="social-proof-header">
        <h2>Trusted by operations, finance, and manufacturing teams</h2>
        <p>Real results from real implementations</p>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((testimonial, idx) => (
          <div key={idx} className="testimonial-card">
            <p className="testimonial-quote">"{testimonial.quote}"</p>
            <div className="testimonial-author">
              <div className="author-avatar">{testimonial.author.charAt(0)}</div>
              <div className="author-info">
                <div className="author-name">{testimonial.author}</div>
                <div className="author-company">{testimonial.company}</div>
              </div>
            </div>
            <div className="testimonial-metric">{testimonial.metric}</div>
          </div>
        ))}
      </div>

      <div className="social-proof-stats">
        <h3>By the numbers</h3>
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="social-proof-cta">
        <h3>Ready to solve your operational bottleneck?</h3>
        <p>Let's talk about what reliable systems could mean for your team.</p>
        <a href="#contact" className="btn dark-btn">Book a call</a>
      </div>
    </section>
  );
};

export default SocialProof;
