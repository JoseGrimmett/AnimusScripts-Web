import React from 'react'
import './Contact.css'
import msg_icon from "../../assets/mail.png"
import arrow from "../../assets/right.png"
const Contact = () => {
    const [result, setResult] = React.useState("");

    const onSubmit = async (event) => {
      event.preventDefault();
      setResult("Sending....");
      const formData = new FormData(event.target);
  
      formData.append("access_key", "030ea692-bc4f-492d-bbd0-9be9e7462f27");
  
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
  
      const data = await response.json();
  
      if (data.success) {
        setResult("Form Submitted Successfully");
        event.target.reset();
    
      } else {
        console.log("Error", data);
        setResult(data.message);
      }
    };
  return (
    <div className='contact'>

        <div className='contact-col'>
            <h3>Send us a message <img src={msg_icon}alt=''/></h3>
            <p>Feel free to reach out through contact form or find our contact infromation below. Your feedback, questions, and suggestions are important to us as we strive to provide exceptional service to our customers!</p>
            <ul>
                <li><img src={msg_icon} alt="" />ljgrimmett1216@outlook.com</li>
                <li><img src={msg_icon} alt="" />+1 547-376-9568 </li>
                <li><img src={msg_icon} alt="" />Warsaw, Indiana</li>
            </ul>
        </div>
        <div className='contact-col'>
            <form onSubmit={onSubmit}>
                <label>Your Name</label>
                <input type="text" name='name' placeholder='Enter your name' required/>
                <label>Phone Number</label>
                <input type="tel" name='phone' placeholder='Enter your mobile number' required/>
                <label>Email</label>
                <input type="text" name='email' placeholder='Enter your email' required/>
                <label>Write your message here</label>
                <textarea name='message' id='' rows="6" placeholder='Enter your message' required></textarea>
                <button type='submit' className='btn dark-btn'>Submit now! <img src={arrow} alt='' /> </button>
            </form>
            <span> {result} </span>
        </div>
        
    </div>
  )
}

export default Contact