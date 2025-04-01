import React from 'react'
import './Campus.css'
import Webicon from "../../assets/AnimusSciptsLogo.png"
const Campus = () => {
  return (
    <div className='campus'>
        <div className='gallery'>
            <img src= {Webicon} alt='' />
            <img src={Webicon} alt='' />
            <img src={Webicon} alt='' />
            <img src={Webicon} alt='' />

        </div>
        <button className='btn dark-btn' >See More Here <img src={Webicon} alt='' /></button>
    </div>
  )
}

export default Campus