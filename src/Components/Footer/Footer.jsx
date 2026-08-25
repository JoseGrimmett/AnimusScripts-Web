import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className='footer'>
      <div className="footer-inner">
        <div className="footer-brand-copy">
          <p className="footer-brand">Animus Scripts</p>
          <p>Operational software systems for modern teams.</p>
          <p className="footer-sub">We turn operational chaos into reliable software systems.</p>
        </div>
        <nav className="footer-navigation" aria-label="Footer navigation">
          <Link to="/services">Services</Link>
          <Link to="/what-we-build">What We Build</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <p className="footer-legal">© 2026 Animus Scripts. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
