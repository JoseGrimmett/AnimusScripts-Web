import React, { useRef } from 'react'
import './Testimonials.css'
import ProfileIcon from "../../assets/profilepic.jpg"
import rightArrow from "../../assets/right.png"
import leftArrow from "../../assets/arrow.png"

const Testimonials = () => {
    const slider = useRef();
    let tx= 0;

    const slideForward = ()=>{
        if(tx > -50){
            tx -= 25;

        }
        slider.current.style.transform = `translateX(${tx}%)`
} 
const slideBackward = ()=>{
    if(tx < 0){
        tx += 25;

    }
    slider.current.style.transform = `translateX(${tx}%)`
} 
    return (

    <div className='testimonials'>
        <img src={rightArrow} alt='' className='next-btn'  onClick={slideForward}/>
        <img src={leftArrow} alt='' className='back-btn'  onClick={slideBackward}/>
        <div className="slider"> 
            <ul ref={slider}>
                <li>
                    <div className='slide' >
                        <div className='user-info'>
                            <img src={ProfileIcon} alt='' /> 
                            <div>
                                <h3> Jone Doe </h3>
                                <span> Warsaw, Indiana </span>
                            </div>
                        </div>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </div>
                </li>
                <li>
                    <div className='slide' >
                        <div className='user-info'>
                            <img src={ProfileIcon} alt='' /> 
                            <div>
                                <h3> Jone Doe </h3>
                                <span> Warsaw, Indiana </span>
                            </div>
                        </div>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </div>
                </li>
                <li>
                    <div className='slide' >
                        <div className='user-info'>
                            <img src={ProfileIcon} alt='' /> 
                            <div>
                                <h3> Jone Doe </h3>
                                <span> Warsaw, Indiana </span>
                            </div>
                        </div>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </div>
                </li>
                <li>
                    <div className='slide' >
                        <div className='user-info'>
                            <img src={ProfileIcon} alt='' /> 
                            <div>
                                <h3> Jone Doe </h3>
                                <span> Warsaw, Indiana </span>
                            </div>
                        </div>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </div>
                </li>
            </ul>
        </div>
    </div>

  )
}

export default Testimonials