import React from "react";
import "./DemoShowcase.css";

const DemoShowcase = () => (
  <div className="demo">
    {/* Header */}
    <div className="demo-header">
      <div className="demo-header-left">
        <p className="demo-eyebrow">Animus Scripts · Workflow walkthrough</p>
        <h3 className="demo-title">How your data moves from source to decision</h3>
      </div>
      <div className="demo-live-badge">
        <span className="demo-live-dot" />
        Live
      </div>
    </div>

    {/* Source nodes */}
    <div className="demo-sources">
      <div className="demo-source demo-s1">
        <div className="demo-source-chip demo-chip-blue">ERP</div>
        <span className="demo-source-label">SQL / ERP</span>
        <span className="demo-source-sub">Production data</span>
      </div>
      <div className="demo-source demo-s2">
        <div className="demo-source-chip demo-chip-teal">FRM</div>
        <span className="demo-source-label">Forms / API</span>
        <span className="demo-source-sub">Submissions</span>
      </div>
      <div className="demo-source demo-s3">
        <div className="demo-source-chip demo-chip-indigo">SP</div>
        <span className="demo-source-label">SharePoint</span>
        <span className="demo-source-sub">Lists &amp; files</span>
      </div>
    </div>

    {/* Connector down */}
    <div className="demo-connector demo-conn1">
      <div className="demo-conn-line" />
      <div className="demo-conn-head" />
    </div>

    {/* ETL Pipeline box */}
    <div className="demo-etl">
      <div className="demo-etl-top">
        <span className="demo-etl-label">Python ETL Pipeline</span>
        <span className="demo-etl-status demo-status-run">Running</span>
        <span className="demo-etl-status demo-status-done">Done</span>
      </div>
      <div className="demo-etl-steps">
        <span className="demo-etl-step">Extract</span>
        <span className="demo-etl-sep">→</span>
        <span className="demo-etl-step">Validate</span>
        <span className="demo-etl-sep">→</span>
        <span className="demo-etl-step">Transform</span>
        <span className="demo-etl-sep">→</span>
        <span className="demo-etl-step">Load</span>
      </div>
      <div className="demo-progress-track">
        <div className="demo-progress-fill" />
      </div>
      <div className="demo-etl-log">
        ✓ 1,284 rows processed &nbsp;·&nbsp; 0 errors &nbsp;·&nbsp; audit log written
      </div>
    </div>

    {/* Connector down */}
    <div className="demo-connector demo-conn2">
      <div className="demo-conn-line" />
      <div className="demo-conn-head" />
    </div>

    {/* Dashboard row */}
    <div className="demo-dashboard">
      <div className="demo-kpi demo-kpi1">
        <span className="demo-kpi-label">On-time delivery</span>
        <span className="demo-kpi-value">97.3%</span>
        <span className="demo-kpi-delta">↑ 4.1 pts vs prior period</span>
      </div>
      <div className="demo-kpi demo-kpi2">
        <span className="demo-kpi-label">Open RFQs</span>
        <span className="demo-kpi-value">12</span>
        <span className="demo-kpi-delta">↓ 3 resolved today</span>
      </div>
      <div className="demo-chart">
        <span className="demo-chart-label">Production volume · weekly</span>
        <div className="demo-bars">
          <div className="demo-bar demo-bar1" />
          <div className="demo-bar demo-bar2" />
          <div className="demo-bar demo-bar3" />
          <div className="demo-bar demo-bar4" />
          <div className="demo-bar demo-bar5" />
          <div className="demo-bar demo-bar6" />
        </div>
        <div className="demo-bar-axis">
          <span>Mon</span><span>Tue</span><span>Wed</span>
          <span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
      </div>
    </div>

    {/* Teams notification */}
    <div className="demo-notification">
      <div className="demo-notif-header">
        <span className="demo-notif-dot" />
        Microsoft Teams
      </div>
      <p className="demo-notif-body">
        Pipeline complete · Dashboard refreshed
        <br />
        <span className="demo-notif-check">✓ 0 errors · Audit log ready</span>
      </p>
      <span className="demo-notif-time">just now</span>
    </div>

    {/* Restart label */}
    <div className="demo-restart-label">Replaying in 2s…</div>
  </div>
);

export default DemoShowcase;
