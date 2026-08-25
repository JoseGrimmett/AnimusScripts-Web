import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../Components/AdminShell/AdminShell";
import "./SubmissionsPage.css";
import { AUTH_CHANGED_EVENT, emitAuthChanged, emitToast } from "../utils/uiEvents";

const ADMIN_SESSION_KEY = "animusAdminSession";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const csvEscape = (value) => {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll("\"", '""')}"`;
};

const buildCsv = (items) => {
  const headers = [
    "createdAt",
    "requestId",
    "subject",
    "status",
    "source",
    "assignedTo",
    "assignedBy",
    "assignedAt",
  ];

  const rows = items.map((item) =>
    [
      item.createdAt,
      item.requestId,
      item.subject,
      item.status,
      item.source,
      item.assignedTo,
      item.assignedBy,
      item.assignedAt,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [headers.map(csvEscape).join(","), ...rows].join("\n");
};

const SubmissionsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("Sign in to access the employee workspace.");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "employee",
  });
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [statusNote, setStatusNote] = useState("");
  const [crmNoteBody, setCrmNoteBody] = useState("");
  const [crmTaskTitle, setCrmTaskTitle] = useState("");
  const [crmTaskDescription, setCrmTaskDescription] = useState("");
  const [crmTaskDueDate, setCrmTaskDueDate] = useState("");
  const [isCreatingCrmNote, setIsCreatingCrmNote] = useState(false);
  const [isCreatingCrmTask, setIsCreatingCrmTask] = useState(false);
  const [crmActivity, setCrmActivity] = useState([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");
    } catch {
      return null;
    }
  });

  const clearSession = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setSession(null);
    setTickets([]);
    setSelectedTicket(null);
    setUsers([]);
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session", {
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();

      if (!payload?.ok || !payload?.user) {
        return null;
      }

      return {
        user: payload.user,
        token: null,
      };
    } catch {
      return null;
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!session?.token && !session?.user) {
      const activeSession = await fetchSession();

      if (!activeSession) {
        setStatus("Sign in to access the employee workspace.");
        return;
      }

      setSession(activeSession);
    }

    setIsLoading(true);
    setStatus("Loading ticket queue...");

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/tickets?limit=300", {
        headers: authHeader,
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          clearSession();
          emitToast({ message: "Session expired. Please sign in again.", type: "warning", duration: 4200 });
          throw new Error("Session expired. Please sign in again.");
        }

        throw new Error(payload?.error || "Failed to load ticket queue");
      }

      const nextTickets = payload.tickets || [];
      setTickets(nextTickets);
      setStatus(nextTickets.length ? "" : "No tickets found yet.");
      setSelectedTicket((prev) => {
        if (!prev?.requestId) {
          return prev;
        }

        return nextTickets.some((item) => item.requestId === prev.requestId) ? prev : null;
      });
    } catch (error) {
      setStatus(error.message || "Failed to load ticket queue");
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, fetchSession, session?.token, session?.user]);

  const fetchTicketDetail = useCallback(
    async (requestId) => {
      if (!requestId) {
        return;
      }

      setIsDetailLoading(true);

      try {
        const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
        const response = await fetch(`/api/admin/tickets?requestId=${encodeURIComponent(requestId)}`, {
          headers: authHeader,
          credentials: "include",
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load ticket detail");
        }

        setSelectedTicket(payload.ticket || null);
        setSelectedAssignee(payload.ticket?.assignedTo || "");
        setSelectedStatus(payload.ticket?.status || "open");
        setStatus("");
        await fetchCrmActivity(requestId);
      } catch (error) {
        setStatus(error.message || "Failed to load ticket detail");
      } finally {
        setIsDetailLoading(false);
      }
    },
    [fetchCrmActivity, session?.token],
  );

  const fetchCrmActivity = useCallback(
    async (requestId) => {
      if (!requestId) {
        setCrmActivity([]);
        return;
      }

      setIsActivityLoading(true);

      try {
        const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
        const response = await fetch(`/api/admin/crm-activity?requestId=${encodeURIComponent(requestId)}`, {
          headers: authHeader,
          credentials: "include",
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load CRM activity");
        }

        setCrmActivity(payload.activity || []);
      } catch (error) {
        setCrmActivity([]);
        setStatus(error.message || "Failed to load CRM activity");
      } finally {
        setIsActivityLoading(false);
      }
    },
    [session?.token],
  );

  const fetchUsers = useCallback(async () => {
    if (!session?.user) {
      setUsers([]);
      return;
    }

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/users?limit=200", {
        headers: authHeader,
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load users");
      }

      setUsers(payload.users || []);
    } catch (error) {
      setStatus(error.message || "Failed to load users");
    }
  }, [session?.token, session?.user]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setStatus("Enter both username and password.");
      return;
    }

    setIsLoading(true);
    setStatus("Signing in...");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Login failed");
      }

      const nextSession = {
        token: payload.token,
        user: payload.user,
      };

      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setPassword("");
      setStatus("Signed in. Loading workspace...");
      emitAuthChanged();
      emitToast({ message: "Employee login successful.", type: "success" });
    } catch (error) {
      setStatus(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTicket?.requestId) {
      return;
    }

    setIsAssigning(true);

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          requestId: selectedTicket.requestId,
          assignedTo: selectedAssignee,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to assign ticket");
      }

      setStatus(payload.assignment?.assignedTo ? "Ticket assigned." : "Ticket unassigned.");
      setStatusNote("");
      await fetchTickets();
      await fetchTicketDetail(selectedTicket.requestId);
    } catch (error) {
      setStatus(error.message || "Failed to assign ticket");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicket?.requestId) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          action: "status",
          requestId: selectedTicket.requestId,
          status: selectedStatus,
          note: statusNote,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update status");
      }

      setStatus(`Status updated to ${payload.statusUpdate?.status || selectedStatus}.`);
      setStatusNote("");
      await fetchTickets();
      await fetchTicketDetail(selectedTicket.requestId);
    } catch (error) {
      setStatus(error.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateCrmNote = async () => {
    if (!selectedTicket?.requestId || !crmNoteBody.trim()) {
      setStatus("Enter a note before saving it to CRM.");
      return;
    }

    setIsCreatingCrmNote(true);

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/crm-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          action: "note",
          requestId: selectedTicket.requestId,
          body: crmNoteBody,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save CRM note");
      }

      setCrmNoteBody("");
      setStatus("CRM note saved.");
      emitToast({ message: "CRM note saved.", type: "success" });
      await fetchCrmActivity(selectedTicket.requestId);
    } catch (error) {
      setStatus(error.message || "Failed to save CRM note");
    } finally {
      setIsCreatingCrmNote(false);
    }
  };

  const handleCreateCrmTask = async () => {
    if (!selectedTicket?.requestId || !crmTaskTitle.trim()) {
      setStatus("Enter a task title before saving it to CRM.");
      return;
    }

    setIsCreatingCrmTask(true);

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/crm-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          action: "task",
          requestId: selectedTicket.requestId,
          title: crmTaskTitle,
          description: crmTaskDescription,
          dueDate: crmTaskDueDate,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save CRM task");
      }

      setCrmTaskTitle("");
      setCrmTaskDescription("");
      setCrmTaskDueDate("");
      setStatus("CRM task created.");
      emitToast({ message: "CRM task created.", type: "success" });
      await fetchCrmActivity(selectedTicket.requestId);
    } catch (error) {
      setStatus(error.message || "Failed to save CRM task");
    } finally {
      setIsCreatingCrmTask(false);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!newUser.username.trim() || !newUser.password) {
      setStatus("Username and password are required for new employee accounts.");
      return;
    }

    setIsLoading(true);

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to add user");
      }

      setStatus("Employee account saved.");
      setNewUser({ username: "", password: "", role: "employee" });
      await fetchUsers();
    } catch (error) {
      setStatus(error.message || "Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.token || session?.user) {
      fetchTickets();
      fetchUsers();
      return;
    }

    fetchSession().then((activeSession) => {
      if (activeSession) {
        setSession(activeSession);
        return;
      }

      setTickets([]);
    });
  }, [fetchSession, fetchTickets, fetchUsers, session?.token, session?.user]);

  useEffect(() => {
    const handleAuthChanged = async () => {
      const activeSession = await fetchSession();

      if (!activeSession) {
        clearSession();
        setStatus("Sign in to access the employee workspace.");
        return;
      }

      setSession(activeSession);
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
  }, [clearSession, fetchSession]);

  const latestUpdated = useMemo(() => {
    if (!tickets.length) {
      return null;
    }

    return tickets[0].createdAt;
  }, [tickets]);

  const handleExport = () => {
    if (!tickets.length) {
      return;
    }

    const blob = new Blob([buildCsv(tickets)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `animus-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const assignmentEvents = useMemo(() => {
    return (selectedTicket?.timeline || []).filter((event) => String(event.type || "").includes("assignment"));
  }, [selectedTicket?.timeline]);

  return (
    <AdminShell user={session?.user}>
      <main className="container submissions-main">
        <section className="submissions-hero">
          <p className="section-kicker">{session?.user ? "Ticket operations" : "Employee access"}</p>
          <h1>{session?.user ? "Ticket inbox" : "Sign in to Animus Operations"}</h1>
          <p>
            {session?.user
              ? "Review new requests, assign ownership, and keep customers updated."
              : "Use your employee credentials or Microsoft 365 account."}
          </p>
          {!session?.user ? (
            <form className="submissions-unlock" onSubmit={handleLogin}>
              <label className="submissions-label" htmlFor="admin-username">
                Employee username
              </label>
              <div className="submissions-input-row">
                <input
                  id="admin-username"
                  className="submissions-input"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter employee username"
                />
              </div>
              <label className="submissions-label" htmlFor="admin-password">
                Password
              </label>
              <div className="submissions-unlock-row">
                <input
                  id="admin-password"
                  className="submissions-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                />
                <button className="btn dark-btn" type="submit" disabled={isLoading}>
                  Sign in
                </button>
              </div>
            </form>
          ) : null}
          <div className="submissions-actions">
            {!session?.user ? (
              <a className="btn ghost-btn" href="/api/admin/microsoft/start">
                Continue with Microsoft 365
              </a>
            ) : null}
            <button className="btn dark-btn" onClick={fetchTickets} disabled={!session?.user || isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="btn ghost-btn" onClick={handleExport} disabled={!tickets.length}>
              Export CSV
            </button>
          </div>
          {latestUpdated ? (
            <p className="submissions-meta">Latest update: {formatDate(latestUpdated)}</p>
          ) : null}
        </section>

        {status ? <p className="submissions-status">{status}</p> : null}

        {session?.user ? (
          <div className="employee-workspace">
            <section className="ticket-table-shell card-raise" aria-label="Ticket queue table">
              <h2>Ticket queue</h2>
              <div className="ticket-table-wrap">
                <table className="ticket-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Assigned</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.requestId}>
                        <td>{ticket.requestId}</td>
                        <td>{ticket.subject}</td>
                        <td>{ticket.status || "open"}</td>
                        <td>{ticket.source || "portal"}</td>
                        <td>{ticket.assignedTo || "Unassigned"}</td>
                        <td>{formatDate(ticket.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn ghost-btn"
                            onClick={() => fetchTicketDetail(ticket.requestId)}
                            disabled={isDetailLoading}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="ticket-detail-shell card-raise">
              <h2>Ticket detail</h2>
              {selectedTicket ? (
                <>
                  <div className="submission-grid">
                    <div>
                      <strong>Request ID</strong>
                      <span>{selectedTicket.requestId}</span>
                    </div>
                    <div>
                      <strong>Status</strong>
                      <span>{selectedTicket.status || "open"}</span>
                    </div>
                    <div>
                      <strong>Source</strong>
                      <span>{selectedTicket.source || "portal"}</span>
                    </div>
                    <div>
                      <strong>Created</strong>
                      <span>{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                  </div>

                  <div className="submission-notes">
                    <div>
                      <strong>Subject</strong>
                      <p>{selectedTicket.subject}</p>
                    </div>
                    <div>
                      <strong>Details</strong>
                      <p>{selectedTicket.message}</p>
                    </div>
                  </div>

                  <div className="crm-action-panel">
                    <div className="crm-action-card">
                      <strong>Save CRM note</strong>
                      <textarea
                        className="submissions-input"
                        rows={4}
                        value={crmNoteBody}
                        onChange={(event) => setCrmNoteBody(event.target.value)}
                        placeholder="Add an internal CRM note from this ticket"
                      />
                      <button className="btn ghost-btn" type="button" onClick={handleCreateCrmNote} disabled={isCreatingCrmNote}>
                        {isCreatingCrmNote ? "Saving..." : "Save note to CRM"}
                      </button>
                    </div>

                    <div className="crm-action-card">
                      <strong>Create CRM task</strong>
                      <input
                        className="submissions-input"
                        type="text"
                        value={crmTaskTitle}
                        onChange={(event) => setCrmTaskTitle(event.target.value)}
                        placeholder="Follow-up task title"
                      />
                      <textarea
                        className="submissions-input"
                        rows={3}
                        value={crmTaskDescription}
                        onChange={(event) => setCrmTaskDescription(event.target.value)}
                        placeholder="Optional task description"
                      />
                      <input
                        className="submissions-input"
                        type="date"
                        value={crmTaskDueDate}
                        onChange={(event) => setCrmTaskDueDate(event.target.value)}
                      />
                      <button className="btn dark-btn" type="button" onClick={handleCreateCrmTask} disabled={isCreatingCrmTask}>
                        {isCreatingCrmTask ? "Creating..." : "Create CRM task"}
                      </button>
                    </div>
                  </div>

                  <div className="timeline-list">
                    <h3>CRM activity</h3>
                    {isActivityLoading ? (
                      <p className="submissions-meta">Loading CRM activity...</p>
                    ) : crmActivity.length ? (
                      crmActivity.map((item) => (
                        <article key={item.id} className="timeline-item">
                          <strong>{item.type === "task" ? "Task" : item.type === "note" ? "Note" : "Activity"}</strong>
                          <span>{formatDate(item.createdAt)}</span>
                          {item.type === "task" ? (
                            <p>
                              {item.title}
                              {item.body ? ` • ${item.body}` : ""}
                              {item.dueDate ? ` • Due ${formatDate(item.dueDate)}` : ""}
                            </p>
                          ) : (
                            <p>{item.body || item.title || "CRM record created."}</p>
                          )}
                        </article>
                      ))
                    ) : (
                      <p className="submissions-meta">No CRM notes or tasks have been added yet.</p>
                    )}
                  </div>

                  <div className="assignment-row status-row">
                    <label htmlFor="ticket-assignee" className="submissions-label">Assignee</label>
                    <select
                      id="ticket-assignee"
                      className="submissions-input"
                      value={selectedAssignee}
                      onChange={(event) => setSelectedAssignee(event.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.username} value={user.username}>
                          {user.username} ({user.role})
                        </option>
                      ))}
                    </select>
                    <button className="btn dark-btn" type="button" onClick={handleAssign} disabled={isAssigning}>
                      {isAssigning ? "Saving..." : "Save assignment"}
                    </button>
                  </div>

                  <div className="assignment-row">
                    <label htmlFor="ticket-status" className="submissions-label">Status</label>
                    <select
                      id="ticket-status"
                      className="submissions-input"
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="waiting">Waiting</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <textarea
                      className="submissions-input"
                      rows={2}
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      placeholder="Optional note for timeline"
                    />
                    <button
                      className="btn dark-btn"
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? "Updating..." : "Update status"}
                    </button>
                  </div>

                  <div className="timeline-list">
                    <h3>Timeline</h3>
                    {(selectedTicket.timeline || []).map((event) => (
                      <article key={event.id || `${event.type}-${event.createdAt}`} className="timeline-item">
                        <strong>{String(event.type || "update").replaceAll("_", " ")}</strong>
                        <span>{formatDate(event.createdAt)}</span>
                        <p>{event.note || "Status updated."}</p>
                      </article>
                    ))}
                  </div>

                  <div className="timeline-list">
                    <h3>Assignment audit trail</h3>
                    {assignmentEvents.length ? (
                      assignmentEvents.map((event) => (
                        <article key={`assignment-${event.id || `${event.type}-${event.createdAt}`}`} className="timeline-item">
                          <strong>{event.note || "Assignment updated."}</strong>
                          <span>{formatDate(event.createdAt)}</span>
                          <p>By {event.actor || "system"}</p>
                        </article>
                      ))
                    ) : (
                      <p className="submissions-meta">No assignment changes recorded yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="submissions-meta">Pick a ticket from the table to view details.</p>
              )}
            </section>
          </div>
        ) : null}

        {session?.user?.role === "admin" ? (
          <section className="user-admin-shell card-raise">
            <h2>Employee access management</h2>
            <form className="submissions-unlock" onSubmit={handleCreateUser}>
              <label className="submissions-label" htmlFor="new-username">Username</label>
              <input
                id="new-username"
                className="submissions-input"
                type="text"
                value={newUser.username}
                onChange={(event) => setNewUser((prev) => ({ ...prev, username: event.target.value }))}
              />
              <label className="submissions-label" htmlFor="new-password">Password</label>
              <input
                id="new-password"
                className="submissions-input"
                type="password"
                minLength={8}
                value={newUser.password}
                onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
              />
              <label className="submissions-label" htmlFor="new-role">Role</label>
              <select
                id="new-role"
                className="submissions-input"
                value={newUser.role}
                onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn dark-btn" type="submit" disabled={isLoading}>
                Add or update user
              </button>
            </form>

            <div className="user-chip-list">
              {users.map((user) => (
                <div className="user-chip" key={user.username}>
                  <strong>{user.username}</strong>
                  <span>{user.role}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </AdminShell>
  );
};

export default SubmissionsPage;
