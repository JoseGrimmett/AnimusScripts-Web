import React from "react";
import NavBar from "./Components/NavBar/NavBar";
import Hero from "./Components/Hero/Hero";
import Programs from "./Components/Programs/Programs";
import ProofSection from "./Components/ProofSection/ProofSection";
import Contact from "./Components/Contact/Contact";
import Footer from "./Components/Footer/Footer";
import TrustSection from "./Components/TrustSection/TrustSection";
import DeliveryChecklist from "./Components/DeliveryChecklist/DeliveryChecklist";
import PackageCTA from "./Components/PackageCTA/PackageCTA";

const App = () => {
  return (
    <div>
      <NavBar />
      <Hero />
      <div className="container">
        <ProofSection />
        <Programs />
        <DeliveryChecklist />
        <PackageCTA />
        <TrustSection />
        <Contact/>
        <Footer />
      </div>
    </div>
  );
};

export default App;
