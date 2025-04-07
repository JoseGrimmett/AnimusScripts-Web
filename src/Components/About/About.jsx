import React from 'react'
import './About.css'
import playicon from "../../assets/play-button.png"
import drone from "../../assets/drone.jpg"
const About = ({setPlayState}) => {
  return (
    <div className='about'>
        <div className='about-left'>
            <img src={drone} alt='' className='about-img'/>
            <img src={playicon} alt='' className='play-icon' onClick={() => {setPlayState(true)}}/>
        </div>
        <div className='about-right'>
            <h3>About Animus Scripts</h3>
            <h2>Leaders of Tommorrow</h2>
            <p>Founded in 2025, Animus Scripts is a forward-thinking software contracting company established by a Wabash College graduate with a degree in Computer Science. With a strong foundation in IT and hands-on experience in developing CRM mobile applications and web-based ERP systems, Animus Scripts brings innovation, precision, and efficiency to every project.</p>
            <p>Driven by a passion for technology and a commitment to excellence, we aim to lead the future of software development—empowering businesses with tailored digital solutions that scale and perform.</p>
        </div>
    </div>
  )
}

export default About