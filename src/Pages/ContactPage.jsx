import React from "react";
import NavBar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import Contact from "../Components/Contact/Contact";
import "./ContactPage.css";

const ContactPage = () => {
  return (
    <div className="site-shell">
      <NavBar />
      <main className="container contact-page-main">
        <section className="contact-page-hero">
          <p className="section-kicker">Contact</p>
          <h1>Tell us where operations are breaking down.</h1>
          <p>
            Share your current process, the systems involved, and where your team is losing time.
            We will help map a reliable path forward.
          </p>
        </section>
        <Contact sectionId="contact-form" />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
