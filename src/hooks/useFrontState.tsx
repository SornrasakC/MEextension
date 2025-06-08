import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  FRONT_STATE,
  type FrontState,
  type FrontStateActions,
} from '../types';

interface FrontStateContextType {
  state: FRONT_STATE;
  action: FrontStateActions & {
    setState: (state: FRONT_STATE) => void;
  };
}

const FrontStateContext = createContext<FrontStateContextType | undefined>(
  undefined
);

// Provider component
interface FrontStateProviderProps {
  children: ReactNode;
}

export function FrontStateProvider({
  children,
}: FrontStateProviderProps): JSX.Element {
  // TODO: Check with backend `PROCESS_STATUS`
  // READING, FINALIZING = PROCESSING
  // FINISH = FINISH
  // Otherwise = IDLE
  const [state, setState] = useState<FRONT_STATE>(FRONT_STATE.IDLE);

  // actions
  const toIdle = useCallback(
    () => setState(FRONT_STATE.IDLE),
    [setState]
  );
  const toProcessing = useCallback(
    () => setState(FRONT_STATE.PROCESSING),
    [setState]
  );
  const toFinish = useCallback(
    () => setState(FRONT_STATE.FINISHED),
    [setState]
  );
  const toError = useCallback(
    () => setState(FRONT_STATE.ERROR),
    [setState]
  );

  const value: FrontStateContextType = {
    state,
    action: {
      setState,
      toIdle,
      toProcessing,
      toFinish,
      toError,
    },
  };

  return (
    <FrontStateContext.Provider value={value}>
      {children}
    </FrontStateContext.Provider>
  );
}

// Hook
export function useFrontState(): [FRONT_STATE, FrontStateContextType['action']] {
  const context = useContext(FrontStateContext);
  
  if (context === undefined) {
    throw new Error('useFrontState must be used within a FrontStateProvider');
  }

  return [context.state, context.action];
} 