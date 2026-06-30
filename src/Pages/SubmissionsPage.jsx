import React, { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import "./SubmissionsPage.css";

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
  const [status, setStatus] = useState("Locked. Enter the submissions key to continue.");
  const [isLoading, setIsLoading] = useState(true);
  const [accessKey, setAccessKey] = useState(() => localStorage.getItem("animusSubmissionsKey") || "");
  const [keyInput, setKeyInput] = useState(() => localStorage.getItem("animusSubmissionsKey") || "");
  const [isUnlocked, setIsUnlocked] = useState(Boolean(localStorage.getItem("animusSubmissionsKey")));

  const fetchSubmissions = useCallback(async (key) => {
    setIsLoading(true);
    setStatus("Loading submissions...");

    try {
      const headers = key ? { "x-admin-submissions-key": key } : undefined;
      const response = await fetch("/api/submissions?limit=50", { headers });
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setIsUnlocked(false);
          localStorage.removeItem("animusSubmissionsKey");
          throw new Error("Access denied. Enter the correct submissions key.");
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
  }, []);

  const handleUnlock = async (event) => {
    event.preventDefault();

    if (!keyInput.trim()) {
      setStatus("Enter the submissions key.");
      return;
    }

    localStorage.setItem("animusSubmissionsKey", keyInput.trim());
    setAccessKey(keyInput.trim());
    setIsUnlocked(true);
    await fetchSubmissions(keyInput.trim());
  };

  const handleLock = () => {
    localStorage.removeItem("animusSubmissionsKey");
    setAccessKey("");
    setKeyInput("");
    setSubmissions([]);
    setIsUnlocked(false);
    setStatus("Locked. Enter the submissions key to continue.");
  };

  useEffect(() => {
    if (accessKey) {
      fetchSubmissions(accessKey);
      return;
    }

    setIsLoading(false);
  }, [accessKey, fetchSubmissions]);

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
          <h1>Recent intake submissions</h1>
          <p>
            Review the latest contact and lead captures stored in the production database.
          </p>
          <form className="submissions-unlock" onSubmit={handleUnlock}>
            <label className="submissions-label" htmlFor="submissions-key">
              Submissions key
            </label>
            <div className="submissions-unlock-row">
              <input
                id="submissions-key"
                className="submissions-input"
                type="password"
                autoComplete="current-password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder="Enter the internal access key"
              />
              <button className="btn dark-btn" type="submit" disabled={isLoading}>
                {isUnlocked ? "Refresh" : "Unlock"}
              </button>
              <button className="btn ghost-btn" type="button" onClick={handleLock}>
                Lock
              </button>
            </div>
          </form>
          <div className="submissions-actions">
            <button className="btn ghost-btn" onClick={handleExport} disabled={!submissions.length}>
              Export CSV
            </button>
          </div>
          {latestUpdated && isUnlocked ? (
            <p className="submissions-meta">Latest update: {formatDate(latestUpdated)}</p>
          ) : null}
        </section>

        {status ? <p className="submissions-status">{status}</p> : null}

        {isUnlocked ? (
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
