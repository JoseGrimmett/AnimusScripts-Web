# CRM to ERP Roadmap

This document lays out the fastest practical path from the current public website into a working CRM, then into ERP-style operations.

## Goal

Use the existing website, intake flow, admin page, and portal as the foundation for a single business system.

The order matters:

1. Start with CRM.
2. Prove the core workflow end to end.
3. Add staff productivity features.
4. Move into ERP modules only after the CRM loop is stable.

Related docs:

- [Execution Checklist](CRM-ERP-Execution-Checklist.md)
- [Data Model](CRM-ERP-Data-Model.md)

## Phase 1: Start CRM

Build the minimum shared system of record.

### What to create

- Organizations
- Contacts
- Leads or opportunities
- Tickets or requests
- Tasks
- Notes
- Activity history
- User roles and permissions

### What this phase should do

- Turn every website form submission into a real CRM record.
- Let staff search, filter, and update records in one place.
- Show the relationship between a contact, their company, their requests, and their status.

### Exit criteria

- A contact submission creates a stored CRM record.
- Staff can log in and view the record.
- The same record can be updated without duplicating data across screens.

## Phase 2: Connect the Website to CRM

Use the public site as the intake layer for the CRM.

### What to connect

- Contact form submissions
- Service inquiry forms
- Portal signups
- Support ticket creation

### What this phase should do

- Map every public-facing action to a CRM entity.
- Assign source, status, owner, and timestamps automatically.
- Keep the website as the front door, not a separate system.

### Exit criteria

- Public actions create records with consistent fields.
- Staff can trace each record back to its source page or form.
- No manual copy-paste is needed between the website and internal tools.

## Phase 3: Build the Staff CRM

Create the working dashboard for internal use.

### What to create

- Inbox for new leads and tickets
- Record detail page
- Assignment and ownership controls
- Follow-up task list
- Status pipeline
- Search and filters

### What this phase should do

- Let staff process incoming work quickly.
- Make every record actionable.
- Reduce the need to open multiple tools to answer one customer question.

### Exit criteria

- Staff can triage, assign, and close records from the dashboard.
- Follow-up work is visible and trackable.
- The dashboard is the main operational view for the business.

## Phase 4: Normalize Identity and Permissions

Unify how users, staff, and customers access the system.

### What to standardize

- Authentication
- Session handling
- Role-based access control
- Staff vs customer permissions
- Audit trail for sensitive actions

### What this phase should do

- Remove duplicate login logic where possible.
- Ensure customer data and internal data are separated by permissions, not by separate code paths.
- Make the portal and admin surface operate on the same identity model.

### Exit criteria

- One permission model controls staff and customer access.
- Sensitive actions are logged.
- The portal and admin surface share the same underlying user model.

## Phase 5: Add Client Self-Service

Use the portal to reduce staff workload and improve customer visibility.

### What to create

- Ticket status view
- Ticket detail and timeline
- Message or comment thread
- Account profile
- Request history

### What this phase should do

- Let clients check progress without emailing staff.
- Keep customers inside the same record lifecycle as staff.
- Make the portal useful enough that support overhead drops.

### Exit criteria

- Customers can see their own requests and status.
- Customers can create or update requests from the portal.
- Staff and clients are looking at the same record set.

## Phase 6: Stabilize the CRM Core

Before moving into ERP, make sure the CRM is reliable.

### What to harden

- Data model consistency
- Validation rules
- Search performance
- Indexing and filtering
- Notifications
- Reporting basics

### What this phase should do

- Remove friction in daily use.
- Make the CRM trustworthy as the source of truth.
- Prove the system can support repeatable business operations.

### Exit criteria

- Records stay clean and searchable.
- Core workflows are dependable.
- Staff use the CRM without needing manual cleanup.

## Phase 7: Move Into ERP

Only add ERP modules once the CRM is stable and in use.

### Good ERP candidates

- Projects and delivery tracking
- Time tracking
- Billing and invoicing
- Approvals
- Resource planning
- Purchase or expense workflows
- Inventory, if the business actually needs it

### What this phase should do

- Reuse the same organizations, users, tasks, and activity history from CRM.
- Add operational depth without creating a second system of record.
- Tie delivery and finance back to customer accounts and projects.

### Exit criteria

- ERP records inherit data from the CRM core.
- Teams can move from sales to delivery to billing without re-entering data.
- The platform behaves like one system, not separate apps.

## Fastest Build Order

If speed matters most, build in this order:

1. Shared database schema
2. Contact to CRM record flow
3. Staff dashboard
4. Record assignment and tasking
5. Portal sync
6. Reporting and search
7. ERP modules

## Recommended Rule

Do not build ERP features before the CRM loop works end to end.

If the system cannot reliably capture a lead, assign it, update it, and show it to the customer, it is too early for finance, inventory, or project automation.
