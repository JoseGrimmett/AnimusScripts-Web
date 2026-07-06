import React, { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import { emitToast } from "../utils/uiEvents";
import "./AdminCrmPage.css";

const ENTITY_CONFIG = {
  organizations: {
    label: "Organizations",
    description: "Companies and customer accounts.",
    endpoint: "organizations",
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "industry", label: "Industry" },
      { key: "ownerAdminId", label: "Owner" },
    ],
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "industry", label: "Industry" },
      { key: "website", label: "Website" },
      { key: "ownerAdminId", label: "Owner Admin ID" },
    ],
    defaults: {
      name: "",
      type: "customer",
      status: "active",
      industry: "",
      website: "",
      ownerAdminId: "",
    },
  },
  contacts: {
    label: "Contacts",
    description: "People tied to accounts or portal users.",
    endpoint: "contacts",
    columns: [
      { key: "firstName", label: "First" },
      { key: "lastName", label: "Last" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
      { key: "organizationId", label: "Org" },
    ],
    fields: [
      { key: "organizationId", label: "Organization ID" },
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "email", label: "Email", required: true },
      { key: "phone", label: "Phone" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "ownerAdminId", label: "Owner Admin ID" },
      { key: "portalUserId", label: "Portal User ID" },
    ],
    defaults: {
      organizationId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      status: "active",
      ownerAdminId: "",
      portalUserId: "",
    },
  },
  leads: {
    label: "Leads",
    description: "Inbound opportunities and initial qualification.",
    endpoint: "leads",
    columns: [
      { key: "source", label: "Source" },
      { key: "stage", label: "Stage" },
      { key: "priority", label: "Priority" },
      { key: "organizationId", label: "Org" },
      { key: "contactId", label: "Contact" },
    ],
    fields: [
      { key: "organizationId", label: "Organization ID" },
      { key: "contactId", label: "Contact ID" },
      { key: "sourceSubmissionRequestId", label: "Submission Request ID" },
      { key: "source", label: "Source" },
      { key: "stage", label: "Stage" },
      { key: "priority", label: "Priority" },
      { key: "ownerAdminId", label: "Owner Admin ID" },
    ],
    defaults: {
      organizationId: "",
      contactId: "",
      sourceSubmissionRequestId: "",
      source: "contact-form",
      stage: "new",
      priority: "normal",
      ownerAdminId: "",
    },
  },
  tickets: {
    label: "Tickets",
    description: "Support and service requests.",
    endpoint: "tickets",
    columns: [
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "source", label: "Source" },
      { key: "ownerAdminId", label: "Owner" },
    ],
    fields: [
      { key: "organizationId", label: "Organization ID" },
      { key: "contactId", label: "Contact ID" },
      { key: "portalUserId", label: "Portal User ID" },
      { key: "contactSubmissionRequestId", label: "Submission Request ID" },
      { key: "portalTicketRequestId", label: "Portal Ticket Request ID" },
      { key: "subject", label: "Subject", required: true },
      { key: "message", label: "Message", multiline: true, required: true },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "ownerAdminId", label: "Owner Admin ID" },
    ],
    defaults: {
      organizationId: "",
      contactId: "",
      portalUserId: "",
      contactSubmissionRequestId: "",
      portalTicketRequestId: "",
      subject: "",
      message: "",
      status: "open",
      priority: "normal",
      ownerAdminId: "",
    },
  },
};

const ENTITY_ORDER = ["organizations", "contacts", "leads", "tickets"];

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const blankDraft = (entity) => ({ ...ENTITY_CONFIG[entity].defaults });

