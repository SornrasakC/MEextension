import React, { createContext, useState, useContext, useCallback } from "react";
import { FRONT_STATE } from "../utils/constants";

export const FrontStateContext = createContext();

export const FrontStateProvider = ({ children }) => {
  // TODO: Check with backend `PROCESS_STATUS`
  // READING, FINALIZING = PROCESSING
  // FINISH = FINISH
  // Otherwise = IDLE
  const [state, setState] = useState(FRONT_STATE.IDLE);

  // actions
  const toIdle = useCallback(
    () => setState(FRONT_STATE.IDLE),
    [state, setState]
  );
  const toProcessing = useCallback(
    () => setState(FRONT_STATE.PROCESSING),
    [state, setState]
  );
  const toFinish = useCallback(
    () => setState(FRONT_STATE.FINISHED),
    [state, setState]
  );

  return (
    <FrontStateContext.Provider
      value={{
        state,
        action: {
          setState,
          toIdle,
          toProcessing,
          toFinish,
        },
      }}
    >
      {children}
    </FrontStateContext.Provider>
  );
};

export const useFrontState = () => {
  const { state, action } = useContext(FrontStateContext);

  return [state, action];
};
