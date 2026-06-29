import React from 'react'
import './Footer.css'

const Footer = () => {
  return (
    <footer className='footer'>
      <div>
        <p>© 2025 Animus Scripts. Premium software, thoughtfully delivered.</p>
        <p className="footer-sub">Built for teams that care about product quality and long-term clarity.</p>
      </div>
      <ul>
        <li><a href="mailto:hello@animusscripts.com">Email</a></li>
        <li><a href="#contact">Book a call</a></li>
      </ul>
    </footer>
  )
}

export default Footer