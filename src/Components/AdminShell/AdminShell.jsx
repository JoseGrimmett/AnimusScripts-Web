import React from "react";
import { NavLink } from "react-router-dom";
import "./AdminShell.css";

const AdminShell = ({ user, children }) => {
  const handleSignOut = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => null);
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

      <nav className="admin-nav">
        <NavLink to="/admin" end className={({ isActive }) => isActive ? "active" : ""}>
          <span aria-hidden="true">01</span>
          Ticket inbox
        </NavLink>
        <NavLink to="/admin/crm" className={({ isActive }) => isActive ? "active" : ""}>
          <span aria-hidden="true">02</span>
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
            <button type="button" className="admin-signout" onClick={handleSignOut}>Sign out</button>
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
