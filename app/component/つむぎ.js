import React from "react";

import idealImage from "../../static/assets/ideal.png";
import processingImage from "../../static/assets/processing.png";
import successImage from "../../static/assets/success.png";

const つむぎ = ({ className, state }) => {
  return state === "success" ? (
    <img src={successImage} className={className}></img>
  ) : state === "processing" ? (
    <img src={processingImage} className={className}></img>
  ) : (
    <img src={idealImage} className={className}></img>
  );
};

export default つむぎ;
