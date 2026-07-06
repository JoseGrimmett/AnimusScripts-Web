import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import "./PortalPage.css";
import { emitAuthChanged, emitToast } from "../utils/uiEvents";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const PortalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    message: "",
  });
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [status, setStatus] = useState("Sign in to view your tickets.");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/session", {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const payload = await response.json();

      if (payload?.ok && payload?.user) {
        setUser(payload.user);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setIsTicketsLoading(true);
    setStatus("Loading tickets...");

    try {
      const response = await fetch("/api/portal/tickets?limit=100", {
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load tickets");
      }

      setTickets(payload.tickets || []);
      setSelectedTicket((prev) => {
        if (!prev?.requestId) {
          return prev;
        }

        return payload.tickets?.some((ticket) => ticket.requestId === prev.requestId) ? prev : null;
      });
      setStatus(payload.tickets?.length ? "" : "No tickets yet. Submit your first request below.");
    } catch (error) {
      setStatus(error.message || "Failed to load tickets");
    } finally {
      setIsTicketsLoading(false);
    }
  }, []);

  const loadTicketDetail = useCallback(async (requestId) => {
    if (!requestId) {
      return;
    }

    setIsDetailLoading(true);
    setStatus("Loading ticket details...");

    try {
      const response = await fetch(`/api/portal/tickets?requestId=${encodeURIComponent(requestId)}`, {
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load ticket details");
      }

      setSelectedTicket(payload.ticket || null);
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Failed to load ticket details");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const notice = params.get("notice");

    if (notice === "employee-access-required") {
      const message = "Employee access is required for the admin workspace. Sign in with an employee account.";
      setStatus(message);
      emitToast({ message, type: "warning", duration: 4200 });
      navigate("/portal", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!user) {
      setTickets([]);
      setSelectedTicket(null);
      return;
    }

    loadTickets();
  }, [loadTickets, user]);

  const handleAuthInput = (field) => (event) => {
    setAuthForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleTicketInput = (field) => (event) => {
    setTicketForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setIsAuthLoading(true);
    setStatus(mode === "login" ? "Signing in..." : "Creating account...");

    const endpoint = mode === "login" ? "/api/portal/login" : "/api/portal/signup";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(authForm),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Authentication failed");
      }

      setUser(payload.user);
      setAuthForm((prev) => ({
        ...prev,
        password: "",
      }));
      setStatus(mode === "login" ? "Signed in." : "Account created and signed in.");
      setSelectedTicket(null);
      emitAuthChanged();
      emitToast({
        message: mode === "login" ? "Login successful." : "Account created and signed in.",
        type: "success",
      });
    } catch (error) {
      setStatus(error.message || "Authentication failed");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/portal/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // no-op
    }

    setUser(null);
    setSelectedTicket(null);
    setStatus("Signed out.");
    emitAuthChanged();
    emitToast({ message: "Signed out successfully.", type: "success" });
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      setStatus("Subject and message are required.");
      return;
    }

    setIsSubmittingTicket(true);
    setStatus("Submitting ticket...");

    try {
      const response = await fetch("/api/portal/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(ticketForm),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create ticket");
      }

      setTicketForm({ subject: "", message: "" });
      setStatus("Ticket submitted.");
      await loadTickets();
      if (payload.ticket?.requestId) {
        await loadTicketDetail(payload.ticket.requestId);
      }
    } catch (error) {
      setStatus(error.message || "Failed to create ticket");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const signedInLabel = useMemo(() => {
    if (!user) {
      return null;
    }

    return user.displayName || user.email;
  }, [user]);

  return (
    <div className="site-shell">
      <NavBar />
      <main className="container portal-main">
        <section className="portal-hero">
          <p className="section-kicker">Client Portal</p>
          <h1>Track requests as tickets</h1>
          <p>
            Sign up or sign in to see your requests and submit new tickets. You only see records linked to your account email.
          </p>
          {signedInLabel ? <p className="portal-signed-in">Signed in as {signedInLabel}</p> : null}
          <div className="portal-actions">
            <button className="btn dark-btn" onClick={loadTickets} disabled={!user || isTicketsLoading}>
              {isTicketsLoading ? "Refreshing..." : "Refresh tickets"}
            </button>
            <button className="btn ghost-btn" onClick={handleSignOut} disabled={!user}>
              Sign out
            </button>
          </div>
        </section>

        {!user ? (
          <section className="portal-auth card-raise">
            <div className="portal-mode-toggle">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </div>
            <form className="portal-form" onSubmit={handleAuthSubmit}>
              {mode === "signup" ? (
                <label>
                  Display name (optional)
                  <input type="text" value={authForm.displayName} onChange={handleAuthInput("displayName")} />
                </label>
              ) : null}
              <label>
                Email
                <input type="email" value={authForm.email} onChange={handleAuthInput("email")} required />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={handleAuthInput("password")}
                  required
                  minLength={8}
                />
              </label>
              <button className="btn dark-btn" type="submit" disabled={isAuthLoading}>
                {isAuthLoading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="portal-ticket-create card-raise">
              <h2>Submit a new ticket</h2>
              <form className="portal-form" onSubmit={handleCreateTicket}>
                <label>
                  Subject
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={handleTicketInput("subject")}
                    maxLength={140}
                    required
                  />
                </label>
                <label>
                  Request details
                  <textarea
                    value={ticketForm.message}
                    onChange={handleTicketInput("message")}
                    maxLength={5000}
                    rows={5}
                    required
                  />
                </label>
                <button className="btn dark-btn" type="submit" disabled={isSubmittingTicket}>
                  {isSubmittingTicket ? "Submitting..." : "Create ticket"}
                </button>
              </form>
            </section>

            <section className="portal-ticket-list">
              <h2>Your tickets</h2>
              <div className="portal-ticket-grid">
                {tickets.map((ticket) => (
                  <article className="portal-ticket card-raise" key={ticket.requestId}>
                    <div className="portal-ticket-head">
                      <h3>{ticket.subject}</h3>
                      <span className={`ticket-status ticket-${ticket.status || "open"}`}>{ticket.status || "open"}</span>
                    </div>
                    <p>{ticket.message}</p>
                    <div className="portal-ticket-meta">
                      <span>#{ticket.requestId}</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                      <span>{ticket.source}</span>
                    </div>
                    <div className="portal-ticket-actions">
                      <button
                        type="button"
                        className="btn ghost-btn"
                        onClick={() => loadTicketDetail(ticket.requestId)}
                        disabled={isDetailLoading}
                      >
                        {isDetailLoading && selectedTicket?.requestId === ticket.requestId
                          ? "Loading..."
                          : "View details"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {selectedTicket ? (
              <section className="portal-ticket-detail card-raise">
                <h2>Ticket details</h2>
                <div className="portal-ticket-detail-head">
                  <h3>{selectedTicket.subject}</h3>
                  <span className={`ticket-status ticket-${selectedTicket.status || "open"}`}>
                    {selectedTicket.status || "open"}
                  </span>
                </div>
                <p className="portal-ticket-detail-message">{selectedTicket.message}</p>
                <div className="portal-ticket-meta">
                  <span>#{selectedTicket.requestId}</span>
                  <span>{formatDate(selectedTicket.createdAt)}</span>
                  <span>{selectedTicket.source}</span>
                </div>

                <h3 className="portal-timeline-title">Timeline</h3>
                <div className="portal-timeline">
                  {(selectedTicket.timeline || []).map((event) => (
                    <article className="portal-timeline-item" key={event.id || `${event.type}-${event.createdAt}`}>
                      <div className="portal-timeline-item-head">
                        <strong>{String(event.type || "update").replaceAll("_", " ")}</strong>
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                      <p>{event.note || "Status updated."}</p>
                      <div className="portal-ticket-meta">
                        <span>{event.actor || "system"}</span>
                        <span>{event.status || "n/a"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        {status ? <p className="portal-status">{status}</p> : null}
      </main>
      <Footer />
    </div>
  );
};

export default PortalPage;
