import React, { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import "./SubmissionsPage.css";

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
    "kind",
    "name",
    "company",
    "email",
    "processNeedsImprovement",
    "currentTools",
    "timeline",
    "source",
    "context",
  ];

  const rows = items.map((item) =>
    [
      item.createdAt,
      item.kind,
      item.name,
      item.company,
      item.email,
      item.processNeedsImprovement,
      item.currentTools,
      item.timeline,
      item.source,
      item.context,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [headers.map(csvEscape).join(","), ...rows].join("\n");
};

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState("Sign in to view submissions.");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    setSubmissions([]);
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

  const fetchSubmissions = useCallback(async () => {
    if (!session?.token && !session?.user) {
      const activeSession = await fetchSession();

      if (!activeSession) {
        setStatus("Sign in to view submissions.");
        return;
      }

      setSession(activeSession);
    }

    setIsLoading(true);
    setStatus("Loading submissions...");

    try {
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const response = await fetch("/api/admin/submissions?limit=100", {
        headers: authHeader,
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          clearSession();
          throw new Error("Session expired. Please sign in again.");
        }

        throw new Error(payload?.error || "Failed to load submissions");
      }

      setSubmissions(payload.submissions || []);
      setStatus(payload.submissions?.length ? "" : "No submissions found yet.");
    } catch (error) {
      setStatus(error.message || "Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, fetchSession, session?.token, session?.user]);

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
      setStatus("Signed in.");
    } catch (error) {
      setStatus(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // no-op
    }

    clearSession();
    setPassword("");
    setStatus("Signed out.");
  };

  useEffect(() => {
    if (session?.token || session?.user) {
      fetchSubmissions();
      return;
    }

    fetchSession().then((activeSession) => {
      if (activeSession) {
        setSession(activeSession);
        return;
      }

      setSubmissions([]);
    });
  }, [fetchSession, fetchSubmissions, session?.token, session?.user]);

  const latestUpdated = useMemo(() => {
    if (!submissions.length) {
      return null;
    }

    return submissions[0].createdAt;
  }, [submissions]);

  const handleExport = () => {
    if (!submissions.length) {
      return;
    }

    const blob = new Blob([buildCsv(submissions)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `animus-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="site-shell">
      <NavBar />
      <main className="container submissions-main">
        <section className="submissions-hero">
          <p className="section-kicker">Internal Admin</p>
          <h1>Admin submissions dashboard</h1>
          <p>
            Sign in with admin credentials to review contact and lead captures stored in the database.
          </p>
          <form className="submissions-unlock" onSubmit={handleLogin}>
            <label className="submissions-label" htmlFor="admin-username">
              Admin username
            </label>
            <div className="submissions-input-row">
              <input
                id="admin-username"
                className="submissions-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter admin username"
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
                {session?.user ? "Sign in again" : "Sign in"}
              </button>
              <button className="btn ghost-btn" type="button" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </form>
          <div className="submissions-actions">
            <a className="btn ghost-btn" href="/api/admin/microsoft/start">
              Continue with Microsoft 365
            </a>
            <button className="btn dark-btn" onClick={fetchSubmissions} disabled={!session?.user || isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="btn ghost-btn" onClick={handleExport} disabled={!submissions.length}>
              Export CSV
            </button>
          </div>
          {session?.user?.username ? (
            <p className="submissions-meta">Signed in as {session.user.username}</p>
          ) : null}
          {latestUpdated ? (
            <p className="submissions-meta">Latest update: {formatDate(latestUpdated)}</p>
          ) : null}
        </section>

        {status ? <p className="submissions-status">{status}</p> : null}

        {session?.user ? (
          <section className="submissions-list" aria-label="Recent submissions">
            {submissions.map((submission) => (
              <article className="submission-card card-raise" key={submission.requestId}>
                <div className="submission-card-header">
                  <div>
                    <p className="submission-kind">{submission.kind}</p>
                    <h2>{submission.name || submission.email || "Unnamed submission"}</h2>
                  </div>
                  <span className="submission-date">{formatDate(submission.createdAt)}</span>
                </div>
                <div className="submission-grid">
                  <div>
                    <strong>Company</strong>
                    <span>{submission.company || "-"}</span>
                  </div>
                  <div>
                    <strong>Email</strong>
                    <span>{submission.email || "-"}</span>
                  </div>
                  <div>
                    <strong>Timeline</strong>
                    <span>{submission.timeline || "-"}</span>
                  </div>
                  <div>
                    <strong>Source</strong>
                    <span>{submission.source || "-"}</span>
                  </div>
                </div>
                <div className="submission-notes">
                  <div>
                    <strong>Process to improve</strong>
                    <p>{submission.processNeedsImprovement || "-"}</p>
                  </div>
                  <div>
                    <strong>Current tools</strong>
                    <p>{submission.currentTools || "-"}</p>
                  </div>
                  {submission.context ? (
                    <div>
                      <strong>Context</strong>
                      <p>{submission.context}</p>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default SubmissionsPage;
