import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./NavBar.css";
import { Link, NavLink, useLocation } from "react-router-dom";
import ASLogo from "../../assets/AnimusSciptsLogo.png";
import { AUTH_CHANGED_EVENT, emitAuthChanged, emitToast } from "../../utils/uiEvents";

const NavBar = () => {
  const location = useLocation();
  const [sticky, setSticky] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspacesMenuOpen, setWorkspacesMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [portalUser, setPortalUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 480);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadAuthState = useCallback(async () => {
    setIsAuthLoading(true);

    try {
      const [adminResponse, portalResponse] = await Promise.all([
        fetch("/api/admin/session", { credentials: "include" }),
        fetch("/api/portal/session", { credentials: "include" }),
      ]);

      if (adminResponse.ok) {
        const adminPayload = await adminResponse.json();
        setAdminUser(adminPayload?.user || null);
      } else {
        setAdminUser(null);
      }

      if (portalResponse.ok) {
        const portalPayload = await portalResponse.json();
        setPortalUser(portalPayload?.user || null);
      } else {
        setPortalUser(null);
      }
    } catch {
      setAdminUser(null);
      setPortalUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleAuthChanged = () => {
      loadAuthState();
    };

    loadAuthState();
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("focus", handleAuthChanged);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("focus", handleAuthChanged);
    };
  }, [loadAuthState, location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".utility-user") && !event.target.closest(".utility-workspaces") && !event.target.closest(".nav-login")) {
        setUserMenuOpen(false);
        setWorkspacesMenuOpen(false);
        setLoginMenuOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleMenu = () => {
    setMobileMenu((prev) => !prev);
  };

  const closeMenu = () => {
    setMobileMenu(false);
    setUserMenuOpen(false);
    setWorkspacesMenuOpen(false);
    setLoginMenuOpen(false);
  };

  const toggleUserMenu = (event) => {
    event.stopPropagation();
    setUserMenuOpen((prev) => !prev);
  };

  const toggleWorkspacesMenu = (event) => {
    event.stopPropagation();
    setWorkspacesMenuOpen((prev) => !prev);
  };

  const toggleLoginMenu = (event) => {
    event.stopPropagation();
    setLoginMenuOpen((prev) => !prev);
    setUserMenuOpen(false);
    setWorkspacesMenuOpen(false);
  };

  const navClassName = ({ isActive }) => (isActive ? "nav-active" : "");

  const isEmployee = useMemo(() => {
    if (!adminUser?.role) {
      return false;
    }

    return adminUser.role === "employee" || adminUser.role === "admin";
  }, [adminUser?.role]);

  const hasAdminSession = Boolean(adminUser);
  const hasPortalSession = Boolean(portalUser);
  const hasAnySession = hasAdminSession || hasPortalSession;
  const userLabel = adminUser?.username || portalUser?.displayName || portalUser?.email || "User";

  const handleSignOut = async () => {
    await Promise.allSettled([
      fetch("/api/admin/logout", { method: "POST", credentials: "include" }),
      fetch("/api/portal/logout", { method: "POST", credentials: "include" }),
    ]);

    localStorage.removeItem("animusAdminSession");
    setAdminUser(null);
    setPortalUser(null);
    setUserMenuOpen(false);
    emitAuthChanged();
    emitToast({ message: "Signed out successfully.", type: "success" });
  };

  const roleLabel = adminUser?.role || (portalUser ? "client" : "guest");
  const activeWorkspace = useMemo(() => {
    if (location.pathname === "/admin/crm") {
      return "crm";
    }

    if (location.pathname === "/admin" || location.pathname === "/submissions") {
      return "tickets";
    }

    return null;
  }, [location.pathname]);

  return (
    <>
      <nav className={`navbar ${sticky ? "dark-nav" : ""}`}>
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <img src={ASLogo} alt="Animus Scripts logo" className="logo" />
          <div>
            <span>Animus Scripts</span>
            <small>Operational software consultancy</small>
          </div>
        </Link>

        <ul className={`nav-links ${mobileMenu ? "open" : "hide-mobile-menu"}`}>
          <li>
            <NavLink to="/" onClick={closeMenu} className={navClassName} end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/services" onClick={closeMenu} className={navClassName}>
              Services
            </NavLink>
          </li>
          <li>
            <NavLink to="/what-we-build" onClick={closeMenu} className={navClassName}>
              What We Build
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" onClick={closeMenu} className={navClassName}>
              About
            </NavLink>
          </li>
          {isEmployee ? (
            <li className="employee-nav-item">
              <NavLink to="/admin" onClick={closeMenu} className={navClassName}>
                Tickets
              </NavLink>
            </li>
          ) : null}
          {isEmployee ? (
            <li className="employee-nav-item">
              <NavLink to="/admin/crm" onClick={closeMenu} className={navClassName}>
                CRM
              </NavLink>
            </li>
          ) : null}
          <li>
            <NavLink to="/portal" onClick={closeMenu} className={navClassName}>
              Portal
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" onClick={closeMenu} className="nav-cta">
              Contact
            </NavLink>
          </li>
          {!hasAnySession && !isAuthLoading ? (
            <li className="auth-nav-item nav-login nav-login-mobile">
              <button type="button" className="login-trigger" onClick={toggleLoginMenu} aria-expanded={loginMenuOpen}>
                Login
              </button>
              {loginMenuOpen ? (
                <div className="login-menu">
                  {!hasAdminSession ? (
                    <Link to="/admin" onClick={closeMenu}>
                      <strong>Employee workspace</strong>
                      <span>Dashboard, inbox, and CRM</span>
                    </Link>
                  ) : null}
                  {!hasPortalSession ? (
                    <Link to="/portal" onClick={closeMenu}>
                      <strong>Client portal</strong>
                      <span>Requests, replies, and status</span>
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </li>
          ) : null}
        </ul>

        <div className="nav-utility">
          <div className="utility-message">Operational Service Desk</div>
          {isEmployee ? (
            <div className="utility-workspaces">
              <button className="utility-workspaces-btn" onClick={toggleWorkspacesMenu} aria-expanded={workspacesMenuOpen}>
                Workspaces
              </button>

              {workspacesMenuOpen && (
                <div className="utility-menu utility-workspaces-menu">
                  <p className="utility-menu-title">Employee Workspaces</p>
                  <p className="utility-menu-copy">Choose the internal area you want to open.</p>
                  <div className="utility-menu-divider" />
                  <Link
                    to="/admin"
                    onClick={() => setWorkspacesMenuOpen(false)}
                    className={activeWorkspace === "tickets" ? "utility-menu-link active" : "utility-menu-link"}
                  >
                    <span className="utility-menu-link-title">Ticket Workspace</span>
                    <span className="utility-menu-link-subtitle">Queue, assignment, and ticket status</span>
                  </Link>
                  <Link
                    to="/admin/crm"
                    onClick={() => setWorkspacesMenuOpen(false)}
                    className={activeWorkspace === "crm" ? "utility-menu-link active" : "utility-menu-link"}
                  >
                    <span className="utility-menu-link-title">CRM Workspace</span>
                    <span className="utility-menu-link-subtitle">Contacts, leads, and CRM records</span>
                  </Link>
                </div>
              )}
            </div>
          ) : null}
          {!hasAnySession && !isAuthLoading ? (
            <div className="nav-login nav-login-desktop">
              <button type="button" className="login-trigger" onClick={toggleLoginMenu} aria-expanded={loginMenuOpen}>
                Login
              </button>
              {loginMenuOpen ? (
                <div className="login-menu">
                  <p>Choose your workspace</p>
                  {!hasAdminSession ? (
                    <Link to="/admin" onClick={closeMenu}>
                      <strong>Employee workspace</strong>
                      <span>Dashboard, inbox, and CRM</span>
                    </Link>
                  ) : null}
                  {!hasPortalSession ? (
                    <Link to="/portal" onClick={closeMenu}>
                      <strong>Client portal</strong>
                      <span>Requests, replies, and status</span>
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {hasAnySession ? (
            <div className="utility-user">
              <button className="utility-user-btn" onClick={toggleUserMenu} aria-expanded={userMenuOpen}>
                <span className="user-avatar">AS</span>
                <span className="user-label">{userLabel}</span>
              </button>

              {userMenuOpen && (
                <div className="utility-menu">
                  <p className="utility-menu-title">User Options</p>
                  <span className="utility-role-badge">Role: {roleLabel}</span>
                  <Link to="/portal" onClick={() => setUserMenuOpen(false)}>My Tickets</Link>
                  <Link to="/about" onClick={() => setUserMenuOpen(false)}>Profile Info</Link>
                  <Link to="/services" onClick={() => setUserMenuOpen(false)}>Services</Link>
                  <Link to="/contact" onClick={() => setUserMenuOpen(false)}>Support</Link>
                  <button type="button" onClick={handleSignOut}>Sign Out</button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <button
          className={`menu-icon ${mobileMenu ? "open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {mobileMenu && (
          <div className="mobile-menu-overlay" onClick={closeMenu} />
        )}
      </nav>
    </>
  );
};

export default NavBar;
