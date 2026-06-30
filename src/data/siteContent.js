export const serviceCatalog = [
  {
    slug: "workflow-automation",
    title: "Workflow Automation",
    icon: "WF",
    summary:
      "Automate repetitive work across forms, email, Teams, SharePoint, SQL databases, APIs, and internal business systems.",
    detailIntro:
      "Manual handoffs create hidden queues, inconsistent follow-through, and delayed execution. We design workflow systems that route work automatically, preserve context, and keep status visible.",
    capabilities: [
      "Jotform, SharePoint, and internal form intake automation",
      "Rule-based routing by team, region, or request type",
      "Automated notifications in Microsoft Teams and email",
      "Centralized request tracking with processing logs",
    ],
    outcomes: [
      "Less manual triage and re-entry",
      "Clear accountability across each step",
      "Faster cycle times for operational requests",
    ],
  },
  {
    slug: "business-intelligence",
    title: "Business Intelligence",
    icon: "BI",
    summary:
      "Build reliable SQL models, Power BI dashboards, KPI reporting, operational metrics, and reporting systems that help teams make decisions faster.",
    detailIntro:
      "When reporting is inconsistent, teams stop trusting the numbers. We build data models and reporting layers that give operations, finance, and leadership one reliable view of performance.",
    capabilities: [
      "SQL Server and MySQL data modeling for operational reporting",
      "Power BI dashboards with role-based visibility",
      "KPI definitions and metric governance",
      "Refresh automation and data validation checks",
    ],
    outcomes: [
      "Trusted metrics across departments",
      "Faster decisions with current data",
      "Reduced spreadsheet reconciliation work",
    ],
  },
  {
    slug: "internal-business-apps",
    title: "Internal Business Apps",
    icon: "APP",
    summary:
      "Create lightweight internal applications for approvals, request tracking, operations, production workflows, data entry, and team coordination.",
    detailIntro:
      "Many teams need focused tools, not another large platform rollout. We build targeted internal apps that improve workflow control while fitting into your existing environment.",
    capabilities: [
      "Approval applications with audit-friendly status tracking",
      "Request tracking tools with ownership and SLA visibility",
      "Production and operations data entry interfaces",
      "Role-based access for secure internal collaboration",
    ],
    outcomes: [
      "Fewer process delays and bottlenecks",
      "More consistent execution across teams",
      "Better visibility into operational workload",
    ],
  },
  {
    slug: "systems-integration",
    title: "Systems Integration",
    icon: "API",
    summary:
      "Connect disconnected business systems using APIs, SQL Server, MySQL, Microsoft Graph, SharePoint, ERP data, and custom ETL pipelines.",
    detailIntro:
      "Disconnected tools create duplicate entry, stale reports, and hard-to-trace errors. We design integrations that move data reliably and make failures visible.",
    capabilities: [
      "API and Microsoft Graph integrations",
      "SQL-to-SQL and ERP-to-reporting synchronization",
      "Custom ETL pipelines with logging and retry handling",
      "Data mapping and transformation for consistent records",
    ],
    outcomes: [
      "Single operational source of truth",
      "Fewer manual transfer points",
      "Improved reliability of downstream reporting",
    ],
  },
  {
    slug: "microsoft-365-identity",
    title: "Microsoft 365 & Identity Systems",
    icon: "M365",
    summary:
      "Improve SharePoint architecture, role-based access, Active Directory group management, distribution workflows, and internal collaboration systems.",
    detailIntro:
      "Microsoft 365 often grows organically without clear ownership standards. We structure SharePoint and identity systems so access, workflows, and collaboration scale cleanly.",
    capabilities: [
      "SharePoint information architecture and list strategy",
      "Role-based access and Active Directory group design",
      "Distribution and notification workflow automation",
      "Governance patterns for internal collaboration systems",
    ],
    outcomes: [
      "Cleaner permissions and access control",
      "Reduced admin overhead for onboarding changes",
      "More consistent internal collaboration workflows",
    ],
  },
];

export const problemAreas = [
  "Repetitive manual work",
  "Disconnected systems",
  "Delayed reporting",
  "Spreadsheet dependency",
  "Missing accountability",
  "Data that cannot be trusted",
];

export const projectSystems = [
  {
    title: "Jotform to SQL Pipeline",
    problem: "Form submissions were copied manually between tools and often lost context.",
    system:
      "Jotform-to-SQL-to-Excel-and-Teams automation pipeline with validation, logging, and status tracking.",
    outcome:
      "Centralized records, faster processing, and clear visibility into where each submission stands.",
  },
  {
    title: "RFQ Workflow Automation",
    problem: "RFQ requests sat in inboxes with no clear routing ownership.",
    system:
      "Routes incoming requests to the correct team, writes data to a centralized tracker, sends Teams notifications, and keeps processing status visible.",
    outcome:
      "Less triage overhead, fewer dropped requests, and better accountability for turnaround time.",
  },
  {
    title: "Rush Order Approval App",
    problem: "Urgent approvals depended on manual email threads and ad hoc follow-up.",
    system:
      "Internal rush-order approval application with role-based routing, escalation logic, and approval audit trail.",
    outcome:
      "Shorter approval cycles and a documented path for every urgent decision.",
  },
  {
    title: "Identity-Driven Reporting Access",
    problem: "Report access updates were manual and inconsistent across departments.",
    system:
      "Role-based reporting and Active Directory group automation aligned to plant, team, and management hierarchy.",
    outcome:
      "Cleaner onboarding, consistent report visibility, and less access administration.",
  },
  {
    title: "SharePoint Operations System",
    problem: "Operational tasks were tracked in disconnected files and email chains.",
    system:
      "SharePoint operational system with structured intake, ownership views, KPI applications, and workflow notifications.",
    outcome:
      "Repeatable execution with measurable status across departments.",
  },
  {
    title: "Cross-System BI Reporting",
    problem: "Finance, production, and ERP reporting required manual reconciliation every cycle.",
    system:
      "Power BI reporting connected to finance, production, ERP, and operational data through validated SQL models.",
    outcome:
      "Faster reporting cycles with trusted metrics and fewer manual adjustments.",
  },
  {
    title: "Email-to-App Process Replacement",
    problem: "Core internal requests were buried across inboxes and spreadsheets.",
    system:
      "Internal app that replaces manual email and spreadsheet processes with structured intake, routing, and tracking.",
    outcome:
      "Higher process reliability and less dependence on tribal knowledge.",
  },
];

export const processSteps = [
  {
    title: "Map the Workflow",
    body: "Understand the process, people, systems, and bottlenecks.",
  },
  {
    title: "Design the System",
    body: "Define the data model, automation, integrations, reporting, and user experience.",
  },
  {
    title: "Build and Integrate",
    body: "Develop the application, workflow, dashboard, or system connection.",
  },
  {
    title: "Support and Improve",
    body: "Refine the system as the business changes and new opportunities appear.",
  },
];

export const technologyStack = [
  "Python",
  "SQL Server",
  "MySQL",
  "Power BI",
  "Power Apps",
  "SharePoint",
  "Microsoft Graph",
  "Microsoft Teams",
  "REST APIs",
  "Jotform",
  "Azure",
  "React",
  "Node.js",
  "ETL Pipelines",
  "Active Directory",
];