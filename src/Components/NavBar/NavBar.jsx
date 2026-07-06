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
      if (!event.target.closest(".utility-user")) {
        setUserMenuOpen(false);
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
  };

  const toggleUserMenu = (event) => {
    event.stopPropagation();
    setUserMenuOpen((prev) => !prev);
  };

  const navClassName = ({ isActive }) => (isActive ? "nav-active" : "");

  const isEmployee = useMemo(() => {
    if (!adminUser?.role) {
      return false;
    }

    return adminUser.role === "employee" || adminUser.role === "admin";
  }, [adminUser?.role]);

  const hasAnySession = Boolean(adminUser || portalUser);
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
            <li>
              <NavLink to="/admin" onClick={closeMenu} className={navClassName}>
                Admin
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
            <li>
              <NavLink to="/admin" onClick={closeMenu} className={navClassName}>
                Employee Login
              </NavLink>
            </li>
          ) : null}
          {!hasAnySession && !isAuthLoading ? (
            <li>
              <NavLink to="/portal" onClick={closeMenu} className={navClassName}>
                Client Login
              </NavLink>
            </li>
          ) : null}
        </ul>

        <div className="nav-utility">
          <div className="utility-message">Operational Service Desk</div>
          {!hasAnySession && !isAuthLoading ? (
            <div className="utility-auth-links">
              <Link to="/admin" className="utility-auth-link" onClick={closeMenu}>Employee Login</Link>
              <Link to="/portal" className="utility-auth-link" onClick={closeMenu}>Client Login</Link>
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
                {isEmployee ? <Link to="/admin" onClick={() => setUserMenuOpen(false)}>Employee Dashboard</Link> : null}
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
