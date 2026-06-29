import React, { useState } from "react";
import "./Contact.css";

const initialState = {
  name: "",
  email: "",
  projectType: "Data & Reporting",
  message: "",
};

const Contact = () => {
  const [formData, setFormData] = useState(initialState);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;

    if (!endpoint) {
      const subject = encodeURIComponent(`Project inquiry from ${formData.name || "website"}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nProject focus: ${formData.projectType}\n\n${formData.message}`
      );
      window.location.href = `mailto:hello@animusscripts.com?subject=${subject}&body=${body}`;
      setStatus({
        type: "success",
        message: "Your email app is opening with your brief ready to send.",
      });
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
          name: formData.name,
          email: formData.email,
          projectType: formData.projectType,
          message: formData.message,
          source: "animusscripts-site",
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setFormData(initialState);
      setStatus({
        type: "success",
        message: "Thanks for reaching out. Your message has been sent.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong on submit. Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="contact-col">
        <div className="brand-pill">Let's build it</div>
        <h3>Reliable systems that replace manual work and spreadsheet chaos.</h3>
        <p>
          If you're managing reporting bottlenecks, fragile workflows, disconnected data, or repetitive manual processes—let's talk about a practical system that scales with your team.
        </p>
        <div className="contact-highlights">
          <div>
            <strong>What to expect</strong>
            <span>A conversation about your current pain points, systems, and timeline for improvement.</span>
          </div>
          <div>
            <strong>Best fit</strong>
            <span>Manufacturing, operations, finance teams with SQL, Power BI, or Microsoft 365 environments.</span>
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
        <span>hello@animusscripts.com</span>
        <span className="contact-note">Response times are typically within 1–2 business days.</span>
      </div>

      <div className="form-panel">
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Your name" required />
          </label>
          <label>
            Email
            <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Project focus
            <select name="projectType" value={formData.projectType} onChange={handleChange}>
              <option value="Data & Reporting">Data & Reporting</option>
              <option value="Workflow Automation">Workflow Automation</option>
              <option value="Data Integration & ETL">Data Integration & ETL</option>
              <option value="Microsoft 365 Solutions">Microsoft 365 Solutions</option>
              <option value="Internal Application">Internal Application</option>
              <option value="Access & Directory">Access & Directory</option>
            </select>
          </label>
          <label>
            Project brief
            <textarea name="message" value={formData.message} onChange={handleChange} rows="5" placeholder="Tell me about the challenge, timeline, and goals." required></textarea>
          </label>
          <button type="submit" className="btn dark-btn" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Start the conversation"}
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
