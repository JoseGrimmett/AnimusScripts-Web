import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import "./ServiceDetailPage.css";
import ASLogo from "../assets/AnimusSciptsLogo.png";

const serviceData = {
  "business-intelligence": {
    title: "Business Intelligence & Reporting",
    summary: "Power BI dashboards, KPI definitions, and SQL reporting layers that turn operational data into trusted metrics.",
    intro: "Manufacturing, operations, and finance teams rely on data to make decisions. We design reporting systems that consolidate disconnected data sources into a single source of truth.",
    bullets: [
      "Power BI dashboards and semantic models with DAX KPIs",
      "SQL Server and MySQL reporting layers",
      "Data modeling for operations, finance, production, purchasing, and quality",
      "Performance tuning, refresh automation, and data-quality checks",
    ],
    caseStudy: {
      title: "Case study: Operational reporting system",
      text: "A manufacturing plant replaced three Excel reports with a centralized Power BI dashboard that reconciles production, purchasing, and shipment data. The operations team now has real-time visibility into delivery performance, quality metrics, and production efficiency.",
    },
    process: ["Data discovery and source mapping", "Data model design and KPI definition", "Dashboard development and validation"],
    outcomes: ["Consistent source of truth across the organization", "Faster decision making with real-time metrics", "Reduced manual reporting overhead"],
  },
  "data-integration": {
    title: "Data Integration & ETL",
    summary: "Python-based pipelines and API ingestion that move data reliably between systems with audit logging.",
    intro: "Data integration is only as good as its error handling. We build pipelines that include logging, duplicate prevention, incremental loading, and recovery so you know exactly what happened and why.",
    bullets: [
      "Python ETL development with error handling and audit logging",
      "API ingestion from Jotform, Microsoft 365, SharePoint, Teams, and ERP systems",
      "SQL Server and MySQL database architecture for reporting and automation",
      "Docker and Airflow scheduling for reliable, observable data flows",
    ],
    caseStudy: {
      title: "Case study: Reliable form-to-database pipeline",
      text: "A business replaced a fragile Zapier-based workflow with a Python pipeline that ingests Jotform submissions, validates data, logs exceptions, and routes records to Excel trackers and Teams channels. Processing logs show exactly what succeeded or failed, making troubleshooting immediate.",
    },
    process: ["Source system audit and integration mapping", "Pipeline design with error recovery", "Testing, scheduling, and monitoring setup"],
    outcomes: ["Automated data flow with full observability", "Reduced failed integrations and silent data loss", "Audit trail for compliance and troubleshooting"],
  },
  "workflow-automation": {
    title: "Workflow Automation",
    summary: "Form processing, approval routing, and notifications that replace manual handoffs with structured, auditable workflows.",
    intro: "Manual workflows are slow and error-prone. We build automation that includes routing logic, database storage, notifications, and tracking so every step is visible and recoverable.",
    bullets: [
      "Form-to-database and form-to-Excel automation",
      "Dynamic routing based on location, business unit, or form response",
      "Teams and email notifications for approvals and alerts",
      "Submission tracking with processing logs and duplicate prevention",
    ],
    caseStudy: {
      title: "Case study: RFQ and approval routing",
      text: "A manufacturing company automated their request-for-quote process with form-based intake, role-based routing to the right approver, Teams notifications, and automated Excel tracker updates. The system includes a processing log so administrators can see which requests succeeded, which are pending, and which failed with actionable errors.",
    },
    process: ["Workflow mapping and approval logic design", "Form intake and routing setup", "Notification and tracking configuration"],
    outcomes: ["Faster approval cycles", "Reduced manual data entry and tracking", "Full audit trail of all workflow steps"],
  },
  "microsoft-365": {
    title: "Microsoft 365 & SharePoint Solutions",
    summary: "Power Apps, SharePoint lists, and Teams integrations that give teams a clean interface without learning a new platform.",
    intro: "Microsoft 365 is powerful, but many teams don't use it strategically. We help design SharePoint systems, Power Apps, and automation that fit your actual workflows.",
    bullets: [
      "Power Apps Canvas applications with role-based access",
      "SharePoint list architecture and filtered views for departments",
      "Power Automate workflows and Microsoft Graph integrations",
      "Power BI embedding and centralized governance",
    ],
    caseStudy: {
      title: "Case study: Operational tracking in SharePoint",
      text: "A business built a SharePoint-centered system for rush orders, quality issues, and operational requests. Each business unit sees only their data through role-based views. A Power App provides a clean form interface, and automation routes approvals to Teams. Leadership has a Power BI dashboard aggregating all data.",
    },
    process: ["Current systems audit and workflow assessment", "SharePoint and Power App design", "Role-based access and automation setup"],
    outcomes: ["Centralized data with departmental access control", "Cleaner team experience without new training", "Governance and compliance built in"],
  },
  "internal-applications": {
    title: "Internal Business Applications",
    summary: "SQL-backed tools for operations, purchasing, quality, shipment, and ERP extensions.",
    intro: "Not every workflow fits into a spreadsheet or existing ERP screen. We build lightweight internal applications that solve specific operational problems without requiring a full platform replacement.",
    bullets: [
      "Mobile-friendly and web-based internal applications",
      "SQL and MySQL integration with existing operational systems",
      "Role-based CRUD interfaces for reviewing and updating data",
      "Read-only dashboards and controlled workflow tools",
    ],
    caseStudy: {
      title: "Case study: Production workflow tool",
      text: "A manufacturing plant built a simple internal app for reviewing production orders, capturing quality data, and updating shipment status. The app reads from the ERP database and logs user updates separately, allowing the team to move faster without disrupting core system integrity.",
    },
    process: ["Workflow and data requirements gathering", "Database schema and interface design", "Development, testing, and team training"],
    outcomes: ["Faster operational workflows", "Reduced manual system navigation", "Preserved ERP system integrity"],
  },
  "active-directory": {
    title: "Active Directory & Access Strategy",
    summary: "Role-based group design and distribution lists that make access management and communications easier.",
    intro: "Managing access and communications individually is tedious and error-prone. We help design Active Directory structures around organizational roles so access scales with your business.",
    bullets: [
      "Business-unit, plant, department, and role-based security groups",
      "Distribution list design for targeted communications",
      "Group documentation and naming standards",
      "SharePoint, Power BI, Teams, and application permission mapping",
    ],
    caseStudy: {
      title: "Case study: Operational reporting access design",
      text: "A business designed an Active Directory structure where plant managers, department leads, and staff automatically receive the right Power BI reports, SharePoint access, and Teams channels based on their group membership. New hires get proper access on day one without manual configuration.",
    },
    process: ["Current access audit and organizational mapping", "Group structure and naming convention design", "Documentation and automation setup"],
    outcomes: ["Scalable access management", "Consistent security and compliance", "Faster onboarding for new employees"],
  },
};

