import React, { useState } from "react";
import "./LeadCapture.css";
import { trackLeadCapture } from "../../utils/analytics";

const LeadCapture = ({ title = "Get your ROI calculation", subtitle = "See how much you could save", context = "homepage" }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;

    if (!endpoint) {
      const subject = encodeURIComponent("Lead capture from Animus Scripts");
      const body = encodeURIComponent(
        `Email: ${email}\nContext: ${context}`
      );
      window.location.href = `mailto:hello@animusscripts.com?subject=${subject}&body=${body}`;
      setStatus({
        type: "success",
        message: "Your email app is opening.",
      });
      setEmail("");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          source: `lead-capture-${context}`,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setEmail("");
      setStatus({
        type: "success",
        message: "Thanks! Check your email for your ROI calculation.",
      });
      
      // Track lead capture event
      trackLeadCapture(context, email);
      
      // Reset success message after 4 seconds
      setTimeout(() => setStatus({ type: "idle", message: "" }), 4000);
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lead-capture">
      <div className="lead-capture-content">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        
        <form onSubmit={handleSubmit} className="lead-capture-form">
          <div className="lead-capture-input-group">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="lead-capture-input"
            />
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="lead-capture-btn"
            >
              {isSubmitting ? "Sending..." : "Get ROI"}
            </button>
          </div>
          
          {status.message && (
            <div className={`lead-capture-status lead-capture-status-${status.type}`}>
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LeadCapture;
