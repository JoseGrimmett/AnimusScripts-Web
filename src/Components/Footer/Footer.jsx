import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className='footer'>
      <div>
        <p>© 2026 Animus Scripts. Operational software systems for modern teams.</p>
        <p className="footer-sub">We turn operational chaos into reliable software systems.</p>
      </div>
      <ul>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/what-we-build">What We Build</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </footer>
  )
}

export default Footer