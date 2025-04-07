import React, { useState } from "react";
import NavBar from "./Components/NavBar/NavBar";
import Hero from "./Components/Hero/Hero";
import Programs from "./Components/Programs/Programs";
import Title from "./Components/Title/Title";
import About from "./Components/About/About";
import Campus from "./Components/Campus/Campus";
import Testimonials from "./Components/Testimonials/Testimonials";
import Contact from "./Components/Contact/Contact";
import Footer from "./Components/Footer/Footer";
import VideoPlayer from "./Components/VideoPlayer/VideoPlayer";



const App = () => {
  const [playState, setPlayState] = useState(false);

  return (
    <div>
      
      <NavBar />
      <Hero />
      <div className="container">
        <Title subTitle='Our Solutions' title='What We Offer'/>
        <Programs />
        <About setPlayState={setPlayState}/>
        {/*<Title subTitle='Gallery' title='Projects'/> 
        <Campus /> */}
        {/*<Title subTitle='Testimonials' title='Annyomous Quotes'/>
        <Testimonials /> */}
        <Title subTitle='Contact us' title='Get in Touch'/>
        <Contact/>
        <Footer />
      </div>
     <VideoPlayer playState={playState} setPlayState={setPlayState}/>
    </div>
  );
};

export default App;
