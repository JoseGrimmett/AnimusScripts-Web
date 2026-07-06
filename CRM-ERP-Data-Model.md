# CRM to ERP Data Model

This is the shared domain model to build first so CRM and ERP grow from the same foundation.

## Core tables

### organizations

Represents a company or customer account.

Suggested fields:

- id
- name
- type
- status
- industry
- website
- owner_user_id
- created_at
- updated_at

### contacts

Represents a person tied to an organization or acting as an individual customer.

Suggested fields:

- id
- organization_id
- first_name
- last_name
- email
- phone
- title
- status
- owner_user_id
- created_at
- updated_at

### users

Represents staff and, where needed, customer portal accounts.

Suggested fields:

- id
- email
- display_name
- password_hash
- role
- status
- created_at
- updated_at

### leads

Represents early-stage opportunities or unqualified inbound interest.

Suggested fields:

- id
- organization_id
- contact_id
- source
- stage
- priority
- owner_user_id
- created_at
- updated_at

### opportunities

Represents qualified sales work.

Suggested fields:

- id
- lead_id
- organization_id
- contact_id
- value
- probability
- stage
- expected_close_date
- owner_user_id
- created_at
- updated_at

### tickets

Represents support, requests, or service issues.

Suggested fields:

- id
- request_id
- organization_id
- contact_id
- user_id
- subject
- message
- status
- priority
- source
- owner_user_id
- created_at
- updated_at

### tasks

Represents internal work items.

Suggested fields:

- id
- organization_id
- contact_id
- ticket_id
- opportunity_id
- title
- description
- status
- priority
- due_date
- assigned_user_id
- created_by_user_id
- created_at
- updated_at

### notes

Represents internal or shared commentary on a record.

Suggested fields:

- id
- organization_id
- contact_id
- ticket_id
- opportunity_id
- body
- visibility
- created_by_user_id
- created_at

### activity_events

Represents a timeline of important changes.

Suggested fields:

- id
- entity_type
- entity_id
- action
- actor_user_id
- payload_json
- created_at

## ERP extension tables

### projects

Represents client delivery work.

Suggested fields:

- id
- organization_id
- opportunity_id
- name
- status
- start_date
- end_date
- owner_user_id
- created_at
- updated_at

### time_entries

Represents work logged against a project or task.

Suggested fields:

- id
- project_id
- task_id
- user_id
- minutes
- work_date
- notes
- created_at

### invoices

Represents billing output.

Suggested fields:

- id
- organization_id
- project_id
- invoice_number
- status
- subtotal
- tax
- total
- due_date
- created_at
- updated_at

### approvals

Represents sign-off or internal approval steps.

Suggested fields:

- id
- entity_type
- entity_id
- requested_by_user_id
- approved_by_user_id
- status
- comment
- created_at
- updated_at

## Relationships to preserve

- One organization can have many contacts.
- One contact can have many tickets, tasks, notes, and activities.
- One lead can become one opportunity.
- One opportunity can become one project.
- One project can produce many time entries and invoices.
- One activity stream should cover CRM and ERP records.

## Design rules

- Keep one record of truth for each person and company.
- Reuse the same IDs across CRM and ERP where possible.
- Attach every workflow to an owner and a timestamp.
- Prefer shared tables over duplicate tables.
- Add ERP tables only after CRM tables are working in production.
