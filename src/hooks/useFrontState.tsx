import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  PROGRESS_STATUS,
  type FrontState,
  type FrontStateActions,
} from '../types';

interface FrontStateContextType {
  state: FrontState;
  actions: FrontStateActions;
}

const FrontStateContext = createContext<FrontStateContextType | undefined>(
  undefined
);

// Action types
type FrontStateAction =
  | { type: 'TO_IDLE' }
  | { type: 'TO_PROCESSING' }
  | { type: 'TO_FINISH' };

// Reducer
function frontStateReducer(
  state: FrontState,
  action: FrontStateAction
): FrontState {
  switch (action.type) {
    case 'TO_IDLE':
      return { ...state, status: PROGRESS_STATUS.IDLE };
    case 'TO_PROCESSING':
      return { ...state, status: PROGRESS_STATUS.READING };
    case 'TO_FINISH':
      return { ...state, status: PROGRESS_STATUS.FINISHED };
    default:
      return state;
  }
}

// Provider component
interface FrontStateProviderProps {
  children: ReactNode;
}

export function FrontStateProvider({
  children,
}: FrontStateProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(frontStateReducer, {
    status: PROGRESS_STATUS.IDLE,
  });

  const actions: FrontStateActions = {
    toIdle: () => dispatch({ type: 'TO_IDLE' }),
    toProcessing: () => dispatch({ type: 'TO_PROCESSING' }),
    toFinish: () => dispatch({ type: 'TO_FINISH' }),
  };

  const value: FrontStateContextType = {
    state,
    actions,
  };

  return (
    <FrontStateContext.Provider value={value}>
      {children}
    </FrontStateContext.Provider>
  );
}

// Hook
export function useFrontState(): [FrontState, FrontStateActions] {
  const context = useContext(FrontStateContext);
  
  if (context === undefined) {
    throw new Error('useFrontState must be used within a FrontStateProvider');
  }

  return [context.state, context.actions];
} 