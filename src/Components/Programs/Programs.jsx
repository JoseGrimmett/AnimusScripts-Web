import React from "react";
import './Programs.css'
import CRM from "../../assets/CRM.jpg"
import SwitchPIC from "../../assets/switch.jpg"
import WebDev from "../../assets/webdev.jpg"
const Programs = () => {
  return (
    <div className="programs">
      <div className="program">
        <img src={CRM} alt= "" />
        <div className="caption"> 
          <img src="./src/assets/AnimusSciptsLogo.png" alt="" />
          <p> CRM </p>
        </div>
      </div>
      <div className="program">
        <img src={WebDev} alt= "" />
        <div className="caption"> 
          <img src="./src/assets/AnimusSciptsLogo.png" alt="" />
          <p> Web Design </p>
        </div>
      </div>
      <div className="program">
         <img src={SwitchPIC} alt= "" />
         <div className="caption"> 
          <img src="./src/assets/AnimusSciptsLogo.png" alt="" />
          <p> IT Solutions</p>
        </div>
      </div>
    </div>
  );
};

export default Programs;
