import React, { useEffect, useState } from "react";
import "./NavBar.css";
import { Link as ScrollLink } from "react-scroll";
import { Link } from "react-router-dom";
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

  const toggleMenu = () => {
    setMobileMenu((prev) => !prev);
    // Prevent body scroll when menu is open
    if (!mobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  };

  const closeMenu = () => {
    setMobileMenu(false);
    document.body.style.overflow = "unset";
  };

  return (
    <nav className={`navbar ${sticky ? "dark-nav" : ""}`}>
      <div className="nav-brand">
        <img src={ASLogo} alt="Animus Scripts logo" className="logo" />
        <div>
          <span>Animus Scripts</span>
          <small>Software engineering studio</small>
        </div>
      </div>

      <ul className={`nav-links ${mobileMenu ? "open" : "hide-mobile-menu"}`}>
        <li><ScrollLink to="hero" smooth={true} offset={-80} duration={500} onClick={closeMenu}>Home</ScrollLink></li>
        <li><ScrollLink to="case-studies" smooth={true} offset={-120} duration={500} onClick={closeMenu}>Work</ScrollLink></li>
        <li><ScrollLink to="program" smooth={true} offset={-120} duration={500} onClick={closeMenu}>Services</ScrollLink></li>
        <li><ScrollLink to="about" smooth={true} offset={-120} duration={500} onClick={closeMenu}>About</ScrollLink></li>
        <li><Link to="/pricing" onClick={closeMenu}>Pricing</Link></li>
        <li><ScrollLink to="contact" smooth={true} offset={-120} duration={500} onClick={closeMenu} className="nav-cta">Book a call</ScrollLink></li>
      </ul>

      <button className={`menu-icon ${mobileMenu ? "open" : ""}`} onClick={toggleMenu} aria-label="Toggle menu">
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
