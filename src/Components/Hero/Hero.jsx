import React from "react";
import "./Hero.css";
const Hero = () => {
  return (
    <div className="hero container">
      <div className="hero-box">
      <div className="hero-text">
        <h1 className="hero-text-h1"> Welcome to Animus Scripts </h1>  
        <h2>Innovative Software Solutions for a Digital Future</h2>
        <p>
              At Animus Scripts, we specialize in crafting powerful and efficient
          software solutions tailored to your business needs. With expertise in
          Databases, IT Applications, and Web Development, we bring your ideas
          to life through cutting-edge technology and seamless functionality.
          Whether you're looking to build scalable web applications, optimize
          your data management, or develop robust IT solutions, our team is
          committed to delivering high-quality, customized software that drives
          success.
        </p>
        {/* <button className="btn">Learn More</button> */}
      </div>
      </div>
    </div>
  );
};

export default Hero;
