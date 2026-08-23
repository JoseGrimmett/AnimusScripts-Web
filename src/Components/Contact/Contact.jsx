import React, { useState } from "react";
import "./Contact.css";
import { trackCTAClick } from "../../utils/analytics";

const initialState = {
  name: "",
  company: "",
  email: "",
  processNeedsImprovement: "",
  currentTools: "",
  timeline: "",
};

const buildContactMailto = (formData) => {
  const subject = encodeURIComponent(`Project inquiry from ${formData.name || "website"}`);
  const body = encodeURIComponent(
    `Name: ${formData.name}\nCompany: ${formData.company}\nEmail: ${formData.email}\n\nProcess to improve:\n${formData.processNeedsImprovement}\n\nCurrent tools:\n${formData.currentTools}\n\nTimeline: ${formData.timeline || "Not specified"}`,
  );

  return `mailto:info@animusscripts.com?subject=${subject}&body=${body}`;
};

const Contact = ({
  sectionId = "contact",
  title = "Have a process held together by spreadsheets, emails, or manual work?",
  subtitle = "Let's map the workflow and build a system that saves time, improves visibility, and scales with your business.",
}) => {
  const [formData, setFormData] = useState(initialState);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fallBackToEmail = () => {
    window.location.href = buildContactMailto(formData);
    setStatus({
      type: "success",
      message: "The intake service is unavailable right now. Your email app is opening instead.",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "Sending..." });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind: "contact",
          name: formData.name,
          company: formData.company,
          email: formData.email,
          processNeedsImprovement: formData.processNeedsImprovement,
          currentTools: formData.currentTools,
          timeline: formData.timeline,
          source: "animusscripts-site",
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Submission failed");
      }

      setFormData(initialState);
      if (payload?.durable === false) {
        console.warn("[contact-form] submission captured without durable production storage");
      }
      trackCTAClick("contact_form_success", "contact_section");
      setStatus({
        type: "success",
        message: "Thanks for reaching out. Your message has been captured.",
      });
    } catch (error) {
      if (error.message === "Failed to fetch" || error.message === "Submission failed" || error.message === "Failed to store submission") {
        fallBackToEmail();
      } else {
        setStatus({
          type: "error",
          message: error.message || "Something went wrong on submit. Please try again in a moment.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact" id={sectionId}>
      <div className="contact-col">
        <div className="brand-pill">Start a conversation</div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <div className="contact-highlights">
          <div>
            <strong>What to expect</strong>
            <span>A practical discussion about bottlenecks, systems, and how work should flow.</span>
          </div>
          <div>
            <strong>Best fit</strong>
            <span>Operations, manufacturing, finance, and IT teams managing critical internal workflows.</span>
          </div>
        </div>
        <div className="contact-steps">
          <div>
            <strong>01</strong>
            <span>We map your current data flow and identify bottlenecks or failures.</span>
          </div>
          <div>
            <strong>02</strong>
            <span>We design a practical system with clear ownership and audit trails.</span>
          </div>
          <div>
            <strong>03</strong>
            <span>We deliver and document the solution so your team owns it going forward.</span>
          </div>
        </div>
        <span>info@animusscripts.com</span>
        <span className="contact-note">Response times are typically within 1–2 business days.</span>
      </div>

      <div className="form-panel">
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Your name" required />
          </label>
          <label>
            Company
            <input
              name="company"
              value={formData.company}
              onChange={handleChange}
              type="text"
              placeholder="Company name"
              required
            />
          </label>
          <label>
            Email
            <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="you@example.com" required />
          </label>
          <label>
            What process needs improvement?
            <textarea
              name="processNeedsImprovement"
              value={formData.processNeedsImprovement}
              onChange={handleChange}
              rows="3"
              placeholder="Describe the workflow, bottleneck, or manual process that needs to improve."
              required
            ></textarea>
          </label>
          <label>
            Current tools or systems involved
            <textarea
              name="currentTools"
              value={formData.currentTools}
              onChange={handleChange}
              rows="3"
              placeholder="For example: Excel, SharePoint, SQL Server, Power BI, ERP, Teams, Jotform."
              required
            ></textarea>
          </label>
          <label>
            Optional project timeline
            <input
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              type="text"
              placeholder="For example: this quarter, next 60 days, exploratory"
            />
          </label>
          <button type="submit" className="btn dark-btn" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Start a Conversation"}
          </button>
          {status.message ? (
            <p className={`contact-status ${status.type}`}>{status.message}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
};

export default Contact;
