import React, { useState } from "react";
import "./LeadCapture.css";
import { trackLeadCapture } from "../../utils/analytics";

const buildLeadMailto = (email, context) => {
  const subject = encodeURIComponent("Lead capture from Animus Scripts");
  const body = encodeURIComponent(`Email: ${email}\nContext: ${context}`);

  return `mailto:info@animusscripts.com?subject=${subject}&body=${body}`;
};

const LeadCapture = ({ title = "Get your ROI calculation", subtitle = "See how much you could save", context = "homepage" }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidationError = (message) => message === "Email is required";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const fallBackToEmail = () => {
      window.location.href = buildLeadMailto(email, context);
      setStatus({
        type: "success",
        message: "The intake service is unavailable right now. Your email app is opening.",
      });
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind: "lead",
          email: email,
          context,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.error || "Submission failed";

        if (response.status === 400 && isValidationError(message)) {
          throw new Error(message);
        }

        fallBackToEmail();
        return;
      }

      setEmail("");
      if (payload?.durable === false) {
        console.warn("[lead-capture] submission captured without durable production storage");
      }
      setStatus({
        type: "success",
        message: "Thanks. Your lead was captured and added to the intake system.",
      });
      
      // Track lead capture event
      trackLeadCapture(context, email);
      
      // Reset success message after 4 seconds
      setTimeout(() => setStatus({ type: "idle", message: "" }), 4000);
    } catch (error) {
      if (!isValidationError(error.message) || error.message === "Failed to store submission") {
        fallBackToEmail();
      } else {
        setStatus({
          type: "error",
          message: error.message || "Something went wrong. Please try again.",
        });
      }
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
