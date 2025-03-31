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
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <p>Wabash Alumni</p>
            <p>More text</p>
        </div>
    </div>
  )
}

export default About