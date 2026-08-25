import React from "react";
import { NavLink } from "react-router-dom";
import { emitAuthChanged } from "../../utils/uiEvents";
import "./AdminShell.css";

const AdminShell = ({ user, children }) => {
  const handleSignOut = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => null);
    localStorage.removeItem("animusAdminSession");
    emitAuthChanged();
    window.location.assign("/admin");
  };

  return (
  <div className="admin-app-shell">
    <aside className="admin-sidebar" aria-label="Staff workspace navigation">
      <div className="admin-brand">
        <span className="admin-brand-mark" aria-hidden="true">AS</span>
        <div>
          <strong>Animus Operations</strong>
          <span>Staff workspace</span>
        </div>
      </div>

      <p className="admin-nav-section-label">Workspace</p>
      <nav className="admin-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
          Overview
        </NavLink>
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 13h4l2 3h4l2-3h4" /></svg>
          Ticket inbox
        </NavLink>
        <NavLink to="/admin/crm" className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19v-2.2C3 14.7 5.2 13 8 13s5 1.7 5 3.8V19ZM14 19v-2c0-1.2-.5-2.3-1.4-3.1.8-.5 1.8-.9 2.9-.9 2.5 0 4.5 1.5 4.5 3.5V19Z" /></svg>
          CRM records
        </NavLink>
      </nav>

      <div className="admin-sidebar-footer">
        {user ? (
          <>
            <div className="admin-user-card">
              <span className="admin-user-avatar" aria-hidden="true">
                {String(user.username || "S").slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{user.username}</strong>
                <span>{user.role || "employee"}</span>
              </div>
            </div>
            <button type="button" className="admin-signout" onClick={handleSignOut}>Sign out of workspace</button>
          </>
        ) : (
          <p>Secure employee access</p>
        )}
        <a href="/" className="admin-public-link">View public website ↗</a>
      </div>
    </aside>

    <div className="admin-app-content">
      <header className="admin-mobile-header">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">AS</span>
          <div><strong>Animus Operations</strong><span>Staff workspace</span></div>
        </div>
        <nav aria-label="Staff workspace navigation">
          <NavLink to="/admin/dashboard">Overview</NavLink>
          <NavLink to="/admin" end>Inbox</NavLink>
          <NavLink to="/admin/crm">CRM</NavLink>
        </nav>
      </header>
      {children}
    </div>
  </div>
  );
};

export default AdminShell;
