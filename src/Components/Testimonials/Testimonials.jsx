import React, { useRef } from 'react'
import './Testimonials.css'
import rightArrow from "../../assets/right.png"
import leftArrow from "../../assets/arrow.png"

const testimonialData = [
  { initials: "FL", name: "Finance Lead", location: "Manufacturing company", quote: "We replaced three separate Excel reports with one reliable dashboard. The whole team trusts the data now." },
  { initials: "OM", name: "Operations Manager", location: "Supply chain team", quote: "The system has built-in logging so when something fails, we can see exactly what happened and fix it. No more silent errors." },
  { initials: "TL", name: "Team Lead", location: "Growing service business", quote: "It felt like someone understood the workflow, not just the code. The process was calm and strategic." },
  { initials: "FO", name: "Founder", location: "Operations-focused product team", quote: "The result gave our team something easier to use every day. Documentation made it easy to hand off." },
];

const InitialAvatar = ({ initials }) => (
  <div style={{
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4A6CF4 0%, #7AA2FF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 18,
    color: '#F5F7FB',
    flexShrink: 0,
    letterSpacing: 1,
  }}>
    {initials}
  </div>
);

const Testimonials = () => {
    const slider = useRef();
    let tx = 0;

    const slideForward = () => {
        if (tx > -50) { tx -= 25; }
        slider.current.style.transform = `translateX(${tx}%)`;
    };
    const slideBackward = () => {
        if (tx < 0) { tx += 25; }
        slider.current.style.transform = `translateX(${tx}%)`;
    };

    return (
        <div className='testimonials'>
            <img src={rightArrow} alt='Next' className='next-btn' onClick={slideForward} />
            <img src={leftArrow} alt='Previous' className='back-btn' onClick={slideBackward} />
            <div className="slider">
                <ul ref={slider}>
                    {testimonialData.map((t, i) => (
                        <li key={i}>
                            <div className='slide'>
                                <div className='user-info'>
                                    <InitialAvatar initials={t.initials} />
                                    <div>
                                        <h3>{t.name}</h3>
                                        <span>{t.location}</span>
                                    </div>
                                </div>
                                <p>"{t.quote}"</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Testimonials