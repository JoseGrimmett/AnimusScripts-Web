import React from "react";
import './Programs.css'
import CRM from "../../assets/CRM.jpg"
import SwitchPIC from "../../assets/Switch.jpg"
import WebDev from "../../assets/WebDev.jpg"
import Webicon from "../../assets/AnimusSciptsLogo.png"
const Programs = () => {
  return (
    <div className="programs">
      <div className="program">
        <img src={CRM} alt= "" />
        <div className="caption"> 
          <img src={Webicon} alt="" />
          <p> Mobile Applications </p>
        </div>
      </div>
      <div className="program">
        <img src={WebDev} alt= "" />
        <div className="caption"> 
          <img src={Webicon} alt="" />
          <p> Web Development </p>
        </div>
      </div>
      <div className="program">
         <img src={SwitchPIC} alt= "" />
         <div className="caption"> 
          <img src={Webicon} alt="" />
          <p> IT Solutions</p>
        </div>
      </div>
    </div>
  );
};

export default Programs;
