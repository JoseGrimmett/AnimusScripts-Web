import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "../Components/AdminShell/AdminShell";
import "./AdminDashboardPage.css";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};

const humanize = (value) => String(value || "update").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const AdminDashboardPage = () => {
  const [session, setSession] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState("Loading operations overview...");

  const loadDashboard = useCallback(async () => {
    setStatus("Refreshing operations overview...");
    try {
      const [sessionResponse, dashboardResponse] = await Promise.all([
        fetch("/api/admin/session", { credentials: "include" }),
        fetch("/api/admin/crm?mode=dashboard", { credentials: "include" }),
      ]);
      const [sessionPayload, dashboardPayload] = await Promise.all([sessionResponse.json(), dashboardResponse.json()]);
      if (!dashboardResponse.ok) throw new Error(dashboardPayload?.error || "Failed to load dashboard");
      setSession(sessionResponse.ok ? sessionPayload : null);
      setDashboard(dashboardPayload);
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Failed to load dashboard");
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const maxStatus = Math.max(1, ...Object.values(dashboard?.statuses || {}));
  const metrics = dashboard?.metrics || {};

  return (
    <AdminShell user={session?.user}>
      <main className="ops-dashboard">
        <header className="ops-dashboard-head">
          <div>
            <p className="section-kicker">Operations overview</p>
            <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}.</h1>
            <p>Here’s what needs attention across customers and delivery.</p>
          </div>
          <div className="ops-head-actions">
            <button type="button" className="btn ghost-btn" onClick={loadDashboard}>Refresh</button>
            <Link className="btn dark-btn" to="/admin">Open ticket inbox</Link>
          </div>
        </header>

        {status ? <p className="ops-dashboard-status" role="status">{status}</p> : null}

        <section className="ops-kpis" aria-label="Key performance indicators">
          <article className="ops-kpi ops-kpi-primary"><span>Active work</span><strong>{metrics.active ?? "—"}</strong><small>{metrics.newLast7Days ?? 0} new in 7 days</small></article>
          <article className="ops-kpi"><span>Unassigned</span><strong>{metrics.unassigned ?? "—"}</strong><small>{metrics.unassigned ? "Needs an owner" : "Queue is covered"}</small></article>
          <article className="ops-kpi"><span>Customers</span><strong>{metrics.organizations ?? "—"}</strong><small>{metrics.contacts ?? 0} contacts</small></article>
          <article className="ops-kpi"><span>Open leads</span><strong>{metrics.leads ?? "—"}</strong><small>From all intake sources</small></article>
        </section>

        <div className="ops-dashboard-grid">
          <section className="ops-panel ops-workload">
            <div className="ops-panel-head"><div><span>Workload</span><h2>Ticket health</h2></div><Link to="/admin">View inbox →</Link></div>
            <div className="ops-status-bars">
              {Object.entries(dashboard?.statuses || {}).map(([key, count]) => (
                <div className="ops-status-row" key={key}>
                  <div><span className={`ops-dot ops-dot-${key}`} />{humanize(key)}<strong>{count}</strong></div>
                  <div className="ops-bar"><span style={{ width: `${Math.max(4, (count / maxStatus) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="ops-panel ops-system-records">
            <div className="ops-panel-head"><div><span>System of record</span><h2>CRM coverage</h2></div><Link to="/admin/crm">Explore CRM →</Link></div>
            <div className="ops-record-grid">
              <div><strong>{metrics.organizations ?? 0}</strong><span>Organizations</span></div>
              <div><strong>{metrics.contacts ?? 0}</strong><span>Contacts</span></div>
              <div><strong>{metrics.leads ?? 0}</strong><span>Leads</span></div>
              <div><strong>{metrics.tickets ?? 0}</strong><span>CRM tickets</span></div>
            </div>
          </section>

          <section className="ops-panel ops-recent-work">
            <div className="ops-panel-head"><div><span>Priority queue</span><h2>Recent requests</h2></div><Link to="/admin">Work queue →</Link></div>
            <div className="ops-ticket-list">
              {(dashboard?.recentTickets || []).map((ticket) => (
                <Link to="/admin" className="ops-ticket-row" key={ticket.requestId}>
                  <span className={`ops-ticket-state state-${ticket.status || "open"}`} />
                  <div><strong>{ticket.subject}</strong><span>{ticket.assignedTo || "Unassigned"} · {formatDate(ticket.createdAt)}</span></div>
                  <span className="ops-ticket-status">{humanize(ticket.status)}</span>
                </Link>
              ))}
              {!dashboard?.recentTickets?.length ? <p className="ops-empty">No requests yet. New work will appear here.</p> : null}
            </div>
          </section>

          <section className="ops-panel ops-activity">
            <div className="ops-panel-head"><div><span>Audit stream</span><h2>Recent activity</h2></div></div>
            <div className="ops-activity-list">
              {(dashboard?.activity || []).slice(0, 6).map((event) => (
                <article key={event.id}>
                  <span className="ops-activity-icon" aria-hidden="true">{String(event.actorId || "S").slice(0, 1).toUpperCase()}</span>
                  <div><strong>{humanize(event.action)}</strong><p>{event.actorId || "System"}</p></div>
                  <time>{formatDate(event.createdAt)}</time>
                </article>
              ))}
              {!dashboard?.activity?.length ? <p className="ops-empty">Activity will appear as the team works.</p> : null}
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  );
};

export default AdminDashboardPage;
