import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "../Components/AdminShell/AdminShell";
import "./SubmissionsPage.css";
import { AUTH_CHANGED_EVENT, emitAuthChanged, emitToast } from "../utils/uiEvents";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatRelativeDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const elapsedMinutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  if (elapsedMinutes < 1440) return `${Math.round(elapsedMinutes / 60)}h ago`;
  if (elapsedMinutes < 10080) return `${Math.round(elapsedMinutes / 1440)}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const humanize = (value) => String(value || "open")
  .replaceAll("_", " ")
  .replaceAll("-", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeStatus = (value) => String(value || "open").toLowerCase().replaceAll("_", "-");

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
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  const [session, setSession] = useState(null);
  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [ticketOwnershipFilter, setTicketOwnershipFilter] = useState("all");

  const clearSession = useCallback(() => {
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
      };
    } catch {
      return null;
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!session?.user) {
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
      const response = await fetch("/api/admin/tickets?limit=300", {
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
  }, [clearSession, fetchSession, session?.user]);

  const fetchCrmActivity = useCallback(
    async (requestId) => {
      if (!requestId) {
        setCrmActivity([]);
        return;
      }

      setIsActivityLoading(true);

      try {
        const response = await fetch(`/api/admin/crm-activity?requestId=${encodeURIComponent(requestId)}`, {
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
    [],
  );

  const fetchTicketDetail = useCallback(
    async (requestId) => {
      if (!requestId) {
        return;
      }

      setIsDetailLoading(true);

      try {
        const response = await fetch(`/api/admin/tickets?requestId=${encodeURIComponent(requestId)}`, {
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
    [fetchCrmActivity],
  );

  const fetchUsers = useCallback(async () => {
    if (!session?.user) {
      setUsers([]);
      return;
    }

    try {
      const response = await fetch("/api/admin/users?limit=200", {
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
  }, [session?.user]);

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
        credentials: "include",
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

      await fetch("/api/portal/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      const nextSession = {
        user: payload.user,
      };

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
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const response = await fetch("/api/admin/crm-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const response = await fetch("/api/admin/crm-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    if (session?.user) {
      setIsSessionChecking(false);
      fetchTickets();
      fetchUsers();
      return;
    }

    let isActive = true;
    setIsSessionChecking(true);

    fetchSession().then((activeSession) => {
      if (!isActive) {
        return;
      }

      if (activeSession) {
        setSession(activeSession);
        setIsSessionChecking(false);
        return;
      }
      setTickets([]);
      setIsSessionChecking(false);
    });

    return () => {
      isActive = false;
    };
  }, [fetchSession, fetchTickets, fetchUsers, session?.user]);

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

  const ticketMetrics = useMemo(() => {
    return tickets.reduce((summary, ticket) => {
      const ticketStatus = normalizeStatus(ticket.status);
      summary.total += 1;
      if (ticketStatus === "received" || ticketStatus === "open") summary.new += 1;
      if (ticketStatus !== "resolved") summary.active += 1;
      if (!ticket.assignedTo) summary.unassigned += 1;
      return summary;
    }, { total: 0, new: 0, active: 0, unassigned: 0 });
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const normalizedQuery = ticketQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const ticketStatus = normalizeStatus(ticket.status);
      const matchesQuery = !normalizedQuery || [
        ticket.requestId,
        ticket.subject,
        ticket.message,
        ticket.source,
        ticket.assignedTo,
      ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
      const matchesStatus = ticketStatusFilter === "all" || ticketStatus === ticketStatusFilter;
      const matchesOwnership = ticketOwnershipFilter === "all"
        || (ticketOwnershipFilter === "unassigned" && !ticket.assignedTo)
        || (ticketOwnershipFilter === "mine" && ticket.assignedTo === session?.user?.username);

      return matchesQuery && matchesStatus && matchesOwnership;
    });
  }, [session?.user?.username, ticketOwnershipFilter, ticketQuery, ticketStatusFilter, tickets]);

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

  if (isSessionChecking) {
    return (
      <div className="employee-login-page employee-session-loading" role="status" aria-live="polite">
        <div className="employee-session-loading-card">
          <span className="employee-session-loading-mark" aria-hidden="true">AS</span>
          <strong>Checking employee access</strong>
          <p>Connecting to the secure workspace...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="employee-login-page">
        <header className="employee-login-header">
          <Link className="employee-login-brand" to="/">
            <span aria-hidden="true">AS</span>
            <div>
              <strong>Animus Operations</strong>
              <small>Secure employee workspace</small>
            </div>
          </Link>
          <Link className="employee-login-back" to="/">Back to website</Link>
        </header>

        <main className="employee-login-main">
          <section className="employee-login-intro" aria-labelledby="employee-login-title">
            <p className="section-kicker">Staff access</p>
            <h1 id="employee-login-title">One place to run customer operations.</h1>
            <p>Access the ticket inbox, CRM records, assignments, and customer activity through the protected employee workspace.</p>
            <ul>
              <li>Customer requests and replies</li>
              <li>CRM contacts and operational records</li>
              <li>Role-based employee administration</li>
            </ul>
          </section>

          <section className="employee-login-card" aria-label="Employee sign in">
            <div className="employee-login-card-head">
              <p className="section-kicker">Employee sign in</p>
              <h2>Welcome back</h2>
              <p>Use your work account to continue.</p>
            </div>

            <form className="employee-login-form" onSubmit={handleLogin}>
              <label htmlFor="admin-username">Work email or username</label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="name@company.com"
                required
              />

              <div className="employee-password-label">
                <label htmlFor="admin-password">Password</label>
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />

              <button className="btn dark-btn employee-login-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in to workspace"}
              </button>
            </form>

            <div className="employee-login-divider"><span>or</span></div>
            <a className="btn ghost-btn employee-microsoft-login" href="/api/admin/microsoft/start">
              Continue with Microsoft 365
            </a>

            <p className="employee-login-status" aria-live="polite">{status}</p>
            <p className="employee-client-handoff">Looking for your requests? <Link to="/portal">Open the client portal</Link>.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <AdminShell user={session?.user}>
      <main className="container submissions-main">
        <header className="submissions-hero">
          <div>
            <p className="section-kicker">Customer operations</p>
            <h1>Ticket inbox</h1>
            <p>Prioritize requests, assign clear ownership, and move every customer issue forward.</p>
            {latestUpdated ? (
              <p className="submissions-meta">Queue updated {formatRelativeDate(latestUpdated)}</p>
            ) : null}
          </div>
          <div className="submissions-actions">
            <button className="btn ghost-btn" onClick={handleExport} disabled={!tickets.length}>
              Export CSV
            </button>
            <button className="btn dark-btn" onClick={fetchTickets} disabled={!session?.user || isLoading}>
              {isLoading ? "Refreshing..." : "Refresh queue"}
            </button>
          </div>
        </header>

        {status ? <p className="submissions-status" role="status">{status}</p> : null}

        {session?.user ? (
          <>
            <section className="ticket-metrics" aria-label="Ticket queue summary">
              <article><span>Total requests</span><strong>{ticketMetrics.total}</strong><small>All intake sources</small></article>
              <article><span>New</span><strong>{ticketMetrics.new}</strong><small>Awaiting first action</small></article>
              <article><span>Active</span><strong>{ticketMetrics.active}</strong><small>Still in progress</small></article>
              <article className={ticketMetrics.unassigned ? "needs-attention" : ""}><span>Unassigned</span><strong>{ticketMetrics.unassigned}</strong><small>{ticketMetrics.unassigned ? "Needs an owner" : "Queue covered"}</small></article>
            </section>

            <div className="employee-workspace">
              <section className="ticket-queue-shell" aria-label="Ticket queue">
                <header className="ticket-panel-header">
                  <div><span>Queue</span><h2>Customer requests</h2></div>
                  <strong>{filteredTickets.length}</strong>
                </header>

                <div className="ticket-toolbar">
                  <label className="ticket-search">
                    <span className="sr-only">Search tickets</span>
                    <input
                      type="search"
                      value={ticketQuery}
                      onChange={(event) => setTicketQuery(event.target.value)}
                      placeholder="Search subject, ID, or owner"
                    />
                  </label>
                  <select aria-label="Filter by status" value={ticketStatusFilter} onChange={(event) => setTicketStatusFilter(event.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="received">Received</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select aria-label="Filter by ownership" value={ticketOwnershipFilter} onChange={(event) => setTicketOwnershipFilter(event.target.value)}>
                    <option value="all">Everyone</option>
                    <option value="mine">Assigned to me</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="">NULL</option>
                  </select>
                </div>

                <div className="ticket-queue-list">
                  {filteredTickets.map((ticket) => {
                    const ticketStatus = normalizeStatus(ticket.status);
                    const isSelected = ticket.requestId === selectedTicket?.requestId;

                    return (
                      <button
                        type="button"
                        className={`ticket-queue-item${isSelected ? " is-selected" : ""}`}
                        key={ticket.requestId}
                        onClick={() => fetchTicketDetail(ticket.requestId)}
                        aria-pressed={isSelected}
                      >
                        <span className={`ticket-status-dot status-${ticketStatus}`} aria-hidden="true" />
                        <span className="ticket-queue-copy">
                          <span className="ticket-queue-subject">{ticket.subject || "Untitled request"}</span>
                          <span className="ticket-queue-preview">{ticket.message || ticket.requestId}</span>
                          <span className="ticket-queue-meta">
                            <span>{ticket.assignedTo || "Unassigned"}</span>
                            <span>{ticket.source || "portal"}</span>
                          </span>
                        </span>
                        <span className="ticket-queue-side">
                          <time dateTime={ticket.createdAt}>{formatRelativeDate(ticket.createdAt)}</time>
                          <span className={`ticket-status-pill status-${ticketStatus}`}>{humanize(ticketStatus)}</span>
                        </span>
                      </button>
                    );
                  })}
                  {!filteredTickets.length ? (
                    <div className="ticket-empty-state">
                      <strong>No matching tickets</strong>
                      <p>Adjust the search or filters to see more requests.</p>
                      <button type="button" onClick={() => { setTicketQuery(""); setTicketStatusFilter("all"); setTicketOwnershipFilter("all"); }}>Clear filters</button>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="ticket-detail-shell" aria-label="Selected ticket detail" aria-busy={isDetailLoading}>
                {selectedTicket ? (
                  <>
                    <header className="ticket-detail-header">
                      <div>
                        <span className="ticket-detail-id">{selectedTicket.requestId}</span>
                        <h2>{selectedTicket.subject || "Untitled request"}</h2>
                      </div>
                      <span className={`ticket-status-pill status-${normalizeStatus(selectedTicket.status)}`}>{humanize(selectedTicket.status)}</span>
                    </header>

                    <div className="ticket-detail-meta">
                      <div><span>Created</span><strong>{formatDate(selectedTicket.createdAt)}</strong></div>
                      <div><span>Source</span><strong>{humanize(selectedTicket.source || "portal")}</strong></div>
                      <div><span>Owner</span><strong>{selectedTicket.assignedTo || "Unassigned"}</strong></div>
                    </div>

                    <section className="ticket-message">
                      <span>Customer request</span>
                      <p>{selectedTicket.message || "No additional details were provided."}</p>
                    </section>

                    <section className="ticket-workflow-controls" aria-label="Ticket workflow controls">
                      <div className="ticket-control-card">
                        <div><span>Ownership</span><strong>Assign teammate</strong></div>
                        <select id="ticket-assignee" className="submissions-input" value={selectedAssignee} onChange={(event) => setSelectedAssignee(event.target.value)}>
                          <option value="">Unassigned</option>
                          {users.map((user) => <option key={user.username} value={user.username}>{user.username} ({user.role})</option>)}
                        </select>
                        <button className="btn ghost-btn" type="button" onClick={handleAssign} disabled={isAssigning}>{isAssigning ? "Saving..." : "Save owner"}</button>
                      </div>

                      <div className="ticket-control-card">
                        <div><span>Lifecycle</span><strong>Update status</strong></div>
                        <select id="ticket-status" className="submissions-input" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                          <option value="received">Received</option>
                          <option value="open">Open</option>
                          <option value="in-progress">In progress</option>
                          <option value="waiting">Waiting</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <textarea className="submissions-input" rows={2} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Optional update note" />
                        <button className="btn dark-btn" type="button" onClick={handleStatusUpdate} disabled={isUpdatingStatus}>{isUpdatingStatus ? "Updating..." : "Update status"}</button>
                      </div>
                    </section>

                    <details className="ticket-detail-section">
                      <summary><span><small>CRM actions</small><strong>Notes and follow-up tasks</strong></span><span aria-hidden="true">+</span></summary>
                      <div className="crm-action-panel">
                        <div className="crm-action-card">
                          <strong>Save internal note</strong>
                          <textarea className="submissions-input" rows={4} value={crmNoteBody} onChange={(event) => setCrmNoteBody(event.target.value)} placeholder="Add context for the team" />
                          <button className="btn ghost-btn" type="button" onClick={handleCreateCrmNote} disabled={isCreatingCrmNote}>{isCreatingCrmNote ? "Saving..." : "Save note"}</button>
                        </div>
                        <div className="crm-action-card">
                          <strong>Create follow-up task</strong>
                          <input className="submissions-input" type="text" value={crmTaskTitle} onChange={(event) => setCrmTaskTitle(event.target.value)} placeholder="Task title" />
                          <textarea className="submissions-input" rows={3} value={crmTaskDescription} onChange={(event) => setCrmTaskDescription(event.target.value)} placeholder="Optional description" />
                          <input className="submissions-input" type="date" value={crmTaskDueDate} onChange={(event) => setCrmTaskDueDate(event.target.value)} />
                          <button className="btn dark-btn" type="button" onClick={handleCreateCrmTask} disabled={isCreatingCrmTask}>{isCreatingCrmTask ? "Creating..." : "Create task"}</button>
                        </div>
                      </div>
                    </details>

                    <details className="ticket-detail-section" open>
                      <summary><span><small>History</small><strong>Customer and team timeline</strong></span><span aria-hidden="true">+</span></summary>
                      <div className="timeline-list">
                        {(selectedTicket.timeline || []).map((event) => (
                          <article key={event.id || `${event.type}-${event.createdAt}`} className="timeline-item">
                            <span className="timeline-marker" aria-hidden="true" />
                            <div><strong>{humanize(event.type)}</strong><p>{event.note || "Status updated."}</p><span>{event.actor || "system"}</span></div>
                            <time>{formatRelativeDate(event.createdAt)}</time>
                          </article>
                        ))}
                        {!selectedTicket.timeline?.length ? <p className="submissions-meta">No timeline events yet.</p> : null}
                      </div>
                    </details>

                    <details className="ticket-detail-section">
                      <summary><span><small>CRM history</small><strong>Notes, tasks, and assignment audit</strong></span><span aria-hidden="true">+</span></summary>
                      <div className="timeline-list">
                        {isActivityLoading ? <p className="submissions-meta">Loading CRM activity...</p> : null}
                        {crmActivity.map((item) => (
                          <article key={item.id} className="timeline-item">
                            <span className="timeline-marker" aria-hidden="true" />
                            <div><strong>{item.type === "task" ? "Task" : item.type === "note" ? "Note" : "Activity"}</strong><p>{item.title || item.body || "CRM record created."}</p></div>
                            <time>{formatRelativeDate(item.createdAt)}</time>
                          </article>
                        ))}
                        {assignmentEvents.map((event) => (
                          <article key={`assignment-${event.id || `${event.type}-${event.createdAt}`}`} className="timeline-item">
                            <span className="timeline-marker" aria-hidden="true" />
                            <div><strong>Assignment</strong><p>{event.note || "Assignment updated."}</p><span>{event.actor || "system"}</span></div>
                            <time>{formatRelativeDate(event.createdAt)}</time>
                          </article>
                        ))}
                        {!isActivityLoading && !crmActivity.length && !assignmentEvents.length ? <p className="submissions-meta">No CRM or assignment activity yet.</p> : null}
                      </div>
                    </details>
                  </>
                ) : (
                  <div className="ticket-detail-empty">
                    <span aria-hidden="true">↗</span>
                    <strong>Select a customer request</strong>
                    <p>Choose a ticket from the queue to review its context, owner, status, and history.</p>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}

        {session?.user?.role === "admin" ? (
          <section className="user-admin-shell card-raise">
            <header className="user-admin-header">
              <div>
                <p className="section-kicker">Administration</p>
                <h2>Employee access</h2>
                <p>Create staff accounts and review current workspace permissions.</p>
              </div>
              <span>{users.length} team {users.length === 1 ? "member" : "members"}</span>
            </header>
            <form className="submissions-unlock" onSubmit={handleCreateUser}>
              <label className="submissions-label" htmlFor="new-username">
                <span>Work email or username</span>
                <input id="new-username" className="submissions-input" type="text" value={newUser.username} onChange={(event) => setNewUser((prev) => ({ ...prev, username: event.target.value }))} placeholder="teammate@company.com" />
              </label>
              <label className="submissions-label" htmlFor="new-password">
                <span>Temporary password</span>
                <input id="new-password" className="submissions-input" type="password" minLength={8} value={newUser.password} onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))} placeholder="At least 8 characters" />
              </label>
              <label className="submissions-label" htmlFor="new-role">
                <span>Workspace role</span>
                <select id="new-role" className="submissions-input" value={newUser.role} onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button className="btn dark-btn" type="submit" disabled={isLoading}>
                Add team member
              </button>
            </form>

            <div className="user-chip-list">
              {users.map((user) => (
                <div className="user-chip" key={user.username}>
                  <span className="user-chip-avatar" aria-hidden="true">{String(user.username || "U").slice(0, 1).toUpperCase()}</span>
                  <div><strong>{user.username}</strong><span>{humanize(user.role)}</span></div>
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
