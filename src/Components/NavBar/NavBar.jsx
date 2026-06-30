import React, { useEffect, useState } from "react";
import "./NavBar.css";
import { Link, NavLink } from "react-router-dom";
import ASLogo from "../../assets/AnimusSciptsLogo.png";

const NavBar = () => {
  const [sticky, setSticky] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 480);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

  const toggleMenu = () => {
    setMobileMenu((prev) => !prev);
  };

  const closeMenu = () => {
    setMobileMenu(false);
  };

  const navClassName = ({ isActive }) => (isActive ? "nav-active" : "");

  return (
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
        <li>
          <NavLink to="/contact" onClick={closeMenu} className="nav-cta">
            Contact
          </NavLink>
        </li>
      </ul>

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
  );
};

export default NavBar;