const ServiceDetailPage = () => {
  const { slug } = useParams();
  const service = serviceData[slug];

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="service-detail-page">
      <header className="service-detail-hero">
        <div className="container">
          <Link to="/services" className="back-link">← Back to services</Link>
          <div className="service-detail-brand">
            <img src={ASLogo} alt="Animus Scripts logo" />
            <div>
              <p>Animus Scripts</p>
              <span>Specialized technology services</span>
            </div>
          </div>
          <h1>{service.title}</h1>
          <p>{service.summary}</p>
        </div>
      </header>

      <main className="container service-detail-content">
        <section className="detail-panel card-raise">
          <p className="detail-eyebrow">Service overview</p>
          <h2>What this service looks like</h2>
          <p>{service.intro}</p>
          <ul>
            {service.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="detail-panel detail-panel-alt card-raise">
          <p className="detail-eyebrow">Studio approach</p>
          <h2>Featured work</h2>
          <div className="case-study-card">
            <h3>{service.caseStudy.title}</h3>
            <p>{service.caseStudy.text}</p>
          </div>
          <div className="process-list">
            <h3>Our process</h3>
            <ul>
              {service.process.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
          <div className="metric-grid detail-metrics">
            <div className="metric-card">
              <strong>Strategy</strong>
              <span>Define the product scope and delivery roadmap.</span>
            </div>
            <div className="metric-card">
              <strong>Build</strong>
              <span>Craft the experience with a calm, scalable approach.</span>
            </div>
            <div className="metric-card">
              <strong>Support</strong>
              <span>Refine the product after launch with continued stewardship.</span>
            </div>
          </div>
          <h2>Business outcomes</h2>
          <div className="outcomes-grid">
            {service.outcomes.map((item) => (
              <div className="outcome-card" key={item}>
                <span>●</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <Link to="/" className="btn dark-btn detail-cta">Discuss your idea</Link>
        </section>
      </main>
    </div>
  );
};

export default ServiceDetailPage;