const AdminCrmPage = () => {
  const [session, setSession] = useState(null);
  const [entity, setEntity] = useState("organizations");
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [draft, setDraft] = useState(blankDraft("organizations"));
  const [status, setStatus] = useState("Loading CRM workspace...");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSession = useCallback(async () => {
    const response = await fetch("/api/admin/session", { credentials: "include" });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.user ? payload : null;
  }, []);

  const loadRecords = useCallback(async (nextEntity = entity, preserveRecordId = null) => {
    setIsLoading(true);
    setStatus(`Loading ${ENTITY_CONFIG[nextEntity].label.toLowerCase()}...`);

    try {
      const response = await fetch(`/api/admin/crm?entity=${encodeURIComponent(nextEntity)}&limit=200`, {
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || `Failed to load ${nextEntity}`);
      }

      const nextRecords = payload.records || [];
      setRecords(nextRecords);

      if (preserveRecordId) {
        const replacement = nextRecords.find((item) => String(item.id) === String(preserveRecordId));
        if (replacement) {
          setSelectedRecord(replacement);
          setDraft(replacement);
        } else {
          setSelectedRecord(null);
          setDraft(blankDraft(nextEntity));
        }
      } else if (!nextRecords.length) {
        setSelectedRecord(null);
        setDraft(blankDraft(nextEntity));
      }

      setStatus(nextRecords.length ? "" : `No ${ENTITY_CONFIG[nextEntity].label.toLowerCase()} yet.`);
    } catch (error) {
      setStatus(error.message || `Failed to load ${nextEntity}`);
    } finally {
      setIsLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    fetchSession().then((payload) => {
      setSession(payload);
    }).catch(() => setSession(null));
  }, [fetchSession]);

  useEffect(() => {
    setSelectedRecord(null);
    setDraft(blankDraft(entity));
    loadRecords(entity, null);
  }, [entity, loadRecords]);

  const summary = useMemo(() => {
    return ENTITY_ORDER.map((key) => ({
      key,
      label: ENTITY_CONFIG[key].label,
      count: key === entity ? records.length : null,
    }));
  }, [entity, records.length]);

  const handleSelectRecord = async (record) => {
    setSelectedRecord(record);
    setDraft(record);

    try {
      const response = await fetch(`/api/admin/crm?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(record.id)}`, {
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load record detail");
      }

      setSelectedRecord(payload.record);
      setDraft(payload.record);
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Failed to load record detail");
    }
  };

  const handleSave = async () => {
    const config = ENTITY_CONFIG[entity];
    const payload = { data: draft };

    setIsSaving(true);

    try {
      const response = await fetch(
        selectedRecord?.id
          ? `/api/admin/crm?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(selectedRecord.id)}`
          : `/api/admin/crm?entity=${encodeURIComponent(entity)}`,
        {
          method: selectedRecord?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || `Failed to save ${config.label.toLowerCase()}`);
      }

      setSelectedRecord(result.record);
      setDraft(result.record);
      setStatus(`${config.label.slice(0, -1)} saved.`);
      emitToast({ message: `${config.label.slice(0, -1)} saved.`, type: "success" });
      await loadRecords(entity, result.record?.id || null);
    } catch (error) {
      setStatus(error.message || `Failed to save ${config.label.toLowerCase()}`);
      emitToast({ message: error.message || "Save failed", type: "warning" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord?.id) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/crm?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(selectedRecord.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedRecord.id }),
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete record");
      }

      setSelectedRecord(null);
      setDraft(blankDraft(entity));
      setStatus("Record deleted.");
      emitToast({ message: "Record deleted.", type: "success" });
      await loadRecords(entity, null);
    } catch (error) {
      setStatus(error.message || "Failed to delete record");
      emitToast({ message: error.message || "Delete failed", type: "warning" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setDraft(blankDraft(entity));
    setStatus(`Creating a new ${ENTITY_CONFIG[entity].label.slice(0, -1).toLowerCase()}.`);
  };

  const currentConfig = ENTITY_CONFIG[entity];

  return (
    <div className="site-shell">
      <NavBar />
      <main className="container crm-main">
        <section className="crm-hero card-raise">
          <p className="section-kicker">Internal CRM</p>
          <h1>Admin CRM workspace</h1>
          <p>
            Work the shared system of record for customers, contacts, leads, and tickets.
          </p>

          <div className="crm-summary">
            {summary.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`crm-summary-card ${entity === item.key ? "active" : ""}`}
                onClick={() => setEntity(item.key)}
              >
                <span>{item.label}</span>
                <strong>{item.count ?? records.length}</strong>
              </button>
            ))}
          </div>

          <div className="crm-actions">
            <button type="button" className="btn dark-btn" onClick={() => loadRecords(entity)} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button type="button" className="btn ghost-btn" onClick={handleCreateNew}>
              New {currentConfig.label.slice(0, -1)}
            </button>
            <a className="btn ghost-btn" href="/admin">
              Ticket workspace
            </a>
          </div>

          {session?.user?.username ? (
            <p className="crm-meta">
              Signed in as {session.user.username} ({session.user.role || "employee"})
            </p>
          ) : null}
        </section>

        {status ? <p className="crm-status">{status}</p> : null}

        <section className="crm-tabs card-raise" aria-label="CRM entity tabs">
          {ENTITY_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              className={`crm-tab ${entity === item ? "active" : ""}`}
              onClick={() => setEntity(item)}
            >
              {ENTITY_CONFIG[item].label}
            </button>
          ))}
        </section>

        <div className="crm-grid">
          <section className="crm-list-shell card-raise">
            <div className="crm-section-head">
              <div>
                <h2>{currentConfig.label}</h2>
                <p>{currentConfig.description}</p>
              </div>
              <span className="crm-count-pill">{records.length} records</span>
            </div>

            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {currentConfig.columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className={selectedRecord?.id === record.id ? "active" : ""}
                      onClick={() => handleSelectRecord(record)}
                    >
                      <td>{record.id}</td>
                      {currentConfig.columns.map((column) => (
                        <td key={column.key}>{formatValue(record[column.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="crm-detail-shell card-raise">
            <div className="crm-section-head">
              <div>
                <h2>{selectedRecord?.id ? `Edit ${currentConfig.label.slice(0, -1)}` : `New ${currentConfig.label.slice(0, -1)}`}</h2>
                <p>Update the record details or create a new one.</p>
              </div>
            </div>

            <div className="crm-form-grid">
              {currentConfig.fields.map((field) => (
                <label key={field.key} className={`crm-field ${field.multiline ? "full" : ""}`}>
                  <span>
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.multiline ? (
                    <textarea
                      className="crm-input"
                      rows={6}
                      value={draft[field.key] ?? ""}
                      onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  ) : (
                    <input
                      className="crm-input"
                      type="text"
                      value={draft[field.key] ?? ""}
                      onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="crm-actions crm-actions-bottom">
              <button type="button" className="btn dark-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : selectedRecord?.id ? "Save changes" : "Create record"}
              </button>
              <button
                type="button"
                className="btn ghost-btn"
                onClick={() => {
                  setSelectedRecord(null);
                  setDraft(blankDraft(entity));
                }}
              >
                Clear form
              </button>
              <button type="button" className="btn ghost-btn" onClick={handleDelete} disabled={!selectedRecord?.id || isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>

            {selectedRecord?.id ? (
              <div className="crm-detail-meta">
                <strong>Selected record</strong>
                <span>ID {selectedRecord.id}</span>
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCrmPage;