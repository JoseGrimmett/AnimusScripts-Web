import React, { useEffect, useState } from "react";
import "./NavBar.css";
import { Link } from "react-scroll";
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
  };

  const closeMenu = () => {
    setMobileMenu(false);
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
        <li><Link to="hero" smooth={true} offset={-80} duration={500} onClick={closeMenu}>Home</Link></li>
        <li><Link to="case-studies" smooth={true} offset={-120} duration={500} onClick={closeMenu}>Work</Link></li>
        <li><Link to="program" smooth={true} offset={-120} duration={500} onClick={closeMenu}>Services</Link></li>
        <li><Link to="about" smooth={true} offset={-120} duration={500} onClick={closeMenu}>About</Link></li>
        <li><Link to="contact" smooth={true} offset={-120} duration={500} onClick={closeMenu} className="nav-cta">Book a call</Link></li>
      </ul>

      <button className="menu-icon" onClick={toggleMenu} aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
};

export default NavBar;
