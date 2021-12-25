import React from "react";

import idealImage from "../../static/assets/ideal.png";
import processingImage from "../../static/assets/processing.png";
import successImage from "../../static/assets/success.png";
import { useFrontState } from "../context/FrontStateContext";

import { FRONT_STATE } from "../utils/constants";

const Tsumugi = () => {
  const [state] = useFrontState();
  const className =
    "filter drop-shadow-ideal transform scale-90 -translate-y-8";

  console.log("Tsumugi", state);
  return state === FRONT_STATE.FINISHED ? (
    // FINISH WITH SUCCESs
    <img src={successImage} className={className}></img>
  ) : state === FRONT_STATE.PROCESSING ? (
    // PROCESSING
    <img src={processingImage} className={className}></img>
  ) : (
    // IDLE
    <img src={idealImage} className={className}></img>
  );
};

export default Tsumugi;
