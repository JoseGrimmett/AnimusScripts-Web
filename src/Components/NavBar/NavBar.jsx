import React, { useEffect, useState } from "react";
import "./NavBar.css";
import { Link } from "react-scroll";
import ASLogo from "../../assets/AnimusSciptsLogo.png"
const NavBar = () => {

  const [sticky, setSticky] = useState(false);

  useEffect(()=>{
    window.addEventListener('scroll', ()=>{window.scrollY > 500 ? setSticky(true) : setSticky(false) })
  },[]);
  const [mobileMenu,setMobileMenu] = useState(false)
  const toggleMenu = ()=>{
    mobileMenu? setMobileMenu(false) :setMobileMenu(true)
  }

  return (
    <nav className={`container ${sticky? 'dark-nav' : ''}`}>
      <div>
         <img src={ASLogo} alt="Animus Scripts" className="logo" /> 
      </div>
      <ul className={mobileMenu?'':'hide-mobile-menu'}>
        <li><Link to="hero" smooth={true} offset={0} duration={500}>Home</Link></li>
        <li><Link to="program" smooth={true} offset={-260} duration={500}>Solutions</Link></li>
        <li><Link to="about" smooth={true} offset={-150} duration={500}>About</Link></li>
        {/*  <li><Link to="campus" smooth={true} offset={0} duration={500}>Projects</Link></li> */}
        {/*  <li><Link to="testimonials" smooth={true} offset={-260} duration={500}>Testimonals</Link></li> */}
        <li><Link to="contact" smooth={true} offset={-260} duration={500} className="btn">Contact </Link></li>
      </ul>
      <img src={ASLogo} alt="" className="menu-icon" onClick={toggleMenu}/>
    </nav>
  );
};

export default NavBar;
