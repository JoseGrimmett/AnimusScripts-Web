# CRM to ERP Execution Checklist

This is the practical build order for moving from the current site into a working CRM first, then into ERP.

## Stage 0: Lock the scope

- Define the first CRM users.
- Define the first source of truth.
- Define the first workflow to complete end to end.
- Decide what will not be built yet.

### Output

- One-page scope statement.
- One primary workflow.
- One owner for each data object.

## Stage 1: Create the shared schema

- Add organizations.
- Add contacts.
- Add users.
- Add tickets or requests.
- Add tasks.
- Add notes.
- Add activity events.
- Add ownership and status fields.

### Output

- Database tables exist.
- Core relations are defined.
- IDs and timestamps are consistent.

## Stage 2: Route intake into CRM records

- Map the public contact form to a CRM contact or lead.
- Map portal signup to a customer account.
- Map portal ticket creation to a support ticket.
- Save the source page, form, and timestamps.

### Output

- Every public action writes a record.
- The same person is not duplicated across forms.
- Internal staff can trace the origin of each record.

## Stage 3: Build the staff inbox

- Create a queue for new items.
- Show status, priority, owner, and source.
- Add quick assignment.
- Add quick status updates.

### Output

- Staff can process incoming work from one screen.
- Nothing sits unowned by default.
- The inbox becomes the daily operating view.

## Stage 4: Add record detail pages

- Show profile, company, tickets, tasks, notes, and activity.
- Add edit controls for staff.
- Add timeline history.
- Add manual task creation.

### Output

- One record page tells the full story.
- Staff do not need to jump between multiple tools.
- History is visible and auditable.

## Stage 5: Add workflow controls

- Assign owners.
- Change status.
- Set due dates.
- Add follow-up tasks.
- Add internal notes.
- Trigger notifications where useful.

### Output

- Records move through a controlled pipeline.
- Follow-up work is visible.
- Progress can be measured.

## Stage 6: Connect the portal to the same records

- Let customers see ticket status.
- Let customers view timelines.
- Let customers create or update requests.
- Keep portal access restricted to the owning account.

### Output

- Staff and customers are looking at the same data.
- Portal use reduces email and manual updates.

## Stage 7: Add permissions and auditability

- Separate staff and customer access.
- Record login events.
- Record updates to sensitive fields.
- Restrict who can change ownership, billing, or status fields.

### Output

- Access is controlled by role.
- Sensitive changes are tracked.
- The system is ready for real operational use.

## Stage 8: Add reporting and search

- Search by name, company, email, status, and owner.
- Filter by source, date, and stage.
- Track response time.
- Track open vs closed counts.

### Output

- The team can answer operational questions quickly.
- Managers can see workload and bottlenecks.

## Stage 9: Stabilize the CRM before ERP

- Clean up duplicate records.
- Improve validation.
- Add indexes where needed.
- Fix any inconsistent workflow behavior.
- Confirm staff can use it daily.

### Output

- The CRM is stable enough to be the system of record.
- ERP work can start without rebuilding the foundation.

## Stage 10: Expand into ERP

- Add projects.
- Add delivery tracking.
- Add time tracking.
- Add billing or invoicing.
- Add approvals.
- Add expenses or purchasing if needed.

### Output

- ERP shares the CRM data model.
- Delivery and finance reuse the same accounts and tasks.
- The platform behaves like one system.
